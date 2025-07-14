/**
 * Error Handler Middleware
 * Portal de Auditorías Técnicas
 */

// Clase para errores personalizados
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handler para errores específicos de la aplicación
const handleAppError = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      code: err.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.details : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  });
};

// Handler para errores de Sequelize
const handleSequelizeError = (err, req, res) => {
  let statusCode = 500;
  let message = 'Error de base de datos';
  let code = 'DATABASE_ERROR';

  switch (err.name) {
    case 'SequelizeValidationError':
      statusCode = 400;
      message = 'Error de validación de datos';
      code = 'VALIDATION_ERROR';
      break;
    
    case 'SequelizeUniqueConstraintError':
      statusCode = 409;
      message = 'El registro ya existe';
      code = 'DUPLICATE_ENTRY';
      break;
    
    case 'SequelizeForeignKeyConstraintError':
      statusCode = 400;
      message = 'Referencia inválida';
      code = 'FOREIGN_KEY_ERROR';
      break;
    
    case 'SequelizeConnectionError':
      statusCode = 503;
      message = 'Error de conexión a la base de datos';
      code = 'CONNECTION_ERROR';
      break;
    
    case 'SequelizeTimeoutError':
      statusCode = 408;
      message = 'Timeout en base de datos';
      code = 'TIMEOUT_ERROR';
      break;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      code: code,
      details: process.env.NODE_ENV === 'development' ? {
        original: err.message,
        sql: err.sql,
        parameters: err.parameters
      } : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  });
};

// Handler para errores de JWT
const handleJWTError = (err, req, res) => {
  let statusCode = 401;
  let message = 'Token inválido';
  let code = 'INVALID_TOKEN';

  if (err.name === 'TokenExpiredError') {
    message = 'Token expirado';
    code = 'EXPIRED_TOKEN';
  } else if (err.name === 'JsonWebTokenError') {
    message = 'Token malformado';
    code = 'MALFORMED_TOKEN';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      code: code,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  });
};

// Handler para errores de multer (upload de archivos)
const handleMulterError = (err, req, res) => {
  let statusCode = 400;
  let message = 'Error en upload de archivo';
  let code = 'UPLOAD_ERROR';

  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'Archivo demasiado grande';
      code = 'FILE_TOO_LARGE';
      break;
    
    case 'LIMIT_FILE_COUNT':
      message = 'Demasiados archivos';
      code = 'TOO_MANY_FILES';
      break;
    
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Campo de archivo inesperado';
      code = 'UNEXPECTED_FILE';
      break;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      code: code,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  });
};

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  // Si la respuesta ya fue enviada, delegar a Express
  if (res.headersSent) {
    return next(err);
  }

  // Log del error (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error('\n🚨 Error Handler:', err);
  }

  // Manejar diferentes tipos de errores
  if (err instanceof AppError) {
    return handleAppError(err, req, res);
  }

  if (err.name && err.name.startsWith('Sequelize')) {
    return handleSequelizeError(err, req, res);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return handleJWTError(err, req, res);
  }

  if (err.code && err.code.startsWith('LIMIT_')) {
    return handleMulterError(err, req, res);
  }

  // Error genérico no manejado
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        name: err.name
      } : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  });
};

// Middleware para errores 404
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Ruta ${req.originalUrl} no encontrada`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// Handler para errores de conexión y operaciones asíncronas
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};
