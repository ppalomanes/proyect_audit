// client/src/domains/auditorias/services/auditoriaService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuditoriaService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/auditorias`;
  }

  // Helper para manejar requests con autenticación
  async fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };

    // No agregar Content-Type para FormData (multipart)
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // ✅ Manejo optimizado de errores
      const errorMessage = errorData.message || 
                          errorData.error || 
                          `Error ${response.status}: ${response.statusText}`;
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ====================================
  // GESTIÓN DE AUDITORÍAS
  // ====================================

  async obtenerAuditorias(filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.fetchWithAuth(`${this.baseURL}?${params}`);
  }

  async obtenerAuditoriaPorId(auditoriaId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}`);
  }

  async crearAuditoria(datosAuditoria) {
    return this.fetchWithAuth(this.baseURL, {
      method: 'POST',
      body: JSON.stringify(datosAuditoria)
    });
  }

  async actualizarAuditoria(auditoriaId, datos) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    });
  }

  // ====================================
  // GESTIÓN DE DOCUMENTOS POR SECCIÓN
  // ====================================

  async cargarDocumento(auditoriaId, seccion, formData) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/documentos/${seccion}`, {
      method: 'POST',
      body: formData // FormData ya incluye el archivo y metadatos
    });
  }

  async actualizarDocumento(auditoriaId, documentoId, formData) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/documentos/${documentoId}`, {
      method: 'PUT',
      body: formData
    });
  }

  async eliminarDocumento(auditoriaId, documentoId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/documentos/${documentoId}`, {
      method: 'DELETE'
    });
  }

  async obtenerDocumentos(auditoriaId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/documentos`);
  }

  // ====================================
  // PROCESAMIENTO ETL PARQUE INFORMÁTICO
  // ====================================

  async procesarParqueInformatico(auditoriaId, formData) {
    return this.fetchWithAuth(`${API_BASE_URL}/etl/process`, {
      method: 'POST',
      body: formData, // FormData con archivo + configuración
      headers: {
        'X-Auditoria-ID': auditoriaId // Header personalizado para asociar con auditoría
      }
    });
  }

  async obtenerEstadoJob(jobId) {
    return this.fetchWithAuth(`${API_BASE_URL}/etl/jobs/${jobId}/status`);
  }

  async obtenerResultadosJob(jobId) {
    return this.fetchWithAuth(`${API_BASE_URL}/etl/jobs/${jobId}/results`);
  }

  async validarArchivoETL(formData) {
    return this.fetchWithAuth(`${API_BASE_URL}/etl/validate-only`, {
      method: 'POST',
      body: formData
    });
  }

  // ====================================
  // WORKFLOW DE ETAPAS
  // ====================================

  async finalizarCargaDocumentos(auditoriaId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/finalizar-carga`, {
      method: 'POST'
    });
  }

  async enviarAEvaluacion(auditoriaId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/enviar-evaluacion`, {
      method: 'POST'
    });
  }

  // ====================================
  // COMUNICACIONES Y MENSAJERÍA
  // ====================================

  async enviarMensaje(auditoriaId, mensaje) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/mensajes`, {
      method: 'POST',
      body: JSON.stringify(mensaje)
    });
  }

  async obtenerMensajes(auditoriaId, filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/mensajes?${params}`);
  }

  // ====================================
  // INCUMPLIMIENTOS Y VALIDACIONES
  // ====================================

  async obtenerIncumplimientos(auditoriaId, filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/incumplimientos?${params}`);
  }

  async exportarIncumplimientos(auditoriaId, formato = 'excel') {
    const token = localStorage.getItem('auth_token');
    const url = `${this.baseURL}/${auditoriaId}/incumplimientos/export?formato=${formato}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error exportando incumplimientos: ${response.statusText}`);
    }

    return response.blob();
  }

  // ====================================
  // REPORTES Y MÉTRICAS
  // ====================================

  async obtenerResumenAuditoria(auditoriaId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/resumen`);
  }

  async obtenerMetricasAuditoria(auditoriaId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/metricas`);
  }

  // ====================================
  // CONFIGURACIÓN Y PLANTILLAS
  // ====================================

  async obtenerUmbralesTecnicos() {
    return this.fetchWithAuth(`${API_BASE_URL}/etl/validation-rules`);
  }

  // ====================================
  // HISTORIAL Y TRAZABILIDAD
  // ====================================

  async obtenerHistorialCambios(auditoriaId) {
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/historial`);
  }

  async obtenerBitacora(auditoriaId, filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.fetchWithAuth(`${this.baseURL}/${auditoriaId}/bitacora?${params}`);
  }
}

// Crear instancia singleton
const auditoriaService = new AuditoriaService();

export { auditoriaService };
export default auditoriaService;