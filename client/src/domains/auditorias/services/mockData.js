// Mock data para testing del frontend sin backend
export const mockData = {
  auditorias: [
    {
      id: 1,
      codigo_auditoria: 'AUD-2025-001',
      estado: 'ETAPA_2_CARGA_DOCUMENTOS',
      etapa_actual: 2,
      fecha_programada: '2025-01-20',
      fecha_creacion: '2025-01-15',
      alcance: 'Auditoría técnica completa de infraestructura y procesos de call center',
      observaciones: 'Primera auditoría del año 2025',
      proveedor: {
        id: 1,
        nombre: 'Call Center Solutions SAS',
        email: 'contacto@callcentersolutions.com'
      },
      auditor_principal: {
        id: 2,
        nombre: 'María García',
        email: 'auditor@portal-auditorias.com'
      },
      auditor_secundario: null
    },
    {
      id: 2,
      codigo_auditoria: 'AUD-2025-002',
      estado: 'ETAPA_5_VISITA_PRESENCIAL',
      etapa_actual: 5,
      fecha_programada: '2025-01-25',
      fecha_creacion: '2025-01-10',
      alcance: 'Auditoría de cumplimiento de estándares de seguridad',
      observaciones: 'Seguimiento de observaciones previas',
      proveedor: {
        id: 2,
        nombre: 'TeleMark Pro LTDA',
        email: 'info@telemarkpro.com'
      },
      auditor_principal: {
        id: 2,
        nombre: 'María García',
        email: 'auditor@portal-auditorias.com'
      },
      auditor_secundario: {
        id: 3,
        nombre: 'Carlos López',
        email: 'carlos.lopez@portal-auditorias.com'
      }
    },
    {
      id: 3,
      codigo_auditoria: 'AUD-2025-003',
      estado: 'ETAPA_8_INFORME_FINAL',
      etapa_actual: 8,
      fecha_programada: '2025-01-30',
      fecha_creacion: '2025-01-05',
      alcance: 'Auditoría de continuidad de negocio y plan de contingencias',
      observaciones: 'Auditoría completada exitosamente',
      proveedor: {
        id: 3,
        nombre: 'Contact Center Elite',
        email: 'gerencia@contactelite.com'
      },
      auditor_principal: {
        id: 2,
        nombre: 'María García',
        email: 'auditor@portal-auditorias.com'
      },
      auditor_secundario: null
    },
    {
      id: 4,
      codigo_auditoria: 'AUD-2025-004',
      estado: 'PROGRAMADA',
      etapa_actual: 0,
      fecha_programada: '2025-02-05',
      fecha_creacion: '2025-01-17',
      alcance: 'Auditoría inicial de nuevo proveedor',
      observaciones: 'Primera evaluación',
      proveedor: {
        id: 4,
        nombre: 'Digital Voice Services',
        email: 'admin@digitalvoice.com'
      },
      auditor_principal: {
        id: 2,
        nombre: 'María García',
        email: 'auditor@portal-auditorias.com'
      },
      auditor_secundario: null
    }
  ],
  
  proveedores: [
    { id: 1, nombre: 'Call Center Solutions SAS', email: 'contacto@callcentersolutions.com' },
    { id: 2, nombre: 'TeleMark Pro LTDA', email: 'info@telemarkpro.com' },
    { id: 3, nombre: 'Contact Center Elite', email: 'gerencia@contactelite.com' },
    { id: 4, nombre: 'Digital Voice Services', email: 'admin@digitalvoice.com' },
    { id: 5, nombre: 'Customer Care Solutions', email: 'contacto@customercare.com' }
  ],
  
  auditores: [
    { id: 2, nombre: 'María García', email: 'auditor@portal-auditorias.com', rol: 'AUDITOR' },
    { id: 3, nombre: 'Carlos López', email: 'carlos.lopez@portal-auditorias.com', rol: 'AUDITOR' },
    { id: 4, nombre: 'Ana Martínez', email: 'ana.martinez@portal-auditorias.com', rol: 'AUDITOR' },
    { id: 5, nombre: 'Luis Rodríguez', email: 'luis.rodriguez@portal-auditorias.com', rol: 'AUDITOR' }
  ],
  
  estadisticas: {
    total: 4,
    enProceso: 2,
    completadas: 1,
    pendientes: 1,
    programadas: 1,
    enProgreso: 2,
    tiempoPromedio: '15 días',
    tasaExito: '95%'
  }
};

// Mock service para simular llamadas al backend
export const mockAuditoriasService = {
  async getAuditorias(params = {}) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let filteredAuditorias = [...mockData.auditorias];
    
    // Aplicar filtros
    if (params.estado) {
      filteredAuditorias = filteredAuditorias.filter(a => a.estado === params.estado);
    }
    if (params.etapa) {
      filteredAuditorias = filteredAuditorias.filter(a => a.etapa_actual.toString() === params.etapa);
    }
    if (params.proveedor) {
      filteredAuditorias = filteredAuditorias.filter(a => a.proveedor.id.toString() === params.proveedor);
    }
    if (params.auditor) {
      filteredAuditorias = filteredAuditorias.filter(a => 
        a.auditor_principal.id.toString() === params.auditor ||
        (a.auditor_secundario && a.auditor_secundario.id.toString() === params.auditor)
      );
    }
    
    // Paginación
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const total = filteredAuditorias.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      auditorias: filteredAuditorias.slice(startIndex, endIndex),
      total,
      totalPages,
      currentPage: page
    };
  },

  async getAuditoriaById(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const auditoria = mockData.auditorias.find(a => a.id.toString() === id.toString());
    if (!auditoria) {
      throw new Error('Auditoría no encontrada');
    }
    return auditoria;
  },

  async createAuditoria(data) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newAuditoria = {
      id: mockData.auditorias.length + 1,
      codigo_auditoria: `AUD-2025-${String(mockData.auditorias.length + 1).padStart(3, '0')}`,
      estado: 'PROGRAMADA',
      etapa_actual: 0,
      fecha_creacion: new Date().toISOString().split('T')[0],
      ...data,
      proveedor: mockData.proveedores.find(p => p.id.toString() === data.proveedor_id),
      auditor_principal: mockData.auditores.find(a => a.id.toString() === data.auditor_principal_id),
      auditor_secundario: data.auditor_secundario_id ? 
        mockData.auditores.find(a => a.id.toString() === data.auditor_secundario_id) : null
    };
    
    mockData.auditorias.push(newAuditoria);
    
    // Actualizar estadísticas
    mockData.estadisticas.total++;
    mockData.estadisticas.programadas++;
    
    return newAuditoria;
  },

  async updateAuditoria(id, data) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = mockData.auditorias.findIndex(a => a.id.toString() === id.toString());
    if (index === -1) {
      throw new Error('Auditoría no encontrada');
    }
    
    mockData.auditorias[index] = { ...mockData.auditorias[index], ...data };
    return mockData.auditorias[index];
  },

  async avanzarEtapa(id, observaciones = '') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const auditoria = mockData.auditorias.find(a => a.id.toString() === id.toString());
    if (!auditoria) {
      throw new Error('Auditoría no encontrada');
    }
    
    if (auditoria.etapa_actual >= 8) {
      throw new Error('La auditoría ya está en la etapa final');
    }
    
    auditoria.etapa_actual++;
    
    // Actualizar estado según etapa
    const estadosPorEtapa = {
      0: 'PROGRAMADA',
      1: 'ETAPA_1_NOTIFICACION',
      2: 'ETAPA_2_CARGA_DOCUMENTOS',
      3: 'ETAPA_3_VALIDACION_DOCUMENTOS',
      4: 'ETAPA_4_ANALISIS_PARQUE',
      5: 'ETAPA_5_VISITA_PRESENCIAL',
      6: 'ETAPA_6_INFORME_PRELIMINAR',
      7: 'ETAPA_7_REVISION_OBSERVACIONES',
      8: 'ETAPA_8_INFORME_FINAL'
    };
    
    auditoria.estado = estadosPorEtapa[auditoria.etapa_actual];
    
    // Actualizar estadísticas si se completa
    if (auditoria.etapa_actual === 8) {
      mockData.estadisticas.completadas++;
      mockData.estadisticas.enProceso--;
    }
    
    return auditoria;
  },

  async getEstadisticas() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockData.estadisticas;
  },

  async getProveedores() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockData.proveedores;
  },

  async getAuditores() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockData.auditores;
  },

  async getHistorial(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        fecha: '2025-01-15',
        accion: 'Auditoría creada',
        usuario: 'Administrador Portal',
        observaciones: 'Auditoría programada inicialmente'
      },
      {
        id: 2,
        fecha: '2025-01-16',
        accion: 'Avanzó a Etapa 1',
        usuario: 'María García',
        observaciones: 'Notificación enviada al proveedor'
      }
    ];
  }
};

// Flag para activar/desactivar modo mock
export const USE_MOCK_DATA = true;