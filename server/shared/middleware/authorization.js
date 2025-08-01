// Authorization middleware
// Portal de Auditorías Técnicas

const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No estás autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required_roles: allowedRoles,
        your_role: req.user.rol
      });
    }

    next();
  };
};

module.exports = authorizeRoles;