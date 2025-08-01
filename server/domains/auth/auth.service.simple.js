/**
 * Servicio de Autenticación Simplificado
 * Portal de Auditorías Técnicas
 */

const jwt = require('jsonwebtoken');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-please';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Generar token JWT
   */
  generateToken(user, type = 'access') {
    const payload = {
      id: user.id || user.user_id || 'demo_user',
      email: user.email || 'demo@example.com',
      rol: user.rol || 'ADMIN',
      nombres: user.nombres || 'Usuario',
      apellidos: user.apellidos || 'Demo',
      type: type
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'portal-auditorias'
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
      } else {
        throw new Error('Error verificando token');
      }
    }
  }

  /**
   * Login simplificado - devuelve usuario demo
   */
  async login(email, password) {
    try {
      // Simulación de usuario demo para testing
      const demoUser = {
        id: 'demo_admin_001',
        email: email,
        nombres: 'Administrador',
        apellidos: 'Sistema',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        email_verificado: true
      };

      // Generar tokens
      const accessToken = this.generateToken(demoUser, 'access');
      const refreshToken = this.generateToken(demoUser, 'refresh');

      return {
        success: true,
        message: 'Login exitoso',
        data: {
          user: demoUser,
          accessToken,
          refreshToken,
          expiresIn: this.jwtExpiresIn
        }
      };

    } catch (error) {
      console.error('Error en login:', error.message);
      return {
        success: false,
        message: 'Error en autenticación',
        data: null
      };
    }
  }

  /**
   * Validar token (para endpoint /validate)
   */
  async validateToken(token) {
    try {
      const decoded = this.verifyToken(token);
      
      return {
        success: true,
        message: 'Token válido',
        data: {
          user: {
            id: decoded.id,
            email: decoded.email,
            nombres: decoded.nombres,
            apellidos: decoded.apellidos,
            rol: decoded.rol
          },
          token_valid: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token inválido',
        data: null
      };
    }
  }

  /**
   * Logout simplificado
   */
  async logout() {
    return {
      success: true,
      message: 'Logout exitoso',
      data: null
    };
  }

  /**
   * Refresh token simplificado
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Token de refresh inválido');
      }

      const user = {
        id: decoded.id,
        email: decoded.email,
        nombres: decoded.nombres,
        apellidos: decoded.apellidos,
        rol: decoded.rol
      };

      const newAccessToken = this.generateToken(user, 'access');

      return {
        success: true,
        message: 'Token renovado exitosamente',
        data: {
          accessToken: newAccessToken,
          expiresIn: this.jwtExpiresIn
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error renovando token',
        data: null
      };
    }
  }

  /**
   * Registro simplificado
   */
  async register(userData) {
    try {
      // Simulación de registro exitoso
      const newUser = {
        id: `user_${Date.now()}`,
        email: userData.email,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        rol: userData.rol || 'PROVEEDOR',
        estado: 'ACTIVO',
        email_verificado: true
      };

      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: newUser
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error en registro',
        data: null
      };
    }
  }

  /**
   * Obtener perfil de usuario
   */
  async getProfile(userId) {
    try {
      // Simulación de perfil de usuario
      const userProfile = {
        id: userId,
        email: 'admin@portal-auditorias.com',
        nombres: 'Administrador',
        apellidos: 'Sistema',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        email_verificado: true,
        creado_en: new Date().toISOString(),
        ultima_conexion: new Date().toISOString()
      };

      return {
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: {
          user: userProfile
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error obteniendo perfil',
        data: null
      };
    }
  }

  /**
   * Actualizar perfil
   */
  async updateProfile(userId, updateData) {
    try {
      return {
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          user: {
            id: userId,
            ...updateData,
            actualizado_en: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error actualizando perfil',
        data: null
      };
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      return {
        success: true,
        message: 'Contraseña cambiada exitosamente',
        data: null
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error cambiando contraseña',
        data: null
      };
    }
  }

  /**
   * Recuperar contraseña
   */
  async forgotPassword(email) {
    return {
      success: true,
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
      data: null
    };
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(token, newPassword) {
    try {
      return {
        success: true,
        message: 'Contraseña reseteada exitosamente',
        data: null
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token inválido o expirado',
        data: null
      };
    }
  }

  /**
   * Verificar email
   */
  async verifyEmail(token) {
    try {
      return {
        success: true,
        message: 'Email verificado exitosamente',
        data: null
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token de verificación inválido',
        data: null
      };
    }
  }
}

module.exports = new AuthService();
