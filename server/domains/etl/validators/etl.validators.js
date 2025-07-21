/**
 * Validadores ETL - Portal de Auditorías Técnicas
 * Validación completa para procesamiento de parque informático
 */

const { body, param, query, validationResult } = require('express-validator');

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES DE VALIDACIÓN
// ============================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      error: 'ETL_VALIDATION_ERROR',
      message: 'Errores de validación en la solicitud',
      details: {
        total_errors: formattedErrors.length,
        errors: formattedErrors
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// ============================================
// VALIDADORES PARA PROCESAMIENTO DE ARCHIVOS
// ============================================

const validateProcessFile = [
  // Validar que se adjuntó un archivo
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'ETL_FILE_REQUIRED',
        message: 'Debe adjuntar un archivo Excel (.xlsx, .xls) o CSV (.csv)',
        details: {
          supported_formats: ['.xlsx', '.xls', '.csv'],
          max_size: '50MB'
        }
      });
    }
    next();
  },

  // Validar ID de auditoría (opcional)
  body('auditoria_id')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('ID de auditoría debe ser un string válido'),

  // Validar configuración de procesamiento
  body('configuracion')
    .optional()
    .isObject()
    .withMessage('Configuración debe ser un objeto JSON válido'),

  body('configuracion.strict_mode')
    .optional()
    .isBoolean()
    .withMessage('strict_mode debe ser booleano (true/false)'),

  body('configuracion.auto_fix')
    .optional()
    .isBoolean()
    .withMessage('auto_fix debe ser booleano (true/false)'),

  body('configuracion.skip_validation')
    .optional()
    .isArray()
    .withMessage('skip_validation debe ser un array de campos'),

  body('configuracion.scoring_ia')
    .optional()
    .isBoolean()
    .withMessage('scoring_ia debe ser booleano (true/false)'),

  handleValidationErrors
];

const validateJobId = [
  param('job_id')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('ID de job debe ser un string válido'),

  handleValidationErrors
];

const validateJobQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Página debe ser un entero entre 1 y 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un entero entre 1 y 100'),

  query('estado')
    .optional()
    .isIn(['INICIADO', 'PARSEANDO', 'NORMALIZANDO', 'VALIDANDO', 'COMPLETADO', 'ERROR', 'CANCELADO'])
    .withMessage('Estado debe ser válido'),

  handleValidationErrors
];

const validateValidationRules = [
  body('reglas')
    .isObject()
    .withMessage('reglas debe ser un objeto JSON válido'),

  body('reglas.ram_minima_gb')
    .optional()
    .isFloat({ min: 1, max: 128 })
    .withMessage('ram_minima_gb debe ser un número entre 1 y 128'),

  body('reglas.cpu_minima_ghz')
    .optional()
    .isFloat({ min: 0.5, max: 6.0 })
    .withMessage('cpu_minima_ghz debe ser un número entre 0.5 y 6.0'),

  handleValidationErrors
];

const validateMetricsQuery = [
  query('periodo')
    .optional()
    .isIn(['24h', '7d', '30d', '90d', '1y'])
    .withMessage('Período debe ser: 24h, 7d, 30d, 90d o 1y'),

  query('incluir_detalle')
    .optional()
    .isBoolean()
    .withMessage('incluir_detalle debe ser booleano'),

  handleValidationErrors
];

const validateReportGeneration = [
  body('tipo_reporte')
    .isIn(['quality', 'executive', 'technical', 'comparative'])
    .withMessage('tipo_reporte debe ser: quality, executive, technical o comparative'),

  body('formato_salida')
    .optional()
    .isIn(['pdf', 'excel', 'json'])
    .withMessage('formato_salida debe ser: pdf, excel o json'),

  handleValidationErrors
];

const validateBatchProcess = [
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ETL_FILES_REQUIRED',
        message: 'Debe adjuntar al menos un archivo para procesamiento en lote'
      });
    }
    next();
  },

  handleValidationErrors
];

// ============================================
// EXPORTS
// ============================================

module.exports = {
  validateProcessFile,
  validateJobId,
  validateJobQuery,
  validateValidationRules,
  validateMetricsQuery,
  validateReportGeneration,
  validateBatchProcess,
  handleValidationErrors
};
