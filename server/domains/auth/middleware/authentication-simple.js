/**
 * Middleware de Autenticación Simplificado
 * Portal de Auditorías Técnicas
 */

const authService = require('../auth.service-simple');

/**
 * Middleware para verificar token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token de autenticación requerido',
        data: null
      });
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar token
    const decoded = authService.verifyToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token de acceso inválido',
        data: null
      });
    }
    
    // Simular usuario válido (en versión completa se consultaría la base de datos)
    const usuario = {
      id: decoded.id,
      email: decoded.email,
      nombres: decoded.nombres,
      apellidos: decoded.apellidos,
      rol: decoded.rol,
      estado: 'ACTIVO',
      email_verificado: true
    };
    
    // Agregar usuario a la request
    req.user = usuario;
    next();
    
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    
    let mensaje = 'Token inválido';
    
    if (error.message === 'Token expirado') {
      mensaje = 'Token expirado. Inicia sesión nuevamente';
    } else if (error.message === 'Token inválido') {
      mensaje = 'Token inválido';
    }
    
    return res.status(401).json({
      status: 'fail',
      message: mensaje,
      data: null
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Permite acceso si no hay token, pero lo verifica si existe
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin usuario
      req.user = null;
      return next();
    }
    
    // Hay token, intentar autenticar
    await authenticate(req, res, next);
    
  } catch (error) {
    // Si hay error en token opcional, continuar sin usuario
    req.user = null;
    next();
  }
};

/**
 * Middleware que requiere autenticación completa
 */
const requireAuth = authenticate;

/**
 * Verificar token de refresh
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Refresh token requerido',
        data: null
      });
    }
    
    const decoded = authService.verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        status: 'fail',
        message: 'Refresh token inválido',
        data: null
      });
    }
    
    req.tokenData = decoded;
    next();
    
  } catch (error) {
    console.error('Error verificando refresh token:', error.message);
    
    return res.status(401).json({
      status: 'fail',
      message: 'Refresh token inválido o expirado',
      data: null
    });
  }
};

/**
 * Verificar estado de cuenta activa
 */
const requireActiveAccount = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autenticación requerida',
      data: null
    });
  }
  
  if (req.user.estado !== 'ACTIVO') {
    return res.status(403).json({
      status: 'fail',
      message: 'Cuenta no activa',
      data: null
    });
  }
  
  if (!req.user.email_verificado) {
    return res.status(403).json({
      status: 'fail',
      message: 'Email no verificado',
      data: null
    });
  }
  
  next();
};

/**
 * Verificar email verificado
 */
const requireVerifiedEmail = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Autenticación requerida',
      data: null
    });
  }
  
  if (!req.user.email_verificado) {
    return res.status(403).json({
      status: 'fail',
      message: 'Debes verificar tu email para acceder a esta funcionalidad',
      data: null
    });
  }
  
  next();
};

/**
 * Rate limiting para login (simplificado)
 */
const loginRateLimit = (req, res, next) => {
  // En producción esto debería usar Redis o una base de datos
  // Por ahora solo dejamos pasar
  next();
};

/**
 * Limpiar datos sensibles de la respuesta
 */
const sanitizeUserData = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data && data.data && data.data.user) {
      // Remover campos sensibles
      const user = { ...data.data.user };
      delete user.password_hash;
      delete user.token_verificacion;
      delete user.reset_password_token;
      delete user.reset_password_expires;
      delete user.intentos_login_fallidos;
      delete user.bloqueado_hasta;
      
      data.data.user = user;
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  authenticate,
  authenticateToken: authenticate, // Alias para compatibilidad
  optionalAuthenticate,
  requireAuth,
  verifyRefreshToken,
  requireActiveAccount,
  requireVerifiedEmail,
  loginRateLimit,
  sanitizeUserData
};
