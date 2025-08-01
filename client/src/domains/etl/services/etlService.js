// ETL Service - API Client
// Portal de Auditorías Técnicas

import apiClient from '../../shared/services/apiClient';

class ETLService {
  constructor() {
    this.baseURL = '/api/etl';
  }

  /**
   * Validar archivo sin procesarlo (dry-run)
   */
  async validateFile(file, options = {}) {
    const formData = new FormData();
    formData.append('archivo', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    // Agregar callback de progreso si se proporciona
    if (options.onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        options.onProgress(progress);
      };
    }

    const response = await apiClient.post(`${this.baseURL}/validate-only`, formData, config);
    return response.data;
  }

  /**
   * Procesar archivo de parque informático
   */
  async processFile(file, auditoriaId, configuracion = {}, options = {}) {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('auditoria_id', auditoriaId);
    formData.append('configuracion', JSON.stringify(configuracion));

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    // Agregar callback de progreso si se proporciona
    if (options.onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        options.onProgress(progress);
      };
    }

    const response = await apiClient.post(`${this.baseURL}/process`, formData, config);
    return response.data;
  }

  /**
   * Obtener lista de trabajos ETL
   */
  async getJobs(filters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`${this.baseURL}/jobs?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtener estado de un trabajo ETL
   */
  async getJobStatus(jobId) {
    const response = await apiClient.get(`${this.baseURL}/jobs/${jobId}/status`);
    return response.data;
  }

  /**
   * Obtener resultados completos de un trabajo ETL
   */
  async getJobResults(jobId) {
    const response = await apiClient.get(`${this.baseURL}/jobs/${jobId}/results`);
    return response.data;
  }

  /**
   * Obtener datos de parque informático procesados
   */
  async getParqueInformatico(auditoriaId, filters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(
      `${this.baseURL}/parque-informatico/${auditoriaId}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Obtener reglas de validación
   */
  async getValidationRules(categoria = null) {
    const params = categoria ? `?categoria=${categoria}` : '';
    const response = await apiClient.get(`${this.baseURL}/validation-rules${params}`);
    return response.data;
  }

  /**
   * Crear reglas de validación por defecto
   */
  async createDefaultRules() {
    const response = await apiClient.post(`${this.baseURL}/validation-rules/defaults`);
    return response.data;
  }

  /**
   * Obtener métricas ETL
   */
  async getMetrics(auditoriaId = null) {
    const params = auditoriaId ? `?auditoria_id=${auditoriaId}` : '';
    const response = await apiClient.get(`${this.baseURL}/metrics${params}`);
    return response.data;
  }

  /**
   * Limpiar datos antiguos
   */
  async cleanupOldData(days = 30) {
    const response = await apiClient.delete(`${this.baseURL}/cleanup?dias=${days}`);
    return response.data;
  }

  /**
   * Health check del módulo ETL
   */
  async healthCheck() {
    const response = await apiClient.get(`${this.baseURL}/health`);
    return response.data;
  }

  /**
   * Información general del módulo
   */
  async getInfo() {
    const response = await apiClient.get(`${this.baseURL}/info`);
    return response.data;
  }

  // === UTILIDADES ===

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validar tipo de archivo
   */
  validateFileType(file) {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
  }

  /**
   * Obtener icono según tipo de archivo
   */
  getFileIcon(fileName) {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    switch (extension) {
      case '.xlsx':
      case '.xls':
        return '📊';
      case '.csv':
        return '📄';
      default:
        return '📁';
    }
  }

  /**
   * Formatear duración
   */
  formatDuration(ms) {
    if (!ms) return '-';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Obtener color según nivel de cumplimiento
   */
  getComplianceColor(nivel) {
    const colors = {
      'EXCELENTE': 'text-green-600 bg-green-100',
      'BUENO': 'text-blue-600 bg-blue-100',
      'ACEPTABLE': 'text-yellow-600 bg-yellow-100',
      'DEFICIENTE': 'text-orange-600 bg-orange-100',
      'CRITICO': 'text-red-600 bg-red-100'
    };
    
    return colors[nivel] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Obtener color según estado ETL
   */
  getStatusColor(estado) {
    const colors = {
      'INICIADO': 'text-blue-600 bg-blue-100',
      'PARSEANDO': 'text-yellow-600 bg-yellow-100',
      'NORMALIZANDO': 'text-purple-600 bg-purple-100',
      'VALIDANDO': 'text-orange-600 bg-orange-100',
      'SCORING': 'text-indigo-600 bg-indigo-100',
      'COMPLETADO': 'text-green-600 bg-green-100',
      'ERROR': 'text-red-600 bg-red-100',
      'CANCELADO': 'text-gray-600 bg-gray-100',
      'VALIDADO': 'text-green-600 bg-green-100',
      'PROCESANDO': 'text-yellow-600 bg-yellow-100'
    };
    
    return colors[estado] || 'text-gray-600 bg-gray-100';
  }
}

// Instancia singleton
export const etlService = new ETLService();
export default etlService;