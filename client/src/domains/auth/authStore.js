// authStore.js - Store de autenticación corregido usando authService unificado
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import authService from './services/authService';

// Store de autenticación con Zustand
const useAuthStore = create(
  persist(
    (set, get) => ({
      // === ESTADO ===
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // === ACCIONES ===
      
      /**
       * Iniciar sesión
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await authService.login(email, password);
          
          if (result.success) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            console.log('✅ Login exitoso en store:', result.user);
            return { success: true, user: result.user };
          } else {
            throw new Error(result.error || 'Error de autenticación');
          }
          
        } catch (error) {
          console.error('❌ Error en login store:', error);
          set({
            isLoading: false,
            error: error.message,
            isAuthenticated: false,
            user: null,
            token: null
          });
          return { success: false, error: error.message };
        }
      },

      /**
       * Cerrar sesión
       */
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
        } catch (error) {
          console.warn('Error en logout:', error);
        } finally {
          // Siempre limpiar el estado local
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            isLoading: false
          });
          
          console.log('👋 Sesión cerrada en store');
        }
      },

      /**
       * Verificar estado de autenticación
       */
      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          // Primero verificar si hay datos en localStorage
          const storedUser = authService.getStoredUser();
          const storedToken = authService.getStoredToken();
          
          if (!storedToken || !storedUser) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false
            });
            return false;
          }
          
          // Verificar token con el servidor
          const result = await authService.verifyToken();
          
          if (result.success) {
            set({
              user: result.user,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            console.log('✅ Auth verificado:', result.user.email);
            return true;
          } else {
            // Token inválido, limpiar estado
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
            return false;
          }
          
        } catch (error) {
          console.error('❌ Error verificando auth:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          return false;
        }
      },

      /**
       * Inicializar store desde localStorage
       */
      initializeAuth: () => {
        try {
          const storedUser = authService.getStoredUser();
          const storedToken = authService.getStoredToken();
          
          if (storedUser && storedToken) {
            set({
              user: storedUser,
              token: storedToken,
              isAuthenticated: true,
              error: null
            });
            
            console.log('🔄 Auth inicializado desde localStorage:', storedUser.email);
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Error inicializando auth:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
          });
          return false;
        }
      },

      /**
       * Obtener headers de autenticación
       */
      getAuthHeaders: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },

      /**
       * Limpiar errores
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Actualizar datos del usuario en el store
       */
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }));
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;