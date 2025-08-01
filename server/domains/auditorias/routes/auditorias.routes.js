const express = require('express');
const { body } = require('express-validator');
const auditoriasController = require('../controllers/auditorias.controller');
const documentosService = require('../services/documentos.service');

const router = express.Router();

// Middleware de autenticación (se aplicará a todas las rutas)
const authenticate = require('../../../middleware/authenticate');
const authorize = require('../../../middleware/authorize');

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Configurar multer para upload de documentos
const upload = documentosService.configurarUpload();

// Validaciones para crear auditoría
const validarCrearAuditoria = [
  body('proveedor_id')
    .isInt({ min: 1 })
    .withMessage('ID de proveedor debe ser un número entero válido'),
  body('auditor_principal_id')
    .isInt({ min: 1 })
    .withMessage('ID de auditor principal debe ser un número entero válido'),
  body('fecha_programada')
    .isISO8601()
    .withMessage('Fecha programada debe ser una fecha válida'),
  body('alcance')
    .isLength({ min: 10, max: 1000 })
    .withMessage('El alcance debe tener entre 10 y 1000 caracteres'),
  body('observaciones')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Las observaciones no pueden exceder 2000 caracteres')
];

// Validaciones para actualizar auditoría
const validarActualizarAuditoria = [
  body('auditor_principal_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de auditor principal debe ser un número entero válido'),
  body('fecha_programada')
    .optional()
    .isISO8601()
    .withMessage('Fecha programada debe ser una fecha válida'),
  body('fecha_limite')
    .optional()
    .isISO8601()
    .withMessage('Fecha límite debe ser una fecha válida'),
  body('alcance')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('El alcance debe tener entre 10 y 1000 caracteres'),
  body('observaciones')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Las observaciones no pueden exceder 2000 caracteres')
];

// ==================== RUTAS PRINCIPALES ====================

/**
 * @route   GET /api/auditorias/configuracion/secciones
 * @desc    Obtener configuración de secciones de documentos
 * @access  Private (todos los roles)
 */
router.get('/configuracion/secciones', auditoriasController.obtenerConfiguracionSecciones);

/**
 * @route   GET /api/auditorias/estadisticas
 * @desc    Obtener estadísticas generales de auditorías
 * @access  Private (ADMIN, AUDITOR)
 */
router.get('/estadisticas', 
  authorize(['ADMIN', 'AUDITOR']), 
  auditoriasController.obtenerEstadisticas
);

/**
 * @route   POST /api/auditorias
 * @desc    Crear nueva auditoría
 * @access  Private (ADMIN, AUDITOR)
 */
router.post('/', 
  authorize(['ADMIN', 'AUDITOR']),
  validarCrearAuditoria,
  auditoriasController.crear
);

/**
 * @route   GET /api/auditorias
 * @desc    Listar auditorías con filtros y paginación
 * @access  Private (todos los roles)
 */
router.get('/', auditoriasController.listar);

/**
 * @route   GET /api/auditorias/:id
 * @desc    Obtener auditoría específica con toda la información
 * @access  Private (todos los roles)
 */
router.get('/:id', auditoriasController.obtenerPorId);

/**
 * @route   PUT /api/auditorias/:id
 * @desc    Actualizar auditoría
 * @access  Private (ADMIN, AUDITOR propietario)
 */
router.put('/:id', 
  authorize(['ADMIN', 'AUDITOR']),
  validarActualizarAuditoria,
  auditoriasController.actualizar
);

// ==================== RUTAS DE WORKFLOW ====================

/**
 * @route   GET /api/auditorias/:id/workflow
 * @desc    Obtener estado actual del workflow
 * @access  Private (todos los roles)
 */
router.get('/:id/workflow', auditoriasController.obtenerWorkflow);

/**
 * @route   POST /api/auditorias/:id/avanzar-etapa
 * @desc    Avanzar a la siguiente etapa del workflow
 * @access  Private (ADMIN, AUDITOR, PROVEEDOR según etapa)
 */
router.post('/:id/avanzar-etapa', auditoriasController.avanzarEtapa);

// ==================== RUTAS DE DOCUMENTOS ====================

/**
 * @route   GET /api/auditorias/:id/documentos
 * @desc    Obtener documentos de la auditoría
 * @access  Private (todos los roles)
 */
router.get('/:id/documentos', auditoriasController.obtenerDocumentos);

/**
 * @route   POST /api/auditorias/:id/documentos/:seccion
 * @desc    Cargar documento en una sección específica
 * @access  Private (PROVEEDOR propietario, ADMIN)
 */
router.post('/:id/documentos/:seccion',
  authorize(['ADMIN', 'PROVEEDOR']),
  upload.single('archivo'),
  auditoriasController.cargarDocumento
);

/**
 * @route   GET /api/auditorias/:id/validar-documentos
 * @desc    Validar completitud de documentos obligatorios
 * @access  Private (todos los roles)
 */
router.get('/:id/validar-documentos', auditoriasController.validarDocumentosCompletos);

// ==================== RUTAS DE INFORMACIÓN ====================

/**
 * @route   GET /api/auditorias/:id/timeline
 * @desc    Obtener timeline de eventos de la auditoría
 * @access  Private (todos los roles)
 */
router.get('/:id/timeline', auditoriasController.obtenerTimeline);

/**
 * @route   GET /api/auditorias/:id/resumen
 * @desc    Obtener resumen ejecutivo de la auditoría
 * @access  Private (todos los roles)
 */
router.get('/:id/resumen', auditoriasController.obtenerResumen);

// ==================== MANEJO DE ERRORES ====================

// Middleware para manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo excede el tamaño máximo permitido (50MB)'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado'
      });
    }
  }

  if (error.message.includes('Formato no permitido')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (error.message.includes('Sección de documento no válida')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Error genérico
  console.error('Error en rutas de auditorías:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;