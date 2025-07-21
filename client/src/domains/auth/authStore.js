import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Configurar axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Variable para evitar loops de logout
let isLoggingOut = false;

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación (CORREGIDO)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo hacer logout automático en errores 401 reales, no en otros errores
    if (error.response?.status === 401 && !isLoggingOut) {
      console.log('🔒 Token inválido, haciendo logout automático');
      isLoggingOut = true;
      
      // Dar tiempo para que termine la operación actual
      setTimeout(() => {
        const authStore = useAuthStore.getState();
        authStore.logout();
        window.location.href = '/login';
        isLoggingOut = false;
      }, 100);
    }
    return Promise.reject(error);
  }
);

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      lastActivity: null,

      // Acciones de autenticación
      login: async (email, password, rememberMe = false) => {
        try {
          set({ loading: true, error: null });
          
          console.log('🔐 Iniciando login para:', email);
          
          const response = await api.post('/auth/login', {
            email,
            password,
            remember_me: rememberMe
          });

          const { token, refresh_token, user } = response.data.data;
          
          console.log('✅ Login exitoso, guardando datos...');
          
          // Configurar persistencia basada en "recordarme"
          if (rememberMe) {
            localStorage.setItem('token', token);
            localStorage.setItem('refresh_token', refresh_token || '');
            localStorage.setItem('user', JSON.stringify(user));
          } else {
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('refresh_token', refresh_token || '');
            sessionStorage.setItem('user', JSON.stringify(user));
          }
          
          set({
            user,
            token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            loading: false,
            error: null,
            lastActivity: Date.now()
          });

          console.log('✅ Estado actualizado, login completo');
          return { success: true };
          
        } catch (error) {
          console.error('❌ Error en login:', error);
          const errorMessage = error.response?.data?.message || 'Error de autenticación';
          set({
            loading: false,
            error: errorMessage,
            isAuthenticated: false
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        try {
          set({ loading: true, error: null });
          
          const response = await api.post('/auth/register', userData);

          // Si el registro incluye auto-login
          if (response.data.data && response.data.data.token) {
            const { token, refresh_token, user } = response.data.data;
            
            // Guardar datos del usuario registrado
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('refresh_token', refresh_token || '');
            sessionStorage.setItem('user', JSON.stringify(user));
            
            set({
              user,
              token,
              refreshToken: refresh_token,
              isAuthenticated: true,
              loading: false,
              error: null,
              lastActivity: Date.now()
            });
            
            return { success: true };
          }

          // Si solo fue registro sin auto-login
          set({ loading: false });
          return { success: true };
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Error en el registro';
          set({
            loading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          console.log('👋 Iniciando logout...');
          
          if (isLoggingOut) {
            console.log('⚠️ Logout ya en progreso, saltando...');
            return;
          }
          
          isLoggingOut = true;
          
          const { token } = get();
          if (token) {
            // Intentar logout en el servidor (sin esperar respuesta)
            api.post('/auth/logout').catch(() => {
              // Ignorar errores del servidor en logout
            });
          }
        } catch (error) {
          console.warn('Error during server logout:', error);
        } finally {
          // Limpiar storage
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('user');
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
            lastActivity: null
          });
          
          console.log('✅ Logout completo');
          isLoggingOut = false;
        }
      },

      // Gestión de perfil
      updateProfile: async (profileData) => {
        try {
          set({ loading: true, error: null });

          const response = await api.put('/auth/profile', profileData);
          const updatedUser = response.data.data;

          // Actualizar usuario en storage
          const isRemembered = localStorage.getItem('user');
          if (isRemembered) {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else {
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
          }

          set({
            user: updatedUser,
            loading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Error actualizando perfil';
          set({
            loading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          set({ loading: true, error: null });

          await api.put('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword
          });

          set({
            loading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Error cambiando contraseña';
          set({
            loading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      // Verificación de sesión (SIMPLIFICADA)
      checkAuth: async () => {
        try {
          const { token } = get();
          if (!token) {
            return { success: false };
          }

          const response = await api.get('/auth/me');
          const user = response.data.data;

          set({
            user,
            isAuthenticated: true,
            lastActivity: Date.now()
          });

          console.log('✅ Verificación de auth exitosa');
          return { success: true };
        } catch (error) {
          console.log('⚠️ Verificación de auth falló (sin logout automático)');
          // NO hacer logout automático aquí
          return { success: false };
        }
      },

      // Inicializar usuario desde storage (SIMPLIFICADO)
      initializeAuth: () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        console.log('🔄 Inicializando auth...', { hasToken: !!token, hasUser: !!userData });
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              lastActivity: Date.now()
            });

            console.log('✅ Auth inicializado desde storage');
            
            // NO verificar con el servidor automáticamente
            // get().checkAuth();
          } catch (error) {
            console.error('Error parsing user data:', error);
            // Limpiar datos corruptos
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refresh_token');
            sessionStorage.removeItem('user');
          }
        } else {
          console.log('ℹ️ No hay datos de auth guardados');
        }
      },

      // Utilidades
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      clearError: () => set({ error: null }),

      // Verificar roles y permisos
      hasRole: (role) => {
        const { user } = get();
        return user?.rol === role;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.rol);
      },

      isAdmin: () => {
        return get().hasRole('ADMIN');
      },

      isAuditor: () => {
        return get().hasRole('AUDITOR');
      },

      isProveedor: () => {
        return get().hasRole('PROVEEDOR');
      }
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        // Solo persistir datos esenciales
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity
      })
    }
  )
);

export { useAuthStore, api };
