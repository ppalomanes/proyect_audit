// /server/server-chat-real.js
// Servidor con Chat Real integrado
// Portal de Auditorías Técnicas

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Importar configuración
require('dotenv').config();

// Importar y configurar base de datos
const { sequelize, testConnection } = require('./config/database');

// Importar rutas
const chatRealRoutes = require('./domains/chat/chat-real.routes');

// Importar WebSocket handler
const ChatRealHandler = require('./domains/chat/websockets/chat-real-handler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api/chat', chatRealRoutes);

// Configurar WebSocket handler para chat real
const chatHandler = new ChatRealHandler(io);

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      websocket: 'running',
      database: 'connected'
    },
    chat_stats: {
      connected_users: chatHandler.getConnectedUsersCount(),
      active_workspaces: chatHandler.workspaceRooms.size
    }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    console.log('🔌 Inicializando conexión a base de datos...');
    await testConnection();
    
    console.log('📋 Sincronizando modelos...');
    await sequelize.sync({ alter: true });
    
    console.log('✅ Base de datos inicializada correctamente');
    
    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      console.log('🚀 ============================================');
      console.log('🎯 Portal de Auditorías Técnicas - Chat Real');
      console.log('🚀 ============================================');
      console.log(`📡 Servidor ejecutándose en puerto: ${PORT}`);
      console.log(`🌐 API disponible en: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket namespace: /chat`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('🚀 ============================================');
      console.log('✅ Chat Real con persistencia MySQL activo');
      console.log('🔐 Autenticación JWT habilitada');
      console.log('📁 Upload de archivos configurado');
      console.log('🚀 ============================================');
    });
    
  } catch (error) {
    console.error('❌ Error inicializando aplicación:', error.message);
    console.log('💡 Posibles soluciones:');
    console.log('   1. Verificar que XAMPP esté ejecutándose');
    console.log('   2. Verificar credenciales de base de datos en .env');
    console.log('   3. Crear base de datos "portal_auditorias" en phpMyAdmin');
    process.exit(1);
  }
}

// Inicializar aplicación
initializeApp();

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor de Chat Real...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = { app, server, io };