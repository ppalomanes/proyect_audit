/**
 * Request Logger personalizado para Portal de Auditorías Técnicas
 * Registra información detallada de requests para monitoreo y debugging
 */

const { NODE_ENV = 'development' } = process.env;

/**
 * Middleware de logging de requests
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Información básica del request
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  };

  // Agregar ID de request para tracking
  req.requestId = requestInfo.requestId;
  res.set('X-Request-ID', requestInfo.requestId);

  // Interceptar el final de la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: duration,
      responseSize: data ? Buffer.byteLength(data, 'utf8') : 0,
      userId: req.user?.id,
      userRole: req.user?.rol
    };

    // Log según el nivel apropiado
    logRequest(responseInfo, req, data);
    
    // Llamar al método original
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Función de logging según el tipo de request y respuesta
 */
const logRequest = (info, req, responseData) => {
  const isError = info.statusCode >= 400;
  const isSlowRequest = info.duration > 5000; // > 5 segundos
  const isFileUpload = req.headers['content-type']?.includes('multipart/form-data');
  
  // Construir mensaje de log
  let message = `${info.method} ${info.url} - ${info.statusCode} - ${info.duration}ms`;
  
  if (info.userId) {
    message += ` - User: ${info.userId}`;
  }
  
  if (isFileUpload) {
    message += ' - FILE_UPLOAD';
  }

  // Log según severidad
  if (isError) {
    console.error(`🔴 ${message}`);
  } else if (isSlowRequest) {
    console.warn(`🟡 SLOW REQUEST - ${message}`);
  } else if (NODE_ENV === 'development') {
    console.log(`🟢 ${message}`);
  }
};

/**
 * Generar ID único para el request
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Middleware para logging de operaciones específicas
 */
const operationLogger = (operationType) => {
  return (req, res, next) => {
    console.log(`📝 ${operationType.toUpperCase()} - ${req.method} ${req.originalUrl}`, {
      operation: operationType,
      userId: req.user?.id,
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
    next();
  };
};

/**
 * Logger específico para operaciones ETL
 */
const etlOperationLogger = (operation, jobId, details = {}) => {
  console.log(`🔄 ETL ${operation.toUpperCase()}:`, {
    operation,
    jobId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Logger específico para operaciones de IA
 */
const iaOperationLogger = (operation, analysisId, model, details = {}) => {
  console.log(`🤖 IA ${operation.toUpperCase()}:`, {
    operation,
    analysisId,
    model,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Logger de performance para operaciones lentas
 */
const performanceLogger = (operation, duration, threshold = 1000) => {
  if (duration > threshold) {
    console.warn(`⏱️  SLOW OPERATION - ${operation}: ${duration}ms`, {
      operation,
      duration,
      threshold,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  requestLogger,
  operationLogger,
  etlOperationLogger,
  iaOperationLogger,
  performanceLogger,
  generateRequestId
};
