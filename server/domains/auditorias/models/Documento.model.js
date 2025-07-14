/**
 * Modelo Documento - Gestión de Documentos
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');

const defineDocumento = (sequelize) => {
  const Documento = sequelize.define('Documento', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Relaciones
    auditoria_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    documento_padre_id: {
      type: DataTypes.UUID,
      allowNull: true // Para versionado
    },

    // Información del archivo
    nombre_original: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: false // Nombre único en el sistema
    },

    ruta_archivo: {
      type: DataTypes.STRING(500),
      allowNull: false
    },

    url_publica: {
      type: DataTypes.STRING(500),
      allowNull: true
    },

    // Metadatos del archivo
    tamaño_bytes: {
      type: DataTypes.BIGINT,
      allowNull: false
    },

    tipo_mime: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    extension: {
      type: DataTypes.STRING(10),
      allowNull: false
    },

    hash_archivo: {
      type: DataTypes.STRING(64),
      allowNull: true // SHA-256 para verificar integridad
    },

    // Clasificación y categorización
    tipo_documento: {
      type: DataTypes.ENUM,
      values: [
        'CERTIFICADO_CALIDAC',
        'POLITICAS_SEGURIDAD',
        'MANUAL_PROCEDIMIENTOS',
        'CERTIFICADO_ISO',
        'LICENCIAS_SOFTWARE',
        'CONTRATOS_PROVEEDORES',
        'DOCUMENTOS_TECNICOS',
        'DIAGRAMAS_RED',
        'INVENTARIO_HARDWARE',
        'BACKUP_PROCEDURES',
        'DISASTER_RECOVERY',
        'PARQUE_INFORMATICO',
        'OTRO'
      ],
      allowNull: false
    },

    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    es_requerido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    // Estado del documento
    estado: {
      type: DataTypes.ENUM,
      values: [
        'SUBIDO',
        'EN_VALIDACION',
        'VALIDADO',
        'RECHAZADO',
        'REQUIERE_CORRECCION',
        'OBSOLETO'
      ],
      allowNull: false,
      defaultValue: 'SUBIDO'
    },

    // Validación y revisión
    validado_por: {
      type: DataTypes.UUID,
      allowNull: true
    },

    fecha_validacion: {
      type: DataTypes.DATE,
      allowNull: true
    },

    observaciones_validacion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Scoring y análisis automático
    score_completitud: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    score_calidad: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    analisis_ia: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    palabras_clave_detectadas: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    // Versionado
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },

    es_version_actual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    motivo_nueva_version: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Fechas importantes
    fecha_documento: {
      type: DataTypes.DATE,
      allowNull: true // Fecha del documento según su contenido
    },

    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true // Para certificados, licencias, etc.
    },

    // Metadatos adicionales
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    confidencialidad: {
      type: DataTypes.ENUM,
      values: ['PUBLICO', 'INTERNO', 'CONFIDENCIAL', 'RESTRINGIDO'],
      allowNull: false,
      defaultValue: 'INTERNO'
    },

    // Procesamiento automático
    procesado_ocr: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    texto_extraido: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    metadatos_procesamiento: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    // Campos de auditoría
    subido_por: {
      type: DataTypes.UUID,
      allowNull: false
    },

    actualizado_por: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'documentos',
    timestamps: true,
    paranoid: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    deletedAt: 'eliminado_en',
    
    indexes: [
      {
        fields: ['auditoria_id']
      },
      {
        fields: ['tipo_documento']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['subido_por']
      },
      {
        fields: ['validado_por']
      },
      {
        fields: ['es_version_actual']
      },
      {
        fields: ['hash_archivo']
      },
      {
        fields: ['fecha_vencimiento']
      }
    ],

    scopes: {
      activos: {
        where: {
          es_version_actual: true,
          estado: {
            [sequelize.Sequelize.Op.ne]: 'OBSOLETO'
          }
        }
      },
      
      validados: {
        where: {
          estado: 'VALIDADO'
        }
      },
      
      pendientes: {
        where: {
          estado: {
            [sequelize.Sequelize.Op.in]: ['SUBIDO', 'EN_VALIDACION']
          }
        }
      },

      porTipo: (tipo) => ({
        where: {
          tipo_documento: tipo
        }
      })
    }
  });

  // Métodos de instancia
  Documento.prototype.puedeSerValidado = function() {
    return ['SUBIDO', 'EN_VALIDACION', 'REQUIERE_CORRECCION'].includes(this.estado);
  };

  Documento.prototype.validar = async function(validadorId, observaciones = null) {
    if (!this.puedeSerValidado()) {
      throw new Error('El documento no puede ser validado en su estado actual');
    }

    this.estado = 'VALIDADO';
    this.validado_por = validadorId;
    this.fecha_validacion = new Date();
    this.observaciones_validacion = observaciones;
    
    await this.save();
  };

  Documento.prototype.rechazar = async function(validadorId, motivo) {
    this.estado = 'RECHAZADO';
    this.validado_por = validadorId;
    this.fecha_validacion = new Date();
    this.observaciones_validacion = motivo;
    
    await this.save();
  };

  Documento.prototype.estaVencido = function() {
    if (!this.fecha_vencimiento) return false;
    return new Date() > new Date(this.fecha_vencimiento);
  };

  Documento.prototype.diasParaVencimiento = function() {
    if (!this.fecha_vencimiento) return null;
    
    const ahora = new Date();
    const vencimiento = new Date(this.fecha_vencimiento);
    const diferencia = vencimiento.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  };

  Documento.prototype.generarNuevaVersion = async function(nuevoArchivo, motivo) {
    // Marcar versión actual como no actual
    this.es_version_actual = false;
    await this.save();

    // Crear nueva versión
    const nuevaVersion = await this.constructor.create({
      ...nuevoArchivo,
      auditoria_id: this.auditoria_id,
      documento_padre_id: this.documento_padre_id || this.id,
      tipo_documento: this.tipo_documento,
      version: this.version + 1,
      motivo_nueva_version: motivo,
      es_version_actual: true
    });

    return nuevaVersion;
  };

  Documento.prototype.getTamañoLegible = function() {
    const bytes = this.tamaño_bytes;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Métodos estáticos
  Documento.buscarPorAuditoria = async function(auditoriaId) {
    return await this.scope('activos').findAll({
      where: { auditoria_id: auditoriaId },
      order: [['tipo_documento', 'ASC'], ['creado_en', 'DESC']]
    });
  };

  Documento.buscarPendientesValidacion = async function() {
    return await this.scope('pendientes').findAll({
      order: [['creado_en', 'ASC']]
    });
  };

  Documento.buscarProximosAVencer = async function(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return await this.findAll({
      where: {
        fecha_vencimiento: {
          [sequelize.Sequelize.Op.between]: [new Date(), fechaLimite]
        },
        estado: 'VALIDADO'
      },
      order: [['fecha_vencimiento', 'ASC']]
    });
  };

  Documento.buscarPorTipo = async function(tipo, auditoriaId = null) {
    const where = { tipo_documento: tipo };
    if (auditoriaId) {
      where.auditoria_id = auditoriaId;
    }

    return await this.scope('activos').findAll({
      where,
      order: [['creado_en', 'DESC']]
    });
  };

  return Documento;
};

module.exports = defineDocumento;
