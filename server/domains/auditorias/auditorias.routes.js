// server/domains/auditorias/auditorias.routes.js
const express = require('express');
const router = express.Router();

// Datos de prueba para desarrollo
const auditoriasPrueba = [
  {
    id: 1,
    codigo: 'AUD-2025-001',
    periodo: '2025-S1',
    estado: 'CARGA_PRESENCIAL',
    etapa_actual: 3,
    fecha_programada: '2025-02-15T09:00:00Z',
    fecha_limite: '2025-02-28T23:59:59Z',
    alcance: 'Auditoría técnica completa sitio principal',
    proveedor: {
      id: 1,
      nombre: 'Proveedor Demo S.A.S'
    },
    auditor_principal: {
      id: 2,
      nombres: 'Juan Carlos',
      apellidos: 'Pérez Auditor'
    },
    total_puestos_os: 25,
    total_puestos_ho: 15,
    score_general: 85.5,
    cumplimiento_critico: true,
    puede_avanzar_etapa: true,
    estadisticas: {
      documentos_cargados: 8
    },
    dias_restantes: 12
  },
  {
    id: 2,
    codigo: 'AUD-2025-002',
    periodo: '2025-S1',
    estado: 'CARGA_PARQUE',
    etapa_actual: 4,
    fecha_programada: '2025-02-20T09:00:00Z',
    fecha_limite: '2025-03-05T23:59:59Z',
    alcance: 'Auditoría técnica sitio secundario',
    proveedor: {
      id: 3,
      nombre: 'TechServ Colombia Ltda'
    },
    auditor_principal: {
      id: 4,
      nombres: 'María Elena',
      apellidos: 'González Técnica'
    },
    total_puestos_os: 18,
    total_puestos_ho: 12,
    score_general: 92.3,
    cumplimiento_critico: true,
    puede_avanzar_etapa: false,
    estadisticas: {
      documentos_cargados: 11
    },
    dias_restantes: 18
  }
];

const documentosPrueba = [
  {
    id: 1,
    auditoria_id: 1,
    seccion_id: 'topologia',
    nombre_archivo: 'topologia_red_v2.pdf',
    fecha_carga: '2025-01-15T10:30:00Z',
    observaciones: 'Diagrama actualizado con últimos cambios'
  },
  {
    id: 2,
    auditoria_id: 1,
    seccion_id: 'cuarto_tecnologia',
    nombre_archivo: 'inventario_datacenter.xlsx',
    fecha_carga: '2025-01-16T14:20:00Z',
    observaciones: 'Inventario completo con fotografías'
  }
];

// ===== RUTAS PRINCIPALES =====

// GET /api/auditorias - Listar auditorías
router.get('/', (req, res) => {
  try {
    const { estado, busqueda, periodo, page = 1, limit = 20 } = req.query;
    
    let auditoriasFiltradas = [...auditoriasPrueba];
    
    // Aplicar filtros
    if (estado) {
      auditoriasFiltradas = auditoriasFiltradas.filter(a => a.estado === estado);
    }
    
    if (busqueda) {
      auditoriasFiltradas = auditoriasFiltradas.filter(a => 
        a.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    
    if (periodo) {
      auditoriasFiltradas = auditoriasFiltradas.filter(a => a.periodo === periodo);
    }
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const auditoriasPaginadas = auditoriasFiltradas.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: auditoriasPaginadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: auditoriasFiltradas.length,
        pages: Math.ceil(auditoriasFiltradas.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo auditorías',
      error: error.message
    });
  }
});

// GET /api/auditorias/:id - Obtener auditoría específica
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { incluir_timeline } = req.query;
    
    const auditoria = auditoriasPrueba.find(a => a.id === parseInt(id));
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }
    
    // Agregar timeline si se solicita
    if (incluir_timeline === 'true') {
      auditoria.timeline = [
        {
          id: 1,
          fecha: '2025-01-15T09:00:00Z',
          descripcion: 'Auditoría creada',
          seccion: null
        },
        {
          id: 2,
          fecha: '2025-01-15T10:30:00Z',
          descripcion: 'Documento cargado: topologia_red_v2.pdf',
          seccion: 'topologia'
        },
        {
          id: 3,
          fecha: '2025-01-16T14:20:00Z',
          descripcion: 'Documento cargado: inventario_datacenter.xlsx',
          seccion: 'cuarto_tecnologia'
        }
      ];
    }
    
    res.json({
      success: true,
      data: auditoria
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo auditoría',
      error: error.message
    });
  }
});

// GET /api/auditorias/:id/documentos - Obtener documentos de auditoría
router.get('/:id/documentos', (req, res) => {
  try {
    const { id } = req.params;
    const { solo_actuales } = req.query;
    
    const auditoria = auditoriasPrueba.find(a => a.id === parseInt(id));
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }
    
    const documentosAuditoria = documentosPrueba.filter(d => d.auditoria_id === parseInt(id));
    
    // Organizar por secciones para el frontend
    const secciones = [
      {
        id: 'topologia',
        nombre: 'Topología',
        obligatoria: false,
        version_actual: documentosAuditoria.find(d => d.seccion_id === 'topologia') || null
      },
      {
        id: 'cuarto_tecnologia',
        nombre: 'Cuarto de Tecnología',
        obligatoria: true,
        version_actual: documentosAuditoria.find(d => d.seccion_id === 'cuarto_tecnologia') || null
      },
      {
        id: 'conectividad',
        nombre: 'Conectividad',
        obligatoria: false,
        version_actual: null
      },
      {
        id: 'energia',
        nombre: 'Energía',
        obligatoria: true,
        version_actual: null
      }
    ];
    
    res.json({
      success: true,
      data: {
        secciones: secciones,
        total_documentos: documentosAuditoria.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo documentos',
      error: error.message
    });
  }
});

// POST /api/auditorias - Crear nueva auditoría
router.post('/', (req, res) => {
  try {
    const nuevaAuditoria = {
      id: auditoriasPrueba.length + 1,
      codigo: `AUD-2025-${String(auditoriasPrueba.length + 1).padStart(3, '0')}`,
      periodo: '2025-S1',
      estado: 'CONFIGURACION',
      etapa_actual: 1,
      ...req.body,
      fecha_creacion: new Date().toISOString(),
      puede_avanzar_etapa: false,
      estadisticas: {
        documentos_cargados: 0
      }
    };
    
    auditoriasPrueba.push(nuevaAuditoria);
    
    res.status(201).json({
      success: true,
      data: nuevaAuditoria,
      message: 'Auditoría creada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando auditoría',
      error: error.message
    });
  }
});

// POST /api/auditorias/:id/avanzar-etapa - Avanzar etapa de auditoría
router.post('/:id/avanzar-etapa', (req, res) => {
  try {
    const { id } = req.params;
    const auditoria = auditoriasPrueba.find(a => a.id === parseInt(id));
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }
    
    if (!auditoria.puede_avanzar_etapa) {
      return res.status(400).json({
        success: false,
        message: 'No se puede avanzar la etapa en este momento'
      });
    }
    
    // Simular avance de etapa
    auditoria.etapa_actual = Math.min(auditoria.etapa_actual + 1, 8);
    
    // Actualizar estado según etapa
    const estadosPorEtapa = {
      1: 'CONFIGURACION',
      2: 'NOTIFICACION',
      3: 'CARGA_PRESENCIAL',
      4: 'CARGA_PARQUE',
      5: 'VALIDACION_AUTOMATICA',
      6: 'REVISION_AUDITOR',
      7: 'NOTIFICACION_RESULTADOS',
      8: 'COMPLETADA'
    };
    
    auditoria.estado = estadosPorEtapa[auditoria.etapa_actual];
    auditoria.puede_avanzar_etapa = auditoria.etapa_actual < 8;
    
    res.json({
      success: true,
      data: auditoria,
      message: `Auditoría avanzada a etapa ${auditoria.etapa_actual}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error avanzando etapa',
      error: error.message
    });
  }
});

module.exports = router;
