// authStore.js - Store de autenticación corregido
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Configuración API - Puerto corregido a 5000
const API_BASE_URL = 'http://localhost:5000';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
};

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
          const response = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error de autenticación');
          }

          const data = await response.json();
          
          if (data.status === 'success' && data.data) {
            const { user, accessToken } = data.data;
            
            set({
              user: user,
              token: accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            // Guardar token en localStorage
            localStorage.setItem('auth_token', accessToken);
            
            console.log('✅ Login exitoso:', user);
            return { success: true, user: user };
          } else {
            throw new Error(data.message || 'Credenciales inválidas');
          }
          
        } catch (error) {
          console.error('❌ Error en login:', error);
          set({
            isLoading: false,
            error: error.message,
            isAuthenticated: false
          });
          return { success: false, error: error.message };
        }
      },

      /**
       * Cerrar sesión
       */
      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
        console.log('👋 Sesión cerrada');
      },

      /**
       * Verificar estado de autenticación
       */
      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          return false;
        }

        try {
          const response = await apiRequest('/api/auth/verify', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              set({
                user: data.user,
                token: token,
                isAuthenticated: true
              });
              return true;
            }
          }
        } catch (error) {
          console.warn('Error verificando autenticación:', error);
        }

        // Si la verificación falla, limpiar datos
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        return false;
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
