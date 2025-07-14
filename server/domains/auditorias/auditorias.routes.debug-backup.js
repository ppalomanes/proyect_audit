/**
 * Rutas de Auditorías - VERSIÓN SIMPLIFICADA PARA DEBUG
 * Portal de Auditorías Técnicas
 */

const express = require('express');
const router = express.Router();

// Importar exactamente como lo hace auth.routes.js que SÍ funciona
const { 
  requireAuth
} = require('../auth/middleware/authentication');

// Controlador
const auditoriasController = require('./auditorias.controller');

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

// Rutas principales con autenticación mínima
router.get('/estadisticas', requireAuth, (req, res) => {
  // Respuesta simplificada sin llamar al servicio
  res.json({
    status: 'success',
    message: 'Estadísticas obtenidas (versión debug)',
    data: {
      resumen: {
        total_auditorias: 0,
        por_vencer: 0,
        vencidas: 0
      },
      distribucion: {
        por_estado: [],
        por_etapa: []
      }
    }
  });
});

router.get('/', requireAuth, (req, res) => {
  // Respuesta simplificada sin llamar al servicio
  res.json({
    status: 'success',
    message: 'Lista de auditorías obtenida (versión debug)',
    data: {
      auditorias: [],
      pagination: {
        current_page: 1,
        total_pages: 0,
        total_items: 0,
        items_per_page: 10,
        has_next_page: false,
        has_prev_page: false
      }
    }
  });
});

router.get('/mis-auditorias', requireAuth, (req, res) => {
  // Respuesta simplificada sin llamar al servicio
  res.json({
    status: 'success',
    message: 'Mis auditorías obtenidas (versión debug)',
    data: {
      auditorias: []
    }
  });
});

// Manejo de errores
router.use((error, req, res, next) => {
  console.error('Error en módulo auditorías (DEBUG):', error);
  res.status(500).json({
    status: 'error',
    message: 'Error interno en el módulo de auditorías (DEBUG)',
    data: {
      error: error.message,
      stack: error.stack
    }
  });
});

module.exports = router;
