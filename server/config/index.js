/**
 * Configuración principal del servidor
 * Portal de Auditorías Técnicas
 * Centraliza todas las configuraciones y conexiones
 */

const database = require('./database');
const redis = require('./redis');
const ollama = require('./ollama');
const bullmq = require('./bullmq');

require('dotenv').config();

const serverConfig = {
  // Configuración del servidor Express
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:5173']
  },

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'portal_auditorias_jwt_secret_2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'portal_auditorias_refresh_secret_2025',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Configuración de archivos
  files: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    allowedExtensions: {
      documents: ['.pdf', '.doc', '.docx', '.txt'],
      spreadsheets: ['.xlsx', '.xls', '.csv'],
      images: ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'],
      archives: ['.zip', '.rar', '.7z']
    }
  },

  // Configuración de email (para notificaciones)
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@portal-auditorias.com',
    templates: {
      path: './server/domains/notifications/templates'
    }
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/server.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },

  // Configuración de seguridad
  security: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100,
      skipSuccessfulRequests: false
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }
  }
};

// Función para inicializar todas las conexiones
const initializeConnections = async () => {
  console.log('🚀 Inicializando conexiones del servidor...');
  
  const results = {
    database: false,
    redis: false,
    ollama: false,
    bullmq: false
  };

  try {
    // Inicializar base de datos
    console.log('📊 Conectando a MySQL...');
    results.database = await database.testConnection();
    
    if (results.database && serverConfig.server.env !== 'production') {
      // Sincronizar modelos en desarrollo
      await database.syncDatabase({ alter: true });
    }

    // Inicializar Redis
    console.log('🔴 Conectando a Redis...');
    results.redis = await redis.testConnection();

    // Inicializar Ollama (IA)
    console.log('🤖 Conectando a Ollama...');
    results.ollama = await ollama.initializeOllama();

    // BullMQ se inicializa automáticamente con Redis
    results.bullmq = results.redis;

    // Resumen de conexiones
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n✅ Conexiones inicializadas: ${successCount}/${totalCount}`);
    console.log('📋 Estado de conexiones:');
    Object.entries(results).forEach(([service, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`  ${icon} ${service}: ${status ? 'Conectado' : 'Desconectado'}`);
    });

    return results;

  } catch (error) {
    console.error('❌ Error durante inicialización:', error.message);
    return results;
  }
};

// Función para verificar salud del sistema
const healthCheck = async () => {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {},
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: serverConfig.server.env
  };

  try {
    // Verificar base de datos
    health.services.database = {
      status: await database.testConnection() ? 'up' : 'down',
      type: 'mysql'
    };

    // Verificar Redis
    health.services.redis = {
      status: await redis.testConnection() ? 'up' : 'down',
      type: 'redis'
    };

    // Verificar Ollama
    const ollamaStatus = await ollama.checkOllamaStatus();
    health.services.ollama = {
      status: ollamaStatus.status === 'connected' ? 'up' : 'down',
      type: 'ai_engine',
      models: ollamaStatus.models?.length || 0
    };

    // Verificar BullMQ
    try {
      const bullmqStats = await bullmq.getGlobalStats();
      health.services.bullmq = {
        status: 'up',
        type: 'job_queue',
        queues: bullmqStats.totalQueues || 0
      };
    } catch (error) {
      health.services.bullmq = {
        status: 'down',
        type: 'job_queue',
        error: error.message
      };
    }

    // Determinar estado general
    const downServices = Object.values(health.services)
      .filter(service => service.status === 'down');
    
    if (downServices.length > 0) {
      health.status = downServices.length >= 2 ? 'unhealthy' : 'degraded';
    }

    return health;

  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    return health;
  }
};

// Función para cerrar todas las conexiones gracefully
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor gracefully...`);
  
  try {
    // Cerrar BullMQ
    await bullmq.closeAll();
    
    // Cerrar Redis
    await redis.closeConnections();
    
    // Cerrar base de datos
    await database.closeConnection();
    
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante cierre del servidor:', error.message);
    process.exit(1);
  }
};

// Configurar manejo de señales
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
  process.exit(1);
});

module.exports = {
  serverConfig,
  initializeConnections,
  healthCheck,
  gracefulShutdown,
  
  // Re-exportar configuraciones específicas
  database,
  redis,
  ollama,
  bullmq
};
