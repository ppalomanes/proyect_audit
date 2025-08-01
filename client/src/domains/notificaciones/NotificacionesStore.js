// NotificacionesStore.js - Store para centro de notificaciones
import { create } from "zustand";
import useAuthStore from "../auth/authStore";

// Configuración API
const API_BASE_URL = 'http://localhost:5000';

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const { getAuthHeaders } = useAuthStore.getState();
  
  return fetch(url, {
    ...options,
    headers: { 
      'Content-Type': 'application/json', 
      ...getAuthHeaders(),
      ...options.headers 
    }
  });
};

// Store de notificaciones con Zustand
const useNotificacionesStore = create((set, get) => ({
  // === ESTADO ===
  notificaciones: [],
  noLeidas: 0,
  loading: false,
  error: null,
  filtros: {
    tipo: 'todas', // 'todas', 'info', 'warning', 'error', 'success'
    leida: 'todas', // 'todas', 'leidas', 'no_leidas'
    prioridad: 'todas' // 'todas', 'alta', 'media', 'baja'
  },
  polling: null, // ID del interval para polling

  // === ACCIONES ===

  /**
   * Obtener notificaciones
   */
  fetchNotificaciones: async () => {
    set({ loading: true, error: null });
    
    try {
      const { filtros } = get();
      
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filtros).filter(([_, value]) => value !== 'todas')
        )
      });

      const response = await apiRequest(`/api/notifications?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo notificaciones');
      }

      const data = await response.json();
      
      set({
        notificaciones: data.notificaciones || [],
        noLeidas: data.no_leidas || 0,
        loading: false,
        error: null
      });

      console.log('✅ Notificaciones obtenidas:', data.notificaciones?.length || 0);
      
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      set({
        loading: false,
        error: error.message,
        notificaciones: [],
        noLeidas: 0
      });
    }
  },

  /**
   * Marcar notificación como leída
   */
  marcarComoLeida: async (notificacionId) => {
    try {
      const response = await apiRequest(`/api/notifications/${notificacionId}/read`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error marcando notificación como leída');
      }

      // Actualizar estado local
      set(state => ({
        notificaciones: state.notificaciones.map(notif => 
          notif.id === notificacionId 
            ? { ...notif, leida: true, fecha_leida: new Date().toISOString() }
            : notif
        ),
        noLeidas: Math.max(0, state.noLeidas - 1)
      }));

      console.log('✅ Notificación marcada como leída');
      
    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
      set({ error: error.message });
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasComoLeidas: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest('/api/notifications/read-all', {
        method: 'PATCH'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error marcando todas como leídas');
      }

      // Actualizar estado local
      const ahora = new Date().toISOString();
      set(state => ({
        notificaciones: state.notificaciones.map(notif => ({
          ...notif,
          leida: true,
          fecha_leida: notif.fecha_leida || ahora
        })),
        noLeidas: 0,
        loading: false
      }));

      console.log('✅ Todas las notificaciones marcadas como leídas');
      
    } catch (error) {
      console.error('❌ Error marcando todas como leídas:', error);
      set({
        loading: false,
        error: error.message
      });
    }
  },

  /**
   * Eliminar notificación
   */
  eliminarNotificacion: async (notificacionId) => {
    try {
      const response = await apiRequest(`/api/notifications/${notificacionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error eliminando notificación');
      }

      // Actualizar estado local
      set(state => {
        const notifEliminada = state.notificaciones.find(n => n.id === notificacionId);
        const wasUnread = notifEliminada && !notifEliminada.leida;
        
        return {
          notificaciones: state.notificaciones.filter(n => n.id !== notificacionId),
          noLeidas: wasUnread ? Math.max(0, state.noLeidas - 1) : state.noLeidas
        };
      });

      console.log('✅ Notificación eliminada');
      
    } catch (error) {
      console.error('❌ Error eliminando notificación:', error);
      set({ error: error.message });
    }
  },

  /**
   * Crear nueva notificación
   */
  crearNotificacion: async (notificacionData) => {
    try {
      const response = await apiRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notificacionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando notificación');
      }

      const data = await response.json();
      
      // Agregar notificación al estado local
      set(state => ({
        notificaciones: [data.notificacion, ...state.notificaciones],
        noLeidas: state.noLeidas + 1
      }));

      console.log('✅ Notificación creada');
      return data.notificacion;
      
    } catch (error) {
      console.error('❌ Error creando notificación:', error);
      set({ error: error.message });
      return null;
    }
  },

  /**
   * Iniciar polling automático de notificaciones
   */
  iniciarPolling: (intervalo = 30000) => {
    const { polling } = get();
    
    // Limpiar polling anterior si existe
    if (polling) {
      clearInterval(polling);
    }
    
    // Iniciar nuevo polling
    const pollingId = setInterval(() => {
      get().fetchNotificaciones();
    }, intervalo);
    
    set({ polling: pollingId });
    
    console.log('✅ Polling de notificaciones iniciado');
  },

  /**
   * Detener polling automático
   */
  detenerPolling: () => {
    const { polling } = get();
    
    if (polling) {
      clearInterval(polling);
      set({ polling: null });
      console.log('✅ Polling de notificaciones detenido');
    }
  },

  /**
   * Actualizar filtros
   */
  setFiltros: (nuevosFiltros) => {
    set(state => ({
      filtros: { ...state.filtros, ...nuevosFiltros }
    }));
  },

  /**
   * Limpiar filtros
   */
  limpiarFiltros: () => {
    set({
      filtros: {
        tipo: 'todas',
        leida: 'todas',
        prioridad: 'todas'
      }
    });
  },

  /**
   * Obtener cantidad de notificaciones no leídas
   */
  getContadorNoLeidas: () => {
    return get().noLeidas;
  },

  /**
   * Verificar si hay notificaciones de alta prioridad no leídas
   */
  hayPrioridadAlta: () => {
    const { notificaciones } = get();
    return notificaciones.some(n => !n.leida && n.prioridad === 'alta');
  },

  /**
   * Limpiar errores
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset del estado
   */
  reset: () => {
    const { polling } = get();
    
    // Detener polling si está activo
    if (polling) {
      clearInterval(polling);
    }
    
    set({
      notificaciones: [],
      noLeidas: 0,
      error: null,
      polling: null,
      filtros: {
        tipo: 'todas',
        leida: 'todas',
        prioridad: 'todas'
      }
    });
  }
}));

export { useNotificacionesStore };
export default useNotificacionesStore;
