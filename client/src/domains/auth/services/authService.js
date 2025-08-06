// authService.js - Servicio de autenticación unificado
// Portal de Auditorías Técnicas

import apiClient from '../../shared/services/apiClient';

/**
 * Servicio de autenticación que utiliza el apiClient unificado
 * Todas las operaciones de auth pasan por aquí para mantener consistencia
 */
class AuthService {
  
  /**
   * Iniciar sesión
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Resultado del login
   */
  async login(email, password) {
    try {
      console.log('🔐 Intentando login:', email);
      
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      if (response.data.status === 'success') {
        const { user, accessToken } = response.data.data;
        
        // Guardar token en localStorage
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        console.log('✅ Login exitoso:', user.email);
        
        return {
          success: true,
          user,
          token: accessToken,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Error de autenticación');
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Limpiar datos si el login falla
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error de conexión'
      };
    }
  }

  /**
   * Verificar token actual
   * @returns {Promise<Object>} Resultado de la verificación
   */
  async verifyToken() {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return { success: false, error: 'No hay token' };
      }
      
      console.log('🔍 Verificando token...');
      
      const response = await apiClient.get('/auth/validate-token');
      
      if (response.data.status === 'success') {
        const user = response.data.data.user;
        
        // Actualizar datos del usuario en localStorage
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        console.log('✅ Token válido para:', user.email);
        
        return {
          success: true,
          user,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Token inválido');
      }
      
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      
      // Limpiar datos si la verificación falla
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Cerrar sesión
   * @returns {Promise<Object>} Resultado del logout
   */
  async logout() {
    try {
      console.log('👋 Cerrando sesión...');
      
      // Intentar notificar al servidor (opcional)
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        console.warn('No se pudo notificar logout al servidor:', error.message);
      }
      
      // Limpiar datos locales
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      console.log('✅ Sesión cerrada localmente');
      
      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en logout:', error);
      
      // Aunque haya error, limpiar datos locales
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      return {
        success: true,
        message: 'Sesión cerrada (con errores menores)'
      };
    }
  }

  /**
   * Obtener usuario desde localStorage
   * @returns {Object|null} Usuario guardado
   */
  getStoredUser() {
    try {
      const userStr = localStorage.getItem('auth_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error obteniendo usuario de localStorage:', error);
      return null;
    }
  }

  /**
   * Obtener token desde localStorage
   * @returns {string|null} Token guardado
   */
  getStoredToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean} Estado de autenticación
   */
  isAuthenticated() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }
}

// Exportar instancia singleton
const authService = new AuthService();
export default authService;