/**
 * Rutas ETL - Portal de Auditorías Técnicas
 * Endpoints para procesamiento de parque informático
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Controllers
const etlController = require('./etl.controller');

// Validators
const { 
  validateProcessFile,
  validateJobId,
  validateValidationRules,
  validateMetricsQuery,
  validateReportGeneration,
  validateBatchProcess,
  validateJobQuery
} = require('./validators/etl.validators');

// Configuración Multer para upload de archivos ETL
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/etl/'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `etl_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Use Excel (.xlsx, .xls) o CSV (.csv)'));
    }
  }
});

// ============================================
// ENDPOINTS PRINCIPALES DE PROCESAMIENTO ETL
// ============================================

/**
 * POST /api/etl/process
 * Procesar archivo Excel/CSV del parque informático
 */
router.post('/process', 
  upload.single('archivo'),
  validateProcessFile,
  etlController.procesarParqueInformatico
);

/**
 * POST /api/etl/validate-only
 * Validar archivo sin procesar (dry-run)
 */
router.post('/validate-only',
  upload.single('archivo'),
  validateProcessFile,
  etlController.validarSolamente
);

/**
 * POST /api/etl/batch-process
 * Procesar múltiples archivos en lote
 */
router.post('/batch-process',
  upload.array('archivos', 10),
  validateBatchProcess,
  etlController.procesarLote
);

// ============================================
// ENDPOINTS DE GESTIÓN DE JOBS ETL
// ============================================

/**
 * GET /api/etl/jobs
 * Listar jobs ETL con filtros
 */
router.get('/jobs',
  validateJobQuery,
  etlController.listarJobs
);

/**
 * GET /api/etl/jobs/:job_id/status
 * Obtener estado detallado de un job ETL
 */
router.get('/jobs/:job_id/status',
  validateJobId,
  etlController.obtenerEstadoJob
);

/**
 * GET /api/etl/jobs/:job_id/results
 * Obtener resultados completos de un job ETL
 */
router.get('/jobs/:job_id/results',
  validateJobId,
  etlController.obtenerResultadosJob
);

/**
 * POST /api/etl/jobs/:job_id/retry
 * Reintentar job ETL fallido
 */
router.post('/jobs/:job_id/retry',
  validateJobId,
  etlController.reintentarJob
);

/**
 * DELETE /api/etl/jobs/:job_id
 * Cancelar job ETL en progreso
 */
router.delete('/jobs/:job_id',
  validateJobId,
  etlController.cancelarJob
);

// ============================================
// ENDPOINTS DE VALIDACIÓN Y REGLAS
// ============================================

/**
 * GET /api/etl/validation-rules
 * Obtener reglas de validación activas
 */
router.get('/validation-rules',
  etlController.obtenerReglasValidacion
);

/**
 * POST /api/etl/validation-rules
 * Configurar reglas de validación personalizadas
 */
router.post('/validation-rules',
  validateValidationRules,
  etlController.configurarReglas
);

/**
 * GET /api/etl/schema
 * Obtener esquema normalizado de 28 campos
 */
router.get('/schema',
  etlController.obtenerEsquema
);

// ============================================
// ENDPOINTS DE MÉTRICAS Y REPORTES
// ============================================

/**
 * GET /api/etl/metrics
 * Obtener métricas de procesamiento ETL
 */
router.get('/metrics',
  validateMetricsQuery,
  etlController.obtenerMetricas
);

/**
 * GET /api/etl/quality-dashboard
 * Dashboard de calidad de datos en tiempo real
 */
router.get('/quality-dashboard',
  etlController.obtenerDashboardCalidad
);

/**
 * POST /api/etl/reports/quality
 * Generar reporte de calidad detallado
 */
router.post('/reports/quality',
  validateReportGeneration,
  etlController.generarReporteCalidad
);

/**
 * GET /api/etl/health
 * Health check del módulo ETL
 */
router.get('/health', etlController.healthCheck);

/**
 * GET /api/etl/version
 * Obtener versión y información del módulo ETL
 */
router.get('/version', etlController.obtenerVersion);

// ============================================
// MANEJO DE ERRORES ESPECÍFICOS DEL MÓDULO
// ============================================

// Middleware de manejo de errores de Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'ETL_FILE_TOO_LARGE',
        message: 'El archivo excede el tamaño máximo permitido (50MB)'
      });
    }
  }
  
  if (error.message.includes('Tipo de archivo no soportado')) {
    return res.status(400).json({
      success: false,
      error: 'ETL_UNSUPPORTED_FILE_TYPE',
      message: error.message,
      details: {
        supported_types: ['.xlsx', '.xls', '.csv']
      }
    });
  }
  
  next(error);
});

module.exports = router;
