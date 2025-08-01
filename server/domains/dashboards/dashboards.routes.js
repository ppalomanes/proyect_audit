const express = require('express');
const router = express.Router();
const dashboardsController = require('./dashboards.controller');
const authMiddleware = require('../../middleware/auth');
const { body, query } = require('express-validator');

/**
 * Rutas para el módulo de dashboards y métricas
 * Todas las rutas requieren autenticación
 */

// Middleware de autenticación para todas las rutas
router.use(authMiddleware.authenticateToken);

/**
 * @route GET /api/dashboards/ejecutivo
 * @desc Dashboard ejecutivo con KPIs de alto nivel
 * @access Admin, Coordinador
 */
router.get('/ejecutivo', 
  authMiddleware.requireRoles(['admin', 'coordinador']),
  query('periodo').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
  query('include_trends').optional().isBoolean().withMessage('include_trends debe ser boolean'),
  dashboardsController.getDashboardEjecutivo
);

/**
 * @route GET /api/dashboards/operativo
 * @desc Dashboard operativo para auditores
 * @access Admin, Coordinador, Auditor
 */
router.get('/operativo',
  authMiddleware.requireRoles(['admin', 'coordinador', 'auditor']),
  query('periodo').optional().isIn(['1d', '7d', '30d']).withMessage('Período inválido'),
  query('auditor_id').optional().isInt().withMessage('auditor_id debe ser un entero'),
  query('include_alerts').optional().isBoolean().withMessage('include_alerts debe ser boolean'),
  dashboardsController.getDashboardOperativo
);

/**
 * @route GET /api/dashboards/proveedor/:id
 * @desc Dashboard específico de un proveedor
 * @access Admin, Coordinador, Auditor
 */
router.get('/proveedor/:id',
  authMiddleware.requireRoles(['admin', 'coordinador', 'auditor']),
  query('periodo').optional().isIn(['30d', '90d', '6m', '1y']).withMessage('Período inválido'),
  query('compare_peers').optional().isBoolean().withMessage('compare_peers debe ser boolean'),
  dashboardsController.getDashboardProveedor
);

/**
 * @route GET /api/dashboards/metrics/auditorias
 * @desc Métricas específicas de auditorías
 * @access Admin, Coordinador, Auditor
 */
router.get('/metrics/auditorias',
  authMiddleware.requireRoles(['admin', 'coordinador', 'auditor']),
  query('periodo').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
  query('group_by').optional().isIn(['day', 'week', 'month', 'quarter']).withMessage('group_by inválido'),
  query('include_details').optional().isBoolean().withMessage('include_details debe ser boolean'),
  dashboardsController.getMetricasAuditorias
);

/**
 * @route GET /api/dashboards/health
 * @desc Health check del módulo dashboards
 * @access Admin
 */
router.get('/health',
  authMiddleware.requireRoles(['admin']),
  dashboardsController.healthCheck
);

/**
 * Middleware de manejo de errores específico para dashboards
 */
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas dashboards:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación en dashboard',
      errors: error.errors
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'No autorizado para acceder a dashboards'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno en módulo de dashboards',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
  });
});

module.exports = router;