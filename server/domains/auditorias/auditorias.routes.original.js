/**
 * Rutas de Auditorías - CORREGIDAS
 * Portal de Auditorías Técnicas
 */

const express = require('express');
const router = express.Router();

// Middleware personalizado (igual que en auth.routes.js)
const { asyncHandler } = require('../../shared/middleware/errorHandler');

// Middleware de autenticación (importación corregida)
const { 
  requireAuth
} = require('../auth/middleware/authentication');

const {
  requireAdmin,
  requireAuditor,
  requireRole
} = require('../auth/middleware/authorization');

// Controlador
const auditoriasController = require('./auditorias.controller');

// Validadores
const { 
  validarCrearAuditoria,
  validarActualizarAuditoria,
  validarAvanzarEtapa 
} = require('./validators/auditorias.validators');

// =================== RUTAS PROTEGIDAS ===================

// Aplicar autenticación a todas las rutas
router.use(requireAuth);

// =================== RUTAS GENERALES ===================

/**
 * GET /api/auditorias
 * Obtener lista de auditorías con filtros y paginación
 * Acceso: Todos los usuarios autenticados (filtros aplicados por rol)
 */
router.get('/', auditoriasController.obtenerAuditorias);

/**
 * GET /api/auditorias/estadisticas
 * Obtener estadísticas de auditorías
 * Acceso: Todos los usuarios autenticados
 */
router.get('/estadisticas', auditoriasController.obtenerEstadisticas);

/**
 * GET /api/auditorias/mis-auditorias
 * Obtener auditorías específicas del usuario actual
 * Acceso: Todos los usuarios autenticados
 */
router.get('/mis-auditorias', auditoriasController.misAuditorias);

/**
 * GET /api/auditorias/buscar/:codigo
 * Buscar auditoría por código
 * Acceso: Todos los usuarios autenticados
 */
router.get('/buscar/:codigo', auditoriasController.buscarPorCodigo);

/**
 * POST /api/auditorias
 * Crear nueva auditoría
 * Acceso: ADMIN, AUDITOR
 */
router.post('/', 
  requireRole('ADMIN', 'AUDITOR'),
  validarCrearAuditoria,
  auditoriasController.crearAuditoria
);

/**
 * GET /api/auditorias/:id
 * Obtener auditoría específica por ID
 * Acceso: Todos los usuarios autenticados (permisos verificados en controlador)
 */
router.get('/:id', auditoriasController.obtenerAuditoriaPorId);

/**
 * PUT /api/auditorias/:id
 * Actualizar auditoría existente
 * Acceso: ADMIN, AUDITOR (verificación adicional en controlador)
 */
router.put('/:id',
  requireRole('ADMIN', 'AUDITOR'),
  validarActualizarAuditoria,
  auditoriasController.actualizarAuditoria
);

/**
 * DELETE /api/auditorias/:id
 * Eliminar auditoría (soft delete)
 * Acceso: Solo ADMIN
 */
router.delete('/:id',
  requireAdmin,
  auditoriasController.eliminarAuditoria
);

// =================== RUTAS DE WORKFLOW ===================

/**
 * POST /api/auditorias/:id/avanzar-etapa
 * Avanzar auditoría a la siguiente etapa
 * Acceso: ADMIN, AUDITOR (verificación adicional en controlador)
 */
router.post('/:id/avanzar-etapa',
  requireRole('ADMIN', 'AUDITOR'),
  validarAvanzarEtapa,
  auditoriasController.avanzarEtapa
);

/**
 * GET /api/auditorias/:id/historial
 * Obtener historial de cambios de una auditoría
 * Acceso: Todos los usuarios autenticados (permisos verificados en controlador)
 */
router.get('/:id/historial', auditoriasController.obtenerHistorial);

// =================== MIDDLEWARE DE MANEJO DE ERRORES ===================

// Middleware para capturar errores de rutas no encontradas
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Ruta ${req.originalUrl} no encontrada en el módulo de auditorías`,
    data: null
  });
});

// Middleware para manejo de errores del módulo
router.use((error, req, res, next) => {
  console.error('Error en módulo auditorías:', error);
  
  // Si ya se envió respuesta, delegar al siguiente middleware
  if (res.headersSent) {
    return next(error);
  }
  
  // Respuesta de error genérica
  res.status(500).json({
    status: 'error',
    message: 'Error interno en el módulo de auditorías',
    data: process.env.NODE_ENV === 'development' ? {
      error: error.message,
      stack: error.stack
    } : null
  });
});

module.exports = router;
