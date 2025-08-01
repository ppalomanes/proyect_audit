/**
 * Servidor AUTH Rápido - Solo para resolver errores 404
 */

console.log('🚀 Iniciando servidor de autenticación rápido...');

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'demo-secret-key';

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  // Usuario demo
  const demoUser = {
    id: 'demo_admin_001',
    email: email || 'admin@portal-auditorias.com',
    nombres: 'Administrador',
    apellidos: 'Sistema',
    rol: 'ADMIN',
    estado: 'ACTIVO',
    email_verificado: true
  };
  
  // Generar token
  const token = jwt.sign(demoUser, JWT_SECRET, { expiresIn: '24h' });
  
  res.json({
    status: 'success',
    message: 'Login exitoso',
    data: {
      user: demoUser,
      accessToken: token,
      refreshToken: token,
      expiresIn: '24h'
    }
  });
});

// GET /api/auth/validate
app.get('/api/auth/validate', (req, res) => {
  console.log('✅ Token validation:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token requerido'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      status: 'success',
      message: 'Token válido',
      data: {
        user: decoded,
        token_valid: true
      }
    });
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Token inválido'
    });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  console.log('👋 Logout request');
  
  res.json({
    status: 'success',
    message: 'Logout exitoso',
    data: null
  });
});

// GET /api/auth/validate-token (alias)
app.get('/api/auth/validate-token', (req, res) => {
  // Redirigir a /validate
  req.url = '/api/auth/validate';
  app._router.handle(req, res);
});

// ========================================
// RUTAS ADICIONALES
// ========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'auth-quick-server',
    port: PORT
  });
});

// Info de auth
app.get('/api/auth', (req, res) => {
  res.json({
    message: 'Auth Server - Portal de Auditorías',
    version: '1.0.0-quick',
    endpoints: {
      'POST /api/auth/login': 'Iniciar sesión',
      'GET /api/auth/validate': 'Validar token',
      'POST /api/auth/logout': 'Cerrar sesión'
    },
    demo_credentials: {
      email: 'cualquier@email.com',
      password: 'cualquier-password'
    }
  });
});

// Catch all 404
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'fail',
    message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'POST /api/auth/login',
      'GET /api/auth/validate',
      'POST /api/auth/logout',
      'GET /api/health'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('💥 Error:', error.message);
  res.status(500).json({
    status: 'error',
    message: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor AUTH ejecutándose en puerto ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/validate`);
  console.log(`   POST http://localhost:${PORT}/api/auth/logout`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`\n🎯 Listo para recibir requests del frontend!`);
});
