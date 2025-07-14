import { create } from 'zustand';
import axios from 'axios';

// Configurar axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  token: localStorage.getItem('token') || localStorage.getItem('auth_token'),
  isAuthenticated: !!(localStorage.getItem('token') || localStorage.getItem('auth_token')),
  loading: false,
  error: null,

  // Acciones
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data.data;
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error de autenticación';
      set({
        loading: false,
        error: errorMessage,
        isAuthenticated: false
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_data');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  // Inicializar usuario desde localStorage
  initializeAuth: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user') || localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        set({
          user,
          token,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        get().logout();
      }
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));

export { useAuthStore, api };
