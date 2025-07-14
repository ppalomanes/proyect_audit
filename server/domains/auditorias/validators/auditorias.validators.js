/**
 * Validadores de Auditorías
 * Portal de Auditorías Técnicas
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      status: 'fail',
      message: 'Datos de entrada inválidos',
      data: {
        validation_errors: errorMessages
      }
    });
  }
  
  next();
};

/**
 * Validador para crear auditoría
 */
const validarCrearAuditoria = [
  // Título
  body('titulo')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 5, max: 255 })
    .withMessage('El título debe tener entre 5 y 255 caracteres')
    .trim(),

  // Descripción (opcional)
  body('descripcion')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres')
    .trim(),

  // Proveedor ID
  body('proveedor_id')
    .notEmpty()
    .withMessage('El ID del proveedor es requerido')
    .isUUID()
    .withMessage('El ID del proveedor debe ser un UUID válido'),

  // Auditor principal ID
  body('auditor_principal_id')
    .notEmpty()
    .withMessage('El ID del auditor principal es requerido')
    .isUUID()
    .withMessage('El ID del auditor principal debe ser un UUID válido'),

  // Auditor secundario ID (opcional)
  body('auditor_secundario_id')
    .optional()
    .isUUID()
    .withMessage('El ID del auditor secundario debe ser un UUID válido'),

  // Tipo de auditoría
  body('tipo_auditoria')
    .optional()
    .isIn(['INICIAL', 'SEGUIMIENTO', 'EXTRAORDINARIA', 'RENOVACION'])
    .withMessage('Tipo de auditoría inválido'),

  // Modalidad
  body('modalidad')
    .optional()
    .isIn(['PRESENCIAL', 'VIRTUAL', 'HIBRIDA'])
    .withMessage('Modalidad inválida'),

  // Fecha programada
  body('fecha_programada')
    .notEmpty()
    .withMessage('La fecha programada es requerida')
    .isISO8601()
    .withMessage('La fecha programada debe ser una fecha válida')
    .custom((value) => {
      const fechaProgramada = new Date(value);
      const ahora = new Date();
      
      if (fechaProgramada <= ahora) {
        throw new Error('La fecha programada debe ser futura');
      }
      return true;
    }),

  // Fecha fin programada (opcional)
  body('fecha_fin_programada')
    .optional()
    .isISO8601()
    .withMessage('La fecha fin programada debe ser una fecha válida')
    .custom((value, { req }) => {
      if (value && req.body.fecha_programada) {
        const fechaInicio = new Date(req.body.fecha_programada);
        const fechaFin = new Date(value);
        
        if (fechaFin <= fechaInicio) {
          throw new Error('La fecha fin debe ser posterior a la fecha de inicio');
        }
      }
      return true;
    }),

  // Versión del pliego
  body('version_pliego')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('La versión del pliego debe tener entre 1 y 50 caracteres')
    .trim(),

  // Dirección de visita (opcional)
  body('direccion_visita')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La dirección de visita no puede exceder 500 caracteres')
    .trim(),

  // Duración estimada en días
  body('duracion_estimada_dias')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('La duración estimada debe estar entre 1 y 365 días'),

  handleValidationErrors
];

/**
 * Validador para actualizar auditoría
 */
const validarActualizarAuditoria = [
  // Parámetro ID
  param('id')
    .isUUID()
    .withMessage('El ID de la auditoría debe ser un UUID válido'),

  // Título (opcional en actualización)
  body('titulo')
    .optional()
    .isLength({ min: 5, max: 255 })
    .withMessage('El título debe tener entre 5 y 255 caracteres')
    .trim(),

  // Descripción (opcional)
  body('descripcion')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres')
    .trim(),

  // Fechas
  body('fecha_programada')
    .optional()
    .isISO8601()
    .withMessage('La fecha programada debe ser una fecha válida'),

  body('fecha_fin_programada')
    .optional()
    .isISO8601()
    .withMessage('La fecha fin programada debe ser una fecha válida'),

  body('fecha_visita_programada')
    .optional()
    .isISO8601()
    .withMessage('La fecha de visita programada debe ser una fecha válida'),

  // Modalidad
  body('modalidad')
    .optional()
    .isIn(['PRESENCIAL', 'VIRTUAL', 'HIBRIDA'])
    .withMessage('Modalidad inválida'),

  // Dirección de visita
  body('direccion_visita')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La dirección de visita no puede exceder 500 caracteres')
    .trim(),

  // Duración estimada
  body('duracion_estimada_dias')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('La duración estimada debe estar entre 1 y 365 días'),

  // Observaciones generales
  body('observaciones_generales')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Las observaciones generales no pueden exceder 2000 caracteres')
    .trim(),

  handleValidationErrors
];

/**
 * Validador para avanzar etapa
 */
const validarAvanzarEtapa = [
  // Parámetro ID
  param('id')
    .isUUID()
    .withMessage('El ID de la auditoría debe ser un UUID válido'),

  // Fecha de visita (opcional, para etapa 5)
  body('fecha_visita')
    .optional()
    .isISO8601()
    .withMessage('La fecha de visita debe ser una fecha válida')
    .custom((value) => {
      if (value) {
        const fechaVisita = new Date(value);
        const ahora = new Date();
        
        if (fechaVisita <= ahora) {
          throw new Error('La fecha de visita debe ser futura');
        }
      }
      return true;
    }),

  // Observaciones (opcional)
  body('observaciones')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Las observaciones no pueden exceder 1000 caracteres')
    .trim(),

  // Fecha límite para carga (opcional, para etapa 2)
  body('fecha_limite_carga')
    .optional()
    .isISO8601()
    .withMessage('La fecha límite de carga debe ser una fecha válida')
    .custom((value) => {
      if (value) {
        const fechaLimite = new Date(value);
        const ahora = new Date();
        
        if (fechaLimite <= ahora) {
          throw new Error('La fecha límite de carga debe ser futura');
        }
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validador para filtros de consulta
 */
const validarFiltrosConsulta = [
  // Paginación
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  // Filtros de estado
  query('estado')
    .optional()
    .isIn([
      'PROGRAMADA',
      'ETAPA_1_NOTIFICACION',
      'ETAPA_2_CARGA_DOCUMENTOS',
      'ETAPA_3_VALIDACION_DOCUMENTOS',
      'ETAPA_4_ANALISIS_PARQUE',
      'ETAPA_5_VISITA_PRESENCIAL',
      'ETAPA_6_INFORME_PRELIMINAR',
      'ETAPA_7_REVISION_OBSERVACIONES',
      'ETAPA_8_INFORME_FINAL',
      'COMPLETADA',
      'CANCELADA',
      'SUSPENDIDA'
    ])
    .withMessage('Estado de auditoría inválido'),

  // Tipo de auditoría
  query('tipo_auditoria')
    .optional()
    .isIn(['INICIAL', 'SEGUIMIENTO', 'EXTRAORDINARIA', 'RENOVACION'])
    .withMessage('Tipo de auditoría inválido'),

  // IDs
  query('proveedor_id')
    .optional()
    .isUUID()
    .withMessage('El ID del proveedor debe ser un UUID válido'),

  query('auditor_id')
    .optional()
    .isUUID()
    .withMessage('El ID del auditor debe ser un UUID válido'),

  // Fechas
  query('fecha_desde')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe ser una fecha válida'),

  query('fecha_hasta')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe ser una fecha válida')
    .custom((value, { req }) => {
      if (value && req.query.fecha_desde) {
        const fechaDesde = new Date(req.query.fecha_desde);
        const fechaHasta = new Date(value);
        
        if (fechaHasta <= fechaDesde) {
          throw new Error('La fecha hasta debe ser posterior a la fecha desde');
        }
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validador para parámetros de ID
 */
const validarIdParam = [
  param('id')
    .isUUID()
    .withMessage('El ID debe ser un UUID válido'),
  
  handleValidationErrors
];

/**
 * Validador para código de auditoría
 */
const validarCodigoParam = [
  param('codigo')
    .notEmpty()
    .withMessage('El código de auditoría es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El código debe tener entre 3 y 50 caracteres')
    .matches(/^AUD-\d{6}-[A-Z0-9]{6}$/)
    .withMessage('El código debe tener el formato AUD-YYYYMM-XXXXXX'),
  
  handleValidationErrors
];

module.exports = {
  validarCrearAuditoria,
  validarActualizarAuditoria,
  validarAvanzarEtapa,
  validarFiltrosConsulta,
  validarIdParam,
  validarCodigoParam,
  handleValidationErrors
};
