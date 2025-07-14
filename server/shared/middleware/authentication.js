/**
 * Middleware de Autenticación JWT para Portal de Auditorías Técnicas
 * Verifica tokens JWT y establece contexto de usuario
 */

const jwt = require('jsonwebtoken');
const { session } = require('../../config/redis');

const {
  JWT_SECRET = 'portal-auditorias-secret-key',
  JWT_EXPIRES_IN = '24h'
} = process.env;

/**
 * Middleware principal de autenticación
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticación requerido',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          code: 'AUTH_TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        error: 'Token inválido',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // Verificar sesión en Redis (para logout inmediato)
    const sessionData = await session.get(decoded.userId);
    if (!sessionData || sessionData.token !== token) {
      return res.status(401).json({
        error: 'Sesión inválida o expirada',
        code: 'AUTH_SESSION_INVALID'
      });
    }

    // Establecer contexto de usuario en request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      nombre: decoded.nombre,
      rol: decoded.rol,
      permisos: decoded.permisos || [],
      sessionId: sessionData.sessionId
    };

    // Actualizar última actividad
    sessionData.lastActivity = new Date().toISOString();
    await session.store(decoded.userId, sessionData, 86400); // 24 horas

    next();

  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      error: 'Error interno de autenticación',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware de autorización por roles
 */
const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'AUTH_USER_NOT_AUTHENTICATED'
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        required_roles: rolesPermitidos,
        user_role: req.user.rol
      });
    }

    next();
  };
};

/**
 * Middleware de autorización por permisos específicos
 */
const requirePermission = (...permisosRequeridos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'AUTH_USER_NOT_AUTHENTICATED'
      });
    }

    const userPermisos = req.user.permisos || [];
    const tienePermiso = permisosRequeridos.every(permiso => 
      userPermisos.includes(permiso)
    );

    if (!tienePermiso) {
      return res.status(403).json({
        error: 'Permisos específicos insuficientes',
        code: 'AUTH_MISSING_PERMISSIONS',
        required_permissions: permisosRequeridos,
        user_permissions: userPermisos
      });
    }

    next();
  };
};

/**
 * Utilidad para generar token JWT
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    permisos: user.permisos || []
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'portal-auditorias',
    audience: 'portal-users'
  });
};

/**
 * Utilidad para verificar token sin middleware
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Roles disponibles en el sistema
 */
const ROLES = {
  ADMIN: 'ADMIN',           // Administrador del sistema
  AUDITOR: 'AUDITOR',       // Auditor técnico
  PROVEEDOR: 'PROVEEDOR',   // Proveedor de servicios
  CONSULTOR: 'CONSULTOR'    // Consultor externo
};

/**
 * Permisos disponibles en el sistema
 */
const PERMISOS = {
  // Gestión de auditorías
  CREAR_AUDITORIA: 'crear_auditoria',
  MODIFICAR_AUDITORIA: 'modificar_auditoria',
  ELIMINAR_AUDITORIA: 'eliminar_auditoria',
  VER_TODAS_AUDITORIAS: 'ver_todas_auditorias',
  
  // Procesamiento ETL
  PROCESAR_ETL: 'procesar_etl',
  VER_RESULTADOS_ETL: 'ver_resultados_etl',
  CONFIGURAR_ETL: 'configurar_etl',
  
  // Análisis IA
  EJECUTAR_ANALISIS_IA: 'ejecutar_analisis_ia',
  VER_ANALISIS_IA: 'ver_analisis_ia',
  CONFIGURAR_CRITERIOS_IA: 'configurar_criterios_ia',
  
  // Gestión de usuarios
  CREAR_USUARIO: 'crear_usuario',
  MODIFICAR_USUARIO: 'modificar_usuario',
  ELIMINAR_USUARIO: 'eliminar_usuario',
  VER_USUARIOS: 'ver_usuarios',
  
  // Dashboards y reportes
  VER_DASHBOARD_COMPLETO: 'ver_dashboard_completo',
  EXPORTAR_REPORTES: 'exportar_reportes',
  CONFIGURAR_METRICAS: 'configurar_metricas'
};

module.exports = {
  // Middlewares principales
  authenticate,
  authorize,
  requirePermission,
  
  // Utilidades
  generateToken,
  verifyToken,
  
  // Constantes
  ROLES,
  PERMISOS,
  
  // Helpers
  hasRole: (user, role) => user?.rol === role,
  hasPermission: (user, permission) => user?.permisos?.includes(permission),
  isAdmin: (user) => user?.rol === ROLES.ADMIN,
  isAuditor: (user) => user?.rol === ROLES.AUDITOR,
  isProveedor: (user) => user?.rol === ROLES.PROVEEDOR
};
