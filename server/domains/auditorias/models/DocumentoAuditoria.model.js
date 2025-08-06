const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const DocumentoAuditoria = sequelize.define('DocumentoAuditoria', {
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
  tipo_documento: {
    type: DataTypes.ENUM(
      'TOPOLOGIA_RED',
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
      'HARDWARE_ADICIONAL'
    ),
    allowNull: false
  },
  es_obligatorio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Marca si el documento es obligatorio (*) según pliego'
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nombre_original: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre original del archivo subido'
  },
  ruta_archivo: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  tipo_mime: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tamaño_bytes: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Versión del documento para control de cambios'
  },
  fecha_ultima_revision: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha indicada por proveedor de última revisión'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones opcionales del proveedor'
  },
  usuario_carga_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  estado_validacion: {
    type: DataTypes.ENUM('PENDIENTE', 'VALIDADO', 'RECHAZADO', 'CON_OBSERVACIONES'),
    defaultValue: 'PENDIENTE'
  },
  comentarios_auditor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  calificacion_auditor: {
    type: DataTypes.ENUM('CUMPLE', 'NO_CUMPLE', 'CUMPLE_CON_OBSERVACIONES'),
    allowNull: true
  },
  fecha_evaluacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  auditor_evaluador_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios', 
      key: 'id'
    }
  },
  // Metadatos específicos del documento
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos específicos del tipo de documento'
  },
  checksum: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Hash SHA-256 para verificar integridad'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
      fields: ['tipo_documento', 'es_obligatorio']
    },
    {
      fields: ['estado_validacion']
    },
    {
      unique: true,
      fields: ['auditoria_id', 'tipo_documento', 'version']
    }
  ]
});

// Configuración de tipos de documentos
DocumentoAuditoria.TIPOS_DOCUMENTOS = {
  TOPOLOGIA_RED: {
    nombre: 'Topología de Red',
    obligatorio: true,
    formatos_aceptados: ['pdf'],
    descripcion: 'Diagrama de topología de red actualizado'
  },
  CUARTO_TECNOLOGIA: {
    nombre: 'Cuarto de Tecnología',
    obligatorio: true,
    formatos_aceptados: ['pdf', 'jpg', 'png', 'xlsx'],
    descripcion: 'Fotografías e inventario del cuarto de tecnología'
  },
  CONECTIVIDAD: {
    nombre: 'Conectividad',
    obligatorio: false,
    formatos_aceptados: ['pdf'],
    descripcion: 'Certificación de cableado estructurado'
  },
  ENERGIA: {
    nombre: 'Energía',
    obligatorio: true,
    formatos_aceptados: ['pdf', 'jpg', 'png'],
    descripcion: 'Mantenimiento UPS, generador, banco baterías, termografías'
  },
  TEMPERATURA_CT: {
    nombre: 'Temperatura CT',
    obligatorio: false,
    formatos_aceptados: ['pdf'],
    descripcion: 'Documentos de mantenimiento de climatización'
  },
  SERVIDORES: {
    nombre: 'Servidores',
    obligatorio: false,
    formatos_aceptados: ['pdf', 'xlsx'],
    descripcion: 'Detalles de software y servidores'
  },
  INTERNET: {
    nombre: 'Internet',
    obligatorio: false,
    formatos_aceptados: ['pdf', 'jpg', 'png'],
    descripcion: 'Histograma de uso de ancho de banda'
  },
  SEGURIDAD_INFORMATICA: {
    nombre: 'Seguridad Informática',
    obligatorio: true,
    formatos_aceptados: ['pdf'],
    descripcion: 'Documentación sistemas de seguridad'
  },
  PERSONAL_CAPACITADO: {
    nombre: 'Personal Capacitado en Sitio',
    obligatorio: false,
    formatos_aceptados: ['pdf', 'xlsx'],
    descripcion: 'Detalle de personal IT y horarios'
  },
  ESCALAMIENTO: {
    nombre: 'Escalamiento',
    obligatorio: false,
    formatos_aceptados: ['pdf'],
    descripcion: 'Contactos y procedimientos de escalamiento'
  },
  INFORMACION_ENTORNO: {
    nombre: 'Información de Entorno',
    obligatorio: false,
    formatos_aceptados: ['pdf', 'txt', 'xlsx'],
    descripcion: 'Logs de navegación de usuarios'
  },
  PARQUE_INFORMATICO: {
    nombre: 'Parque Informático',
    obligatorio: true,
    formatos_aceptados: ['xlsx'],
    descripcion: 'Archivo Excel con formato estándar de equipos'
  },
  HARDWARE_ADICIONAL: {
    nombre: 'Hardware Adicional',
    obligatorio: false,
    formatos_aceptados: ['pdf', 'xlsx'],
    descripcion: 'Información adicional de hardware'
  }
};

// Métodos de instancia
DocumentoAuditoria.prototype.esVersionMasReciente = function() {
  return DocumentoAuditoria.findOne({
    where: {
      auditoria_id: this.auditoria_id,
      tipo_documento: this.tipo_documento
    },
    order: [['version', 'DESC']]
  }).then(ultimaVersion => {
    return this.version === ultimaVersion.version;
  });
};

DocumentoAuditoria.prototype.generarRutaArchivo = function() {
  const fecha = new Date().toISOString().split('T')[0];
  return `uploads/auditorias/${this.auditoria_id}/${this.tipo_documento}/v${this.version}/${fecha}_${this.nombre_archivo}`;
};

// Métodos estáticos
DocumentoAuditoria.obtenerObligatorios = function() {
  return Object.keys(DocumentoAuditoria.TIPOS_DOCUMENTOS).filter(tipo => 
    DocumentoAuditoria.TIPOS_DOCUMENTOS[tipo].obligatorio
  );
};

DocumentoAuditoria.validarFormato = function(tipoDocumento, archivo) {
  const configuracion = DocumentoAuditoria.TIPOS_DOCUMENTOS[tipoDocumento];
  if (!configuracion) return false;
  
  const extension = archivo.originalname.split('.').pop().toLowerCase();
  return configuracion.formatos_aceptados.includes(extension);
};

module.exports = DocumentoAuditoria;