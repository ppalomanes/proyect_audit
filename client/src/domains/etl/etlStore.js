import { create } from 'zustand';
import { api } from '../auth/authStore';

const useETLStore = create((set, get) => ({
  // Estado
  processing: false,
  uploadProgress: 0,
  processResult: null,
  statistics: null,
  configuration: null,
  error: null,

  // Acciones
  uploadAndProcess: async (file, auditoriaId, options = {}) => {
    try {
      set({ processing: true, error: null, processResult: null });

      // Simular upload del archivo (en implementación real, subirías el archivo primero)
      const documentoId = 'demo-doc-id'; // En la implementación real, esto vendría del upload

      const response = await api.post('/etl/procesar', {
        documento_id: documentoId,
        auditoria_id: auditoriaId,
        ...options
      });

      set({
        processing: false,
        processResult: response.data.data,
        error: null
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error procesando archivo';
      set({
        processing: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  },

  getStatistics: async (auditoriaId) => {
    try {
      const response = await api.get(`/etl/estadisticas/${auditoriaId}`);
      set({ statistics: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  },

  getConfiguration: async () => {
    try {
      const response = await api.get('/etl/configuracion');
      set({ configuration: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      return null;
    }
  },

  clearError: () => set({ error: null }),
  clearResults: () => set({ processResult: null, statistics: null })
}));

export { useETLStore };
