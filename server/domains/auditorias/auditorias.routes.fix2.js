/**
 * Rutas de Auditorías - IMPORTACIÓN CORREGIDA
 * Portal de Auditorías Técnicas
 */

const express = require('express');
const router = express.Router();

// Middleware personalizado (igual que auth.routes.js)
const { asyncHandler } = require('../../shared/middleware/errorHandler');

// Controlador
const auditoriasController = require('./auditorias.controller');

// IMPORTACIÓN EXACTA COMO EN AUTH.ROUTES.JS QUE SÍ FUNCIONA
const { 
  requireAuth
} = require('./middleware/authentication');

const {
  requireAdmin,
  requireAuditor
} = require('./middleware/authorization');

// =================== RUTAS DE DEBUG ===================

// Endpoint de prueba sin autenticación
router.get('/test-sin-auth', (req, res) => {
  res.json({
    status: 'success',
    message: 'Endpoint sin autenticación funcionando',
    data: { timestamp: new Date().toISOString() }
  });
});

// Aplicar autenticación solo a rutas específicas
router.get('/test-con-auth', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    message: 'Endpoint con autenticación funcionando',
    data: { 
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        rol: req.user.rol
      } : null,
      timestamp: new Date().toISOString() 
    }
  });
});

// Rutas principales con autenticación
router.get('/estadisticas', requireAuth, (req, res) => {
  // Respuesta simplificada
  res.json({
    status: 'success',
    message: 'Estadísticas obtenidas (importación corregida)',
    data: {
      resumen: {
        total_auditorias: 0,
        por_vencer: 0,
        vencidas: 0
      }
    }
  });
});

router.get('/', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    message: 'Lista de auditorías obtenida (importación corregida)',
    data: {
      auditorias: [],
      pagination: {
        current_page: 1,
        total_pages: 0,
        total_items: 0,
        items_per_page: 10
      }
    }
  });
});

router.get('/mis-auditorias', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    message: 'Mis auditorías obtenidas (importación corregida)',
    data: {
      auditorias: []
    }
  });
});

module.exports = router;
