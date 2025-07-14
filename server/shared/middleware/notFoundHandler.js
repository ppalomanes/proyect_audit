/**
 * Middleware de Manejo de Rutas No Encontradas
 * Portal de Auditorías Técnicas
 */

const { NotFoundError } = require('./errorHandler');

const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Ruta ${req.originalUrl} no encontrada`);
  
  // Agregar información adicional sobre rutas disponibles
  error.availableRoutes = {
    api: '/api',
    auth: '/api/auth',
    auditorias: '/api/auditorias',
    etl: '/api/etl',
    ia: '/api/ia',
    health: '/health',
    info: '/info'
  };
  
  // Sugerir rutas similares si es posible
  const path = req.originalUrl.toLowerCase();
  const suggestions = [];
  
  if (path.includes('auth')) {
    suggestions.push('/api/auth');
  }
  if (path.includes('audit')) {
    suggestions.push('/api/auditorias');
  }
  if (path.includes('etl') || path.includes('excel') || path.includes('parque')) {
    suggestions.push('/api/etl');
  }
  if (path.includes('ia') || path.includes('ai') || path.includes('ollama')) {
    suggestions.push('/api/ia');
  }
  if (path.includes('health') || path.includes('status')) {
    suggestions.push('/health');
  }
  
  if (suggestions.length > 0) {
    error.suggestions = suggestions;
  }
  
  next(error);
};

module.exports = {
  notFoundHandler
};
