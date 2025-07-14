/**
 * Middleware de Logging de Requests
 * Portal de Auditorías Técnicas
 */

const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configurar logger para requests
const requestLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/requests.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// En desarrollo, también log a consola
if (process.env.NODE_ENV === 'development') {
  requestLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Middleware principal de logging
const requestLoggerMiddleware = (req, res, next) => {
  // Generar ID único para la request
  req.requestId = uuidv4();
  
  // Agregar ID a headers de respuesta
  res.set('X-Request-ID', req.requestId);
  
  // Información inicial de la request
  const startTime = Date.now();
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    forwarded: req.get('X-Forwarded-For'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  };
  
  // Log de request entrante
  requestLogger.info('Incoming request', requestInfo);
  
  // Interceptar el final de la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Información de la respuesta
    const responseInfo = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    };
    
    // Agregar información de usuario si está autenticado
    if (req.user) {
      responseInfo.userId = req.user.id;
      responseInfo.userRole = req.user.rol;
    }
    
    // Agregar información de error si el status es de error
    if (res.statusCode >= 400) {
      responseInfo.errorResponse = data ? JSON.parse(data) : null;
    }
    
    // Log según el nivel de status code
    if (res.statusCode >= 500) {
      requestLogger.error('Request completed with server error', responseInfo);
    } else if (res.statusCode >= 400) {
      requestLogger.warn('Request completed with client error', responseInfo);
    } else {
      requestLogger.info('Request completed successfully', responseInfo);
    }
    
    // Llamar al método original
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware para logging de operaciones específicas
const operationLogger = (operation, additionalInfo = {}) => {
  return (req, res, next) => {
    const operationInfo = {
      requestId: req.requestId,
      operation,
      userId: req.user?.id,
      userRole: req.user?.rol,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };
    
    requestLogger.info(`Operation: ${operation}`, operationInfo);
    next();
  };
};

// Middleware para logging de acceso a recursos sensibles
const sensitiveResourceLogger = (resourceType, resourceId = null) => {
  return (req, res, next) => {
    const accessInfo = {
      requestId: req.requestId,
      resourceType,
      resourceId: resourceId || req.params.id,
      userId: req.user?.id,
      userRole: req.user?.rol,
      action: req.method,
      timestamp: new Date().toISOString()
    };
    
    requestLogger.warn(`Sensitive resource access: ${resourceType}`, accessInfo);
    next();
  };
};

// Middleware para logging de uploads de archivos
const fileUploadLogger = (req, res, next) => {
  if (req.files || req.file) {
    const files = req.files || [req.file];
    const fileInfo = {
      requestId: req.requestId,
      userId: req.user?.id,
      filesCount: files.length,
      files: files.map(file => ({
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fieldname: file.fieldname
      })),
      timestamp: new Date().toISOString()
    };
    
    requestLogger.info('File upload', fileInfo);
  }
  
  next();
};

// Middleware para logging de operaciones de base de datos
const dbOperationLogger = (operation, table, recordId = null) => {
  return (req, res, next) => {
    const dbInfo = {
      requestId: req.requestId,
      operation,
      table,
      recordId: recordId || req.params.id,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    };
    
    requestLogger.info(`Database operation: ${operation} on ${table}`, dbInfo);
    next();
  };
};

// Función para logging manual desde controladores
const logOperation = (req, level, message, additionalInfo = {}) => {
  const logInfo = {
    requestId: req.requestId,
    userId: req.user?.id,
    userRole: req.user?.rol,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };
  
  requestLogger.log(level, message, logInfo);
};

// Función para logging de métricas de performance
const logPerformanceMetric = (req, metricName, value, unit = 'ms') => {
  const metricInfo = {
    requestId: req.requestId,
    metric: metricName,
    value,
    unit,
    timestamp: new Date().toISOString()
  };
  
  requestLogger.info(`Performance metric: ${metricName}`, metricInfo);
};

module.exports = {
  requestLogger: requestLoggerMiddleware,
  operationLogger,
  sensitiveResourceLogger,
  fileUploadLogger,
  dbOperationLogger,
  logOperation,
  logPerformanceMetric
};
