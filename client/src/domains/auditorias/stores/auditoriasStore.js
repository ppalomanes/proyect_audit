import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../../../services/api';

const useAuditoriasStore = create(
  persist(
    (set, get) => ({
      // =============== ESTADO ===============
      auditorias: [],
      auditoriaActual: null,
      documentos: [],
      parqueInformatico: null,
      loading: false,
      error: null,
      
      // Estados del wizard
      etapaActual: 'CARGA_PRESENCIAL',
      pasoWizard: 1,
      totalPasos: 4,
      documentosObligatorios: [
        'TOPOLOGIA_RED',
        'CUARTO_TECNOLOGIA', 
        'ENERGIA',
        'SEGURIDAD_INFORMATICA',
        'PARQUE_INFORMATICO'
      ],
      documentosOpcionales: [
        'CONECTIVIDAD',
        'TEMPERATURA_CT',
        'SERVIDORES',
        'INTERNET',
        'PERSONAL_CAPACITADO',
        'ESCALAMIENTO',
        'INFORMACION_ENTORNO',
        'HARDWARE_ADICIONAL'
      ],

      // =============== ACCIONES GENERALES ===============
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // =============== GESTIÓN DE AUDITORÍAS ===============
      obtenerAuditorias: async (filtros = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await api.get('/auditorias', { params: filtros });
          set({ auditorias: response.data.data.auditorias });
        } catch (error) {
          set({ error: error.response?.data?.message || 'Error obteniendo auditorías' });
        } finally {
          set({ loading: false });
        }
      },

      obtenerAuditoriaPorId: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await api.get(`/auditorias/${id}`);
          const auditoria = response.data.data;
          
          set({ 
            auditoriaActual: auditoria,
            etapaActual: auditoria.etapa_actual,
            pasoWizard: get().obtenerPasoDesdeEtapa(auditoria.etapa_actual)
          });
          
          // Cargar documentos si existen
          await get().obtenerDocumentos(id);
          
          return auditoria;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Error obteniendo auditoría' });
        } finally {
          set({ loading: false });
        }
      },

      // =============== WIZARD WORKFLOW ===============
      obtenerPasoDesdeEtapa: (etapa) => {
        const mapaPasos = {
          'NOTIFICACION': 1,
          'CARGA_PRESENCIAL': 1,
          'CARGA_PARQUE': 2,
          'VALIDACION_AUTOMATICA': 3,
          'REVISION_AUDITOR': 4,
          'NOTIFICACION_RESULTADOS': 4,
          'COMPLETADA': 4
        };
        return mapaPasos[etapa] || 1;
      },

      avanzarPaso: () => {
        const { pasoWizard, totalPasos } = get();
        if (pasoWizard < totalPasos) {
          set({ pasoWizard: pasoWizard + 1 });
        }
      },

      retrocederPaso: () => {
        const { pasoWizard } = get();
        if (pasoWizard > 1) {
          set({ pasoWizard: pasoWizard - 1 });
        }
      },

      irAPaso: (paso) => {
        set({ pasoWizard: paso });
      },

      avanzarEtapa: async (auditoriaId, etapaSiguiente, metadatos = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post(`/auditorias/${auditoriaId}/avanzar-etapa`, {
            etapa_siguiente: etapaSiguiente,
            metadatos
          });
          
          set({ 
            etapaActual: etapaSiguiente,
            pasoWizard: get().obtenerPasoDesdeEtapa(etapaSiguiente)
          });
          
          // Actualizar auditoría actual si está cargada
          const { auditoriaActual } = get();
          if (auditoriaActual && auditoriaActual.id === auditoriaId) {
            set({
              auditoriaActual: {
                ...auditoriaActual,
                etapa_actual: etapaSiguiente,
                estado: response.data.data.estado
              }
            });
          }
          
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Error avanzando etapa' });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // =============== GESTIÓN DE DOCUMENTOS ===============
      obtenerDocumentos: async (auditoriaId) => {
        try {
          const response = await api.get(`/auditorias/${auditoriaId}/documentos`);
          set({ documentos: response.data.data });
        } catch (error) {
          console.error('Error obteniendo documentos:', error);
        }
      },

      cargarDocumento: async (auditoriaId, tipoDocumento, archivo, metadatos = {}) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('archivo', archivo);
          formData.append('tipo_documento', tipoDocumento);
          
          if (metadatos.fecha_ultima_revision) {
            formData.append('fecha_ultima_revision', metadatos.fecha_ultima_revision);
          }
          if (metadatos.observaciones) {
            formData.append('observaciones', metadatos.observaciones);
          }

          const response = await api.post(`/auditorias/${auditoriaId}/documentos`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          // Recargar documentos
          await get().obtenerDocumentos(auditoriaId);
          
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Error cargando documento' });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      eliminarDocumento: async (documentoId) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/auditorias/documentos/${documentoId}`);
          
          // Remover de la lista local
          const { documentos } = get();
          set({ documentos: documentos.filter(doc => doc.id !== documentoId) });
        } catch (error) {
          set({ error: error.response?.data?.message || 'Error eliminando documento' });
        } finally {
          set({ loading: false });
        }
      },

      descargarDocumento: async (documentoId) => {
        try {
          const response = await api.get(`/auditorias/documentos/${documentoId}/descargar`, {
            responseType: 'blob'
          });
          
          // Crear URL de descarga
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          
          // Obtener nombre del archivo del header
          const contentDisposition = response.headers['content-disposition'];
          const filename = contentDisposition 
            ? contentDisposition.split('filename=')[1].replace(/"/g, '')
            : 'documento.pdf';
          
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          set({ error: 'Error descargando documento' });
        }
      },

      // =============== PARQUE INFORMÁTICO ===============
      procesarParqueInformatico: async (auditoriaId, archivoExcel) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('archivo', archivoExcel);

          const response = await api.post(`/auditorias/${auditoriaId}/parque-informatico`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          // Obtener resumen actualizado
          await get().obtenerResumenParque(auditoriaId);
          
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || 'Error procesando parque informático' });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      obtenerResumenParque: async (auditoriaId) => {
        try {
          const response = await api.get(`/auditorias/${auditoriaId}/parque-informatico/resumen`);
          set({ parqueInformatico: response.data.data });
        } catch (error) {
          console.error('Error obteniendo resumen parque:', error);
        }
      },

      obtenerIncumplimientos: async (auditoriaId, filtros = {}) => {
        try {
          const response = await api.get(`/auditorias/${auditoriaId}/parque-informatico/incumplimientos`, {
            params: filtros
          });
          return response.data.data;
        } catch (error) {
          set({ error: 'Error obteniendo incumplimientos' });
          return [];
        }
      },

      // =============== VALIDACIONES WIZARD ===============
      validarPasoActual: () => {
        const { pasoWizard, documentos, documentosObligatorios, auditoriaActual } = get();
        
        switch (pasoWizard) {
          case 1: // Carga Presencial
            const docsObligatoriosCargados = documentosObligatorios.filter(tipo => 
              documentos.some(doc => doc.tipo_documento === tipo)
            );
            return docsObligatoriosCargados.length >= 4; // Al menos 4 de 5 obligatorios (PARQUE_INFORMATICO se carga en paso 2)
            
          case 2: // Carga Parque
            return documentos.some(doc => doc.tipo_documento === 'PARQUE_INFORMATICO') &&
                   auditoriaActual?.equipos_os_count > 0;
            
          case 3: // Validación Automática
            return auditoriaActual?.etapa_actual === 'VALIDACION_AUTOMATICA' ||
                   auditoriaActual?.etapa_actual === 'REVISION_AUDITOR';
            
          case 4: // Revisión Final
            return auditoriaActual?.estado === 'EVALUADA' || 
                   auditoriaActual?.estado === 'COMPLETADA';
            
          default:
            return false;
        }
      },

      puedeAvanzarPaso: () => {
        const { validarPasoActual, pasoWizard, totalPasos } = get();
        return pasoWizard < totalPasos && validarPasoActual();
      },

      obtenerProgresoCompletitud: () => {
        const { documentos, documentosObligatorios, documentosOpcionales, auditoriaActual } = get();
        
        const obligatoriosCargados = documentosObligatorios.filter(tipo => 
          documentos.some(doc => doc.tipo_documento === tipo)
        ).length;
        
        const opcionalesCargados = documentosOpcionales.filter(tipo => 
          documentos.some(doc => doc.tipo_documento === tipo)
        ).length;
        
        const progresoObligatorios = (obligatoriosCargados / documentosObligatorios.length) * 70;
        const progresoOpcionales = (opcionalesCargados / documentosOpcionales.length) * 30;
        
        return Math.round(progresoObligatorios + progresoOpcionales);
      },

      // =============== UTILIDADES ===============
      obtenerTiposDocumentos: async () => {
        try {
          const response = await api.get('/auditorias/config/tipos-documentos');
          return response.data.data;
        } catch (error) {
          console.error('Error obteniendo tipos de documentos:', error);
          return [];
        }
      },

      obtenerUmbrales: async (auditoriaId) => {
        try {
          const response = await api.get(`/auditorias/${auditoriaId}/umbrales`);
          return response.data.data;
        } catch (error) {
          console.error('Error obteniendo umbrales:', error);
          return null;
        }
      },

      calcularDiasRestantes: (fechaLimite) => {
        if (!fechaLimite) return null;
        const hoy = new Date();
        const limite = new Date(fechaLimite);
        const diferencia = limite.getTime() - hoy.getTime();
        return Math.ceil(diferencia / (1000 * 3600 * 24));
      },

      // =============== RESET Y LIMPIEZA ===============
      resetWizard: () => {
        set({
          auditoriaActual: null,
          documentos: [],
          parqueInformatico: null,
          pasoWizard: 1,
          etapaActual: 'CARGA_PRESENCIAL',
          error: null
        });
      },

      limpiarError: () => set({ error: null })
    }),
    {
      name: 'auditorias-store',
      partialize: (state) => ({
        // Solo persistir datos esenciales, no estados temporales
        auditorias: state.auditorias,
        auditoriaActual: state.auditoriaActual
      })
    }
  )
);

export default useAuditoriasStore;