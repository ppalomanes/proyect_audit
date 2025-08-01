/**
 * Middleware de Autenticación Simple para Chat Real
 * Portal de Auditorías Técnicas
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware simple de autenticación JWT para chat
 */
const authenticateSimple = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer '
    const jwtSecret = process.env.JWT_SECRET || 'portal_auditorias_super_secret_key_2025';
    
    // Verificar token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Agregar información básica del usuario a la request
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      nombre: decoded.nombre || decoded.nombres,
      rol: decoded.rol
    };
    
    next();
    
  } catch (error) {
    console.error('Error en autenticación simple:', error.message);
    
    let mensaje = 'Token inválido';
    
    if (error.name === 'TokenExpiredError') {
      mensaje = 'Token expirado. Inicia sesión nuevamente';
    } else if (error.name === 'JsonWebTokenError') {
      mensaje = 'Token inválido';
    }
    
    return res.status(401).json({
      success: false,
      message: mensaje
    });
  }
};

module.exports = authenticateSimple;