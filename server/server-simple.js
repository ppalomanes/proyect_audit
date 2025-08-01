/**
 * Servidor Simplificado para Testing - Portal de Auditorías
 * Versión mínima para verificar que todo funciona
 */

const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const app = express();
const PORT = 3002;

// Middleware básico
app.use(cors());
app.use(express.json());

// Ruta de health check
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a BD
    await testConnection();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0',
      message: 'Portal de Auditorías funcionando correctamente'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Ruta básica de auditorías
app.get('/api/auditorias', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de auditorías funcionando',
    data: []
  });
});

// Ruta básica de bitácora
app.get('/api/bitacora', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de bitácora funcionando',
    data: []
  });
});

// Endpoints básicos de autenticación para el cliente
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simulación básica de login
  if (email && password) {
    res.json({
      success: true,
      user: {
        id: 1,
        email: email,
        name: 'Usuario Demo',
        role: 'admin'
      },
      token: 'demo-token-123',
      message: 'Login exitoso (modo demo)'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email y password requeridos'
    });
  }
});

app.get('/api/auth/validate', (req, res) => {
  // Validación básica de token
  const token = req.headers.authorization;
  
  if (token && token.includes('demo-token')) {
    res.json({
      success: true,
      user: {
        id: 1,
        email: 'demo@example.com',
        name: 'Usuario Demo',
        role: 'admin'
      },
      message: 'Token válido (modo demo)'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

// Manejo de errores simple
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor simplificado...');
    
    // Verificar conexión a BD
    await testConnection();
    console.log('✅ Conexión a base de datos exitosa');
    
    app.listen(PORT, () => {
      console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📋 Auditorías: http://localhost:${PORT}/api/auditorias`);
      console.log(`📝 Bitácora: http://localhost:${PORT}/api/bitacora`);
    });
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Solución: Verifica que MySQL esté ejecutándose en XAMPP');
      console.error('   1. Abre XAMPP Control Panel');
      console.error('   2. Inicia MySQL');
      console.error('   3. Reinicia este servidor');
    }
    
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🔄 Cerrando servidor...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

startServer();
