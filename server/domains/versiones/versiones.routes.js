/**
 * Rutas del Módulo de Control de Versiones - Portal de Auditorías Técnicas
 * 
 * Define todas las rutas para gestión de versiones de documentos
 */

const express = require('express');
const multer = require('multer');
const { VersionesController, validadores } = require('./versiones.controller');
const authMiddleware = require('../auth/middleware/authentication');

const router = express.Router();
const versionesController = new VersionesController();

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Permitir todos los tipos de archivo para documentos de auditoría
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  }
});

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.authenticateToken);

// === RUTAS DE GESTIÓN DE VERSIONES ===

/**
 * Crear nueva versión de documento
 * POST /api/versiones/:documento_id
 */
router.post('/:documento_id',
  upload.single('archivo'),
  validadores.crearVersion,
  authMiddleware.requireRole(['proveedor', 'auditor', 'admin']),
  (req, res) => versionesController.crearVersion(req, res)
);

/**
 * Obtener historial de versiones de un documento
 * GET /api/versiones/:documento_id/historial
 */
router.get('/:documento_id/historial',
  validadores.obtenerHistorial,
  authMiddleware.requireRole(['proveedor', 'auditor', 'admin']),
  (req, res) => versionesController.obtenerHistorial(req, res)
);

/**
 * Descargar versión específica
 * GET /api/versiones/:version_id/descargar
 */
router.get('/:version_id/descargar',
  validadores.versionId,
  authMiddleware.requireRole(['proveedor', 'auditor', 'admin']),
  (req, res) => versionesController.descargarVersion(req, res)
);

/**
 * Restaurar versión anterior como actual
 * POST /api/versiones/:version_id/restaurar
 */
router.post('/:version_id/restaurar',
  validadores.restaurarVersion,
  authMiddleware.requireRole(['auditor', 'admin']),
  (req, res) => versionesController.restaurarVersion(req, res)
);

/**
 * Aprobar versión
 * PUT /api/versiones/:version_id/aprobar
 */
router.put('/:version_id/aprobar',
  validadores.aprobarVersion,
  authMiddleware.requireRole(['auditor', 'admin']),
  (req, res) => versionesController.aprobarVersion(req, res)
);

/**
 * Eliminar versión
 * DELETE /api/versiones/:version_id
 */
router.delete('/:version_id',
  validadores.versionId,
  authMiddleware.requireRole(['admin']), // Solo admin puede eliminar
  (req, res) => versionesController.eliminarVersion(req, res)
);

// === RUTAS DE COMPARACIÓN Y ANÁLISIS ===

/**
 * Comparar dos versiones
 * GET /api/versiones/comparar/:version_id_1/:version_id_2
 */
router.get('/comparar/:version_id_1/:version_id_2',
  validadores.compararVersiones,
  authMiddleware.requireRole(['proveedor', 'auditor', 'admin']),
  (req, res) => versionesController.compararVersiones(req, res)
);

/**
 * Obtener estadísticas de versiones
 * GET /api/versiones/estadisticas
 */
router.get('/estadisticas',
  authMiddleware.requireRole(['auditor', 'admin']),
  (req, res) => versionesController.obtenerEstadisticas(req, res)
);

/**
 * Validar integridad de archivos
 * GET /api/versiones/validar-integridad
 */
router.get('/validar-integridad',
  authMiddleware.requireRole(['admin']),
  (req, res) => versionesController.validarIntegridad(req, res)
);

// === RUTAS DE MANTENIMIENTO ===

/**
 * Limpiar versiones antiguas
 * DELETE /api/versiones/limpiar
 */
router.delete('/limpiar',
  authMiddleware.requireRole(['admin']),
  (req, res) => versionesController.limpiarVersiones(req, res)
);

// === RUTAS DE DIAGNÓSTICO ===

/**
 * Health check del módulo
 * GET /api/versiones/health
 */
router.get('/health',
  (req, res) => versionesController.healthCheck(req, res)
);

/**
 * Información del módulo
 * GET /api/versiones/info
 */
router.get('/info',
  (req, res) => versionesController.getInfo(req, res)
);

// === MIDDLEWARE DE ERROR PARA MULTER ===

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'Archivo demasiado grande. Máximo 50MB permitido.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Solo se permite un archivo por versión.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Campo de archivo inesperado.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Error en la subida de archivo.',
          error: error.message
        });
    }
  }

  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido.',
      error: error.message
    });
  }

  next(error);
});

module.exports = router;