// ETL Store - Zustand
// Portal de Auditorías Técnicas

import { create } from 'zustand';
import etlService from './services/etlService';

const useETLStore = create((set, get) => ({
  // Estado del upload y procesamiento
  uploadState: {
    isUploading: false,
    uploadProgress: 0,
    file: null,
    validationResults: null
  },

  // Trabajos ETL
  jobs: [],
  currentJob: null,
  jobPollingInterval: null,

  // Datos procesados
  parqueInformatico: {
    data: [],
    total: 0,
    loading: false,
    filters: {
      estado: 'VALIDADO',
      nivel_cumplimiento: null,
      limit: 50,
      offset: 0
    }
  },

  // Métricas
  metrics: {
    data: null,
    loading: false
  },

  // Reglas de validación
  validationRules: {
    data: [],
    loading: false
  },

  // === ACCIONES DE UPLOAD ===
  
  setUploadFile: (file) => set((state) => ({
    uploadState: {
      ...state.uploadState,
      file,
      validationResults: null
    }
  })),

  setUploadProgress: (progress) => set((state) => ({
    uploadState: {
      ...state.uploadState,
      uploadProgress: progress
    }
  })),

  setUploadState: (isUploading) => set((state) => ({
    uploadState: {
      ...state.uploadState,
      isUploading
    }
  })),

  // Validar archivo sin procesarlo
  validateFile: async (file, auditoriaId) => {
    const state = get();
    
    try {
      set((state) => ({
        uploadState: {
          ...state.uploadState,
          isUploading: true,
          uploadProgress: 0
        }
      }));

      const results = await etlService.validateFile(file, {
        onProgress: (progress) => {
          set((state) => ({
            uploadState: {
              ...state.uploadState,
              uploadProgress: progress
            }
          }));
        }
      });

      set((state) => ({
        uploadState: {
          ...state.uploadState,
          isUploading: false,
          validationResults: results,
          uploadProgress: 100
        }
      }));

      return results;

    } catch (error) {
      set((state) => ({
        uploadState: {
          ...state.uploadState,
          isUploading: false,
          uploadProgress: 0
        }
      }));
      
      throw error;
    }
  },

  // Procesar archivo
  processFile: async (file, auditoriaId, configuracion = {}) => {
    try {
      set((state) => ({
        uploadState: {
          ...state.uploadState,
          isUploading: true,
          uploadProgress: 0
        }
      }));

      const result = await etlService.processFile(file, auditoriaId, configuracion, {
        onProgress: (progress) => {
          set((state) => ({
            uploadState: {
              ...state.uploadState,
              uploadProgress: progress
            }
          }));
        }
      });

      // Iniciar seguimiento del job
      get().startJobPolling(result.data.job_id);

      set((state) => ({
        uploadState: {
          ...state.uploadState,
          isUploading: false,
          uploadProgress: 100
        },
        currentJob: {
          job_id: result.data.job_id,
          estado: result.data.estado,
          estimacion_tiempo: result.data.estimacion_tiempo
        }
      }));

      return result;

    } catch (error) {
      set((state) => ({
        uploadState: {
          ...state.uploadState,
          isUploading: false,
          uploadProgress: 0
        }
      }));
      
      throw error;
    }
  },

  // === ACCIONES DE JOBS ===
  
  // Obtener lista de jobs
  fetchJobs: async (filters = {}) => {
    try {
      const response = await etlService.getJobs(filters);
      
      set({
        jobs: response.data.jobs
      });

      return response.data;

    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  // Obtener estado de job específico
  fetchJobStatus: async (jobId) => {
    try {
      const response = await etlService.getJobStatus(jobId);
      
      // Actualizar job actual si es el mismo
      const state = get();
      if (state.currentJob?.job_id === jobId) {
        set({
          currentJob: response.data
        });
      }

      // Actualizar en la lista de jobs
      set((state) => ({
        jobs: state.jobs.map(job => 
          job.id === jobId ? { ...job, ...response.data } : job
        )
      }));

      return response.data;

    } catch (error) {
      console.error('Error fetching job status:', error);
      throw error;
    }
  },

  // Obtener resultados de job
  fetchJobResults: async (jobId) => {
    try {
      const response = await etlService.getJobResults(jobId);
      return response.data;

    } catch (error) {
      console.error('Error fetching job results:', error);
      throw error;
    }
  },

  // Iniciar polling de job
  startJobPolling: (jobId) => {
    const state = get();
    
    // Limpiar polling anterior si existe
    if (state.jobPollingInterval) {
      clearInterval(state.jobPollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const jobStatus = await get().fetchJobStatus(jobId);
        
        // Detener polling si el job terminó
        if (['COMPLETADO', 'ERROR', 'CANCELADO'].includes(jobStatus.estado)) {
          get().stopJobPolling();
          
          // Si completado exitosamente, recargar datos
          if (jobStatus.estado === 'COMPLETADO') {
            // Recargar parque informático si estamos viendo esa auditoría
            const currentFilters = get().parqueInformatico.filters;
            if (currentFilters.auditoria_id) {
              get().fetchParqueInformatico(currentFilters.auditoria_id);
            }
          }
        }

      } catch (error) {
        console.error('Error polling job status:', error);
        get().stopJobPolling();
      }
    }, 2000); // Poll cada 2 segundos

    set({ jobPollingInterval: interval });
  },

  // Detener polling de job
  stopJobPolling: () => {
    const state = get();
    if (state.jobPollingInterval) {
      clearInterval(state.jobPollingInterval);
      set({ jobPollingInterval: null });
    }
  },

  // === ACCIONES DE DATOS PROCESADOS ===
  
  // Obtener datos de parque informático
  fetchParqueInformatico: async (auditoriaId, filters = {}) => {
    try {
      set((state) => ({
        parqueInformatico: {
          ...state.parqueInformatico,
          loading: true,
          filters: { ...state.parqueInformatico.filters, ...filters, auditoria_id: auditoriaId }
        }
      }));

      const response = await etlService.getParqueInformatico(auditoriaId, filters);
      
      set((state) => ({
        parqueInformatico: {
          ...state.parqueInformatico,
          data: response.data.registros,
          total: response.data.total,
          loading: false
        }
      }));

      return response.data;

    } catch (error) {
      set((state) => ({
        parqueInformatico: {
          ...state.parqueInformatico,
          loading: false
        }
      }));
      
      console.error('Error fetching parque informático:', error);
      throw error;
    }
  },

  // Actualizar filtros de parque informático
  updateParqueFilters: (filters) => {
    set((state) => ({
      parqueInformatico: {
        ...state.parqueInformatico,
        filters: { ...state.parqueInformatico.filters, ...filters }
      }
    }));

    // Recargar datos si tenemos auditoría
    const state = get();
    if (state.parqueInformatico.filters.auditoria_id) {
      state.fetchParqueInformatico(
        state.parqueInformatico.filters.auditoria_id,
        state.parqueInformatico.filters
      );
    }
  },

  // === ACCIONES DE MÉTRICAS ===
  
  fetchMetrics: async (auditoriaId = null) => {
    try {
      set((state) => ({
        metrics: {
          ...state.metrics,
          loading: true
        }
      }));

      const response = await etlService.getMetrics(auditoriaId);
      
      set({
        metrics: {
          data: response.data,
          loading: false
        }
      });

      return response.data;

    } catch (error) {
      set((state) => ({
        metrics: {
          ...state.metrics,
          loading: false
        }
      }));
      
      console.error('Error fetching metrics:', error);
      throw error;
    }
  },

  // === ACCIONES DE REGLAS ===
  
  fetchValidationRules: async (categoria = null) => {
    try {
      set((state) => ({
        validationRules: {
          ...state.validationRules,
          loading: true
        }
      }));

      const response = await etlService.getValidationRules(categoria);
      
      set({
        validationRules: {
          data: response.data,
          loading: false
        }
      });

      return response.data;

    } catch (error) {
      set((state) => ({
        validationRules: {
          ...state.validationRules,
          loading: false
        }
      }));
      
      console.error('Error fetching validation rules:', error);
      throw error;
    }
  },

  // === UTILIDADES ===
  
  // Limpiar estado de upload
  clearUploadState: () => set({
    uploadState: {
      isUploading: false,
      uploadProgress: 0,
      file: null,
      validationResults: null
    }
  }),

  // Limpiar job actual
  clearCurrentJob: () => {
    get().stopJobPolling();
    set({ currentJob: null });
  },

  // Reset completo del store
  reset: () => {
    get().stopJobPolling();
    set({
      uploadState: {
        isUploading: false,
        uploadProgress: 0,
        file: null,
        validationResults: null
      },
      jobs: [],
      currentJob: null,
      jobPollingInterval: null,
      parqueInformatico: {
        data: [],
        total: 0,
        loading: false,
        filters: {
          estado: 'VALIDADO',
          nivel_cumplimiento: null,
          limit: 50,
          offset: 0
        }
      },
      metrics: {
        data: null,
        loading: false
      },
      validationRules: {
        data: [],
        loading: false
      }
    });
  }
}));

export default useETLStore;