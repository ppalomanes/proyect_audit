/**
 * Servidor Temporal - Solución Rápida Auth - CORREGIDO
 * Puerto 3001 - Reemplaza temporalmente server-simple.js
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware básico
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticación simple
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token no proporcionado',
        data: null
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'portal-auditorias-secret-key');
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token inválido',
      data: null
    });
  }
};

// Importar controlador simplificado
const authController = require('./auth-controller-simple');

// === RUTAS DE AUTENTICACIÓN ===
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);
app.post('/api/auth/refresh', authController.refresh);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', authenticate, authController.me);
app.put('/api/auth/profile', authenticate, authController.updateProfile);
app.put('/api/auth/change-password', authenticate, authController.changePassword);

// === RUTAS DE TESTING ===
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    mode: 'simplified-corrected'
  });
});

app.get('/api/auth', (req, res) => {
  res.json({
    message: 'API de Autenticación - Portal de Auditorías Técnicas (Modo Simplificado Corregido)',
    version: '1.0.0-simple-fixed',
    status: 'active',
    mode: 'simplified',
    endpoints: {
      'POST /api/auth/login': 'Iniciar sesión',
      'POST /api/auth/register': 'Registrar usuario',
      'POST /api/auth/refresh': 'Renovar token',
      'POST /api/auth/logout': 'Cerrar sesión',
      'GET /api/auth/me': 'Obtener perfil',
      'PUT /api/auth/profile': 'Actualizar perfil',
      'PUT /api/auth/change-password': 'Cambiar contraseña'
    },
    demo_users: {
      admin: 'admin@portal-auditorias.com / admin123',
      auditor: 'auditor@portal-auditorias.com / auditor123',
      proveedor: 'proveedor@callcenterdemo.com / proveedor123'
    },
    fix_applied: 'Contraseñas corregidas - comparación directa'
  });
});

// === RUTAS PLACEHOLDER PARA OTROS MÓDULOS ===
app.get('/api/auditorias', authenticate, (req, res) => {
  res.json({
    status: 'success',
    message: 'Módulo de Auditorías - En desarrollo',
    user: req.user
  });
});

app.get('/api/etl', authenticate, (req, res) => {
  res.json({
    status: 'success',
    message: 'Módulo ETL - En desarrollo',
    user: req.user
  });
});

app.get('/api/ia', authenticate, (req, res) => {
  res.json({
    status: 'success',
    message: 'Módulo IA - En desarrollo',
    user: req.user
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('💥 Error global:', error);
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    data: null
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    data: null
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log('🚀 SERVIDOR TEMPORAL SIMPLIFICADO CORREGIDO');
  console.log('='.repeat(50));
  console.log(`Puerto: ${PORT}`);
  console.log(`Frontend: http://localhost:3000`);
  console.log(`Backend: http://localhost:${PORT}`);
  console.log('\n📋 ENDPOINTS DISPONIBLES:');
  console.log(`✅ POST http://localhost:${PORT}/api/auth/login`);
  console.log(`✅ POST http://localhost:${PORT}/api/auth/register`);
  console.log(`✅ GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`✅ PUT  http://localhost:${PORT}/api/auth/profile`);
  console.log(`✅ PUT  http://localhost:${PORT}/api/auth/change-password`);
  console.log(`✅ GET  http://localhost:${PORT}/api/health`);
  console.log('\n👥 USUARIOS DEMO (CONTRASEÑAS CORREGIDAS):');
  console.log('📧 admin@portal-auditorias.com / admin123');
  console.log('📧 auditor@portal-auditorias.com / auditor123');
  console.log('📧 proveedor@callcenterdemo.com / proveedor123');
  console.log('\n🔧 MODO: Simplificado (sin base de datos)');
  console.log('🔑 CONTRASEÑAS: Comparación directa (sin hash)');
  console.log('⏹️  Para cerrar: Ctrl+C');
});
