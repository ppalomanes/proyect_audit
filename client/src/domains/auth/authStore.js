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
          
          console.log('✅ Login exitoso, datos recibidos:', {
            hasToken: !!token,
            hasRefreshToken: !!refresh_token,
            hasUser: !!user,
            userFields: user ? Object.keys(user) : 'no user',
            userComplete: user
          });
          
          // 🛡️ Validación relajada para debugging
          if (!user) {
            throw new Error('No se recibió objeto usuario del servidor');
          }
          
          if (!user.email) {
            throw new Error('Usuario sin email recibido del servidor');
          }
          
          if (!user.rol && !user.role) {
            throw new Error('Usuario sin rol recibido del servidor');
          }
          
          // Normalizar rol si viene como 'role'
          if (user.role && !user.rol) {
            user.rol = user.role;
          }
          
          // Configurar persistencia basada en "recordarme"
          const storage = rememberMe ? localStorage : sessionStorage;
          
          storage.setItem('token', token);
          storage.setItem('refresh_token', refresh_token || '');
          storage.setItem('user', JSON.stringify(user));
          
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
          const errorMessage = error.response?.data?.message || error.message || 'Error de autenticación';
          set({
            loading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null
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
          // Limpiar storage de forma robusta
          console.log('🧹 Limpiando datos de storage...');
          ['token', 'refresh_token', 'user'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
            lastActivity: null,
            loading: false
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

      // Inicializar usuario desde storage (MEJORADO PARA DEBUGGING)
      initializeAuth: () => {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
          const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
          
          console.log('🔄 Inicializando auth...', { 
            hasToken: !!token, 
            hasUser: !!userData,
            tokenValue: token === null ? 'null' : (token === 'undefined' ? 'string-undefined' : 'valid'),
            userValue: userData === null ? 'null' : (userData === 'undefined' ? 'string-undefined' : 'valid')
          });
          
          // 🛡️ Verificar que los datos sean válidos (no null ni string "undefined")
          if (token && token !== 'undefined' && userData && userData !== 'undefined') {
            try {
              const user = JSON.parse(userData);
              
              console.log('🔍 Usuario parseado desde storage:', {
                user,
                hasId: !!user.id,
                hasEmail: !!user.email, 
                hasRol: !!user.rol,
                hasRole: !!user.role
              });
              
              // 🛡️ Validación relajada para debugging
              if (user && typeof user === 'object' && user.email && (user.rol || user.role)) {
                // Normalizar rol si viene como 'role'
                if (user.role && !user.rol) {
                  user.rol = user.role;
                }
                
                set({
                  user,
                  token,
                  refreshToken: refreshToken !== 'undefined' ? refreshToken : null,
                  isAuthenticated: true,
                  lastActivity: Date.now()
                });

                console.log('✅ Auth inicializado desde storage', user.email);
                return;
              } else {
                console.warn('⚠️ Datos de usuario inválidos:', user);
              }
            } catch (error) {
              console.error('Error parsing user data:', error);
            }
          } else {
            // 🔍 Normal: no hay datos guardados (null) o son inválidos
            if (token === null && userData === null) {
              console.log('ℹ️ No hay datos de auth guardados (estado limpio)');
            } else {
              console.log('ℹ️ Datos de auth inválidos o corruptos');
            }
          }
          
          // Estado limpio por defecto
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            lastActivity: null
          });
          
        } catch (error) {
          console.error('Error crítico en initializeAuth:', error);
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            lastActivity: null
          });
        }
      },

      // Utilidades
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      clearError: () => set({ error: null }),

      // Verificar roles y permisos (CON VERIFICACIONES DE SEGURIDAD RELAJADAS)
      hasRole: (role) => {
        const { user, isAuthenticated } = get();
        return isAuthenticated && user && (user.rol === role || user.role === role);
      },

      hasAnyRole: (roles) => {
        const { user, isAuthenticated } = get();
        return isAuthenticated && user && (roles.includes(user.rol) || roles.includes(user.role));
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
