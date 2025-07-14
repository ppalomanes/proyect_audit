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

  // Capturar información del usuario si está autenticado
  const originalNext = next;
  next = (...args) => {
    if (req.user) {
      requestInfo.userId = req.user.id;
      requestInfo.userRole = req.user.rol;
    }
    originalNext(...args);
  };

  // Interceptar el final de la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: duration,
      responseSize: data ? Buffer.byteLength(data, 'utf8') : 0
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

  // Información adicional para logging detallado
  const logData = {
    ...info,
    ...(NODE_ENV === 'development' && {
      headers: sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params
    })
  };

  // Log según severidad
  if (isError) {
    console.error(`🔴 ${message}`, logData);
    
    // Log del body de error si es relevante
    if (NODE_ENV === 'development' && responseData) {
      try {
        const errorResponse = JSON.parse(responseData);
        if (errorResponse.error) {
          console.error(`   Error: ${errorResponse.error}`);
          if (errorResponse.details) {
            console.error(`   Details:`, errorResponse.details);
          }
        }
      } catch (e) {
        // No es JSON válido, ignorar
      }
    }
  } else if (isSlowRequest) {
    console.warn(`🟡 SLOW REQUEST - ${message}`, logData);
  } else if (NODE_ENV === 'development') {
    console.log(`🟢 ${message}`);
  }

  // Métricas especiales para endpoints críticos
  if (isCriticalEndpoint(info.url)) {
    console.log(`⚡ CRITICAL ENDPOINT - ${message}`, {
      endpoint: info.url,
      duration: info.duration,
      userId: info.userId,
      success: !isError
    });
  }
};

/**
 * Generar ID único para el request
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitizar headers sensibles para logging
 */
const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  
  // Ocultar información sensible
  if (sanitized.authorization) {
    sanitized.authorization = 'Bearer [HIDDEN]';
  }
  if (sanitized.cookie) {
    sanitized.cookie = '[HIDDEN]';
  }
  
  return sanitized;
};

/**
 * Identificar endpoints críticos para monitoreo especial
 */
const isCriticalEndpoint = (url) => {
  const criticalPatterns = [
    '/api/auth/login',
    '/api/etl/process',
    '/api/ia/analyze',
    '/api/auditorias',
    '/api/health'
  ];
  
  return criticalPatterns.some(pattern => url.includes(pattern));
};

/**
 * Middleware para logging de errores específicos del dominio
 */
const domainErrorLogger = (domain) => {
  return (error, req, res, next) => {
    console.error(`🚨 ${domain.toUpperCase()} ERROR:`, {
      domain,
      requestId: req.requestId,
      userId: req.user?.id,
      error: error.message,
      stack: NODE_ENV === 'development' ? error.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    next(error);
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
  domainErrorLogger,
  etlOperationLogger,
  iaOperationLogger,
  performanceLogger,
  generateRequestId
};
