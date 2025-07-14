/**
 * Rutas de Autenticación
 * Portal de Auditorías Técnicas
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware personalizado
const { asyncHandler } = require('../../shared/middleware/errorHandler');
const { operationLogger } = require('../../shared/middleware/requestLogger');

// Controlador y middleware de autenticación
const authController = require('./auth.controller');
const { 
  authenticate, 
  optionalAuthenticate, 
  requireAuth, 
  verifyRefreshToken,
  requireActiveAccount,
  requireVerifiedEmail,
  loginRateLimit,
  sanitizeUserData
} = require('./middleware/authentication');

const {
  requireAdmin,
  requireAuditor,
  canModifyUser,
  logSensitiveAction,
  checkMaintenanceMode
} = require('./middleware/authorization');

// Validaciones de entrada
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password debe tener al menos 6 caracteres')
];

const registerValidation = [
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

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual requerida'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nueva contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula y un número')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token requerido'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nueva contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula y un número')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Error de validación',
      errors: errors.array()
    });
  }
  next();
};

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// POST /api/auth/login - Iniciar sesión
router.post('/login', 
  checkMaintenanceMode,
  loginRateLimit,
  loginValidation,
  handleValidationErrors,
  operationLogger('user_login'),
  sanitizeUserData,
  authController.login
);

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register',
  checkMaintenanceMode,
  optionalAuthenticate, // Opcional para que admins puedan crear usuarios
  registerValidation,
  handleValidationErrors,
  operationLogger('user_register'),
  sanitizeUserData,
  authController.register
);

// POST /api/auth/refresh - Renovar token de acceso
router.post('/refresh',
  checkMaintenanceMode,
  body('refreshToken').notEmpty().withMessage('Refresh token requerido'),
  handleValidationErrors,
  verifyRefreshToken,
  operationLogger('token_refresh'),
  authController.refreshToken
);

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña
router.post('/forgot-password',
  checkMaintenanceMode,
  body('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
  handleValidationErrors,
  operationLogger('password_forgot'),
  authController.forgotPassword
);

// POST /api/auth/reset-password - Resetear contraseña
router.post('/reset-password',
  checkMaintenanceMode,
  resetPasswordValidation,
  handleValidationErrors,
  operationLogger('password_reset'),
  logSensitiveAction('password_reset'),
  authController.resetPassword
);

// POST /api/auth/verify-email - Verificar email
router.post('/verify-email',
  checkMaintenanceMode,
  body('token').notEmpty().withMessage('Token de verificación requerido'),
  handleValidationErrors,
  operationLogger('email_verification'),
  authController.verifyEmail
);

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile',
  authenticate,
  requireActiveAccount,
  operationLogger('get_profile'),
  sanitizeUserData,
  authController.getProfile
);

// PUT /api/auth/profile - Actualizar perfil del usuario autenticado
router.put('/profile',
  authenticate,
  requireActiveAccount,
  [
    body('nombres').optional().isLength({ min: 2, max: 100 }),
    body('apellidos').optional().isLength({ min: 2, max: 100 }),
    body('telefono').optional().matches(/^[\+]?[\d\s\-\(\)]{7,20}$/),
    body('avatar_url').optional().isURL(),
    body('configuracion').optional().isObject()
  ],
  handleValidationErrors,
  operationLogger('update_profile'),
  sanitizeUserData,
  authController.updateProfile
);

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password',
  authenticate,
  requireActiveAccount,
  changePasswordValidation,
  handleValidationErrors,
  operationLogger('change_password'),
  logSensitiveAction('password_change'),
  authController.changePassword
);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout',
  authenticate,
  operationLogger('user_logout'),
  authController.logout
);

// GET /api/auth/validate-token - Validar token actual
router.get('/validate-token',
  authenticate,
  requireActiveAccount,
  authController.validateToken
);

// GET /api/auth/sessions - Obtener sesiones activas
router.get('/sessions',
  authenticate,
  requireActiveAccount,
  operationLogger('get_sessions'),
  authController.getSessions
);

// DELETE /api/auth/sessions/:sessionId - Cerrar sesión específica
router.delete('/sessions/:sessionId',
  authenticate,
  requireActiveAccount,
  operationLogger('close_session'),
  logSensitiveAction('close_session'),
  authController.closeSession
);

// GET /api/auth/permissions - Obtener permisos del usuario
router.get('/permissions',
  authenticate,
  requireActiveAccount,
  operationLogger('get_permissions'),
  authController.getPermissions
);

// ========================================
// RUTAS ADMINISTRATIVAS
// ========================================

// POST /api/auth/admin/create-user - Crear usuario (solo admins)
router.post('/admin/create-user',
  authenticate,
  requireAdmin,
  registerValidation,
  handleValidationErrors,
  operationLogger('admin_create_user'),
  logSensitiveAction('create_user'),
  sanitizeUserData,
  authController.register
);

// ========================================
// RUTA DE INFORMACIÓN
// ========================================

// GET /api/auth - Información sobre endpoints de autenticación
router.get('/', (req, res) => {
  res.json({
    message: 'API de Autenticación - Portal de Auditorías Técnicas',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      public: {
        'POST /login': 'Iniciar sesión',
        'POST /register': 'Registrar usuario',
        'POST /refresh': 'Renovar token',
        'POST /forgot-password': 'Solicitar recuperación',
        'POST /reset-password': 'Resetear contraseña',
        'POST /verify-email': 'Verificar email'
      },
      protected: {
        'GET /profile': 'Obtener perfil',
        'PUT /profile': 'Actualizar perfil',
        'POST /change-password': 'Cambiar contraseña',
        'POST /logout': 'Cerrar sesión',
        'GET /validate-token': 'Validar token',
        'GET /sessions': 'Sesiones activas',
        'DELETE /sessions/:id': 'Cerrar sesión específica',
        'GET /permissions': 'Obtener permisos'
      },
      admin: {
        'POST /admin/create-user': 'Crear usuario (admins)'
      }
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
      token_expiration: process.env.JWT_EXPIRES_IN || '24h',
      refresh_token_expiration: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    security: {
      password_requirements: {
        min_length: 8,
        requires_uppercase: true,
        requires_lowercase: true,
        requires_number: true
      },
      rate_limiting: {
        login_attempts: '5 per 15 minutes per IP',
        general_requests: 'Configured via environment'
      }
    }
  });
});

module.exports = router;
