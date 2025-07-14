/**
 * Servicio de Autenticación
 * Portal de Auditorías Técnicas
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getModels } = require('../../models');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-please';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.maxLoginAttempts = 5;
    this.lockoutTime = 30 * 60 * 1000; // 30 minutos
  }

  /**
   * Generar token JWT
   */
  generateToken(user, type = 'access') {
    const payload = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombres: user.nombres,
      apellidos: user.apellidos,
      type: type
    };

    const expiresIn = type === 'refresh' ? this.jwtRefreshExpiresIn : this.jwtExpiresIn;

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn,
      issuer: 'portal-auditorias',
      subject: user.id
    });
  }

  /**
   * Verificar y decodificar token JWT
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token no válido aún');
      } else {
        throw new Error('Error verificando token');
      }
    }
  }

  /**
   * Login de usuario
   */
  async login(email, password) {
    const { Usuario } = await getModels();

    try {
      // Buscar usuario por email
      const usuario = await Usuario.findOne({
        where: { 
          email: email.toLowerCase().trim()
        }
      });

      if (!usuario) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar si la cuenta está bloqueada
      if (usuario.estaBloqueado()) {
        const tiempoRestante = Math.ceil((usuario.bloqueado_hasta - new Date()) / (1000 * 60));
        throw new Error(`Cuenta bloqueada. Intenta nuevamente en ${tiempoRestante} minutos`);
      }

      // Verificar estado de la cuenta
      if (usuario.estado !== 'ACTIVO') {
        let mensaje = 'Cuenta no disponible';
        switch (usuario.estado) {
          case 'INACTIVO':
            mensaje = 'Cuenta inactiva. Contacta al administrador';
            break;
          case 'BLOQUEADO':
            mensaje = 'Cuenta bloqueada. Contacta al administrador';
            break;
          case 'PENDIENTE_VERIFICACION':
            mensaje = 'Cuenta pendiente de verificación. Revisa tu email';
            break;
        }
        throw new Error(mensaje);
      }

      // Verificar contraseña
      const passwordValida = await usuario.verificarPassword(password);
      
      if (!passwordValida) {
        // Incrementar intentos fallidos
        await usuario.incrementarIntentosLogin();
        throw new Error('Credenciales inválidas');
      }

      // Verificar email verificado
      if (!usuario.email_verificado) {
        throw new Error('Debes verificar tu email antes de iniciar sesión');
      }

      // Login exitoso - resetear intentos fallidos
      await usuario.resetearIntentosLogin();

      // Generar tokens
      const accessToken = this.generateToken(usuario, 'access');
      const refreshToken = this.generateToken(usuario, 'refresh');

      // Datos del usuario para respuesta (sin campos sensibles)
      const userData = {
        id: usuario.id,
        email: usuario.email,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        documento: usuario.documento,
        telefono: usuario.telefono,
        rol: usuario.rol,
        estado: usuario.estado,
        avatar_url: usuario.avatar_url,
        configuracion: usuario.configuracion,
        ultimo_login: usuario.ultimo_login,
        creado_en: usuario.creado_en
      };

      return {
        success: true,
        message: 'Login exitoso',
        data: {
          user: userData,
          token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: this.jwtExpiresIn
        }
      };

    } catch (error) {
      console.error('Error en login:', error.message);
      
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(userData) {
    const { Usuario } = await getModels();

    try {
      // Verificar si el email ya existe
      const emailExiste = await Usuario.findOne({
        where: { email: userData.email.toLowerCase().trim() }
      });

      if (emailExiste) {
        throw new Error('El email ya está registrado');
      }

      // Verificar si el documento ya existe
      const documentoExiste = await Usuario.findOne({
        where: { documento: userData.documento }
      });

      if (documentoExiste) {
        throw new Error('El documento ya está registrado');
      }

      // Generar token de verificación
      const tokenVerificacion = crypto.randomBytes(32).toString('hex');

      // Crear nuevo usuario
      const nuevoUsuario = await Usuario.create({
        email: userData.email.toLowerCase().trim(),
        password_hash: userData.password, // Se encripta automáticamente en el hook
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        documento: userData.documento,
        telefono: userData.telefono || null,
        rol: userData.rol || 'PROVEEDOR',
        estado: 'PENDIENTE_VERIFICACION',
        email_verificado: false,
        token_verificacion: tokenVerificacion,
        configuracion: {
          notificaciones_email: true,
          notificaciones_web: true,
          idioma: 'es',
          zona_horaria: 'America/Bogota'
        },
        creado_por: userData.creado_por || null
      });

      // Datos del usuario para respuesta (sin campos sensibles)
      const userResponse = {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombres: nuevoUsuario.nombres,
        apellidos: nuevoUsuario.apellidos,
        documento: nuevoUsuario.documento,
        telefono: nuevoUsuario.telefono,
        rol: nuevoUsuario.rol,
        estado: nuevoUsuario.estado,
        email_verificado: nuevoUsuario.email_verificado,
        creado_en: nuevoUsuario.creado_en
      };

      return {
        success: true,
        message: 'Usuario registrado exitosamente. Revisa tu email para verificar la cuenta',
        data: {
          user: userResponse,
          verification_token: tokenVerificacion // Para testing/debugging
        }
      };

    } catch (error) {
      console.error('Error en registro:', error.message);
      
      // Manejar errores específicos de Sequelize
      if (error.name === 'SequelizeValidationError') {
        const errores = error.errors.map(err => err.message);
        return {
          success: false,
          message: 'Error de validación',
          errors: errores,
          data: null
        };
      }

      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Renovar token de acceso usando refresh token
   */
  async refreshToken(refreshToken) {
    const { Usuario } = await getModels();

    try {
      // Verificar refresh token
      const decoded = this.verifyToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new Error('Token de refresh inválido');
      }

      // Buscar usuario
      const usuario = await Usuario.findByPk(decoded.id);

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar estado del usuario
      if (usuario.estado !== 'ACTIVO' || !usuario.email_verificado) {
        throw new Error('Usuario no autorizado');
      }

      // Generar nuevo access token
      const newAccessToken = this.generateToken(usuario, 'access');

      return {
        success: true,
        message: 'Token renovado exitosamente',
        data: {
          access_token: newAccessToken,
          token_type: 'Bearer',
          expires_in: this.jwtExpiresIn
        }
      };

    } catch (error) {
      console.error('Error renovando token:', error.message);
      
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Verificar email de usuario
   */
  async verifyEmail(token) {
    const { Usuario } = await getModels();

    try {
      const usuario = await Usuario.findOne({
        where: { token_verificacion: token }
      });

      if (!usuario) {
        throw new Error('Token de verificación inválido o expirado');
      }

      if (usuario.email_verificado) {
        throw new Error('El email ya ha sido verificado');
      }

      // Marcar email como verificado
      await usuario.update({
        email_verificado: true,
        email_verificado_en: new Date(),
        estado: 'ACTIVO',
        token_verificacion: null
      });

      return {
        success: true,
        message: 'Email verificado exitosamente. Ya puedes iniciar sesión',
        data: {
          email: usuario.email,
          verified_at: usuario.email_verificado_en
        }
      };

    } catch (error) {
      console.error('Error verificando email:', error.message);
      
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(email) {
    const { Usuario } = await getModels();

    try {
      const usuario = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      if (!usuario) {
        // Por seguridad, no revelamos si el email existe o no
        return {
          success: true,
          message: 'Si el email existe, se enviará un enlace de recuperación',
          data: null
        };
      }

      // Generar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await usuario.update({
        reset_password_token: resetToken,
        reset_password_expires: resetExpires
      });

      return {
        success: true,
        message: 'Si el email existe, se enviará un enlace de recuperación',
        data: {
          reset_token: resetToken, // Para testing/debugging
          expires_at: resetExpires
        }
      };

    } catch (error) {
      console.error('Error en forgot password:', error.message);
      
      return {
        success: false,
        message: 'Error procesando solicitud',
        data: null
      };
    }
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(token, newPassword) {
    const { Usuario } = await getModels();

    try {
      const usuario = await Usuario.findOne({
        where: {
          reset_password_token: token,
          reset_password_expires: {
            [require('sequelize').Op.gt]: new Date()
          }
        }
      });

      if (!usuario) {
        throw new Error('Token de reset inválido o expirado');
      }

      // Actualizar contraseña
      await usuario.update({
        password_hash: newPassword, // Se encripta automáticamente en el hook
        reset_password_token: null,
        reset_password_expires: null,
        intentos_login_fallidos: 0,
        bloqueado_hasta: null
      });

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: null
      };

    } catch (error) {
      console.error('Error reseteando contraseña:', error.message);
      
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const { Usuario } = await getModels();

    try {
      const usuario = await Usuario.findByPk(userId);

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const passwordValida = await usuario.verificarPassword(currentPassword);
      
      if (!passwordValida) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Actualizar contraseña
      await usuario.update({
        password_hash: newPassword // Se encripta automáticamente en el hook
      });

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: null
      };

    } catch (error) {
      console.error('Error cambiando contraseña:', error.message);
      
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Obtener perfil de usuario
   */
  async getProfile(userId) {
    const { Usuario } = await getModels();

    try {
      const usuario = await Usuario.scope('publico').findByPk(userId);

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return {
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: {
          user: usuario
        }
      };

    } catch (error) {
      console.error('Error obteniendo perfil:', error.message);
      
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId, updateData) {
    const { Usuario } = await getModels();

    try {
      const usuario = await Usuario.findByPk(userId);

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Campos permitidos para actualización
      const camposPermitidos = ['nombres', 'apellidos', 'telefono', 'avatar_url', 'configuracion'];
      const datosActualizacion = {};

      for (const campo of camposPermitidos) {
        if (updateData[campo] !== undefined) {
          datosActualizacion[campo] = updateData[campo];
        }
      }

      await usuario.update(datosActualizacion);

      // Obtener usuario actualizado sin campos sensibles
      const usuarioActualizado = await Usuario.scope('publico').findByPk(userId);

      return {
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          user: usuarioActualizado
        }
      };

    } catch (error) {
      console.error('Error actualizando perfil:', error.message);
      
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Validar permisos de usuario
   */
  async validatePermission(userId, permission) {
    const { Usuario } = await getModels();

    try {
      const usuario = await Usuario.findByPk(userId);

      if (!usuario) {
        return false;
      }

      return usuario.tienePermiso(permission);

    } catch (error) {
      console.error('Error validando permiso:', error.message);
      return false;
    }
  }
}

module.exports = new AuthService();
