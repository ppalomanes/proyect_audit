/**
 * Debug del problema de middleware
 */

const express = require('express');
const router = express.Router();

// Probar diferentes formas de importar el middleware

console.log('🔍 Intentando importar middleware de autenticación...');

// Método 1: Importación directa
try {
  const authMiddleware = require('../auth/middleware/authentication');
  console.log('✅ Importación exitosa desde ../auth/middleware/authentication');
  console.log('📋 Exports disponibles:', Object.keys(authMiddleware));
  
  // Verificar que requireAuth existe
  if (authMiddleware.requireAuth) {
    console.log('✅ requireAuth está disponible');
    console.log('📋 Tipo de requireAuth:', typeof authMiddleware.requireAuth);
  } else {
    console.log('❌ requireAuth NO está disponible');
  }
  
} catch (error) {
  console.log('❌ Error importando middleware:', error.message);
}

// Método 2: Intentar importar desde ruta absoluta
try {
  const path = require('path');
  const authPath = path.join(__dirname, '../auth/middleware/authentication');
  console.log('📍 Ruta absoluta:', authPath);
  
  const authMiddleware2 = require(authPath);
  console.log('✅ Importación exitosa con ruta absoluta');
  
} catch (error) {
  console.log('❌ Error con ruta absoluta:', error.message);
}

// Crear un middleware de prueba manual
const testAuth = (req, res, next) => {
  console.log('🧪 Middleware de prueba ejecutándose...');
  
  const authHeader = req.headers.authorization;
  console.log('📋 Authorization header:', authHeader ? 'Presente' : 'Ausente');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Token no encontrado o formato incorrecto');
    return res.status(401).json({
      status: 'fail',
      message: 'Token requerido (middleware de prueba)',
      data: null
    });
  }
  
  const token = authHeader.substring(7);
  console.log('🔑 Token extraído:', token.substring(0, 20) + '...');
  
  // Simular usuario válido
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    rol: 'ADMIN'
  };
  
  console.log('✅ Usuario simulado agregado a req.user');
  next();
};

// Rutas de prueba
router.get('/test-middleware-manual', testAuth, (req, res) => {
  res.json({
    status: 'success',
    message: 'Middleware manual funcionando!',
    data: {
      user: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

// Intentar importar requireAuth específicamente
let requireAuth = null;
try {
  const authModule = require('../auth/middleware/authentication');
  requireAuth = authModule.requireAuth;
  
  if (requireAuth && typeof requireAuth === 'function') {
    console.log('✅ requireAuth importado correctamente como función');
    
    router.get('/test-require-auth', requireAuth, (req, res) => {
      res.json({
        status: 'success',
        message: 'requireAuth funcionando!',
        data: {
          user: req.user || 'No user in req',
          timestamp: new Date().toISOString()
        }
      });
    });
    
  } else {
    console.log('❌ requireAuth no es una función válida');
    console.log('📋 Tipo actual:', typeof requireAuth);
    console.log('📋 Valor:', requireAuth);
  }
  
} catch (error) {
  console.log('❌ Error específico con requireAuth:', error.message);
}

// Ruta simple sin middleware
router.get('/test-simple', (req, res) => {
  res.json({
    status: 'success',
    message: 'Ruta simple funcionando',
    data: { timestamp: new Date().toISOString() }
  });
});

module.exports = router;
