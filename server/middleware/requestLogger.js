/**
 * Request Logger Middleware
 * Portal de Auditorías Técnicas
 */

const morgan = require('morgan');

// Configuración personalizada de morgan
const customFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Logger para desarrollo
const developmentLogger = morgan('dev');

// Logger para producción
const productionLogger = morgan(customFormat, {
  skip: (req, res) => {
    // No loggear health checks en producción
    return req.originalUrl === '/health';
  }
});

// Logger personalizado con colores y formato mejorado
const customLogger = morgan((tokens, req, res) => {
  const status = tokens.status(req, res);
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const responseTime = tokens['response-time'](req, res);
  
  // Colores según el status code
  let statusColor = '\x1b[32m'; // verde por defecto
  if (status >= 400 && status < 500) statusColor = '\x1b[33m'; // amarillo para 4xx
  if (status >= 500) statusColor = '\x1b[31m'; // rojo para 5xx
  
  // Color para el método
  let methodColor = '\x1b[36m'; // cyan
  if (method === 'POST') methodColor = '\x1b[35m'; // magenta
  if (method === 'PUT' || method === 'PATCH') methodColor = '\x1b[33m'; // amarillo
  if (method === 'DELETE') methodColor = '\x1b[31m'; // rojo
  
  return [
    '\x1b[90m', // gris para timestamp
    tokens.date(req, res, 'iso'),
    '\x1b[0m', // reset
    ' ',
    methodColor,
    method,
    '\x1b[0m',
    ' ',
    url,
    ' ',
    statusColor,
    status,
    '\x1b[0m',
    ' - ',
    responseTime,
    'ms',
    status >= 400 ? ` - ${res.statusMessage || ''}` : ''
  ].join('');
});

// Middleware principal
const requestLogger = (req, res, next) => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return productionLogger(req, res, next);
  } else if (env === 'test') {
    // No loggear en tests
    return next();
  } else {
    return customLogger(req, res, next);
  }
};

// Middleware para loggear errores
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress;
  
  console.error(`\n🚨 ERROR ${timestamp}`);
  console.error(`📍 ${method} ${url}`);
  console.error(`🌐 IP: ${ip}`);
  console.error(`🔍 User-Agent: ${userAgent}`);
  console.error(`❌ Error: ${err.message}`);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error(`📚 Stack: ${err.stack}`);
  }
  console.error('─'.repeat(80));
  
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger,
  developmentLogger,
  productionLogger
};
