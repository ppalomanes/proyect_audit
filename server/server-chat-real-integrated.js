// /server/server-chat-real-integrated.js
// Servidor Chat Real con Autenticación Completa Integrada
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
const authRoutes = require('./domains/auth/auth.routes');

// Importar WebSocket handler
const ChatRealHandler = require('./domains/chat/websockets/chat-real-handler');

// Importar middleware de autenticación
const { authenticate } = require('./domains/auth/middleware/authentication');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware básico
app.use(cors({
  origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de autenticación (SIN middleware de auth)
app.use('/api/auth', authRoutes);

// Rutas de chat (CON middleware de auth para endpoints protegidos)
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
      database: 'connected',
      auth: 'integrated'
    },
    chat_stats: {
      connected_users: chatHandler.getConnectedUsersCount(),
      active_workspaces: chatHandler.workspaceRooms.size
    },
    endpoints: {
      auth: [
        'POST /api/auth/login',
        'POST /api/auth/register', 
        'GET /api/auth/profile',
        'POST /api/auth/logout'
      ],
      chat: [
        'GET /api/chat/workspaces',
        'GET /api/chat/canales/:id/mensajes',
        'POST /api/chat/canales/:id/mensajes'
      ]
    }
  });
});

// Endpoint para validar token (útil para debugging)
app.get('/api/auth/validate', authenticate, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'POST /api/auth/login',
      'GET /api/auth/profile', 
      'GET /api/chat/workspaces',
      'GET /health'
    ]
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
    
    // Crear usuarios demo si no existen
    await createDemoUsers();
    
    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      console.log('🚀 ============================================');
      console.log('🎯 Portal de Auditorías - Chat + Auth Integrado');
      console.log('🚀 ============================================');
      console.log(`📡 Servidor ejecutándose en puerto: ${PORT}`);
      console.log(`🌐 API disponible en: http://localhost:${PORT}`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
      console.log(`💬 Chat endpoints: http://localhost:${PORT}/api/chat/*`);
      console.log(`🔌 WebSocket namespace: /chat`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('🚀 ============================================');
      console.log('✅ Chat Real con autenticación completa activo');
      console.log('🔐 Endpoints de login funcionando');
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

// Función para crear usuarios demo
async function createDemoUsers() {
  try {
    const { Usuario } = require('./models');
    const bcrypt = require('bcrypt');
    
    const usuariosDemo = [
      {
        email: 'admin@portal-auditorias.com',
        password: await bcrypt.hash('admin123', 10),
        nombres: 'Administrador',
        apellidos: 'Sistema',
        documento: '12345678',
        telefono: '1234567890',
        rol: 'ADMIN',
        estado: 'ACTIVO'
      },
      {
        email: 'auditor@portal-auditorias.com',
        password: await bcrypt.hash('auditor123', 10),
        nombres: 'Auditor',
        apellidos: 'Principal',
        documento: '87654321',
        telefono: '0987654321',
        rol: 'AUDITOR',
        estado: 'ACTIVO'
      },
      {
        email: 'proveedor@callcenterdemo.com',
        password: await bcrypt.hash('proveedor123', 10),
        nombres: 'Proveedor',
        apellidos: 'Demo',
        documento: '11223344',
        telefono: '1122334455',
        rol: 'PROVEEDOR',
        estado: 'ACTIVO'
      }
    ];
    
    for (const userData of usuariosDemo) {
      const [user, created] = await Usuario.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      
      if (created) {
        console.log(`✅ Usuario demo creado: ${userData.email}`);
      }
    }
    
  } catch (error) {
    console.log('⚠️  No se pudieron crear usuarios demo:', error.message);
  }
}

// Inicializar aplicación
initializeApp();

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor integrado...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = { app, server, io };