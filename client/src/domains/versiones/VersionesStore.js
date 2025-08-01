// VersionesStore.js - Store para control de versiones de documentos
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

// Store de versiones con Zustand
const useVersionesStore = create((set, get) => ({
  // === ESTADO ===
  documentos: [],
  versiones: [],
  documentoSeleccionado: null,
  versionSeleccionada: null,
  loading: false,
  error: null,
  filtros: {
    auditoria_id: '',
    tipo_documento: '',
    fecha_desde: '',
    fecha_hasta: ''
  },

  // === ACCIONES ===

  /**
   * Obtener lista de documentos con versiones
   */
  fetchDocumentos: async (filtros = {}) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams({
        ...get().filtros,
        ...filtros
      });

      const response = await apiRequest(`/api/versiones/documentos?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo documentos');
      }

      const data = await response.json();
      
      set({
        documentos: data.documentos || [],
        loading: false,
        error: null
      });

      console.log('✅ Documentos obtenidos:', data.documentos?.length || 0);
      
    } catch (error) {
      console.error('❌ Error obteniendo documentos:', error);
      set({
        loading: false,
        error: error.message,
        documentos: []
      });
    }
  },

  /**
   * Obtener versiones de un documento específico
   */
  fetchVersionesDocumento: async (documentoId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/versiones/documento/${documentoId}/versiones`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo versiones');
      }

      const data = await response.json();
      
      set({
        versiones: data.versiones || [],
        loading: false,
        error: null
      });

      console.log('✅ Versiones obtenidas:', data.versiones?.length || 0);
      
    } catch (error) {
      console.error('❌ Error obteniendo versiones:', error);
      set({
        loading: false,
        error: error.message,
        versiones: []
      });
    }
  },

  /**
   * Seleccionar documento actual
   */
  setDocumentoSeleccionado: (documento) => {
    set({ 
      documentoSeleccionado: documento,
      versiones: [],
      versionSeleccionada: null 
    });
  },

  /**
   * Seleccionar versión actual
   */
  setVersionSeleccionada: (version) => {
    set({ versionSeleccionada: version });
  },

  /**
   * Descargar una versión específica
   */
  descargarVersion: async (versionId, nombreArchivo = null) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/versiones/version/${versionId}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error descargando versión');
      }

      // Obtener el archivo como blob
      const blob = await response.blob();
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Usar nombre proporcionado o obtenerlo del header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = nombreArchivo;
      
      if (!filename && contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename || `documento_v${versionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      set({ loading: false });
      console.log('✅ Versión descargada exitosamente');
      
    } catch (error) {
      console.error('❌ Error descargando versión:', error);
      set({
        loading: false,
        error: error.message
      });
    }
  },

  /**
   * Comparar dos versiones de un documento
   */
  compararVersiones: async (versionId1, versionId2) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest('/api/versiones/comparar', {
        method: 'POST',
        body: JSON.stringify({
          version1: versionId1,
          version2: versionId2
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error comparando versiones');
      }

      const data = await response.json();
      
      set({ loading: false });
      console.log('✅ Comparación realizada');
      return data.comparacion;
      
    } catch (error) {
      console.error('❌ Error comparando versiones:', error);
      set({
        loading: false,
        error: error.message
      });
      return null;
    }
  },

  /**
   * Crear nueva versión de un documento
   */
  crearVersion: async (documentoId, archivo, comentarios = '') => {
    set({ loading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('comentarios', comentarios);

      const { getAuthHeaders } = useAuthStore.getState();
      
      const response = await fetch(`${API_BASE_URL}/api/versiones/documento/${documentoId}/nueva-version`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
          // No incluir Content-Type para FormData
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando nueva versión');
      }

      const data = await response.json();
      
      set({ loading: false });
      
      // Refrescar versiones del documento
      if (get().documentoSeleccionado?.id === documentoId) {
        get().fetchVersionesDocumento(documentoId);
      }
      
      console.log('✅ Nueva versión creada:', data.version);
      return data.version;
      
    } catch (error) {
      console.error('❌ Error creando versión:', error);
      set({
        loading: false,
        error: error.message
      });
      return null;
    }
  },

  /**
   * Restaurar una versión anterior como versión actual
   */
  restaurarVersion: async (versionId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/versiones/version/${versionId}/restaurar`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error restaurando versión');
      }

      const data = await response.json();
      
      set({ loading: false });
      
      // Refrescar versiones del documento
      if (get().documentoSeleccionado) {
        get().fetchVersionesDocumento(get().documentoSeleccionado.id);
      }
      
      console.log('✅ Versión restaurada exitosamente');
      return data.version;
      
    } catch (error) {
      console.error('❌ Error restaurando versión:', error);
      set({
        loading: false,
        error: error.message
      });
      return null;
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
        auditoria_id: '',
        tipo_documento: '',
        fecha_desde: '',
        fecha_hasta: ''
      }
    });
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
    set({
      documentos: [],
      versiones: [],
      documentoSeleccionado: null,
      versionSeleccionada: null,
      error: null
    });
  }
}));

export { useVersionesStore };
export default useVersionesStore;
