// BitacoraStore.js - Store para sistema de trazabilidad y bitácora
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

// Store de bitácora con Zustand
const useBitacoraStore = create((set, get) => ({
  // === ESTADO ===
  entradas: [],
  filtros: {
    fechaInicio: '',
    fechaFin: '',
    usuario: '',
    accion: '',
    seccion: '',
    busqueda: ''
  },
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  },

  // === ACCIONES ===

  /**
   * Obtener entradas de bitácora con filtros y paginación
   */
  fetchEntradas: async () => {
    set({ loading: true, error: null });
    
    try {
      const { filtros, pagination } = get();
      
      // Construir query parameters
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filtros).filter(([_, value]) => value !== '')
        )
      });

      const response = await apiRequest(`/api/bitacora?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo entradas de bitácora');
      }

      const data = await response.json();
      
      set({
        entradas: data.entradas || [],
        pagination: {
          ...pagination,
          total: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / pagination.limit)
        },
        loading: false,
        error: null
      });

      console.log('✅ Entradas de bitácora obtenidas:', data.entradas?.length || 0);
      
    } catch (error) {
      console.error('❌ Error obteniendo entradas de bitácora:', error);
      set({
        loading: false,
        error: error.message,
        entradas: []
      });
    }
  },

  /**
   * Actualizar filtros de búsqueda
   */
  setFiltros: (nuevosFiltros) => {
    set(state => ({
      filtros: { ...state.filtros, ...nuevosFiltros },
      pagination: { ...state.pagination, page: 1 } // Reset a primera página
    }));
  },

  /**
   * Limpiar filtros
   */
  limpiarFiltros: () => {
    set({
      filtros: {
        fechaInicio: '',
        fechaFin: '',
        usuario: '',
        accion: '',
        seccion: '',
        busqueda: ''
      },
      pagination: { ...get().pagination, page: 1 }
    });
  },

  /**
   * Cambiar página de paginación
   */
  setPagina: (page) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
  },

  /**
   * Exportar bitácora a Excel/CSV
   */
  exportarBitacora: async (formato = 'excel') => {
    set({ loading: true, error: null });
    
    try {
      const { filtros } = get();
      
      const params = new URLSearchParams({
        formato,
        ...Object.fromEntries(
          Object.entries(filtros).filter(([_, value]) => value !== '')
        )
      });

      const response = await apiRequest(`/api/bitacora/export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error exportando bitácora');
      }

      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitacora-${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      set({ loading: false });
      console.log('✅ Bitácora exportada exitosamente');
      
    } catch (error) {
      console.error('❌ Error exportando bitácora:', error);
      set({
        loading: false,
        error: error.message
      });
    }
  },

  /**
   * Registrar nueva entrada en bitácora (uso interno del sistema)
   */
  registrarEntrada: async (entrada) => {
    try {
      const response = await apiRequest('/api/bitacora', {
        method: 'POST',
        body: JSON.stringify(entrada)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error registrando entrada');
      }

      console.log('✅ Entrada registrada en bitácora');
      
      // Refrescar entradas si estamos en la primera página
      const { pagination } = get();
      if (pagination.page === 1) {
        get().fetchEntradas();
      }
      
    } catch (error) {
      console.error('❌ Error registrando entrada en bitácora:', error);
    }
  },

  /**
   * Obtener estadísticas de bitácora
   */
  fetchEstadisticas: async () => {
    try {
      const response = await apiRequest('/api/bitacora/estadisticas');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo estadísticas');
      }

      const data = await response.json();
      console.log('✅ Estadísticas de bitácora obtenidas:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  },

  /**
   * Limpiar errores
   */
  clearError: () => {
    set({ error: null });
  }
}));

export { useBitacoraStore };
export default useBitacoraStore;
