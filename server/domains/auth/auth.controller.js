/**
 * Controlador de Autenticación
 * Portal de Auditorías Técnicas
 */

const authService = require('./auth.service');
const { asyncHandler } = require('../../shared/middleware/errorHandler');

class AuthController {

  /**
   * POST /api/auth/login
   * Iniciar sesión de usuario
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validar datos requeridos
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email y contraseña son requeridos',
        data: null
      });
    }

    const resultado = await authService.login(email, password);

    if (resultado.success) {
      // Login exitoso
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      // Login fallido
      res.status(401).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * POST /api/auth/register
   * Registrar nuevo usuario
   */
  register = asyncHandler(async (req, res) => {
    const { email, password, nombres, apellidos, documento, telefono, rol } = req.body;

    // Validar datos requeridos
    if (!email || !password || !nombres || !apellidos || !documento) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email, contraseña, nombres, apellidos y documento son requeridos',
        data: null
      });
    }

    // Solo admins pueden crear usuarios con roles especiales
    let rolAsignado = 'PROVEEDOR'; // Por defecto
    
    if (req.user && req.user.rol === 'ADMIN') {
      rolAsignado = rol || 'PROVEEDOR';
    } else if (rol && rol !== 'PROVEEDOR') {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permisos para crear usuarios con ese rol',
        data: null
      });
    }

    const userData = {
      email,
      password,
      nombres,
      apellidos,
      documento,
      telefono,
      rol: rolAsignado,
      creado_por: req.user ? req.user.id : null
    };

    const resultado = await authService.register(userData);

    if (resultado.success) {
      res.status(201).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      const statusCode = resultado.errors ? 400 : 409; // 400 para validación, 409 para conflicto
      res.status(statusCode).json({
        status: 'fail',
        message: resultado.message,
        errors: resultado.errors || null,
        data: null
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Renovar token de acceso
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Refresh token requerido',
        data: null
      });
    }

    const resultado = await authService.refreshToken(refreshToken);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      res.status(401).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * POST /api/auth/verify-email
   * Verificar email de usuario
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token de verificación requerido',
        data: null
      });
    }

    const resultado = await authService.verifyEmail(token);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      res.status(400).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * POST /api/auth/forgot-password
   * Solicitar recuperación de contraseña
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email requerido',
        data: null
      });
    }

    const resultado = await authService.forgotPassword(email);

    // Siempre responder con éxito por seguridad
    res.status(200).json({
      status: 'success',
      message: resultado.message,
      data: null
    });
  });

  /**
   * POST /api/auth/reset-password
   * Resetear contraseña con token
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token y nueva contraseña son requeridos',
        data: null
      });
    }

    const resultado = await authService.resetPassword(token, newPassword);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: null
      });
    } else {
      res.status(400).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * GET /api/auth/profile
   * Obtener perfil del usuario autenticado
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const resultado = await authService.getProfile(userId);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      res.status(404).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * PUT /api/auth/profile
   * Actualizar perfil del usuario autenticado
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;

    const resultado = await authService.updateProfile(userId, updateData);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      res.status(400).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña del usuario autenticado
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Contraseña actual y nueva contraseña son requeridas',
        data: null
      });
    }

    const resultado = await authService.changePassword(userId, currentPassword, newPassword);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: null
      });
    } else {
      res.status(400).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Cerrar sesión (invalidar token)
   */
  logout = asyncHandler(async (req, res) => {
    // En una implementación completa, aquí se invalidaría el token
    // Por ahora, simplemente confirmamos el logout
    
    res.status(200).json({
      status: 'success',
      message: 'Sesión cerrada exitosamente',
      data: null
    });
  });

  /**
   * GET /api/auth/validate-token
   * Validar token de acceso
   */
  validateToken = asyncHandler(async (req, res) => {
    // Si llegamos aquí, el token ya fue validado por el middleware
    res.status(200).json({
      status: 'success',
      message: 'Token válido',
      data: {
        user: req.user,
        token_valid: true
      }
    });
  });

  /**
   * GET /api/auth/sessions
   * Obtener sesiones activas del usuario
   */
  getSessions = asyncHandler(async (req, res) => {
    // Por ahora retornamos información básica
    // En una implementación completa, esto consultaría una tabla de sesiones
    
    res.status(200).json({
      status: 'success',
      message: 'Sesiones obtenidas exitosamente',
      data: {
        current_session: {
          user_id: req.user.id,
          logged_in_at: new Date(),
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        },
        active_sessions: [
          {
            session_id: 'current',
            device: 'Navegador Web',
            ip_address: req.ip,
            last_activity: new Date(),
            is_current: true
          }
        ]
      }
    });
  });

  /**
   * DELETE /api/auth/sessions/:sessionId
   * Cerrar sesión específica
   */
  closeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    // En una implementación completa, esto invalidaría la sesión específica
    
    res.status(200).json({
      status: 'success',
      message: `Sesión ${sessionId} cerrada exitosamente`,
      data: null
    });
  });

  /**
   * GET /api/auth/permissions
   * Obtener permisos del usuario autenticado
   */
  getPermissions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Definir permisos por rol
    const permisosPorRol = {
      'ADMIN': [
        'usuarios.*', 'auditorias.*', 'proveedores.*', 
        'dashboards.*', 'reportes.*', 'configuracion.*'
      ],
      'SUPERVISOR': [
        'auditorias.crear', 'auditorias.editar', 'auditorias.ver',
        'usuarios.ver', 'usuarios.editar',
        'reportes.generar', 'reportes.ver',
        'dashboards.ver'
      ],
      'AUDITOR': [
        'auditorias.crear', 'auditorias.editar', 'auditorias.ver',
        'documentos.subir', 'documentos.validar',
        'etl.procesar', 'etl.validar',
        'ia.analizar', 'reportes.ver'
      ],
      'PROVEEDOR': [
        'auditorias.ver_propias', 'documentos.subir_propios',
        'etl.subir_parque', 'chat.participar',
        'perfil.editar'
      ]
    };

    const permisos = permisosPorRol[req.user.rol] || [];

    res.status(200).json({
      status: 'success',
      message: 'Permisos obtenidos exitosamente',
      data: {
        user_role: req.user.rol,
        permissions: permisos,
        has_admin_access: req.user.rol === 'ADMIN',
        is_auditor: ['AUDITOR', 'SUPERVISOR', 'ADMIN'].includes(req.user.rol),
        is_provider: req.user.rol === 'PROVEEDOR'
      }
    });
  });
}

module.exports = new AuthController();
