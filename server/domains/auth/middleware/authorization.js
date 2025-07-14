/**
 * Middleware de Autorización
 * Portal de Auditorías Técnicas
 */

/**
 * Middleware general de autorización por roles
 */
const authorize = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autenticación requerida',
        data: null
      });
    }
    
    // Si rolesPermitidos es un string, convertirlo a array
    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permisos para acceder a este recurso',
        data: {
          required_roles: roles,
          user_role: req.user.rol
        }
      });
    }
    
    next();
  };
};

/**
 * Verificar si el usuario tiene un rol específico
 */
const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autenticación requerida',
        data: null
      });
    }
    
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permisos para acceder a este recurso',
        data: {
          required_roles: rolesPermitidos,
          user_role: req.user.rol
        }
      });
    }
    
    next();
  };
};

/**
 * Verificar si el usuario tiene un permiso específico
 */
const requirePermission = (permiso) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autenticación requerida',
        data: null
      });
    }
    
    try {
      const authService = require('../auth.service');
      const tienePermiso = await authService.validatePermission(req.user.id, permiso);
      
      if (!tienePermiso) {
        return res.status(403).json({
          status: 'fail',
          message: `No tienes el permiso: ${permiso}`,
          data: {
            required_permission: permiso,
            user_role: req.user.rol
          }
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Error verificando permiso:', error.message);
      
      return res.status(500).json({
        status: 'error',
        message: 'Error verificando permisos',
        data: null
      });
    }
  };
};

/**
 * Middleware para administradores únicamente
 */
const requireAdmin = requireRole('ADMIN');

/**
 * Middleware para auditores (incluye supervisores y admins)
 */
const requireAuditor = requireRole('AUDITOR', 'SUPERVISOR', 'ADMIN');

/**
 * Middleware para supervisores (incluye admins)
 */
const requireSupervisor = requireRole('SUPERVISOR', 'ADMIN');

/**
 * Middleware para proveedores únicamente
 */
const requireProveedor = requireRole('PROVEEDOR');

/**
 * Verificar propiedad del recurso
 * El usuario debe ser propietario del recurso o tener rol de auditor/admin
 */
const requireOwnershipOrAuditor = (resourceUserIdField = 'usuario_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autenticación requerida',
        data: null
      });
    }
    
    // Admins y auditores tienen acceso total
    if (['ADMIN', 'SUPERVISOR', 'AUDITOR'].includes(req.user.rol)) {
      return next();
    }
    
    // Para otros roles, verificar propiedad
    const resourceUserId = req.params[resourceUserIdField] || 
                          req.body[resourceUserIdField] || 
                          req.query[resourceUserIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de usuario del recurso requerido',
        data: null
      });
    }
    
    if (resourceUserId !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Solo puedes acceder a tus propios recursos',
        data: null
      });
    }
    
    next();
  };
};

/**
 * Verificar acceso a auditoría
 * Los proveedores solo pueden acceder a sus propias auditorías
 */
const requireAuditoriaAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autenticación requerida',
      data: null
    });
  }
  
  // Admins y auditores tienen acceso total
  if (['ADMIN', 'SUPERVISOR', 'AUDITOR'].includes(req.user.rol)) {
    return next();
  }
  
  // Para proveedores, verificar que la auditoría les pertenece
  if (req.user.rol === 'PROVEEDOR') {
    try {
      const { getModels } = require('../../../models');
      const { Auditoria, Proveedor } = await getModels();
      
      const auditoriaId = req.params.auditoriaId || req.params.id;
      
      if (!auditoriaId) {
        return res.status(400).json({
          status: 'fail',
          message: 'ID de auditoría requerido',
          data: null
        });
      }
      
      // Buscar la auditoría y verificar si pertenece al proveedor del usuario
      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: [{
          model: Proveedor,
          as: 'Proveedor'
        }]
      });
      
      if (!auditoria) {
        return res.status(404).json({
          status: 'fail',
          message: 'Auditoría no encontrada',
          data: null
        });
      }
      
      // Aquí se debería verificar si el usuario pertenece al proveedor
      // Por ahora permitimos acceso si es proveedor
      return next();
      
    } catch (error) {
      console.error('Error verificando acceso a auditoría:', error.message);
      
      return res.status(500).json({
        status: 'error',
        message: 'Error verificando permisos de auditoría',
        data: null
      });
    }
  }
  
  return res.status(403).json({
    status: 'fail',
    message: 'No tienes permisos para acceder a esta auditoría',
    data: null
  });
};

/**
 * Verificar si el usuario puede modificar otros usuarios
 */
const canModifyUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autenticación requerida',
      data: null
    });
  }
  
  const targetUserId = req.params.userId || req.params.id;
  
  // Los usuarios pueden modificar su propio perfil
  if (targetUserId === req.user.id) {
    return next();
  }
  
  // Solo admins pueden modificar otros usuarios
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({
      status: 'fail',
      message: 'Solo puedes modificar tu propio perfil',
      data: null
    });
  }
  
  next();
};

/**
 * Verificar límites de creación por rol
 */
const checkCreationLimits = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Autenticación requerida',
        data: null
      });
    }
    
    // Admins no tienen límites
    if (req.user.rol === 'ADMIN') {
      return next();
    }
    
    // Definir límites por rol y tipo de recurso
    const limites = {
      'AUDITOR': {
        'auditorias': 10, // Máximo 10 auditorías activas
        'documentos': 100 // Máximo 100 documentos por auditoría
      },
      'PROVEEDOR': {
        'documentos': 50, // Máximo 50 documentos por auditoría
        'registros_parque': 1000 // Máximo 1000 registros de parque informático
      }
    };
    
    const limite = limites[req.user.rol]?.[resourceType];
    
    if (!limite) {
      return next(); // No hay límite definido
    }
    
    try {
      // Aquí se implementaría la lógica para verificar el límite actual
      // Por ahora, simplemente continuar
      next();
      
    } catch (error) {
      console.error('Error verificando límites:', error.message);
      
      return res.status(500).json({
        status: 'error',
        message: 'Error verificando límites de creación',
        data: null
      });
    }
  };
};

/**
 * Verificar horarios de acceso
 */
const checkBusinessHours = (req, res, next) => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Domingo, 6 = Sábado
  
  // Horario de oficina: Lunes a Viernes, 7 AM a 7 PM
  const isBusinessHour = day >= 1 && day <= 5 && hour >= 7 && hour < 19;
  
  // Admins siempre tienen acceso
  if (req.user && req.user.rol === 'ADMIN') {
    return next();
  }
  
  // Fuera de horario de oficina, solo operaciones de lectura
  if (!isBusinessHour && req.method !== 'GET') {
    return res.status(403).json({
      status: 'fail',
      message: 'Operaciones de escritura solo permitidas en horario de oficina (L-V 7AM-7PM)',
      data: {
        current_time: now.toISOString(),
        business_hours: 'Lunes a Viernes, 7:00 AM - 7:00 PM'
      }
    });
  }
  
  next();
};

/**
 * Verificar estado de mantenimiento
 */
const checkMaintenanceMode = (req, res, next) => {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  if (maintenanceMode) {
    // Solo admins pueden acceder durante mantenimiento
    if (!req.user || req.user.rol !== 'ADMIN') {
      return res.status(503).json({
        status: 'fail',
        message: 'Sistema en mantenimiento. Intenta más tarde',
        data: {
          maintenance_mode: true,
          estimated_completion: process.env.MAINTENANCE_END || 'No estimado'
        }
      });
    }
  }
  
  next();
};

/**
 * Logging de acciones sensibles
 */
const logSensitiveAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(`🔒 Acción sensible: ${action}`, {
        user_id: req.user.id,
        user_email: req.user.email,
        user_role: req.user.rol,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        action: action,
        resource: req.originalUrl
      });
    }
    
    next();
  };
};

/**
 * Verificar acceso basado en IP
 */
const checkIPWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ALLOWED_IPS ? 
    process.env.ALLOWED_IPS.split(',').map(ip => ip.trim()) : 
    [];
  
  // Si no hay whitelist configurada, permitir acceso
  if (allowedIPs.length === 0) {
    return next();
  }
  
  const clientIP = req.ip;
  
  if (!allowedIPs.includes(clientIP) && !allowedIPs.includes('*')) {
    console.warn(`🚫 Acceso denegado desde IP no autorizada: ${clientIP}`);
    
    return res.status(403).json({
      status: 'fail',
      message: 'Acceso denegado desde esta ubicación',
      data: null
    });
  }
  
  next();
};

module.exports = {
  authorize,
  requireRole,
  requirePermission,
  requireAdmin,
  requireAuditor,
  requireSupervisor,
  requireProveedor,
  requireOwnershipOrAuditor,
  requireAuditoriaAccess,
  canModifyUser,
  checkCreationLimits,
  checkBusinessHours,
  checkMaintenanceMode,
  logSensitiveAction,
  checkIPWhitelist
};
