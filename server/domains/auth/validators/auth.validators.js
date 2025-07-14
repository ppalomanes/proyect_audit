/**
 * Validadores de Autenticación
 * Portal de Auditorías Técnicas
 */

const { body, param, query } = require('express-validator');

/**
 * Validaciones para login
 */
const loginValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password es requerido')
];

/**
 * Validaciones para registro
 */
const registerValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password debe tener al menos 8 caracteres, una minúscula, una mayúscula y un número'),
  body('nombres')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombres debe contener solo letras y espacios'),
  body('apellidos')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellidos debe contener solo letras y espacios'),
  body('documento')
    .isLength({ min: 5, max: 50 })
    .matches(/^[0-9a-zA-Z\-]+$/)
    .withMessage('Documento debe ser alfanumérico'),
  body('telefono')
    .optional()
    .matches(/^[\+]?[\d\s\-\(\)]{7,20}$/)
    .withMessage('Formato de teléfono inválido'),
  body('rol')
    .optional()
    .isIn(['ADMIN', 'AUDITOR', 'SUPERVISOR', 'PROVEEDOR'])
    .withMessage('Rol inválido')
];

/**
 * Validaciones para cambio de contraseña
 */
const changePasswordValidators = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual requerida'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nueva contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula y un número')
];

/**
 * Validaciones para reset de contraseña
 */
const resetPasswordValidators = [
  body('token')
    .notEmpty()
    .withMessage('Token requerido'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nueva contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula y un número')
];

/**
 * Validaciones para solicitud de recuperación de contraseña
 */
const forgotPasswordValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email válido requerido')
];

/**
 * Validaciones para verificación de email
 */
const verifyEmailValidators = [
  body('token')
    .notEmpty()
    .withMessage('Token de verificación requerido')
];

/**
 * Validaciones para refresh token
 */
const refreshTokenValidators = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido')
];

/**
 * Validaciones para actualización de perfil
 */
const updateProfileValidators = [
  body('nombres')
    .optional()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombres debe contener solo letras y espacios'),
  body('apellidos')
    .optional()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellidos debe contener solo letras y espacios'),
  body('telefono')
    .optional()
    .matches(/^[\+]?[\d\s\-\(\)]{7,20}$/)
    .withMessage('Formato de teléfono inválido'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('URL de avatar inválida'),
  body('configuracion')
    .optional()
    .isObject()
    .withMessage('Configuración debe ser un objeto JSON válido')
];

/**
 * Validaciones para parámetros de URL
 */
const userIdParamValidator = [
  param('userId')
    .isUUID()
    .withMessage('ID de usuario debe ser un UUID válido')
];

const sessionIdParamValidator = [
  param('sessionId')
    .notEmpty()
    .withMessage('ID de sesión requerido')
];

/**
 * Validaciones para queries de búsqueda
 */
const searchUsersValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),
  query('rol')
    .optional()
    .isIn(['ADMIN', 'AUDITOR', 'SUPERVISOR', 'PROVEEDOR'])
    .withMessage('Rol inválido'),
  query('estado')
    .optional()
    .isIn(['ACTIVO', 'INACTIVO', 'BLOQUEADO', 'PENDIENTE_VERIFICACION'])
    .withMessage('Estado inválido'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Término de búsqueda debe tener entre 2 y 100 caracteres')
];

/**
 * Validaciones personalizada para contraseña segura
 */
const passwordComplexityValidator = (value) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumbers = /\d/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
  if (value.length < minLength) {
    throw new Error(`Contraseña debe tener al menos ${minLength} caracteres`);
  }
  
  if (!hasUpperCase) {
    throw new Error('Contraseña debe tener al menos una letra mayúscula');
  }
  
  if (!hasLowerCase) {
    throw new Error('Contraseña debe tener al menos una letra minúscula');
  }
  
  if (!hasNumbers) {
    throw new Error('Contraseña debe tener al menos un número');
  }
  
  // Opcional: requerir caracteres especiales en producción
  if (process.env.NODE_ENV === 'production' && !hasSpecialChar) {
    throw new Error('Contraseña debe tener al menos un caracter especial (!@#$%^&*(),.?":{}|<>)');
  }
  
  return true;
};

/**
 * Validación personalizada para email corporativo
 */
const corporateEmailValidator = (value) => {
  // Dominios permitidos para emails corporativos
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS ? 
    process.env.ALLOWED_EMAIL_DOMAINS.split(',') : 
    [];
    
  if (allowedDomains.length === 0) {
    return true; // No hay restricciones
  }
  
  const emailDomain = value.split('@')[1];
  
  if (!allowedDomains.includes(emailDomain)) {
    throw new Error(`Email debe ser de un dominio autorizado: ${allowedDomains.join(', ')}`);
  }
  
  return true;
};

/**
 * Validación personalizada para documento de identidad colombiano
 */
const colombianDocumentValidator = (value) => {
  // Remover espacios y guiones
  const cleanDoc = value.replace(/[\s\-]/g, '');
  
  // Validar longitud
  if (cleanDoc.length < 6 || cleanDoc.length > 12) {
    throw new Error('Documento debe tener entre 6 y 12 dígitos');
  }
  
  // Validar que sea solo números para cédulas
  if (!/^\d+$/.test(cleanDoc)) {
    throw new Error('Documento debe contener solo números');
  }
  
  return true;
};

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Error de validación',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Sanitizadores
 */
const sanitizeUserInput = [
  body('email').normalizeEmail(),
  body('nombres').trim().escape(),
  body('apellidos').trim().escape(),
  body('documento').trim(),
  body('telefono').optional().trim()
];

module.exports = {
  // Validadores básicos
  loginValidators,
  registerValidators,
  changePasswordValidators,
  resetPasswordValidators,
  forgotPasswordValidators,
  verifyEmailValidators,
  refreshTokenValidators,
  updateProfileValidators,
  
  // Validadores de parámetros
  userIdParamValidator,
  sessionIdParamValidator,
  
  // Validadores de queries
  searchUsersValidators,
  
  // Validadores personalizados
  passwordComplexityValidator,
  corporateEmailValidator,
  colombianDocumentValidator,
  
  // Middleware
  handleValidationErrors,
  sanitizeUserInput
};
