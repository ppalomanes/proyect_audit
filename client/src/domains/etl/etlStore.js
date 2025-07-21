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
      console.log('🔄 Iniciando upload ETL:', file.name, file.size);
      set({ processing: true, error: null, processResult: null });

      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('auditoria_id', auditoriaId);
      formData.append('strict_mode', options.strict_mode || false);
      formData.append('auto_fix', options.auto_fix || true);
      
      if (options.skip_validation && options.skip_validation.length > 0) {
        formData.append('skip_validation', JSON.stringify(options.skip_validation));
      }

      console.log('📋 Datos a enviar:');
      console.log('- Archivo:', file.name, file.type, file.size);
      console.log('- Auditoría ID:', auditoriaId);
      console.log('- Opciones:', options);

      // Enviar con FormData (no JSON)
      const response = await api.post('/etl/procesar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutos timeout para archivos grandes
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          set({ uploadProgress: progress });
          console.log(`📤 Upload progress: ${progress}%`);
        }
      });

      console.log('✅ Respuesta del servidor:', response.data);

      set({
        processing: false,
        processResult: response.data.data,
        error: null,
        uploadProgress: 0
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('❌ Error en upload ETL:', error);
      
      let errorMessage = 'Error procesando archivo';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({
        processing: false,
        error: errorMessage,
        uploadProgress: 0
      });
      
      return { success: false, error: errorMessage };
    }
  },

  getStatistics: async (auditoriaId) => {
    try {
      console.log('📊 Obteniendo estadísticas para:', auditoriaId);
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
      console.log('⚙️ Obteniendo configuración ETL');
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
