/**
 * Servidor Principal - Portal de Auditorías Técnicas
 * Implementa la arquitectura modular con separación por dominios
 * siguiendo la Estrategia Claude.md
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Configuraciones centrales
const { testConnection, syncDatabase } = require('./config/database');
const { testConnections } = require('./config/redis');
const { checkOllamaHealth } = require('./config/ollama');
const { initializeQueues, createWorkers } = require('./config/bullmq');

// Middleware personalizado
// const authMiddleware = require('./shared/middleware/authentication'); // Comentado temporalmente
const errorHandler = require('./shared/middleware/error-handler');
const requestLogger = require('./shared/middleware/request-logger');

// Variables de entorno
const {
  PORT = 3001,
  NODE_ENV = 'development',
  CORS_ORIGIN = 'http://localhost:3000',
  RATE_LIMIT_WINDOW = 15,
  RATE_LIMIT_MAX = 100
} = process.env;

// Crear aplicación Express
const app = express();

// === CONFIGURACIÓN DE MIDDLEWARES GLOBALES ===

// Seguridad básica
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configurado
app.use(cors({
  origin: NODE_ENV === 'development' ? true : CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compresión de respuestas
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW * 60 * 1000, // minutos a ms
  max: RATE_LIMIT_MAX,
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    retryAfter: RATE_LIMIT_WINDOW * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Parsing de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Middleware personalizado de logging
app.use(requestLogger);

// === RUTAS PRINCIPALES ===

// Health check básico
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {}
    };

    // Verificar servicios críticos
    try {
      await testConnection();
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'degraded';
    }

    try {
      const redisResults = await testConnections();
      health.services.redis = redisResults.every(r => r.status === 'connected') 
        ? 'connected' 
        : 'partial';
      if (health.services.redis !== 'connected') health.status = 'degraded';
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'degraded';
    }

    try {
      const ollamaHealth = await checkOllamaHealth();
      health.services.ollama = ollamaHealth.status;
      health.services.ollama_models = ollamaHealth.available_models || [];
    } catch (error) {
      health.services.ollama = 'unavailable';
      // IA no es crítica, sistema puede funcionar sin ella
    }

    res.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// === REGISTRO DE RUTAS POR DOMINIOS ===

// NOTA: Solo registramos rutas que existen actualmente
// TODO: Descomentar cuando se implementen los otros módulos

// Rutas de autenticación (sin autenticación requerida)
// app.use('/api/auth', require('./domains/auth/auth.routes'));

// Middleware de autenticación para rutas protegidas
// TEMPORALMENTE COMENTADO - falta implementar módulo auth
// app.use('/api', authMiddleware);

// Rutas protegidas por dominio
// app.use('/api/auditorias', require('./domains/auditorias/auditorias.routes'));
// app.use('/api/etl', require('./domains/etl/etl.routes'));
app.use('/api/ia', require('./domains/ia/ia.routes'));
// app.use('/api/chat', require('./domains/chat/chat.routes'));
// app.use('/api/notifications', require('./domains/notifications/notifications.routes'));
// app.use('/api/dashboards', require('./domains/dashboards/dashboards.routes'));
// app.use('/api/entities', require('./domains/entities/entities.routes'));

// === RUTAS DE ARCHIVOS ESTÁTICOS ===

// Servir archivos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir frontend en producción
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// === MANEJO DE ERRORES ===

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler global
app.use(errorHandler);

// === FUNCIÓN DE INICIALIZACIÓN ===

const initializeServer = async () => {
  try {
    console.log('🚀 Iniciando Portal de Auditorías Técnicas...');
    console.log(`📍 Entorno: ${NODE_ENV}`);
    console.log(`🌐 Puerto: ${PORT}`);

    // 1. Verificar conexión a base de datos
    console.log('\n📊 Verificando servicios externos...');
    await testConnection();
    
    // 2. Sincronizar modelos de base de datos
    if (NODE_ENV === 'development') {
      await syncDatabase({ alter: true, logging: false });
    }

    // 3. Verificar Redis
    const redisResults = await testConnections();
    console.log('📊 Redis:', redisResults.length, 'conexiones verificadas');

    // 4. Verificar Ollama (opcional)
    try {
      const ollamaHealth = await checkOllamaHealth();
      if (ollamaHealth.status === 'healthy') {
        console.log('🤖 Ollama disponible con', ollamaHealth.available_models.length, 'modelos');
      } else {
        console.log('⚠️  Ollama no disponible - se usará modo fallback');
      }
    } catch (error) {
      console.log('⚠️  Ollama no disponible - se usará modo fallback');
    }

    // 5. Inicializar colas BullMQ
    try {
      await initializeQueues();
      await createWorkers();
      console.log('📋 Colas BullMQ inicializadas correctamente');
    } catch (error) {
      console.error('⚠️  Error inicializando colas BullMQ:', error.message);
    }

    // 6. Crear directorio de uploads si no existe
    const uploadsDir = path.join(__dirname, 'uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Directorio uploads creado');
    }

    console.log('\n✅ Servicios inicializados correctamente');
    console.log('🎯 Servidor listo para recibir solicitudes\n');

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    console.error('💡 Verifica las configuraciones en /config/');
    process.exit(1);
  }
};

// === GESTIÓN DE SHUTDOWN GRACEFUL ===

const gracefulShutdown = async () => {
  console.log('\n🔄 Iniciando shutdown graceful...');
  
  try {
    // Cerrar servidor HTTP
    server.close(() => {
      console.log('🔒 Servidor HTTP cerrado');
    });

    // Cerrar conexiones de base de datos
    const { closeConnection } = require('./config/database');
    await closeConnection();

    // Cerrar conexiones Redis
    const { closeConnections } = require('./config/redis');
    await closeConnections();

    // Cerrar colas BullMQ
    const { closeQueues } = require('./config/bullmq');
    await closeQueues();

    console.log('✅ Shutdown graceful completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante shutdown:', error.message);
    process.exit(1);
  }
};

// Listeners para shutdown graceful
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection en:', promise, 'razón:', reason);
  gracefulShutdown();
});

// === INICIO DEL SERVIDOR ===

let server;

const startServer = async () => {
  await initializeServer();
  
  server = app.listen(PORT, () => {
    console.log(`🌟 Portal de Auditorías Técnicas ejecutándose en puerto ${PORT}`);
    console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
    console.log(`💊 Health check: http://localhost:${PORT}/api/health`);
    
    if (NODE_ENV === 'development') {
      console.log(`🎨 Frontend: http://localhost:3000`);
      console.log(`📚 Documentación: Revisar PROJECT_OVERVIEW.md`);
    }
    
    console.log('\n📋 Endpoints principales:');
    console.log('   POST /api/auth/login - Autenticación');
    console.log('   GET  /api/auditorias - Lista de auditorías');
    console.log('   POST /api/etl/process - Procesamiento ETL');
    console.log('   POST /api/ia/analyze - Análisis con IA');
    console.log('   GET  /api/health - Estado del sistema\n');
  });
};

// Iniciar servidor si es el archivo principal
if (require.main === module) {
  startServer().catch(error => {
    console.error('💥 Error fatal iniciando servidor:', error);
    process.exit(1);
  });
}

module.exports = { app, startServer, gracefulShutdown };
