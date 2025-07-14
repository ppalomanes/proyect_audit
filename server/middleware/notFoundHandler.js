/**
 * Not Found Handler Middleware
 * Portal de Auditorías Técnicas
 */

const notFoundHandler = (req, res, next) => {
  const error = {
    success: false,
    error: {
      message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
      code: 'ROUTE_NOT_FOUND',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      availableRoutes: [
        'GET /',
        'GET /health',
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/auth/profile'
      ]
    }
  };

  res.status(404).json(error);
};

module.exports = {
  notFoundHandler
};
