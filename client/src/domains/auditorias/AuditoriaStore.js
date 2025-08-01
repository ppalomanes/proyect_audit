// AuditoriaStore.js - Store principal para gestión del módulo de auditorías
import { create } from "zustand";
import useAuthStore from "../auth/authStore";
import useBitacoraStore from "../bitacora/BitacoraStore";

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

// Configuración de las 11 secciones según PDF
const SECCIONES_AUDITORIA = [
  { id: 'topologia', nombre: 'Topología', obligatoria: false, categoria: 'presencial' },
  { id: 'cuarto_tecnologia', nombre: 'Cuarto de Tecnología', obligatoria: true, categoria: 'presencial' },
  { id: 'conectividad', nombre: 'Conectividad', obligatoria: false, categoria: 'presencial' },
  { id: 'energia', nombre: 'Energía', obligatoria: true, categoria: 'presencial' },
  { id: 'temperatura_ct', nombre: 'Temperatura CT', obligatoria: false, categoria: 'presencial' },
  { id: 'servidores', nombre: 'Servidores', obligatoria: false, categoria: 'presencial' },
  { id: 'internet', nombre: 'Internet', obligatoria: false, categoria: 'presencial' },
  { id: 'seguridad_informatica', nombre: 'Seguridad Informática', obligatoria: true, categoria: 'presencial' },
  { id: 'personal_capacitado', nombre: 'Personal Capacitado en Sitio', obligatoria: false, categoria: 'presencial' },
  { id: 'escalamiento', nombre: 'Escalamiento', obligatoria: false, categoria: 'presencial' },
  { id: 'informacion_entorno', nombre: 'Información de Entorno', obligatoria: false, categoria: 'presencial' },
  { id: 'parque_informatico', nombre: 'Parque Informático', obligatoria: true, categoria: 'parque' }
];

// Estados del workflow según flujo documentado
const ESTADOS_AUDITORIA = {
  CONFIGURACION: 'Configuración del Período',
  NOTIFICACION: 'Notificación a Proveedores', 
  CARGA_PRESENCIAL: 'Carga de Información Presencial',
  CARGA_PARQUE: 'Carga de Parque Informático',
  VALIDACION_AUTOMATICA: 'Validación Automática',
  REVISION_AUDITOR: 'Revisión por Auditores',
  NOTIFICACION_RESULTADOS: 'Notificación de Resultados',
  COMPLETADA: 'Completada',
  SUSPENDIDA: 'Suspendida',
  CANCELADA: 'Cancelada'
};

// Store principal de auditorías
const useAuditoriaStore = create((set, get) => ({
  // === ESTADO ===
  auditorias: [],
  auditoriaActual: null,
  secciones: SECCIONES_AUDITORIA,
  seccionActual: null,
  documentos: [],
  parqueInformatico: {
    archivo: null,
    datosNormalizados: [],
    validaciones: [],
    resumenValidacion: null,
    incumplimientos: []
  },
  conteos: {
    totalEquipos: 0,
    equiposOS: 0,
    equiposHO: 0,
    equiposCumplen: 0,
    equiposNoCumplen: 0
  },
  comunicaciones: [],
  
  // Estados de UI
  loading: false,
  error: null,
  modalSeccionAbierto: false,
  modalParqueAbierto: false,
  procesoETLEnCurso: false,
  
  // Filtros y paginación
  filtros: {
    estado: '',
    proveedor: '',
    auditor: '',
    periodo: '',
    fecha_inicio: '',
    fecha_fin: ''
  },

  // === ACCIONES PRINCIPALES ===

  /**
   * Obtener todas las auditorías con filtros
   */
  fetchAuditorias: async () => {
    set({ loading: true, error: null });
    
    try {
      const { filtros } = get();
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filtros).filter(([_, value]) => value !== ''))
      );

      const response = await apiRequest(`/api/auditorias?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo auditorías');
      }

      const data = await response.json();
      
      set({
        auditorias: data.auditorias || [],
        loading: false,
        error: null
      });

      console.log('✅ Auditorías obtenidas:', data.auditorias?.length || 0);
      
    } catch (error) {
      console.error('❌ Error obteniendo auditorías:', error);
      set({
        loading: false,
        error: error.message,
        auditorias: []
      });
    }
  },

  /**
   * Obtener auditoría específica por ID
   */
  fetchAuditoria: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/auditorias/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error obteniendo auditoría');
      }

      const data = await response.json();
      
      set({
        auditoriaActual: data.auditoria,
        documentos: data.documentos || [],
        comunicaciones: data.comunicaciones || [],
        loading: false,
        error: null
      });

      // Registrar acceso en bitácora
      useBitacoraStore.getState().registrarEntrada({
        accion: 'ACCESO_AUDITORIA',
        descripcion: `Acceso a auditoría ${data.auditoria.codigo}`,
        seccion: 'AUDITORIAS',
        auditoria_id: id
      });

      console.log('✅ Auditoría obtenida:', data.auditoria.codigo);
      
    } catch (error) {
      console.error('❌ Error obteniendo auditoría:', error);
      set({
        loading: false,
        error: error.message,
        auditoriaActual: null
      });
    }
  },

  /**
   * Crear nueva auditoría
   */
  crearAuditoria: async (datosAuditoria) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest('/api/auditorias', {
        method: 'POST',
        body: JSON.stringify(datosAuditoria)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando auditoría');
      }

      const data = await response.json();
      
      set(state => ({
        auditorias: [data.auditoria, ...state.auditorias],
        loading: false,
        error: null
      }));

      // Registrar en bitácora
      useBitacoraStore.getState().registrarEntrada({
        accion: 'CREAR_AUDITORIA',
        descripcion: `Nueva auditoría creada: ${data.auditoria.codigo}`,
        seccion: 'AUDITORIAS',
        auditoria_id: data.auditoria.id
      });

      console.log('✅ Auditoría creada:', data.auditoria.codigo);
      return data.auditoria;
      
    } catch (error) {
      console.error('❌ Error creando auditoría:', error);
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // === GESTIÓN DE SECCIONES ===

  /**
   * Abrir modal de sección específica
   */
  abrirSeccion: (seccionId) => {
    const seccion = SECCIONES_AUDITORIA.find(s => s.id === seccionId);
    if (seccion) {
      set({
        seccionActual: seccion,
        modalSeccionAbierto: true
      });
    }
  },

  /**
   * Cerrar modal de sección
   */
  cerrarSeccion: () => {
    set({
      seccionActual: null,
      modalSeccionAbierto: false
    });
  },

  /**
   * Cargar documento para una sección
   */
  cargarDocumentoSeccion: async (auditoriaId, seccionId, archivo, metadatos = {}) => {
    set({ loading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('seccionId', seccionId);
      formData.append('metadatos', JSON.stringify(metadatos));

      const { getAuthHeaders } = useAuthStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/api/auditorias/${auditoriaId}/documentos`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error cargando documento');
      }

      const data = await response.json();
      
      set(state => ({
        documentos: [...state.documentos.filter(d => d.seccion_id !== seccionId), data.documento],
        loading: false,
        error: null
      }));

      // Registrar en bitácora
      useBitacoraStore.getState().registrarEntrada({
        accion: 'CARGAR_DOCUMENTO',
        descripcion: `Documento cargado en sección ${seccionId}`,
        seccion: seccionId.toUpperCase(),
        auditoria_id: auditoriaId
      });

      console.log('✅ Documento cargado para sección:', seccionId);
      return data.documento;
      
    } catch (error) {
      console.error('❌ Error cargando documento:', error);
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // === GESTIÓN DE PARQUE INFORMÁTICO ===

  /**
   * Abrir modal de parque informático
   */
  abrirParqueInformatico: () => {
    set({ modalParqueAbierto: true });
  },

  /**
   * Cerrar modal de parque informático
   */
  cerrarParqueInformatico: () => {
    set({ modalParqueAbierto: false });
  },

  /**
   * Procesar archivo Excel/CSV de parque informático
   */
  procesarParqueInformatico: async (auditoriaId, archivo, configuracion = {}) => {
    set({ procesoETLEnCurso: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('configuracion', JSON.stringify(configuracion));

      const { getAuthHeaders } = useAuthStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/api/auditorias/${auditoriaId}/parque-informatico`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error procesando parque informático');
      }

      const data = await response.json();
      
      set({
        parqueInformatico: {
          archivo: archivo.name,
          datosNormalizados: data.datosNormalizados || [],
          validaciones: data.validaciones || [],
          resumenValidacion: data.resumenValidacion || null,
          incumplimientos: data.incumplimientos || []
        },
        conteos: data.conteos || {},
        procesoETLEnCurso: false,
        error: null
      });

      // Registrar en bitácora
      useBitacoraStore.getState().registrarEntrada({
        accion: 'PROCESAR_PARQUE_INFORMATICO',
        descripcion: `Archivo ${archivo.name} procesado - ${data.conteos?.totalEquipos || 0} equipos`,
        seccion: 'PARQUE_INFORMATICO',
        auditoria_id: auditoriaId
      });

      console.log('✅ Parque informático procesado:', data.conteos);
      return data;
      
    } catch (error) {
      console.error('❌ Error procesando parque informático:', error);
      set({
        procesoETLEnCurso: false,
        error: error.message
      });
      throw error;
    }
  },

  // === GESTIÓN DE WORKFLOW ===

  /**
   * Avanzar a siguiente etapa de la auditoría
   */
  avanzarEtapa: async (auditoriaId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/auditorias/${auditoriaId}/avanzar-etapa`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error avanzando etapa');
      }

      const data = await response.json();
      
      set(state => ({
        auditoriaActual: state.auditoriaActual ? 
          { ...state.auditoriaActual, etapa_actual: data.nuevaEtapa, estado: data.nuevoEstado } : 
          null,
        auditorias: state.auditorias.map(a => 
          a.id === auditoriaId ? 
            { ...a, etapa_actual: data.nuevaEtapa, estado: data.nuevoEstado } : 
            a
        ),
        loading: false,
        error: null
      }));

      // Registrar en bitácora
      useBitacoraStore.getState().registrarEntrada({
        accion: 'AVANZAR_ETAPA',
        descripcion: `Auditoría avanzada a etapa ${data.nuevaEtapa}`,
        seccion: 'WORKFLOW',
        auditoria_id: auditoriaId
      });

      console.log('✅ Etapa avanzada:', data.nuevaEtapa);
      return data;
      
    } catch (error) {
      console.error('❌ Error avanzando etapa:', error);
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Finalizar carga de documentos
   */
  finalizarCarga: async (auditoriaId) => {
    set({ loading: true, error: null });
    
    try {
      // Validar que todas las secciones obligatorias estén completas
      const { documentos, parqueInformatico } = get();
      const seccionesObligatorias = SECCIONES_AUDITORIA.filter(s => s.obligatoria);
      const seccionesCompletas = seccionesObligatorias.filter(s => 
        s.id === 'parque_informatico' ? 
          parqueInformatico.archivo : 
          documentos.some(d => d.seccion_id === s.id)
      );

      if (seccionesCompletas.length < seccionesObligatorias.length) {
        const faltantes = seccionesObligatorias
          .filter(s => !seccionesCompletas.includes(s))
          .map(s => s.nombre);
        throw new Error(`Faltan secciones obligatorias: ${faltantes.join(', ')}`);
      }

      const response = await apiRequest(`/api/auditorias/${auditoriaId}/finalizar-carga`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error finalizando carga');
      }

      const data = await response.json();
      
      set(state => ({
        auditoriaActual: state.auditoriaActual ? 
          { ...state.auditoriaActual, estado: 'VALIDACION_AUTOMATICA' } : 
          null,
        loading: false,
        error: null
      }));

      // Registrar en bitácora
      useBitacoraStore.getState().registrarEntrada({
        accion: 'FINALIZAR_CARGA',
        descripcion: 'Carga de documentos finalizada',
        seccion: 'WORKFLOW',
        auditoria_id: auditoriaId
      });

      console.log('✅ Carga finalizada exitosamente');
      return data;
      
    } catch (error) {
      console.error('❌ Error finalizando carga:', error);
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // === COMUNICACIONES ===

  /**
   * Enviar mensaje/consulta
   */
  enviarMensaje: async (auditoriaId, mensaje) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/auditorias/${auditoriaId}/mensajes`, {
        method: 'POST',
        body: JSON.stringify(mensaje)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error enviando mensaje');
      }

      const data = await response.json();
      
      set(state => ({
        comunicaciones: [...state.comunicaciones, data.mensaje],
        loading: false,
        error: null
      }));

      console.log('✅ Mensaje enviado');
      return data.mensaje;
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // === UTILIDADES ===

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
        estado: '',
        proveedor: '',
        auditor: '',
        periodo: '',
        fecha_inicio: '',
        fecha_fin: ''
      }
    });
  },

  /**
   * Verificar progreso de auditoría
   */
  verificarProgreso: () => {
    const { auditoriaActual, documentos, parqueInformatico } = get();
    if (!auditoriaActual) return 0;

    const totalSecciones = SECCIONES_AUDITORIA.length;
    let seccionesCompletas = 0;

    SECCIONES_AUDITORIA.forEach(seccion => {
      if (seccion.id === 'parque_informatico') {
        if (parqueInformatico.archivo) seccionesCompletas++;
      } else {
        if (documentos.some(d => d.seccion_id === seccion.id)) seccionesCompletas++;
      }
    });

    return Math.round((seccionesCompletas / totalSecciones) * 100);
  },

  /**
   * Obtener estado actual legible
   */
  getEstadoLegible: (estado) => {
    return ESTADOS_AUDITORIA[estado] || estado;
  },

  /**
   * Limpiar errores
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset del store
   */
  reset: () => {
    set({
      auditorias: [],
      auditoriaActual: null,
      seccionActual: null,
      documentos: [],
      parqueInformatico: {
        archivo: null,
        datosNormalizados: [],
        validaciones: [],
        resumenValidacion: null,
        incumplimientos: []
      },
      conteos: {
        totalEquipos: 0,
        equiposOS: 0,
        equiposHO: 0,
        equiposCumplen: 0,
        equiposNoCumplen: 0
      },
      comunicaciones: [],
      loading: false,
      error: null,
      modalSeccionAbierto: false,
      modalParqueAbierto: false,
      procesoETLEnCurso: false
    });
  }
}));

export { useAuditoriaStore, SECCIONES_AUDITORIA, ESTADOS_AUDITORIA };
export default useAuditoriaStore;
