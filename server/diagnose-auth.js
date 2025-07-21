/**
 * Script de Diagnóstico Rápido - Sistema de Autenticación
 * Identifica problemas en el backend
 */

const express = require('express');
const cors = require('cors');

// Crear app temporal para testing
const app = express();

// Middleware básico
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE AUTENTICACIÓN');
console.log('='.repeat(50));

// Test 1: Variables de entorno
console.log('\n1. ✅ VARIABLES DE ENTORNO:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`PORT: ${process.env.PORT || 'undefined'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'definido' : 'undefined'}`);
console.log(`DB_HOST: ${process.env.DB_HOST || 'undefined'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'undefined'}`);

// Test 2: Dependencias críticas
console.log('\n2. ✅ DEPENDENCIAS CRÍTICAS:');
try {
  const bcrypt = require('bcrypt');
  console.log('✅ bcrypt: OK');
} catch (error) {
  console.log('❌ bcrypt: ERROR');
}

try {
  const jwt = require('jsonwebtoken');
  console.log('✅ jsonwebtoken: OK');
} catch (error) {
  console.log('❌ jsonwebtoken: ERROR');
}

try {
  const { validationResult } = require('express-validator');
  console.log('✅ express-validator: OK');
} catch (error) {
  console.log('❌ express-validator: ERROR');
}

// Test 3: Estructura de archivos
console.log('\n3. ✅ ESTRUCTURA DE ARCHIVOS:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  './domains/auth/auth.controller.js',
  './domains/auth/auth.service.js',
  './domains/auth/auth.routes.js',
  './.env'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}: OK`);
  } else {
    console.log(`❌ ${file}: FALTA`);
  }
});

// Test 4: Endpoint de prueba simple
app.post('/api/auth/test', (req, res) => {
  console.log('\n4. ✅ TEST ENDPOINT RECIBIDO:');
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  
  res.json({
    status: 'success',
    message: 'Endpoint de prueba funcionando',
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Test 5: Login simulado simple
app.post('/api/auth/login-test', async (req, res) => {
  console.log('\n5. ✅ LOGIN TEST RECIBIDO:');
  console.log('Email:', req.body.email);
  console.log('Password:', req.body.password ? '***' : 'undefined');
  
  try {
    // Simular usuario demo
    if (req.body.email === 'admin@portal-auditorias.com' && req.body.password === 'admin123') {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          id: 1,
          email: 'admin@portal-auditorias.com',
          rol: 'ADMIN',
          nombres: 'Administrator',
          apellidos: 'Portal'
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
      
      res.json({
        status: 'success',
        message: 'Login exitoso (modo test)',
        data: {
          token,
          user: {
            id: 1,
            email: 'admin@portal-auditorias.com',
            rol: 'ADMIN',
            nombres: 'Administrator',
            apellidos: 'Portal'
          }
        }
      });
    } else {
      res.status(401).json({
        status: 'fail',
        message: 'Credenciales inválidas (modo test)'
      });
    }
  } catch (error) {
    console.error('❌ Error en login test:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Test 6: Cargar módulos reales (diagnóstico)
console.log('\n6. ✅ CARGANDO MÓDULOS REALES:');

let authController, authService;

try {
  authController = require('./domains/auth/auth.controller.js');
  console.log('✅ AuthController: OK');
} catch (error) {
  console.log('❌ AuthController ERROR:', error.message);
}

try {
  authService = require('./domains/auth/auth.service.js');
  console.log('✅ AuthService: OK');
} catch (error) {
  console.log('❌ AuthService ERROR:', error.message);
}

// Test 7: Database connection test
console.log('\n7. ✅ TESTING DATABASE:');
try {
  const { getModels } = require('./models');
  console.log('✅ Models module: OK');
  
  // Intentar obtener modelos
  const models = getModels();
  if (models && models.Usuario) {
    console.log('✅ Usuario model: OK');
  } else {
    console.log('❌ Usuario model: NO DISPONIBLE');
  }
} catch (error) {
  console.log('❌ Database/Models ERROR:', error.message);
}

// Iniciar servidor de diagnóstico
const PORT = 3002; // Puerto diferente para no interferir

app.listen(PORT, () => {
  console.log('\n🚀 SERVIDOR DE DIAGNÓSTICO INICIADO');
  console.log('='.repeat(50));
  console.log(`Puerto: ${PORT}`);
  console.log('Endpoints disponibles:');
  console.log(`- POST http://localhost:${PORT}/api/auth/test`);
  console.log(`- POST http://localhost:${PORT}/api/auth/login-test`);
  console.log('\n📋 INSTRUCCIONES:');
  console.log('1. Revisar los resultados arriba');
  console.log('2. Probar endpoint: POST http://localhost:3002/api/auth/login-test');
  console.log('3. Body: {"email":"admin@portal-auditorias.com","password":"admin123"}');
  console.log('\n⏹️  Para cerrar: Ctrl+C');
});
