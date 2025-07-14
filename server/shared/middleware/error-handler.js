/**
 * Error Handler Global para Portal de Auditorías Técnicas
 * Maneja errores de manera consistente y proporciona logging detallado
 */

const { NODE_ENV = 'development' } = process.env;

/**
 * Middleware de manejo de errores global
 */
const errorHandler = (error, req, res, next) => {
  console.error('🚨 Error capturado:', {
    message: error.message,
    stack: NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Error de validación de Sequelize
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  // Error de constraint único de Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Recurso ya existe',
      code: 'DUPLICATE_RESOURCE',
      field: error.errors[0]?.path || 'unknown'
    });
  }

  // Error de conexión a base de datos
  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      error: 'Error de conexión a base de datos',
      code: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // Error de sintaxis JSON
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'JSON mal formado',
      code: 'INVALID_JSON'
    });
  }

  // Error de payload muy grande
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Archivo o payload muy grande',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Error personalizado de la aplicación
  if (error.isOperational) {
    return res.status(error.statusCode || 400).json({
      error: error.message,
      code: error.code || 'OPERATIONAL_ERROR',
      ...(error.details && { details: error.details })
    });
  }

  // Error interno del servidor
  res.status(500).json({
    error: NODE_ENV === 'development' 
      ? error.message 
      : 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR',
    ...(NODE_ENV === 'development' && { 
      stack: error.stack 
    })
  });
};

/**
 * Clase para errores operacionales personalizados
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = 'APP_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores específicos del dominio
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Permisos insuficientes') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con recurso existente') {
    super(message, 409, 'CONFLICT');
  }
}

class ETLError extends AppError {
  constructor(message, step = null, details = null) {
    super(message, 400, 'ETL_ERROR', { step, ...details });
  }
}

class IAError extends AppError {
  constructor(message, model = null, details = null) {
    super(message, 400, 'IA_ERROR', { model, ...details });
  }
}

/**
 * Wrapper para funciones async que captura errores automáticamente
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para capturar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Ruta ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  
  // Clases de error
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ETLError,
  IAError
};
