/**
 * Rutas de Auditorías - IMPORTACIÓN DEFINITIVAMENTE CORREGIDA
 * Portal de Auditorías Técnicas
 */

const express = require('express');
const router = express.Router();

// IMPORTACIÓN DIRECTA DESDE AUTH (ruta absoluta desde auditorias)
const { 
  requireAuth
} = require('../auth/middleware/authentication');

const {
  requireAdmin,
  requireRole
} = require('../auth/middleware/authorization');

// =================== RUTAS DE DEBUG ===================

// Endpoint de prueba sin autenticación
router.get('/test-sin-auth', (req, res) => {
  res.json({
    status: 'success',
    message: 'Endpoint sin autenticación funcionando',
    data: { timestamp: new Date().toISOString() }
  });
});

// Endpoint CON autenticación para probar el middleware
router.get('/test-con-auth', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    message: '¡MIDDLEWARE DE AUTENTICACIÓN FUNCIONANDO!',
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

// =================== RUTAS PRINCIPALES ===================

router.get('/estadisticas', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    message: 'Estadísticas de auditorías - FUNCIONANDO',
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
  res.json({
    status: 'success',
    message: 'Lista de auditorías - FUNCIONANDO',
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
  res.json({
    status: 'success',
    message: 'Mis auditorías - FUNCIONANDO',
    data: {
      auditorias: []
    }
  });
});

// Rutas que requieren roles específicos
router.post('/', requireAuth, requireRole('ADMIN', 'AUDITOR'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Crear auditoría - FUNCIONANDO (versión simplificada)',
    data: {
      mensaje: 'Esta es una respuesta simplificada para testing'
    }
  });
});

// Manejo de errores
router.use((error, req, res, next) => {
  console.error('Error en módulo auditorías:', error);
  res.status(500).json({
    status: 'error',
    message: 'Error interno en el módulo de auditorías',
    data: {
      error: error.message
    }
  });
});

module.exports = router;
