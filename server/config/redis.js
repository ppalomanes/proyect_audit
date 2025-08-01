/**
 * Configuración de Redis para Portal de Auditorías Técnicas
 * CORREGIDA para manejo graceful de conexiones fallidas
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
  NODE_ENV = 'development',
  REDIS_DISABLED = 'false'
} = process.env;

// Detectar si Redis está disponible
let redisAvailable = false;
let connectionAttempts = 0;

// Mock clients para cuando Redis no está disponible
const createMockClient = () => ({
  ping: () => Promise.resolve('PONG'),
  set: () => Promise.resolve('OK'),
  get: () => Promise.resolve(null),
  del: () => Promise.resolve(1),
  setex: () => Promise.resolve('OK'),
  quit: () => Promise.resolve('OK'),
  on: () => {},
  info: () => Promise.resolve('redis_version:mock'),
  status: 'mock'
});

// Si Redis está explícitamente deshabilitado
if (REDIS_DISABLED === 'true') {
  console.log('⚠️  Redis deshabilitado por configuración - usando mocks');
  
  const mockClient = createMockClient();

  module.exports = {
    redisClient: mockClient,
    cacheClient: mockClient,
    sessionClient: mockClient,
    queueClient: mockClient,
    redisAvailable: false,
    cache: {
      set: () => Promise.resolve(),
      get: () => Promise.resolve(null),
      del: () => Promise.resolve(),
      setETLResult: () => Promise.resolve(),
      getETLResult: () => Promise.resolve(null),
      setIAAnalysis: () => Promise.resolve(),
      getIAAnalysis: () => Promise.resolve(null)
    },
    session: {
      store: () => Promise.resolve(),
      get: () => Promise.resolve(null),
      invalidate: () => Promise.resolve()
    },
    testConnections: () => Promise.resolve([
      { name: 'Principal', status: 'mocked' },
      { name: 'Cache', status: 'mocked' },
      { name: 'Session', status: 'mocked' },
      { name: 'Queue', status: 'mocked' }
    ]),
    closeConnections: () => Promise.resolve(),
    getStats: () => Promise.resolve({ status: 'mocked' }),
    queueConfig: {
      connection: mockClient,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    }
  };
  return;
}

// Configuración base de Redis con manejo de errores mejorado
const baseConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,  // Reducido para fallar rápido
  connectTimeout: 3000,     // 3 segundos timeout
  commandTimeout: 2000,     // 2 segundos para comandos
  lazyConnect: true,        // No conectar automáticamente
  
  // Estrategia de reintentos mejorada
  retryStrategy: (times) => {
    connectionAttempts = times;
    if (times > 3) {
      console.log(`❌ Redis: Abandoning after ${times} attempts`);
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 1000);
    console.log(`🔄 Redis retry ${times} in ${delay}ms`);
    return delay;
  },
  
  // Configuraciones adicionales para estabilidad
  reconnectOnError: (err) => {
    console.log('🔄 Redis reconnect on error:', err.message);
    return err.message.includes('READONLY');
  },
  
  ...(NODE_ENV === 'development' && {
    showFriendlyErrorStack: true
  })
};

/**
 * Función para crear cliente Redis con manejo de errores
 */
const createRedisClient = (dbNumber, name) => {
  const client = new Redis({
    ...baseConfig,
    db: dbNumber
  });
  
  // Flag para tracking de conexión
  client._isConnected = false;
  client._name = name;
  
  client.on('connect', () => {
    console.log(`✅ Redis ${name} conectado`);
    client._isConnected = true;
    redisAvailable = true;
  });
  
  client.on('ready', () => {
    console.log(`🚀 Redis ${name} listo`);
  });
  
  client.on('error', (error) => {
    console.error(`❌ Redis ${name} error:`, error.message);
    client._isConnected = false;
    // No marcar redisAvailable = false aquí, puede ser temporal
  });
  
  client.on('close', () => {
    console.log(`🔒 Redis ${name} desconectado`);
    client._isConnected = false;
  });
  
  client.on('reconnecting', () => {
    console.log(`🔄 Redis ${name} reconectando...`);
  });

  // Agregar método isHealthy
  client.isHealthy = () => client._isConnected && client.status === 'ready';
  
  return client;
};

// Crear clientes Redis
const redisClient = createRedisClient(REDIS_DB, 'Principal');
const cacheClient = createRedisClient(REDIS_CACHE_DB, 'Cache');
const sessionClient = createRedisClient(REDIS_SESSION_DB, 'Session');
const queueClient = createRedisClient(REDIS_QUEUE_DB, 'Queue');

/**
 * Función para probar conexiones con timeout
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
      // Intentar conectar primero
      if (client.status === 'wait') {
        await client.connect();
      }
      
      // Ping con timeout
      const startTime = Date.now();
      await Promise.race([
        client.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ Redis ${name} OK (${responseTime}ms)`);
      results.push({ name, status: 'connected', responseTime });
      redisAvailable = true;
      
    } catch (error) {
      console.log(`❌ Redis ${name} failed: ${error.message}`);
      results.push({ name, status: 'failed', error: error.message });
    }
  }
  
  return results;
};

/**
 * Utilidades de Cache con fallback
 */
const cache = {
  async set(key, value, ttl = 3600) {
    if (!cacheClient.isHealthy()) return Promise.resolve();
    
    try {
      const prefixedKey = `portal:cache:${key}`;
      const serializedValue = JSON.stringify(value);
      await cacheClient.setex(prefixedKey, ttl, serializedValue);
      console.log(`💾 Cache saved: ${key}`);
    } catch (error) {
      console.warn('⚠️  Cache set failed:', error.message);
    }
  },
  
  async get(key) {
    if (!cacheClient.isHealthy()) return null;
    
    try {
      const prefixedKey = `portal:cache:${key}`;
      const value = await cacheClient.get(prefixedKey);
      if (value) {
        console.log(`📥 Cache hit: ${key}`);
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.warn('⚠️  Cache get failed:', error.message);
      return null;
    }
  },
  
  async del(key) {
    if (!cacheClient.isHealthy()) return Promise.resolve();
    
    try {
      const prefixedKey = `portal:cache:${key}`;
      await cacheClient.del(prefixedKey);
      console.log(`🗑️ Cache deleted: ${key}`);
    } catch (error) {
      console.warn('⚠️  Cache delete failed:', error.message);
    }
  },
  
  // Métodos específicos
  async setETLResult(jobId, result) {
    return this.set(`etl:result:${jobId}`, result, 21600);
  },
  
  async getETLResult(jobId) {
    return this.get(`etl:result:${jobId}`);
  },
  
  async setIAAnalysis(documentId, analysis) {
    return this.set(`ia:analysis:${documentId}`, analysis, 43200);
  },
  
  async getIAAnalysis(documentId) {
    return this.get(`ia:analysis:${documentId}`);
  }
};

/**
 * Utilidades de Sesión con fallback
 */
const session = {
  async store(userId, sessionData, ttl = 86400) {
    if (!sessionClient.isHealthy()) return Promise.resolve();
    
    try {
      const key = `portal:session:user:${userId}`;
      await sessionClient.setex(key, ttl, JSON.stringify(sessionData));
      console.log(`🔐 Session stored: ${userId}`);
    } catch (error) {
      console.warn('⚠️  Session store failed:', error.message);
    }
  },
  
  async get(userId) {
    if (!sessionClient.isHealthy()) return null;
    
    try {
      const key = `portal:session:user:${userId}`;
      const sessionData = await sessionClient.get(key);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.warn('⚠️  Session get failed:', error.message);
      return null;
    }
  },
  
  async invalidate(userId) {
    if (!sessionClient.isHealthy()) return Promise.resolve();
    
    try {
      const key = `portal:session:user:${userId}`;
      await sessionClient.del(key);
      console.log(`🔒 Session invalidated: ${userId}`);
    } catch (error) {
      console.warn('⚠️  Session invalidate failed:', error.message);
    }
  }
};

/**
 * Función para cerrar conexiones gracefully
 */
const closeConnections = async () => {
  const clients = [redisClient, cacheClient, sessionClient, queueClient];
  
  await Promise.all(
    clients.map(async (client, index) => {
      try {
        if (client.status !== 'end') {
          await client.quit();
        }
        console.log(`🔒 Redis client ${index + 1} closed`);
      } catch (error) {
        console.warn(`⚠️  Error closing Redis client ${index + 1}:`, error.message);
      }
    })
  );
};

/**
 * Función para estadísticas con fallback
 */
const getStats = async () => {
  if (!redisClient.isHealthy()) {
    return { status: 'unavailable' };
  }
  
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
      uptime_in_seconds: stats.uptime_in_seconds,
      status: 'healthy'
    };
  } catch (error) {
    console.warn('⚠️  Error getting Redis stats:', error.message);
    return { status: 'error', error: error.message };
  }
};

module.exports = {
  // Clientes Redis
  redisClient,
  cacheClient,
  sessionClient,
  queueClient,
  
  // Flag de disponibilidad
  redisAvailable,
  
  // Utilidades
  cache,
  session,
  
  // Funciones de gestión
  testConnections,
  closeConnections,
  getStats,
  
  // Configuración para BullMQ
  queueConfig: {
    connection: queueClient,
    prefix: 'portal:queue:',
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  }
};