// auditoriaService.js - Servicio para comunicación con API de auditorías
import api from '../../../services/api';

class AuditoriaService {
  /**
   * Crear nueva auditoría (ETAPA 1)
   */
  async crearAuditoria(datos) {
    try {
      const response = await api.post('/auditorias', datos);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtener listado de auditorías con filtros
   */
  async listarAuditorias(filtros = {}) {
    try {
      const queryParams = new URLSearchParams(filtros).toString();
      const response = await api.get(`/auditorias?${queryParams}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtener detalle completo de una auditoría
   */
  async obtenerAuditoria(id) {
    try {
      const response = await api.get(`/auditorias/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cargar documento (ETAPA 2)
   */
  async cargarDocumento(auditoriaId, formData) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/documentos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Finalizar carga de documentos (ETAPA 2 → 3)
   */
  async finalizarCarga(auditoriaId) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/finalizar-carga`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Evaluar sección (ETAPA 4)
   */
  async evaluarSeccion(auditoriaId, datos) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/evaluar-seccion`, datos);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Programar visita presencial (ETAPA 5)
   */
  async programarVisita(auditoriaId, datos) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/programar-visita`, datos);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Completar visita (ETAPA 6)
   */
  async completarVisita(auditoriaId, formData) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/completar-visita`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generar informe final (ETAPA 7)
   */
  async generarInforme(auditoriaId) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/generar-informe`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cerrar auditoría (ETAPA 8)
   */
  async cerrarAuditoria(auditoriaId) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/cerrar`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtener progreso de auditoría
   */
  async obtenerProgreso(auditoriaId) {
    try {
      const response = await api.get(`/auditorias/${auditoriaId}/progreso`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Listar documentos de una auditoría
   */
  async listarDocumentos(auditoriaId, incluirVersiones = false) {
    try {
      const response = await api.get(`/auditorias/${auditoriaId}/documentos`, {
        params: { incluir_versiones: incluirVersiones }
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Descargar documento
   */
  async descargarDocumento(auditoriaId, documentoId) {
    try {
      const response = await api.get(
        `/auditorias/${auditoriaId}/documentos/${documentoId}/descargar`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtener estadísticas generales
   */
  async obtenerEstadisticas(filtros = {}) {
    try {
      const queryParams = new URLSearchParams(filtros).toString();
      const response = await api.get(`/auditorias/estadisticas/general?${queryParams}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Asignar auditor
   */
  async asignarAuditor(auditoriaId, auditorId) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/asignar-auditor`, {
        auditor_id: auditorId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Marcar excepción
   */
  async marcarExcepcion(auditoriaId, justificacion) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/marcar-excepcion`, {
        justificacion
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reenviar notificación
   */
  async reenviarNotificacion(auditoriaId, tipo) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/reenviar-notificacion`, {
        tipo
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Manejo de errores
   */
  handleError(error) {
    if (error.response) {
      // Error de respuesta del servidor
      const message = error.response.data?.message || 'Error en el servidor';
      const status = error.response.status;
      
      if (status === 401) {
        // Token expirado o no válido
        window.location.href = '/login';
        return new Error('Sesión expirada');
      }
      
      if (status === 403) {
        return new Error('No tienes permisos para realizar esta acción');
      }
      
      if (status === 404) {
        return new Error('Recurso no encontrado');
      }
      
      if (status === 422) {
        // Errores de validación
        const validationErrors = error.response.data?.errors || {};
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        return new Error(errorMessages || message);
      }
      
      return new Error(message);
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      return new Error('No se pudo conectar con el servidor');
    } else {
      // Error en la configuración de la petición
      return new Error('Error al procesar la solicitud');
    }
  }

  /**
   * Utilidades
   */
  
  // Formatear fecha para mostrar
  formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Obtener color según estado
  getColorEstado(estado) {
    const colores = {
      'INICIADA': 'blue',
      'CARGANDO': 'indigo',
      'VALIDANDO': 'purple',
      'EN_REVISION': 'pink',
      'VISITA_PROGRAMADA': 'orange',
      'VISITA_REALIZADA': 'yellow',
      'INFORME_GENERADO': 'green',
      'CERRADA': 'gray'
    };
    return colores[estado] || 'gray';
  }

  // Obtener texto descriptivo del estado
  getTextoEstado(estado) {
    const textos = {
      'INICIADA': 'Auditoría iniciada',
      'CARGANDO': 'Cargando documentos',
      'VALIDANDO': 'Validación automática',
      'EN_REVISION': 'En revisión por auditor',
      'VISITA_PROGRAMADA': 'Visita programada',
      'VISITA_REALIZADA': 'Visita realizada',
      'INFORME_GENERADO': 'Informe generado',
      'CERRADA': 'Auditoría cerrada'
    };
    return textos[estado] || estado;
  }
}

export default new AuditoriaService();
