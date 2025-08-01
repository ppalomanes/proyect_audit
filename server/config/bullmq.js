/**
 * Configuración de BullMQ para Portal de Auditorías Técnicas
 * CORREGIDA para manejo graceful sin Redis y compatibilidad v4+
 */

const { Queue, Worker } = require('bullmq');

// Importar configuración Redis con verificación
let redisConfig = null;
let redisAvailable = false;

try {
  redisConfig = require('./redis');
  redisAvailable = redisConfig.redisAvailable !== false;
  console.log(`🔍 Redis status: ${redisAvailable ? 'available' : 'unavailable'}`);
} catch (error) {
  console.warn('⚠️  Redis config no disponible:', error.message);
  redisAvailable = false;
}

// Configuración de colas especializadas
const QUEUE_CONFIGS = {
  etl: {
    name: 'etl-processing',
    concurrency: 3,
    priority: 'high',
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      timeout: 600000  // 10 minutos
    }
  },
  ia: {
    name: 'ia-analysis',
    concurrency: 2,
    priority: 'high',
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 30,
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 },
      timeout: 900000  // 15 minutos
    }
  },
  notifications: {
    name: 'notifications',
    concurrency: 10,
    priority: 'medium',
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 20,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      timeout: 30000   // 30 segundos
    }
  },
  maintenance: {
    name: 'maintenance',
    concurrency: 1,
    priority: 'low',
    defaultJobOptions: {
      removeOnComplete: 3,
      removeOnFail: 10,
      attempts: 1,
      timeout: 3600000  // 1 hora
    }
  }
};

// Instancias de colas y workers
const queues = {};
const workers = {};
let bullmqInitialized = false;

/**
 * Mock para cuando Redis no está disponible
 */
const createMockQueue = (queueName) => ({
  name: queueName,
  add: async (jobName, data, options = {}) => {
    console.log(`📝 Mock queue ${queueName}: would add job ${jobName}`);
    return { 
      id: `mock_${Date.now()}`, 
      name: jobName, 
      data,
      status: 'mock_completed'
    };
  },
  getJob: async (jobId) => null,
  getJobCounts: async () => ({
    active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0
  }),
  getWorkers: async () => [],
  pause: async () => console.log(`⏸️  Mock pause: ${queueName}`),
  resume: async () => console.log(`▶️  Mock resume: ${queueName}`),
  clean: async () => [],
  close: async () => console.log(`🔒 Mock close: ${queueName}`),
  on: () => {},
  _isMock: true
});

const createMockWorker = (queueName) => ({
  name: queueName,
  close: async () => console.log(`🔒 Mock worker closed: ${queueName}`),
  _isMock: true
});

/**
 * Función para inicializar colas
 */
const initializeQueues = async () => {
  try {
    console.log('🚀 Inicializando colas BullMQ...');

    if (!redisAvailable || !redisConfig) {
      console.log('⚠️  Redis no disponible - creando mocks');
      
      // Crear colas mock
      Object.keys(QUEUE_CONFIGS).forEach(key => {
        queues[key] = createMockQueue(QUEUE_CONFIGS[key].name);
        console.log(`📝 Mock queue creada: ${key}`);
      });
      
      bullmqInitialized = true;
      return true;
    }

    // Verificar conexión Redis antes de crear colas
    const connectionTest = await redisConfig.testConnections();
    const queueConnectionOk = connectionTest.find(c => c.name === 'Queue')?.status === 'connected';
    
    if (!queueConnectionOk) {
      console.log('⚠️  Conexión Queue Redis falló - usando mocks');
      Object.keys(QUEUE_CONFIGS).forEach(key => {
        queues[key] = createMockQueue(QUEUE_CONFIGS[key].name);
      });
      bullmqInitialized = true;
      return true;
    }

    // Crear colas reales con BullMQ
    for (const [key, config] of Object.entries(QUEUE_CONFIGS)) {
      try {
        queues[key] = new Queue(config.name, {
          connection: redisConfig.queueClient,
          prefix: 'portal:queue:',
          defaultJobOptions: config.defaultJobOptions
        });

        console.log(`✅ Cola real creada: ${config.name}`);
      } catch (error) {
        console.warn(`⚠️  Error creando cola ${key}, usando mock:`, error.message);
        queues[key] = createMockQueue(config.name);
      }
    }

    setupQueueEventListeners();
    bullmqInitialized = true;
    console.log('🎉 Colas BullMQ inicializadas');
    return true;

  } catch (error) {
    console.error('❌ Error inicializando colas:', error.message);
    
    // Fallback a mocks
    Object.keys(QUEUE_CONFIGS).forEach(key => {
      queues[key] = createMockQueue(QUEUE_CONFIGS[key].name);
    });
    
    bullmqInitialized = true;
    return false;
  }
};

/**
 * Event listeners solo para colas reales
 */
const setupQueueEventListeners = () => {
  Object.entries(queues).forEach(([key, queue]) => {
    if (queue._isMock) return;
    
    queue.on('waiting', (job) => {
      console.log(`⏳ Job ${job.id} en cola ${key} esperando`);
    });

    queue.on('active', (job) => {
      console.log(`🔄 Job ${job.id} en cola ${key} activo`);
    });

    queue.on('completed', (job) => {
      console.log(`✅ Job ${job.id} en cola ${key} completado`);
    });

    queue.on('failed', (job, error) => {
      console.error(`❌ Job ${job.id} en cola ${key} falló:`, error.message);
    });

    queue.on('progress', (job, progress) => {
      console.log(`📊 Job ${job.id} progreso: ${progress}%`);
    });
  });
};

/**
 * Crear workers con manejo graceful
 */
const createWorkers = async () => {
  try {
    console.log('👷 Creando workers BullMQ...');

    if (!redisAvailable || !redisConfig) {
      console.log('⚠️  Redis no disponible - creando mock workers');
      
      Object.keys(QUEUE_CONFIGS).forEach(key => {
        workers[key] = createMockWorker(QUEUE_CONFIGS[key].name);
        console.log(`👷 Mock worker creado: ${key}`);
      });
      
      return true;
    }

    // Verificar que las colas no sean mocks
    const hasRealQueues = Object.values(queues).some(queue => !queue._isMock);
    
    if (!hasRealQueues) {
      console.log('⚠️  Solo colas mock disponibles - creando mock workers');
      Object.keys(QUEUE_CONFIGS).forEach(key => {
        workers[key] = createMockWorker(QUEUE_CONFIGS[key].name);
      });
      return true;
    }

    // Crear workers reales
    await createRealWorkers();
    
    console.log('✅ Workers BullMQ creados');
    return true;

  } catch (error) {
    console.error('❌ Error creando workers:', error.message);
    
    // Fallback a mock workers
    Object.keys(QUEUE_CONFIGS).forEach(key => {
      workers[key] = createMockWorker(QUEUE_CONFIGS[key].name);
    });
    
    return false;
  }
};

/**
 * Crear workers reales con manejo de errores
 */
const createRealWorkers = async () => {
  // Worker ETL
  try {
    const etlProcessor = require('../jobs/etl-jobs/excel-processing.job.js');
    workers.etl = new Worker(
      QUEUE_CONFIGS.etl.name,
      etlProcessor,
      {
        connection: redisConfig.queueClient,
        prefix: 'portal:queue:',
        concurrency: QUEUE_CONFIGS.etl.concurrency
      }
    );
    console.log('✅ Worker ETL creado');
  } catch (error) {
    console.warn('⚠️  Worker ETL falló, usando mock:', error.message);
    workers.etl = createMockWorker('etl');
  }

  // Worker IA
  try {
    const iaProcessor = require('../jobs/ia-jobs/document-analysis.job.js');
    workers.ia = new Worker(
      QUEUE_CONFIGS.ia.name,
      iaProcessor,
      {
        connection: redisConfig.queueClient,
        prefix: 'portal:queue:',
        concurrency: QUEUE_CONFIGS.ia.concurrency
      }
    );
    console.log('✅ Worker IA creado');
  } catch (error) {
    console.warn('⚠️  Worker IA falló, usando mock:', error.message);
    workers.ia = createMockWorker('ia');
  }

  // Worker Notificaciones
  try {
    const notificationProcessor = require('../jobs/notification-jobs/email-sending.job.js');
    workers.notifications = new Worker(
      QUEUE_CONFIGS.notifications.name,
      notificationProcessor,
      {
        connection: redisConfig.queueClient,
        prefix: 'portal:queue:',
        concurrency: QUEUE_CONFIGS.notifications.concurrency
      }
    );
    console.log('✅ Worker Notifications creado');
  } catch (error) {
    console.warn('⚠️  Worker Notifications falló, usando mock:', error.message);
    workers.notifications = createMockWorker('notifications');
  }

  // Worker Mantenimiento
  try {
    workers.maintenance = new Worker(
      QUEUE_CONFIGS.maintenance.name,
      async (job) => {
        console.log(`🧹 Ejecutando mantenimiento: ${job.name}`);
        return { status: 'completed', timestamp: new Date().toISOString() };
      },
      {
        connection: redisConfig.queueClient,
        prefix: 'portal:queue:',
        concurrency: QUEUE_CONFIGS.maintenance.concurrency
      }
    );
    console.log('✅ Worker Maintenance creado');
  } catch (error) {
    console.warn('⚠️  Worker Maintenance falló, usando mock:', error.message);
    workers.maintenance = createMockWorker('maintenance');
  }
};

/**
 * Utilidades para agregar jobs
 */
const addJob = {
  async etl(jobData, options = {}) {
    try {
      const job = await queues.etl.add('process-excel', jobData, {
        priority: options.priority || 1,
        delay: options.delay || 0,
        ...options
      });

      console.log(`📥 Job ETL agregado: ${job.id}`);
      return job;
    } catch (error) {
      console.error('❌ Error agregando job ETL:', error.message);
      throw error;
    }
  },

  async ia(jobData, options = {}) {
    try {
      const jobType = jobData.type || 'analyze-document';
      const job = await queues.ia.add(jobType, jobData, {
        priority: options.priority || 1,
        ...options
      });

      console.log(`🤖 Job IA agregado: ${job.id} (${jobType})`);
      return job;
    } catch (error) {
      console.error('❌ Error agregando job IA:', error.message);
      throw error;
    }
  },

  async notification(jobData, options = {}) {
    try {
      const jobType = jobData.type || 'send-email';
      const job = await queues.notifications.add(jobType, jobData, {
        priority: options.priority || 5,
        ...options
      });

      console.log(`📧 Job notification agregado: ${job.id} (${jobType})`);
      return job;
    } catch (error) {
      console.error('❌ Error agregando job notification:', error.message);
      throw error;
    }
  },

  async scheduled(queueName, jobData, cronExpression, options = {}) {
    try {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Cola ${queueName} no encontrada`);
      }

      if (queue._isMock) {
        console.log(`📅 Mock scheduled job: ${queueName} (${cronExpression})`);
        return { id: `mock_scheduled_${Date.now()}`, name: 'scheduled-task' };
      }

      const job = await queue.add('scheduled-task', jobData, {
        repeat: { cron: cronExpression },
        ...options
      });

      console.log(`⏰ Job programado agregado: ${job.id} (${cronExpression})`);
      return job;
    } catch (error) {
      console.error('❌ Error agregando job programado:', error.message);
      throw error;
    }
  }
};

/**
 * Obtener estadísticas de colas
 */
const getQueueStats = async () => {
  try {
    const stats = {};

    for (const [key, queue] of Object.entries(queues)) {
      if (queue._isMock) {
        stats[key] = {
          name: QUEUE_CONFIGS[key].name,
          concurrency: QUEUE_CONFIGS[key].concurrency,
          jobs: { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 },
          active_workers: 0,
          status: 'mock'
        };
      } else {
        try {
          const counts = await queue.getJobCounts();
          const workers = await queue.getWorkers();

          stats[key] = {
            name: QUEUE_CONFIGS[key].name,
            concurrency: QUEUE_CONFIGS[key].concurrency,
            jobs: counts,
            active_workers: workers.length,
            status: 'healthy'
          };
        } catch (error) {
          stats[key] = {
            name: QUEUE_CONFIGS[key].name,
            status: 'error',
            error: error.message
          };
        }
      }
    }

    return stats;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    return {};
  }
};

/**
 * Obtener información de job
 */
const getJobInfo = async (queueName, jobId) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Cola ${queueName} no encontrada`);
    }

    if (queue._isMock) {
      return {
        id: jobId,
        name: 'mock-job',
        status: 'mock',
        data: {},
        progress: 100
      };
    }

    const job = await queue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      timestamp: job.timestamp,
      attempts: job.attemptsMade,
      delay: job.delay,
      opts: job.opts
    };
  } catch (error) {
    console.error(`❌ Error obteniendo info del job ${jobId}:`, error.message);
    return null;
  }
};

/**
 * Pausar/reanudar cola
 */
const toggleQueue = async (queueName, action) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Cola ${queueName} no encontrada`);
    }

    if (queue._isMock) {
      console.log(`📝 Mock ${action}: ${queueName}`);
      return true;
    }

    if (action === 'pause') {
      await queue.pause();
      console.log(`⏸️  Cola ${queueName} pausada`);
    } else if (action === 'resume') {
      await queue.resume();
      console.log(`▶️  Cola ${queueName} reanudada`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error ${action} cola ${queueName}:`, error.message);
    throw error;
  }
};

/**
 * Limpiar cola
 */
const cleanQueue = async (queueName, options = {}) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Cola ${queueName} no encontrada`);
    }

    if (queue._isMock) {
      console.log(`🧹 Mock clean: ${queueName}`);
      return [];
    }

    const {
      grace = 3600000,
      limit = 100,
      type = 'completed'
    } = options;

    const cleanedJobs = await queue.clean(grace, limit, type);
    console.log(`🧹 ${cleanedJobs.length} jobs ${type} limpiados de ${queueName}`);

    return cleanedJobs;
  } catch (error) {
    console.error(`❌ Error limpiando cola ${queueName}:`, error.message);
    throw error;
  }
};

/**
 * Cerrar colas y workers
 */
const closeQueues = async () => {
  try {
    console.log('🔒 Cerrando colas y workers BullMQ...');

    // Cerrar workers
    await Promise.all(
      Object.values(workers).map(async (worker) => {
        try {
          await worker.close();
        } catch (error) {
          console.warn('⚠️  Error cerrando worker:', error.message);
        }
      })
    );

    // Cerrar colas
    await Promise.all(
      Object.values(queues).map(async (queue) => {
        try {
          if (!queue._isMock) {
            await queue.close();
          }
        } catch (error) {
          console.warn('⚠️  Error cerrando cola:', error.message);
        }
      })
    );

    console.log('✅ BullMQ cerrado correctamente');
  } catch (error) {
    console.error('❌ Error cerrando BullMQ:', error.message);
  }
};

/**
 * Configurar jobs programados
 */
const setupScheduledJobs = async () => {
  try {
    console.log('⏰ Configurando jobs programados...');

    // Solo configurar si tenemos Redis real
    if (!redisAvailable) {
      console.log('⚠️  Jobs programados omitidos (Redis no disponible)');
      return;
    }

    // Limpieza automática diaria
    try {
      await addJob.scheduled('maintenance', {
        task: 'clean-queues',
        config: {
          grace: 86400000,
          limit: 1000,
          types: ['completed', 'failed']
        }
      }, '0 2 * * *');
    } catch (error) {
      console.warn('⚠️  No se pudo programar job de limpieza:', error.message);
    }

    // Reporte semanal
    try {
      await addJob.scheduled('maintenance', {
        task: 'weekly-stats-report'
      }, '0 9 * * 1');
    } catch (error) {
      console.warn('⚠️  No se pudo programar reporte semanal:', error.message);
    }

    console.log('✅ Jobs programados configurados');
  } catch (error) {
    console.error('❌ Error configurando jobs programados:', error.message);
  }
};

/**
 * Verificar salud del sistema BullMQ
 */
const healthCheck = () => {
  const health = {
    bullmq_initialized: bullmqInitialized,
    redis_available: redisAvailable,
    queues: Object.keys(queues).length,
    workers: Object.keys(workers).length,
    queue_types: Object.keys(queues).map(key => ({
      name: key,
      type: queues[key]._isMock ? 'mock' : 'real'
    }))
  };

  return health;
};

module.exports = {
  // Configuraciones
  QUEUE_CONFIGS,
  
  // Instancias
  queues,
  workers,
  
  // Estado
  bullmqInitialized,
  redisAvailable,
  
  // Funciones principales
  initializeQueues,
  createWorkers,
  closeQueues,
  setupScheduledJobs,
  
  // Utilidades
  addJob,
  getJobInfo,
  getQueueStats,
  toggleQueue,
  cleanQueue,
  healthCheck,
  
  // Acceso directo a colas
  etlQueue: () => queues.etl,
  iaQueue: () => queues.ia,
  notificationQueue: () => queues.notifications,
  maintenanceQueue: () => queues.maintenance
};