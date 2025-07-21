import axios from 'axios';
import { mockAuditoriasService, USE_MOCK_DATA } from './mockData';

// Configuración de axios si no existe
const api = axios.create({
  baseURL: '/api'
});

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
      // Token expirado o inválido
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auditoriasService = {
  // Obtener lista de auditorías con filtros y paginación
  async getAuditorias(params = {}) {
    if (USE_MOCK_DATA) {
      return mockAuditoriasService.getAuditorias(params);
    }
    
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await api.get(`/auditorias?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener auditorías:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar auditorías');
    }
  },

  // Obtener auditoría específica por ID
  async getAuditoriaById(id) {
    try {
      const response = await api.get(`/auditorias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener auditoría:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar auditoría');
    }
  },

  // Crear nueva auditoría
  async createAuditoria(data) {
    if (USE_MOCK_DATA) {
      return mockAuditoriasService.createAuditoria(data);
    }
    
    try {
      const response = await api.post('/auditorias', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear auditoría:', error);
      throw new Error(error.response?.data?.message || 'Error al crear auditoría');
    }
  },

  // Actualizar auditoría
  async updateAuditoria(id, data) {
    try {
      const response = await api.put(`/auditorias/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar auditoría:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar auditoría');
    }
  },

  // Eliminar auditoría (solo ADMIN)
  async deleteAuditoria(id) {
    try {
      const response = await api.delete(`/auditorias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar auditoría:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar auditoría');
    }
  },

  // Avanzar a la siguiente etapa
  async avanzarEtapa(id, observaciones = '') {
    if (USE_MOCK_DATA) {
      return mockAuditoriasService.avanzarEtapa(id, observaciones);
    }
    
    try {
      const response = await api.post(`/auditorias/${id}/avanzar-etapa`, {
        observaciones
      });
      return response.data;
    } catch (error) {
      console.error('Error al avanzar etapa:', error);
      throw new Error(error.response?.data?.message || 'Error al avanzar etapa');
    }
  },

  // Obtener historial de cambios
  async getHistorial(id) {
    try {
      const response = await api.get(`/auditorias/${id}/historial`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar historial');
    }
  },

  // Obtener estadísticas
  async getEstadisticas() {
    if (USE_MOCK_DATA) {
      return mockAuditoriasService.getEstadisticas();
    }
    
    try {
      const response = await api.get('/auditorias/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  },

  // Obtener mis auditorías (para auditores)
  async getMisAuditorias(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await api.get(`/auditorias/mis-auditorias?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener mis auditorías:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar mis auditorías');
    }
  },

  // Buscar auditoría por código
  async buscarPorCodigo(codigo) {
    try {
      const response = await api.get(`/auditorias/buscar/${codigo}`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar auditoría:', error);
      throw new Error(error.response?.data?.message || 'Auditoría no encontrada');
    }
  },

  // Obtener proveedores para filtros
  async getProveedores() {
    if (USE_MOCK_DATA) {
      return mockAuditoriasService.getProveedores();
    }
    
    try {
      const response = await api.get('/proveedores');
      return response.data;
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return [];
    }
  },

  // Obtener auditores para filtros
  async getAuditores() {
    if (USE_MOCK_DATA) {
      return mockAuditoriasService.getAuditores();
    }
    
    try {
      const response = await api.get('/usuarios?rol=AUDITOR');
      return response.data;
    } catch (error) {
      console.error('Error al obtener auditores:', error);
      return [];
    }
  },

  // Upload de documentos
  async uploadDocumento(auditoriaId, formData) {
    try {
      const response = await api.post(`/auditorias/${auditoriaId}/documentos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw new Error(error.response?.data?.message || 'Error al subir documento');
    }
  },

  // Obtener documentos de auditoría
  async getDocumentos(auditoriaId) {
    try {
      const response = await api.get(`/auditorias/${auditoriaId}/documentos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar documentos');
    }
  }
};

// Estados y etapas para uso en componentes
export const ESTADOS_AUDITORIA = {
  PROGRAMADA: { label: 'Programada', color: 'gray' },
  ETAPA_1_NOTIFICACION: { label: 'Etapa 1: Notificación', color: 'blue' },
  ETAPA_2_CARGA_DOCUMENTOS: { label: 'Etapa 2: Carga de Documentos', color: 'yellow' },
  ETAPA_3_VALIDACION_DOCUMENTOS: { label: 'Etapa 3: Validación de Documentos', color: 'orange' },
  ETAPA_4_ANALISIS_PARQUE: { label: 'Etapa 4: Análisis de Parque', color: 'purple' },
  ETAPA_5_VISITA_PRESENCIAL: { label: 'Etapa 5: Visita Presencial', color: 'indigo' },
  ETAPA_6_INFORME_PRELIMINAR: { label: 'Etapa 6: Informe Preliminar', color: 'pink' },
  ETAPA_7_REVISION_OBSERVACIONES: { label: 'Etapa 7: Revisión de Observaciones', color: 'red' },
  ETAPA_8_INFORME_FINAL: { label: 'Etapa 8: Informe Final', color: 'green' }
};

export const TIPOS_DOCUMENTO = [
  'CONTRATO_SERVICIOS',
  'CERTIFICACION_ISO',
  'PARQUE_INFORMATICO',
  'INFRAESTRUCTURA_TECNOLOGICA',
  'PLAN_CONTINGENCIA',
  'POLITICAS_SEGURIDAD',
  'MANUAL_PROCEDIMIENTOS',
  'CERTIFICADOS_PERSONAL',
  'LICENCIAS_SOFTWARE',
  'BACKUP_PROCEDIMIENTOS',
  'MONITOREO_SISTEMAS',
  'REPORTES_DISPONIBILIDAD',
  'OTROS'
];

export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};