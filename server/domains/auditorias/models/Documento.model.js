const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

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
    }
  },
  seccion: {
    type: DataTypes.ENUM(
      // Atención Presencial
      'topologia',
      'cuarto_tecnologia', 
      'conectividad',
      'energia',
      'temperatura_ct',
      'servidores',
      'internet', 
      'seguridad_informatica',
      'personal_capacitado',
      'escalamiento',
      'informacion_entorno',
      // Parque Informático
      'parque_hardware',
      'conteo_puestos'
    ),
    allowNull: false,
    comment: 'Sección de la auditoría a la que pertenece'
  },
  nombre_original: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre original del archivo subido'
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre del archivo en el sistema'
  },
  ruta_archivo: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Ruta completa del archivo en el sistema'
  },
  tamaño_bytes: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Tamaño del archivo en bytes'
  },
  tipo_mime: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Tipo MIME del archivo'
  },
  extension: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Extensión del archivo'
  },
  
  // Control de versiones
  version: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Versión del documento'
  },
  version_mayor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  version_menor: {
    type: DataTypes.INTEGER,
    allowNull: false, 
    defaultValue: 0
  },
  
  // Metadatos del documento
  fecha_revision: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de última revisión del documento'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones del proveedor sobre el documento'
  },
  
  // Estados y control
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'HISTORICO', 'ELIMINADO'),
    defaultValue: 'ACTIVO',
    allowNull: false
  },
  es_obligatorio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el documento es obligatorio para la sección'
  },
  validado: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'Null=pendiente, true=válido, false=inválido'
  },
  
  // Resultados de validación
  errores_validacion: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Errores encontrados en la validación'
  },
  score_calidad: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Score de calidad del documento (0-100)'
  },
  
  // Metadatos de carga
  cargado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  fecha_carga: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ip_carga: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP desde la que se cargó el documento'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent del navegador'
  },
  
  // Hash para verificación de integridad
  hash_archivo: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Hash SHA-256 del archivo'
  }
}, {
  tableName: 'documentos',
  timestamps: true,
  createdAt: 'fecha_carga',
  updatedAt: false,
  indexes: [
    {
      fields: ['auditoria_id', 'seccion', 'estado']
    },
    {
      fields: ['seccion', 'es_obligatorio']
    },
    {
      fields: ['estado', 'validado']
    },
    {
      fields: ['cargado_por']
    },
    {
      fields: ['fecha_carga']
    },
    {
      unique: true,
      fields: ['auditoria_id', 'seccion', 'version']
    }
  ]
});

// Métodos de instancia
Documento.prototype.obtenerTamañoHumano = function() {
  const bytes = this.tamaño_bytes;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

Documento.prototype.esVersionActual = function() {
  return this.estado === 'ACTIVO';
};

// Métodos estáticos
Documento.incrementarVersion = function(versionActual) {
  const [mayor, menor] = versionActual.split('.').map(Number);
  return `${mayor}.${menor + 1}`;
};

module.exports = Documento;