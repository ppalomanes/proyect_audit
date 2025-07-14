/**
 * Configuración de Redis para Portal de Auditorías Técnicas
 * Maneja cache, sesiones y colas de trabajos BullMQ para procesamiento asíncrono
 * Optimizado para alta concurrencia en entornos de call center
 */

const Redis = require('ioredis');

// Variables de entorno con valores por defecto
const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = 6379,
  REDIS_PASSWORD = '',
  REDIS_DB = 0,
  REDIS_CACHE_DB = 1,
  REDIS_SESSION_DB = 2,
  REDIS_QUEUE_DB = 3,
  NODE_ENV = 'development'
} = process.env;

// Configuración base de Redis
const baseConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  
  // Configuración de reconexión automática
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Reintentando conexión Redis en ${delay}ms (intento ${times})`);
    return delay;
  },
  
  // Configuraciones de performance
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Event handlers para debugging
  ...(NODE_ENV === 'development' && {
    showFriendlyErrorStack: true
  })
};

/**
 * Cliente Redis principal para uso general
 */
const redisClient = new Redis({
  ...baseConfig,
  db: REDIS_DB,
  keyPrefix: 'portal:main:'
});

/**
 * Cliente Redis para cache de datos
 * TTL por defecto optimizado para datos de auditoría
 */
const cacheClient = new Redis({
  ...baseConfig,
  db: REDIS_CACHE_DB,
  keyPrefix: 'portal:cache:'
});

/**
 * Cliente Redis para sesiones de usuario
 * Configuración específica para autenticación JWT
 */
const sessionClient = new Redis({
  ...baseConfig,
  db: REDIS_SESSION_DB,
  keyPrefix: 'portal:session:'
});

/**
 * Cliente Redis para colas BullMQ
 * Optimizado para procesamiento ETL e IA
 */
const queueClient = new Redis({
  ...baseConfig,
  db: REDIS_QUEUE_DB,
  keyPrefix: 'portal:queue:'
});

// Event listeners para monitoreo
const setupEventListeners = (client, name) => {
  client.on('connect', () => {
    console.log(`✅ Redis ${name} conectado en ${REDIS_HOST}:${REDIS_PORT}`);
  });
  
  client.on('ready', () => {
    console.log(`🚀 Redis ${name} listo para recibir comandos`);
  });
  
  client.on('error', (error) => {
    console.error(`❌ Error Redis ${name}:`, error.message);
  });
  
  client.on('close', () => {
    console.log(`🔒 Conexión Redis ${name} cerrada`);
  });
  
  client.on('reconnecting', () => {
    console.log(`🔄 Redis ${name} reconectando...`);
  });
};

// Configurar event listeners para todos los clientes
setupEventListeners(redisClient, 'Principal');
setupEventListeners(cacheClient, 'Cache');
setupEventListeners(sessionClient, 'Session');
setupEventListeners(queueClient, 'Queue');

/**
 * Función para probar todas las conexiones Redis
 */
const testConnections = async () => {
  const clients = [
    { client: redisClient, name: 'Principal' },
    { client: cacheClient, name: 'Cache' },
    { client: sessionClient, name: 'Session' },
    { client: queueClient, name: 'Queue' }
  ];
  
  const results = [];
  
  for (const { client, name } of clients) {
    try {
      const startTime = Date.now();
      await client.ping();
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Redis ${name} respondió en ${responseTime}ms`);
      results.push({ name, status: 'connected', responseTime });
    } catch (error) {
      console.error(`❌ Redis ${name} falló:`, error.message);
      results.push({ name, status: 'failed', error: error.message });
    }
  }
  
  return results;
};

/**
 * Utilidades de Cache con TTL inteligente
 */
const cache = {
  // Cache para datos de auditoría (1 hora por defecto)
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      await cacheClient.setex(key, ttl, serializedValue);
      console.log(`💾 Cache guardado: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('❌ Error guardando en cache:', error.message);
    }
  },
  
  async get(key) {
    try {
      const value = await cacheClient.get(key);
      if (value) {
        console.log(`📥 Cache hit: ${key}`);
        return JSON.parse(value);
      }
      console.log(`📭 Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ Error leyendo cache:', error.message);
      return null;
    }
  },
  
  async del(key) {
    try {
      await cacheClient.del(key);
      console.log(`🗑️ Cache eliminado: ${key}`);
    } catch (error) {
      console.error('❌ Error eliminando cache:', error.message);
    }
  },
  
  // Cache específico para resultados ETL (6 horas)
  async setETLResult(jobId, result) {
    return this.set(`etl:result:${jobId}`, result, 21600);
  },
  
  async getETLResult(jobId) {
    return this.get(`etl:result:${jobId}`);
  },
  
  // Cache para análisis IA (12 horas)
  async setIAAnalysis(documentId, analysis) {
    return this.set(`ia:analysis:${documentId}`, analysis, 43200);
  },
  
  async getIAAnalysis(documentId) {
    return this.get(`ia:analysis:${documentId}`);
  }
};

/**
 * Utilidades de Sesión para JWT
 */
const session = {
  async store(userId, sessionData, ttl = 86400) { // 24 horas por defecto
    try {
      const key = `user:${userId}`;
      await sessionClient.setex(key, ttl, JSON.stringify(sessionData));
      console.log(`🔐 Sesión almacenada para usuario ${userId}`);
    } catch (error) {
      console.error('❌ Error almacenando sesión:', error.message);
    }
  },
  
  async get(userId) {
    try {
      const sessionData = await sessionClient.get(`user:${userId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('❌ Error leyendo sesión:', error.message);
      return null;
    }
  },
  
  async invalidate(userId) {
    try {
      await sessionClient.del(`user:${userId}`);
      console.log(`🔒 Sesión invalidada para usuario ${userId}`);
    } catch (error) {
      console.error('❌ Error invalidando sesión:', error.message);
    }
  }
};

/**
 * Función para cerrar todas las conexiones Redis
 */
const closeConnections = async () => {
  const clients = [redisClient, cacheClient, sessionClient, queueClient];
  
  await Promise.all(
    clients.map(async (client, index) => {
      try {
        await client.quit();
        console.log(`🔒 Cliente Redis ${index + 1} cerrado correctamente`);
      } catch (error) {
        console.error(`❌ Error cerrando cliente Redis ${index + 1}:`, error.message);
      }
    })
  );
};

/**
 * Función para obtener estadísticas de Redis
 */
const getStats = async () => {
  try {
    const info = await redisClient.info();
    const stats = {};
    
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    });
    
    return {
      connected_clients: stats.connected_clients,
      used_memory_human: stats.used_memory_human,
      total_commands_processed: stats.total_commands_processed,
      keyspace_hits: stats.keyspace_hits,
      keyspace_misses: stats.keyspace_misses,
      uptime_in_seconds: stats.uptime_in_seconds
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas Redis:', error.message);
    return {};
  }
};

module.exports = {
  // Clientes Redis especializados
  redisClient,
  cacheClient,
  sessionClient,
  queueClient,
  
  // Utilidades de alto nivel
  cache,
  session,
  
  // Funciones de gestión
  testConnections,
  closeConnections,
  getStats,
  
  // Configuración para BullMQ
  queueConfig: {
    connection: queueClient,
    defaultJobOptions: {
      removeOnComplete: 10,   // Mantener solo 10 jobs completados
      removeOnFail: 50,       // Mantener 50 jobs fallidos para análisis
      attempts: 3,            // 3 intentos por defecto
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  }
};
