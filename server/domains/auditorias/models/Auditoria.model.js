// Auditoria.model.js - Modelo principal de auditorías técnicas
const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: 'Código único de auditoría (ej: AUD-2025-001)'
  },
  periodo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Período de auditoría (ej: 2025-05, 2025-11)'
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proveedores',
      key: 'id'
    }
  },
  sitio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sitios',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.ENUM(
      'INICIADA',           // Etapa 1: Notificación enviada
      'CARGANDO',          // Etapa 2: Proveedor cargando documentos
      'VALIDANDO',         // Etapa 3: Validación automática en proceso
      'EN_REVISION',       // Etapa 4: Auditor revisando
      'VISITA_PROGRAMADA', // Etapa 5: Visita presencial programada
      'VISITA_REALIZADA',  // Etapa 6: Visita completada
      'INFORME_GENERADO',  // Etapa 7: Informe final generado
      'CERRADA'           // Etapa 8: Auditoría cerrada
    ),
    defaultValue: 'INICIADA',
    allowNull: false
  },
  etapa_actual: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 8
    },
    comment: 'Número de etapa actual (1-8)'
  },
  
  // Fechas clave del proceso
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_limite_carga: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha límite para que el proveedor cargue documentación'
  },
  fecha_carga_completada: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando el proveedor completó la carga'
  },
  fecha_validacion_completada: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se completó la validación automática'
  },
  fecha_revision_completada: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando el auditor completó la revisión'
  },
  fecha_visita: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha programada de visita presencial'
  },
  fecha_informe: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de generación del informe final'
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de cierre de la auditoría'
  },
  
  // Usuarios involucrados
  auditor_asignado_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Auditor principal asignado'
  },
  creado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  
  // Métricas y resultados
  score_automatico: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Score automático de validación ETL + IA'
  },
  score_auditor: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Score asignado por el auditor'
  },
  score_final: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Score final ponderado'
  },
  
  // Contadores de documentos
  documentos_requeridos: {
    type: DataTypes.INTEGER,
    defaultValue: 13,
    comment: 'Total de documentos requeridos'
  },
  documentos_cargados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total de documentos cargados'
  },
  documentos_aprobados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total de documentos aprobados'
  },
  
  // Configuración específica
  requiere_visita: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si requiere visita presencial'
  },
  es_urgente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Marcador de urgencia'
  },
  tiene_excepciones: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si tiene excepciones aprobadas'
  },
  
  // Comentarios y observaciones
  observaciones_proveedor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observaciones_auditor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  justificacion_excepcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Metadata
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Versión del registro para control de cambios'
  }
}, {
  tableName: 'auditorias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['codigo'],
      unique: true
    },
    {
      fields: ['periodo']
    },
    {
      fields: ['proveedor_id']
    },
    {
      fields: ['sitio_id']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['auditor_asignado_id']
    },
    {
      fields: ['fecha_limite_carga']
    }
  ]
});

// Hooks para automatización
Auditoria.beforeCreate(async (auditoria) => {
  // Generar código único
  const year = new Date().getFullYear();
  const count = await Auditoria.count({ where: { periodo: auditoria.periodo } });
  auditoria.codigo = `AUD-${year}-${String(count + 1).padStart(3, '0')}`;
});

Auditoria.beforeUpdate(async (auditoria) => {
  // Incrementar versión en cada actualización
  auditoria.version = (auditoria.version || 1) + 1;
  
  // Actualizar etapa según estado
  const etapaMap = {
    'INICIADA': 1,
    'CARGANDO': 2,
    'VALIDANDO': 3,
    'EN_REVISION': 4,
    'VISITA_PROGRAMADA': 5,
    'VISITA_REALIZADA': 6,
    'INFORME_GENERADO': 7,
    'CERRADA': 8
  };
  
  if (auditoria.changed('estado')) {
    auditoria.etapa_actual = etapaMap[auditoria.estado];
  }
});

module.exports = Auditoria;
