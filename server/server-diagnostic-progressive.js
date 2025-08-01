// server-diagnostic-progressive.js
// SERVIDOR DIAGNÓSTICO PROGRESIVO - IDENTIFICA PROBLEMAS PASO A PASO

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002; // Usar puerto del .env o default 3002

console.log('🔍 INICIANDO DIAGNÓSTICO PROGRESIVO DEL SERVIDOR');
console.log('================================================================================');
console.log(`🌐 Puerto configurado: ${PORT}`);
console.log(`📁 Directorio de trabajo: ${process.cwd()}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('================================================================================');

// PASO 1: Configuración básica
console.log('📋 PASO 1: Configuración básica de Express...');
try {
  app.use(cors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://localhost:5174',
      process.env.CORS_ORIGIN || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Middleware de logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  console.log('✅ PASO 1: Express configurado correctamente');
} catch (error) {
  console.error('❌ PASO 1 FALLÓ:', error.message);
  process.exit(1);
}

// PASO 2: Verificar estructura de directorios
console.log('📋 PASO 2: Verificando estructura de directorios...');
try {
  const requiredDirs = [
    './config',
    './domains',
    './middleware', 
    './models',
    './routes',
    './shared',
    './uploads'
  ];

  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Creando directorio faltante: ${dir}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  console.log('✅ PASO 2: Estructura de directorios verificada');
} catch (error) {
  console.error('❌ PASO 2 FALLÓ:', error.message);
  // No salir, continuamos sin directorios
}

// PASO 3: Verificar conexión MySQL
async function checkMySQL() {
  console.log('📋 PASO 3: Verificando conexión MySQL...');
  let mysqlAvailable = false;
  try {
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Verificar si la base de datos existe
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [process.env.DB_NAME || 'portal_auditorias']
    );

    if (rows.length > 0) {
      console.log('✅ PASO 3: MySQL disponible y base de datos existe');
      mysqlAvailable = true;
    } else {
      console.log('⚠️  PASO 3: MySQL disponible pero base de datos no existe');
      // Crear base de datos
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'portal_auditorias'}\``);
      console.log('✅ PASO 3: Base de datos creada');
      mysqlAvailable = true;
    }

    await connection.end();
  } catch (error) {
    console.error('❌ PASO 3: MySQL no disponible:', error.message);
    console.log('💡 Solución: Verificar que XAMPP esté ejecutándose');
  }
  return mysqlAvailable;
}

// PASO 4: Verificar Redis (opcional)
async function checkRedis() {
  console.log('📋 PASO 4: Verificando Redis...');
  let redisAvailable = false;
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1
    });

    await redis.ping();
    console.log('✅ PASO 4: Redis disponible');
    redisAvailable = true;
    redis.disconnect();
  } catch (error) {
    console.log('⚠️  PASO 4: Redis no disponible (opcional):', error.message);
    console.log('💡 Solución: docker run -d -p 6379:6379 redis (opcional)');
  }
  return redisAvailable;
}

// PASO 5: Cargar rutas básicas
console.log('📋 PASO 5: Configurando rutas básicas...');
try {
  // Ruta de health check expandida
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        server: 'running',
        mysql: mysqlAvailable ? 'connected' : 'disconnected',
        redis: redisAvailable ? 'connected' : 'disconnected'
      },
      config: {
        port: PORT,
        cors_origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        db_name: process.env.DB_NAME || 'portal_auditorias'
      }
    });
  });

  // Rutas de módulos básicas
  app.get('/api/auth/status', (req, res) => {
    res.json({ 
      module: 'auth',
      status: 'loaded', 
      timestamp: new Date().toISOString(),
      features: ['JWT', 'bcrypt', 'rate-limiting']
    });
  });

  app.get('/api/auditorias', (req, res) => {
    res.json({ 
      module: 'auditorias',
      message: 'Módulo auditorías disponible', 
      auditorias: [],
      etapas: 8,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/etl/status', (req, res) => {
    res.json({ 
      module: 'etl',
      status: 'loaded', 
      features: ['ExcelJS', 'CSV Parser', 'Field Normalizer'],
      timestamp: new Date().toISOString() 
    });
  });

  app.get('/api/chat/health', (req, res) => {
    res.json({ 
      module: 'chat',
      status: 'loaded',
      features: ['WebSockets', 'Async Messaging'],
      timestamp: new Date().toISOString() 
    });
  });

  app.get('/api/bitacora', (req, res) => {
    res.json({
      module: 'bitacora',
      message: 'Sistema de bitácora operativo',
      status: 'active',
      mysql_required: mysqlAvailable,
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ PASO 5: Rutas básicas configuradas');
} catch (error) {
  console.error('❌ PASO 5 FALLÓ:', error.message);
}

// PASO 6: Intentar cargar módulos avanzados (opcional)
async function checkAdvancedModules(mysqlAvailable) {
  console.log('📋 PASO 6: Intentando cargar módulos avanzados...');
  let sequelizeLoaded = false;
  let socketIOLoaded = false;

  if (mysqlAvailable) {
    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(
        process.env.DB_NAME || 'portal_auditorias',
        process.env.DB_USER || 'root', 
        process.env.DB_PASSWORD || '',
        {
          host: process.env.DB_HOST || 'localhost',
          dialect: 'mysql',
          logging: false,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        }
      );

      await sequelize.authenticate();
      console.log('✅ PASO 6a: Sequelize cargado y conectado');
      sequelizeLoaded = true;
    } catch (error) {
      console.log('⚠️  PASO 6a: Error cargando Sequelize:', error.message);
    }
  }

  try {
    const { Server } = require('socket.io');
    console.log('✅ PASO 6b: Socket.IO disponible');
    socketIOLoaded = true;
  } catch (error) {
    console.log('⚠️  PASO 6b: Error cargando Socket.IO:', error.message);
  }

  return { sequelizeLoaded, socketIOLoaded };
}

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('💥 Error no capturado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    diagnostic: 'Revisar logs del servidor'
  });
});

// Catch-all para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    available_endpoints: [
      'GET /api/health',
      'GET /api/auth/status',
      'GET /api/auditorias',
      'GET /api/etl/status',
      'GET /api/chat/health',
      'GET /api/bitacora'
    ],
    timestamp: new Date().toISOString()
  });
});

// FUNCIÓN PRINCIPAL ASYNC
async function startDiagnosticServer() {
  // Ejecutar verificaciones async
  const mysqlAvailable = await checkMySQL();
  const redisAvailable = await checkRedis();
  const { sequelizeLoaded, socketIOLoaded } = await checkAdvancedModules(mysqlAvailable);

  // PASO 7: Iniciar servidor
  console.log('📋 PASO 7: Iniciando servidor...');
  const server = app.listen(PORT, () => {
  console.log('================================================================================');
  console.log('🎯 SERVIDOR DIAGNÓSTICO INICIADO EXITOSAMENTE');
  console.log('================================================================================');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
  console.log(`📅 Iniciado: ${new Date().toISOString()}`);
  console.log('');
  console.log('📊 ESTADO DE SERVICIOS:');
  console.log(`   🗄️  MySQL: ${mysqlAvailable ? '✅ Conectado' : '❌ No disponible'}`);
  console.log(`   🔴 Redis: ${redisAvailable ? '✅ Conectado' : '⚠️  No disponible (opcional)'}`);
  console.log(`   📦 Sequelize: ${sequelizeLoaded ? '✅ Cargado' : '⚠️  No cargado'}`);
  console.log(`   🔌 Socket.IO: ${socketIOLoaded ? '✅ Disponible' : '⚠️  No disponible'}`);
  console.log('');
  console.log('🎯 PRÓXIMOS PASOS:');
  if (!mysqlAvailable) {
    console.log('   1. ⚡ Iniciar XAMPP y verificar MySQL');
    console.log('   2. 🗄️  Crear base de datos: portal_auditorias');
  }
  if (!redisAvailable) {
    console.log('   3. 🔴 Instalar Redis (opcional): docker run -d -p 6379:6379 redis');
  }
  console.log('   4. 🚀 Migrar a server.js principal una vez estable');
  console.log('================================================================================');
});

// Manejo de cierre
  // Manejo de cierre
  process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado');
      process.exit(0);
    });
  });

  return server;
}

// Iniciar diagnóstico
if (require.main === module) {
  startDiagnosticServer().catch(error => {
    console.error('💥 Error fatal en diagnóstico:', error);
    process.exit(1);
  });
}

module.exports = app;
