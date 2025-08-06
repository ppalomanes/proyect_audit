// /server/jobs/jobs.routes.js
// Rutas para gestión de jobs asíncronos - Portal de Auditorías Técnicas

const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const jobsController = require('./jobs.controller');

const router = express.Router();

// ================================
// RUTAS DE CREACIÓN DE JOBS
// ================================

/**
 * POST /api/jobs/etl
 * Crear job de procesamiento ETL
 */
router.post(
  '/etl',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  jobsController.createETLJob
);

/**
 * POST /api/jobs/ia
 * Crear job de análisis IA
 */
router.post(
  '/ia',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  jobsController.createIAJob
);

// ================================
// RUTAS DE MONITOREO Y GESTIÓN
// ================================

/**
 * GET /api/jobs/health
 * Health check del sistema de colas
 */
router.get('/health', jobsController.healthCheck);

/**
 * GET /api/jobs/stats
 * Estadísticas generales de colas
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  jobsController.getStats
);

/**
 * GET /api/jobs/monitor
 * Monitor en tiempo real
 */
router.get(
  '/monitor',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  jobsController.getMonitor
);

/**
 * GET /api/jobs/:queueName
 * Obtener jobs de cola específica
 */
router.get(
  '/:queueName',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  jobsController.getQueueJobs
);

// ================================
// RUTAS ADMINISTRATIVAS
// ================================

/**
 * DELETE /api/jobs/cleanup
 * Limpiar jobs antiguos
 */
router.delete(
  '/cleanup',
  authenticateToken,
  requireRole(['admin']),
  jobsController.cleanupJobs
);

module.exports = router;
