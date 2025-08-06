// Documento.model.js - Modelo para documentos de auditoría
const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Documento = sequelize.define('Documento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'auditorias',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tipo_documento: {
    type: DataTypes.ENUM(
      'TOPOLOGIA',
      'CUARTO_TECNOLOGIA',
      'CONECTIVIDAD',
      'ENERGIA',
      'TEMPERATURA_CT',
      'SERVIDORES',
      'INTERNET',
      'SEGURIDAD_INFORMATICA',
      'PERSONAL_CAPACITADO',
      'ESCALAMIENTO',
      'INFORMACION_ENTORNO',
      'PARQUE_INFORMATICO',
      'HARDWARE_SOFTWARE',
      'ACTA_VISITA',
      'FOTOGRAFIAS_VISITA',
      'INFORME_FINAL',
      'OTRO'
    ),
    allowNull: false
  },
  nombre_documento: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre descriptivo del documento'
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre del archivo en el sistema'
  },
  ruta_archivo: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Ruta completa del archivo en el servidor'
  },
  
  // Metadata del archivo
  tipo_mime: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Tipo MIME del archivo'
  },
  tamaño_bytes: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Tamaño del archivo en bytes'
  },
  extension: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Extensión del archivo'
  },
  hash_archivo: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Hash SHA256 del archivo para integridad'
  },
  
  // Estado y validación
  estado: {
    type: DataTypes.ENUM(
      'CARGADO',
      'VALIDANDO',
      'APROBADO',
      'RECHAZADO',
      'REQUIERE_REVISION',
      'REEMPLAZADO'
    ),
    defaultValue: 'CARGADO',
    allowNull: false
  },
  es_obligatorio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si el documento es obligatorio para esta auditoría'
  },
  
  // Versionado
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Versión del documento'
  },
  documento_padre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'documentos_auditoria',
      key: 'id'
    },
    comment: 'ID del documento anterior si es una nueva versión'
  },
  es_version_actual: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si es la versión más reciente'
  },
  
  // Fechas importantes
  fecha_carga: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_ultima_revision: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de última revisión del documento'
  },
  fecha_aprobacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando fue aprobado'
  },
  fecha_vencimiento: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de vencimiento del documento si aplica'
  },
  
  // Usuarios involucrados
  cargado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  revisado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  aprobado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  
  // Validación y scoring
  score_validacion: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Score de validación automática'
  },
  score_ia: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Score de análisis IA'
  },
  validaciones_fallidas: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de validaciones que fallaron'
  },
  
  // Observaciones y comentarios
  observaciones_proveedor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observaciones_auditor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  razon_rechazo: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razón si el documento fue rechazado'
  },
  
  // Procesamiento ETL/IA
  procesado_etl: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si fue procesado por ETL'
  },
  procesado_ia: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si fue analizado por IA'
  },
  resultado_etl: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Resultado del procesamiento ETL'
  },
  resultado_ia: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Resultado del análisis IA'
  },
  
  // Control
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'documentos_auditoria',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['auditoria_id', 'tipo_documento']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['cargado_por_id']
    },
    {
      fields: ['es_version_actual']
    },
    {
      fields: ['hash_archivo']
    }
  ]
});

// Configuración de documentos obligatorios por tipo
Documento.DOCUMENTOS_OBLIGATORIOS = {
  'ATENCION_PRESENCIAL': [
    'CUARTO_TECNOLOGIA',
    'ENERGIA',
    'SEGURIDAD_INFORMATICA'
  ],
  'ATENCION_REMOTA': [
    'PARQUE_INFORMATICO',
    'HARDWARE_SOFTWARE'
  ]
};

// Hook para manejar versionado
Documento.beforeCreate(async (documento) => {
  // Si hay un documento del mismo tipo, marcarlo como no actual
  if (documento.auditoria_id && documento.tipo_documento) {
    const documentoAnterior = await Documento.findOne({
      where: {
        auditoria_id: documento.auditoria_id,
        tipo_documento: documento.tipo_documento,
        es_version_actual: true
      },
      order: [['version', 'DESC']]
    });
    
    if (documentoAnterior) {
      documento.version = (documentoAnterior.version || 1) + 1;
      documento.documento_padre_id = documentoAnterior.id;
      await documentoAnterior.update({ es_version_actual: false });
    }
  }
});

module.exports = Documento;
