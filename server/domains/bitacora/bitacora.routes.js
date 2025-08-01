/**
 * Rutas del Módulo Bitácora - Portal de Auditorías Técnicas
 * 
 * Define todas las rutas para consulta, filtrado y exportación de bitácora
 */

const express = require('express');
const { BitacoraController, validadores } = require('./bitacora.controller');
const authMiddleware = require('../auth/middleware/authentication');

const router = express.Router();
const bitacoraController = new BitacoraController();

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.authenticateToken);

// === RUTAS DE CONSULTA ===

/**
 * Obtener entradas de bitácora con filtros avanzados
 * GET /api/bitacora
 */
router.get('/', 
  validadores.obtenerEntradas,
  (req, res) => bitacoraController.obtenerEntradas(req, res)
);

/**
 * Obtener bitácora específica de una auditoría
 * GET /api/bitacora/auditoria/:auditoria_id
 */
router.get('/auditoria/:auditoria_id',
  authMiddleware.requireRole(['auditor', 'admin']),
  (req, res) => bitacoraController.obtenerBitacoraAuditoria(req, res)
);

/**
 * Obtener estadísticas de la bitácora
 * GET /api/bitacora/estadisticas
 */
router.get('/estadisticas',
  authMiddleware.requireRole(['auditor', 'admin']),
  (req, res) => bitacoraController.obtenerEstadisticas(req, res)
);

/**
 * Obtener tipos de acciones disponibles
 * GET /api/bitacora/tipos-acciones
 */
router.get('/tipos-acciones',
  (req, res) => bitacoraController.obtenerTiposAcciones(req, res)
);

// === RUTAS DE EXPORTACIÓN ===

/**
 * Exportar bitácora para compliance
 * GET /api/bitacora/export
 */
router.get('/export',
  authMiddleware.requireRole(['auditor', 'admin']),
  validadores.exportarBitacora,
  (req, res) => bitacoraController.exportarBitacora(req, res)
);

// === RUTAS DE ADMINISTRACIÓN ===

/**
 * Limpiar entradas antiguas
 * DELETE /api/bitacora/cleanup
 */
router.delete('/cleanup',
  authMiddleware.requireRole(['admin']),
  validadores.limpiarEntradas,
  (req, res) => bitacoraController.limpiarEntradas(req, res)
);

// === RUTAS DE DIAGNÓSTICO ===

/**
 * Health check del módulo bitácora
 * GET /api/bitacora/health
 */
router.get('/health',
  (req, res) => bitacoraController.healthCheck(req, res)
);

/**
 * Versión del módulo bitácora
 * GET /api/bitacora/version
 */
router.get('/version', (req, res) => {
  res.json({
    success: true,
    data: {
      module: 'Bitácora',
      version: '1.0.0',
      description: 'Sistema de registro automático de acciones',
      features: [
        'Registro automático de todas las acciones',
        'Filtros avanzados de consulta',
        'Exportación para compliance',
        'Estadísticas y métricas',
        'Gestión de entradas antiguas',
        'Integración transparente con todos los módulos'
      ],
      endpoints: {
        consulta: 'GET /api/bitacora',
        auditoria: 'GET /api/bitacora/auditoria/:id',
        estadisticas: 'GET /api/bitacora/estadisticas',
        exportacion: 'GET /api/bitacora/export',
        limpieza: 'DELETE /api/bitacora/cleanup',
        health: 'GET /api/bitacora/health'
      }
    }
  });
});

module.exports = router;