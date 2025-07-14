/**
 * Configuración de BullMQ para Portal de Auditorías Técnicas
 * Gestiona colas de trabajos asíncronos para procesamiento ETL, análisis IA
 * y notificaciones con Redis como backend
 */

const { Queue, Worker, QueueScheduler } = require('bullmq');
const { queueClient } = require('./redis');

// Configuración de colas especializadas
const QUEUE_CONFIGS = {
  // Cola para procesamiento ETL de parque informático
  etl: {
    name: 'etl-processing',
    concurrency: 3,           // Máximo 3 archivos Excel simultáneos
    priority: 'high',
    defaultJobOptions: {
      removeOnComplete: 10,   // Mantener 10 jobs completados
      removeOnFail: 50,       // Mantener 50 jobs fallidos para debugging
      attempts: 3,            // 3 reintentos
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      delay: 0,               // Sin delay por defecto
      timeout: 600000         // 10 minutos timeout
    }
  },

  // Cola para análisis de IA (documentos e imágenes)
  ia: {
    name: 'ia-analysis',
    concurrency: 2,           // Limitar IA para no sobrecargar Ollama
    priority: 'high',
    defaultJobOptions: {
      removeOnComplete: 20,   // Mantener más resultados de IA
      removeOnFail: 30,
      attempts: 2,            // Solo 2 reintentos para IA
      backoff: {
        type: 'fixed',
        delay: 5000           // 5 segundos entre reintentos IA
      },
      timeout: 900000         // 15 minutos para análisis complejos
    }
  },

  // Cola para notificaciones y emails
  notifications: {
    name: 'notifications',
    concurrency: 10,          // Muchas notificaciones concurrentes
    priority: 'medium',
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 20,
      attempts: 5,            // Más reintentos para notificaciones
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      timeout: 30000          // 30 segundos timeout
    }
  },

  // Cola para trabajos de mantenimiento y limpieza
  maintenance: {
    name: 'maintenance',
    concurrency: 1,           // Solo un trabajo de mantenimiento a la vez
    priority: 'low',
    defaultJobOptions: {
      removeOnComplete: 3,
      removeOnFail: 10,
      attempts: 1,            // Sin reintentos para mantenimiento
      timeout: 3600000        // 1 hora timeout
    }
  }
};

// Instancias de colas
const queues = {};
const workers = {};
const schedulers = {};

/**
 * Función para inicializar todas las colas
 */
const initializeQueues = async () => {
  try {
    console.log('🚀 Inicializando colas BullMQ...');

    for (const [key, config] of Object.entries(QUEUE_CONFIGS)) {
      // Crear cola
      queues[key] = new Queue(config.name, {
        connection: queueClient,
        defaultJobOptions: config.defaultJobOptions
      });

      // Crear scheduler para jobs programados
      schedulers[key] = new QueueScheduler(config.name, {
        connection: queueClient
      });

      console.log(`✅ Cola ${config.name} inicializada`);
    }

    // Event listeners para monitoreo
    setupQueueEventListeners();

    console.log('🎉 Todas las colas BullMQ inicializadas correctamente');
    return true;

  } catch (error) {
    console.error('❌ Error inicializando colas BullMQ:', error.message);
    throw error;
  }
};

/**
 * Función para configurar event listeners de las colas
 */
const setupQueueEventListeners = () => {
  Object.entries(queues).forEach(([key, queue]) => {
    queue.on('waiting', (job) => {
      console.log(`⏳ Job ${job.id} en cola ${key} esperando procesamiento`);
    });

    queue.on('active', (job) => {
      console.log(`🔄 Job ${job.id} en cola ${key} iniciado`);
    });

    queue.on('completed', (job, result) => {
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
 * Función para crear workers de procesamiento
 */
const createWorkers = async () => {
  try {
    console.log('👷 Creando workers BullMQ...');

    // Worker para ETL
    workers.etl = new Worker(
      QUEUE_CONFIGS.etl.name,
      require('../jobs/etl-jobs/excel-processing.job.js'),
      {
        connection: queueClient,
        concurrency: QUEUE_CONFIGS.etl.concurrency
      }
    );

    // Worker para IA
    workers.ia = new Worker(
      QUEUE_CONFIGS.ia.name,
      require('../jobs/ia-jobs/document-analysis.job.js'),
      {
        connection: queueClient,
        concurrency: QUEUE_CONFIGS.ia.concurrency
      }
    );

    // Worker para notificaciones
    workers.notifications = new Worker(
      QUEUE_CONFIGS.notifications.name,
      require('../jobs/notification-jobs/email-sending.job.js'),
      {
        connection: queueClient,
        concurrency: QUEUE_CONFIGS.notifications.concurrency
      }
    );

    // Worker para mantenimiento
    workers.maintenance = new Worker(
      QUEUE_CONFIGS.maintenance.name,
      async (job) => {
        console.log(`🧹 Ejecutando tarea de mantenimiento: ${job.name}`);
        // Lógica de mantenimiento se implementará según necesidades
        return { status: 'completed', timestamp: new Date().toISOString() };
      },
      {
        connection: queueClient,
        concurrency: QUEUE_CONFIGS.maintenance.concurrency
      }
    );

    console.log('✅ Workers BullMQ creados correctamente');

  } catch (error) {
    console.error('❌ Error creando workers:', error.message);
    throw error;
  }
};

/**
 * Utilidades para agregar jobs a las colas
 */
const addJob = {
  // Agregar job de procesamiento ETL
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

  // Agregar job de análisis IA
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

  // Agregar job de notificación
  async notification(jobData, options = {}) {
    try {
      const jobType = jobData.type || 'send-email';
      const job = await queues.notifications.add(jobType, jobData, {
        priority: options.priority || 5,
        ...options
      });

      console.log(`📧 Job notificación agregado: ${job.id} (${jobType})`);
      return job;
    } catch (error) {
      console.error('❌ Error agregando job notificación:', error.message);
      throw error;
    }
  },

  // Agregar job programado (cron-like)
  async scheduled(queueName, jobData, cronExpression, options = {}) {
    try {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Cola ${queueName} no encontrada`);
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
 * Función para obtener estadísticas de las colas
 */
const getQueueStats = async () => {
  try {
    const stats = {};

    for (const [key, queue] of Object.entries(queues)) {
      const counts = await queue.getJobCounts();
      const workers = await queue.getWorkers();

      stats[key] = {
        name: QUEUE_CONFIGS[key].name,
        concurrency: QUEUE_CONFIGS[key].concurrency,
        jobs: counts,
        active_workers: workers.length,
        status: 'healthy'
      };
    }

    return stats;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de colas:', error.message);
    return {};
  }
};

/**
 * Función para obtener información detallada de un job
 */
const getJobInfo = async (queueName, jobId) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Cola ${queueName} no encontrada`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

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
 * Función para pausar/reanudar una cola
 */
const toggleQueue = async (queueName, action) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Cola ${queueName} no encontrada`);
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
 * Función para limpiar jobs completados/fallidos
 */
const cleanQueue = async (queueName, options = {}) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Cola ${queueName} no encontrada`);
    }

    const {
      grace = 3600000,      // 1 hora
      limit = 100,          // Limpiar máximo 100 jobs
      type = 'completed'    // 'completed', 'failed', 'active', 'waiting'
    } = options;

    const cleanedJobs = await queue.clean(grace, limit, type);
    console.log(`🧹 ${cleanedJobs.length} jobs ${type} limpiados de cola ${queueName}`);

    return cleanedJobs;
  } catch (error) {
    console.error(`❌ Error limpiando cola ${queueName}:`, error.message);
    throw error;
  }
};

/**
 * Función para cerrar todas las colas y workers
 */
const closeQueues = async () => {
  try {
    console.log('🔒 Cerrando colas y workers BullMQ...');

    // Cerrar workers
    await Promise.all(
      Object.values(workers).map(worker => worker.close())
    );

    // Cerrar schedulers
    await Promise.all(
      Object.values(schedulers).map(scheduler => scheduler.close())
    );

    // Cerrar colas
    await Promise.all(
      Object.values(queues).map(queue => queue.close())
    );

    console.log('✅ Todas las colas BullMQ cerradas correctamente');
  } catch (error) {
    console.error('❌ Error cerrando colas BullMQ:', error.message);
  }
};

/**
 * Jobs programados por defecto
 */
const setupScheduledJobs = async () => {
  try {
    console.log('⏰ Configurando jobs programados...');

    // Limpieza automática de colas cada día a las 2 AM
    await addJob.scheduled('maintenance', {
      task: 'clean-queues',
      config: {
        grace: 86400000,    // 24 horas
        limit: 1000,
        types: ['completed', 'failed']
      }
    }, '0 2 * * *');

    // Reporte de estadísticas cada lunes a las 9 AM
    await addJob.scheduled('maintenance', {
      task: 'weekly-stats-report'
    }, '0 9 * * 1');

    console.log('✅ Jobs programados configurados');
  } catch (error) {
    console.error('❌ Error configurando jobs programados:', error.message);
  }
};

module.exports = {
  // Configuraciones
  QUEUE_CONFIGS,
  
  // Instancias de colas
  queues,
  workers,
  schedulers,
  
  // Funciones de gestión
  initializeQueues,
  createWorkers,
  closeQueues,
  setupScheduledJobs,
  
  // Utilidades para jobs
  addJob,
  getJobInfo,
  getQueueStats,
  toggleQueue,
  cleanQueue,
  
  // Acceso directo a colas específicas
  etlQueue: () => queues.etl,
  iaQueue: () => queues.ia,
  notificationQueue: () => queues.notifications,
  maintenanceQueue: () => queues.maintenance
};
