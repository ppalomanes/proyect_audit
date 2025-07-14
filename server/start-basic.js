/**
 * Servidor Básico - Portal de Auditorías Técnicas
 * Inicio simplificado para testing
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Iniciando Portal de Auditorías Técnicas (Modo Básico)...\n');

const app = express();

// Middleware básico
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud básica
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      database: 'not_connected',
      redis: 'not_connected',
      ollama: 'not_connected'
    }
  });
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '🏢 Portal de Auditorías Técnicas API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Intentar cargar rutas de autenticación de forma segura
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Rutas de autenticación cargadas');
} catch (error) {
  console.log('⚠️ Error cargando rutas de auth:', error.message);
}

// Intentar cargar rutas ETL de forma segura
try {
  const etlRoutes = require('./domains/etl/etl.routes');
  app.use('/api/etl', etlRoutes);
  console.log('✅ Rutas ETL cargadas');
} catch (error) {
  console.log('⚠️ Error cargando rutas ETL:', error.message);
}

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('❌ Error del servidor:', error.message);
  
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.message,
      stack: error.stack 
    })
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🎉 Servidor básico iniciado exitosamente!`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`\n📋 Rutas disponibles:`);
  console.log(`   GET  /health        - Estado del servidor`);
  console.log(`   POST /api/auth/*    - Autenticación (si disponible)`);
  console.log(`   POST /api/etl/*     - ETL Service (si disponible)`);
  console.log(`\n⚡ Servidor listo para recibir peticiones del frontend en puerto 3000`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('\n📡 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📡 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;
