/**
 * Middleware de Autenticación
 * Portal de Auditorías Técnicas
 */

const authService = require('../auth.service');
const { getModels } = require('../../../models');

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
    
    // Obtener información actualizada del usuario
    const { Usuario } = await getModels();
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        status: 'fail',
        message: 'Usuario no encontrado',
        data: null
      });
    }
    
    // Verificar estado del usuario
    if (usuario.estado !== 'ACTIVO') {
      return res.status(401).json({
        status: 'fail',
        message: 'Cuenta no activa',
        data: null
      });
    }
    
    // Verificar email verificado
    if (!usuario.email_verificado) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email no verificado',
        data: null
      });
    }
    
    // Verificar si la cuenta está bloqueada
    if (usuario.estaBloqueado()) {
      return res.status(401).json({
        status: 'fail',
        message: 'Cuenta temporalmente bloqueada',
        data: null
      });
    }
    
    // Agregar usuario a la request
    req.user = {
      id: usuario.id,
      email: usuario.email,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
      estado: usuario.estado,
      email_verificado: usuario.email_verificado
    };
    
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
 * Es un alias de authenticate ya que este ya hace todas las verificaciones necesarias
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
 * Rate limiting para login
 */
const loginRateLimit = (() => {
  const intentos = new Map();
  const maxIntentos = 5;
  const ventanaTiempo = 15 * 60 * 1000; // 15 minutos
  
  return (req, res, next) => {
    const ip = req.ip;
    const ahora = Date.now();
    
    if (!intentos.has(ip)) {
      intentos.set(ip, { count: 1, firstAttempt: ahora });
      return next();
    }
    
    const data = intentos.get(ip);
    
    // Reset si ha pasado la ventana de tiempo
    if (ahora - data.firstAttempt > ventanaTiempo) {
      intentos.set(ip, { count: 1, firstAttempt: ahora });
      return next();
    }
    
    // Incrementar contador
    data.count++;
    
    if (data.count > maxIntentos) {
      const tiempoRestante = Math.ceil((ventanaTiempo - (ahora - data.firstAttempt)) / (1000 * 60));
      
      return res.status(429).json({
        status: 'fail',
        message: `Demasiados intentos de login. Intenta nuevamente en ${tiempoRestante} minutos`,
        data: null
      });
    }
    
    next();
  };
})();

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
