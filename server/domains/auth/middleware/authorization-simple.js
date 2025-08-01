/**
 * Middleware de Autorización Simplificado
 * Portal de Auditorías Técnicas
 */

/**
 * Middleware que requiere rol de administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autenticación requerida',
      data: null
    });
  }

  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({
      status: 'fail',
      message: 'Se requiere rol de administrador',
      data: null
    });
  }

  next();
};

/**
 * Middleware que requiere rol de auditor (incluye admin y supervisor)
 */
const requireAuditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autenticación requerida',
      data: null
    });
  }

  const rolesPermitidos = ['ADMIN', 'SUPERVISOR', 'AUDITOR'];
  
  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({
      status: 'fail',
      message: 'Se requiere rol de auditor',
      data: null
    });
  }

  next();
};

/**
 * Verificar si el usuario puede modificar otro usuario
 */
const canModifyUser = (req, res, next) => {
  // Implementación simple: solo admins pueden modificar otros usuarios
  if (req.user.rol === 'ADMIN') {
    return next();
  }

  // Usuarios pueden modificarse a sí mismos
  const targetUserId = req.params.userId || req.params.id;
  if (targetUserId && targetUserId === req.user.id) {
    return next();
  }

  return res.status(403).json({
    status: 'fail',
    message: 'No tienes permisos para modificar este usuario',
    data: null
  });
};

/**
 * Middleware para log de acciones sensibles
 */
const logSensitiveAction = (actionType) => {
  return (req, res, next) => {
    console.log(`🔒 SENSITIVE ACTION: ${actionType}`, {
      user: req.user?.id,
      role: req.user?.rol,
      action: actionType,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    next();
  };
};

/**
 * Verificar modo de mantenimiento
 */
const checkMaintenanceMode = (req, res, next) => {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  if (maintenanceMode) {
    return res.status(503).json({
      status: 'fail',
      message: 'Sistema en mantenimiento. Intenta más tarde.',
      data: null
    });
  }
  
  next();
};

module.exports = {
  requireAdmin,
  requireAuditor,
  canModifyUser,
  logSensitiveAction,
  checkMaintenanceMode
};
