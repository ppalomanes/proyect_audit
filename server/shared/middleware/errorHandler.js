/**
 * Middleware de Manejo de Errores
 * Portal de Auditorías Técnicas
 */

const winston = require('winston');

// Configurar logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Tipos de errores personalizados
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Token de autenticación inválido') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Error en la base de datos') {
    super(message, 500, false);
    this.name = 'DatabaseError';
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'Error en servicio externo') {
    super(`${service}: ${message}`, 503, false);
    this.service = service;
    this.name = 'ExternalServiceError';
  }
}

// Función para determinar si un error es operacional
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Función para formatear errores de Sequelize
const handleSequelizeError = (error) => {
  switch (error.name) {
    case 'SequelizeValidationError':
      const errors = error.errors.map(err => ({
        field: err.path,
        value: err.value,
        message: err.message
      }));
      return new ValidationError('Error de validación', errors);
      
    case 'SequelizeUniqueConstraintError':
      const field = error.errors[0]?.path || 'campo';
      return new ConflictError(`El ${field} ya existe en el sistema`);
      
    case 'SequelizeForeignKeyConstraintError':
      return new ValidationError('Referencia inválida a recurso relacionado');
      
    case 'SequelizeConnectionError':
    case 'SequelizeConnectionRefusedError':
      return new DatabaseError('Error de conexión a la base de datos');
      
    case 'SequelizeDatabaseError':
      return new DatabaseError('Error en consulta a la base de datos');
      
    default:
      return new DatabaseError(error.message);
  }
};

// Función para formatear errores de validación
const handleValidationError = (error) => {
  if (error.array && typeof error.array === 'function') {
    // Error de express-validator
    const errors = error.array().map(err => ({
      field: err.param || err.path,
      value: err.value,
      message: err.msg
    }));
    return new ValidationError('Error de validación de datos', errors);
  }
  
  return new ValidationError(error.message);
};

// Función para formatear errores de JWT
const handleJWTError = (error) => {
  switch (error.name) {
    case 'JsonWebTokenError':
      return new AuthenticationError('Token de autenticación inválido');
    case 'TokenExpiredError':
      return new AuthenticationError('Token de autenticación expirado');
    case 'NotBeforeError':
      return new AuthenticationError('Token de autenticación no válido aún');
    default:
      return new AuthenticationError('Error de autenticación');
  }
};

// Función para formatear errores de multer (upload archivos)
const handleMulterError = (error) => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ValidationError('El archivo excede el tamaño máximo permitido');
    case 'LIMIT_FILE_COUNT':
      return new ValidationError('Demasiados archivos');
    case 'LIMIT_UNEXPECTED_FILE':
      return new ValidationError('Campo de archivo inesperado');
    default:
      return new ValidationError(`Error subiendo archivo: ${error.message}`);
  }
};

// Middleware principal de manejo de errores
const errorHandler = (error, req, res, next) => {
  let err = error;
  
  // Log del error original
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Transformar errores conocidos
  if (error.name && error.name.startsWith('Sequelize')) {
    err = handleSequelizeError(error);
  } else if (error.name && error.name.includes('JWT')) {
    err = handleJWTError(error);
  } else if (error.array && typeof error.array === 'function') {
    err = handleValidationError(error);
  } else if (error.code && error.code.startsWith('LIMIT_')) {
    err = handleMulterError(error);
  } else if (error.code === 'ECONNREFUSED') {
    err = new ExternalServiceError('Database', 'Conexión rechazada');
  } else if (error.code === 'ENOTFOUND') {
    err = new ExternalServiceError('External Service', 'Servicio no encontrado');
  } else if (!error.statusCode) {
    // Error desconocido - convertir a error del servidor
    err = new AppError('Error interno del servidor', 500, false);
  }
  
  // Determinar el status code
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  // Construir respuesta de error
  const errorResponse = {
    status,
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };
  
  // Agregar información adicional según el tipo de error
  if (err instanceof ValidationError && err.errors) {
    errorResponse.errors = err.errors;
  }
  
  if (err instanceof ExternalServiceError) {
    errorResponse.service = err.service;
  }
  
  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.originalError = error.message !== err.message ? error.message : undefined;
  }
  
  // En producción, ocultar detalles de errores del servidor
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    if (!isOperationalError(err)) {
      errorResponse.message = 'Error interno del servidor';
      delete errorResponse.stack;
    }
  }
  
  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar errores asíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para crear errores rápidamente
const createError = (message, statusCode = 500) => {
  return new AppError(message, statusCode);
};

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  isOperationalError,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError
};
