// /server/server-chat-auth-simple.js
// Servidor Chat + Auth Simplificado (Sin dependencias complejas)
// Portal de Auditorías Técnicas

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Importar configuración
require('dotenv').config();

// Importar y configurar base de datos
const { sequelize, testConnection }

// === RUTAS DE ETL ===

// Importar rutas de ETL
try {
  const { initializeETLRoutes } = require('./domains/etl/etl.routes');
  const etlRouter = initializeETLRoutes(sequelize);
  app.use('/api/etl', etlRouter);
  console.log('✅ Rutas de ETL cargadas');
} catch (error) {
  console.log('⚠️ Rutas de ETL no disponibles:', error.message);
  
  // Endpoints básicos de ETL como fallback
  app.get('/api/etl/info', (req, res) => {
    res.json({
      success: true,
      message: 'Módulo ETL no completamente configurado',
      data: {
        module: 'ETL Parque Informático',
        version: '2.0',
        status: 'partial'
      }
    });
  });
}

// === RUTAS DE AUDITORÍAS ===

// Importar rutas de auditorías (si existen)
try {
  const auditoriasRoutes = require('./domains/auditorias/auditorias.routes');
  app.use('/api/auditorias', auditoriasRoutes);
  console.log('✅ Rutas de auditorías cargadas');
} catch (error) {
  console.log('⚠️ Rutas de auditorías no disponibles:', error.message);
  
  // Endpoints básicos de auditorías como fallback
  app.get('/api/auditorias', authenticateToken, (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          codigo: 'AUD-2025-001',
          proveedor: 'Proveedor Demo',
          estado: 'CARGA_PARQUE',
          fecha_creacion: new Date().toISOString()
        }
      ]
    });
  });
} = require('./config/database');

// Importar WebSocket handler
const ChatRealHandler = require('./domains/chat/websockets/chat-real-handler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'portal-auditorias-super-secret-key-change-in-production';

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

// Middleware de autenticación simple
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    req.user = user;
    next();
  });
};

// Usuarios demo en memoria (para simplificar)
const demoUsers = [
  {
    id: 1,
    email: 'admin@portal-auditorias.com',
    password: '$2b$10$CwTycUXWue0Thq9StjUM0uJ8tq.1D.yy0.7.3K1.7zR7qrJ1T2.12', // admin123
    nombres: 'Administrador',
    apellidos: 'Sistema',
    rol: 'ADMIN',
    estado: 'ACTIVO'
  },
  {
    id: 2,
    email: 'auditor@portal-auditorias.com',
    password: '$2b$10$CwTycUXWue0Thq9StjUM0uJ8tq.1D.yy0.7.3K1.7zR7qrJ1T2.12', // auditor123
    nombres: 'Auditor',
    apellidos: 'Principal',
    rol: 'AUDITOR',
    estado: 'ACTIVO'
  },
  {
    id: 3,
    email: 'proveedor@callcenterdemo.com',
    password: '$2b$10$CwTycUXWue0Thq9StjUM0uJ8tq.1D.yy0.7.3K1.7zR7qrJ1T2.12', // proveedor123
    nombres: 'Proveedor',
    apellidos: 'Demo',
    rol: 'PROVEEDOR',
    estado: 'ACTIVO'
  }
];

// Función para generar JWT
const generateToken = (user) => {
  return jwt.sign({
    userId: user.id,
    id: user.id,
    email: user.email,
    nombre: user.nombres + ' ' + user.apellidos,
    nombres: user.nombres,
    apellidos: user.apellidos,
    rol: user.rol
  }, JWT_SECRET, { expiresIn: '24h' });
};

// === RUTAS DE AUTENTICACIÓN ===

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario demo
    const user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña (para demo, aceptamos las contraseñas conocidas)
    const validPasswords = {
      'admin@portal-auditorias.com': 'admin123',
      'auditor@portal-auditorias.com': 'auditor123',
      'proveedor@callcenterdemo.com': 'proveedor123'
    };

    if (password !== validPasswords[email.toLowerCase()]) {
      return res.status(401).json({
        status: 'fail',
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user);

    console.log(`✅ Login exitoso: ${user.email} (${user.rol})`);

    res.json({
      status: 'success',
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          rol: user.rol
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout exitoso'
  });
});

// GET /api/auth/validate
app.get('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// === RUTAS DE CHAT ===

// Importar rutas de chat (si existen y funcionan)
try {
  const chatRealRoutes = require('./domains/chat/chat-real.routes');
  app.use('/api/chat', chatRealRoutes);
  console.log('✅ Rutas de chat cargadas');
} catch (error) {
  console.log('⚠️ Rutas de chat no disponibles, usando endpoints básicos');
  
  // Endpoints básicos de chat como fallback
  app.get('/api/chat/workspaces', authenticateToken, (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          nombre: 'Auditoría Proveedor XYZ',
          descripcion: 'Workspace para auditoría en curso',
          canales: [
            { id: 1, nombre: 'general', conversacion_id: 1 },
            { id: 2, nombre: 'documentos', conversacion_id: 2 }
          ]
        }
      ]
    });
  });
}

// Configurar WebSocket handler para chat real
let chatHandler;
try {
  chatHandler = new ChatRealHandler(io);
  console.log('✅ WebSocket handler inicializado');
} catch (error) {
  console.log('⚠️ WebSocket handler no disponible:', error.message);
}

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      websocket: chatHandler ? 'running' : 'basic',
      database: 'connected',
      auth: 'integrated'
    },
    endpoints: {
      auth: [
        'POST /api/auth/login',
        'GET /api/auth/profile',
        'GET /api/auth/validate',
        'POST /api/auth/logout'
      ],
      chat: [
        'GET /api/chat/workspaces'
      ]
    },
    demo_users: [
      { email: 'admin@portal-auditorias.com', password: 'admin123', rol: 'ADMIN' },
      { email: 'auditor@portal-auditorias.com', password: 'auditor123', rol: 'AUDITOR' },
      { email: 'proveedor@callcenterdemo.com', password: 'proveedor123', rol: 'PROVEEDOR' }
    ]
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
    
    console.log('📋 Base de datos conectada exitosamente');
    
    // Iniciar servidor
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      console.log('🚀 ============================================');
      console.log('🎯 Portal de Auditorías - Chat + Auth Simple');
      console.log('🚀 ============================================');
      console.log(`📡 Servidor ejecutándose en puerto: ${PORT}`);
      console.log(`🌐 API disponible en: http://localhost:${PORT}`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
      console.log(`💬 Chat endpoints: http://localhost:${PORT}/api/chat/*`);
      console.log(`🔌 WebSocket namespace: /chat`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('🚀 ============================================');
      console.log('✅ Sistema con autenticación JWT funcionando');
      console.log('👤 Usuarios demo disponibles:');
      console.log('   📧 admin@portal-auditorias.com / admin123');
      console.log('   📧 auditor@portal-auditorias.com / auditor123');
      console.log('   📧 proveedor@callcenterdemo.com / proveedor123');
      console.log('🚀 ============================================');
    });
    
  } catch (error) {
    console.error('❌ Error inicializando aplicación:', error.message);
    console.log('💡 Posibles soluciones:');
    console.log('   1. Verificar que XAMPP esté ejecutándose');
    console.log('   2. Verificar credenciales de base de datos en .env');
    process.exit(1);
  }
}

// Inicializar aplicación
initializeApp();

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor simple...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = { app, server, io };