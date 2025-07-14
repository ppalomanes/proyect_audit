/**
 * Modelo Auditoria - Gestión de Auditorías
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');

const defineAuditoria = (sequelize) => {
  const Auditoria = sequelize.define('Auditoria', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Información básica
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [5, 255],
          msg: 'Título debe tener entre 5 y 255 caracteres'
        }
      }
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    codigo_auditoria: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },

    // Clasificación
    tipo_auditoria: {
      type: DataTypes.ENUM,
      values: ['INICIAL', 'SEGUIMIENTO', 'EXTRAORDINARIA', 'RENOVACION'],
      allowNull: false,
      defaultValue: 'INICIAL'
    },

    modalidad: {
      type: DataTypes.ENUM,
      values: ['PRESENCIAL', 'VIRTUAL', 'HIBRIDA'],
      allowNull: false,
      defaultValue: 'HIBRIDA'
    },

    // Relaciones principales
    proveedor_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    auditor_principal_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    auditor_secundario_id: {
      type: DataTypes.UUID,
      allowNull: true
    },

    // Fechas y programación
    fecha_programada: {
      type: DataTypes.DATE,
      allowNull: false
    },

    fecha_inicio_real: {
      type: DataTypes.DATE,
      allowNull: true
    },

    fecha_fin_programada: {
      type: DataTypes.DATE,
      allowNull: true
    },

    fecha_fin_real: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Estado del proceso
    estado: {
      type: DataTypes.ENUM,
      values: [
        'PROGRAMADA',
        'ETAPA_1_NOTIFICACION',
        'ETAPA_2_CARGA_DOCUMENTOS', 
        'ETAPA_3_VALIDACION_DOCUMENTOS',
        'ETAPA_4_ANALISIS_PARQUE',
        'ETAPA_5_VISITA_PRESENCIAL',
        'ETAPA_6_INFORME_PRELIMINAR',
        'ETAPA_7_REVISION_OBSERVACIONES',
        'ETAPA_8_INFORME_FINAL',
        'COMPLETADA',
        'CANCELADA',
        'SUSPENDIDA'
      ],
      allowNull: false,
      defaultValue: 'PROGRAMADA'
    },

    etapa_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 8
      }
    },

    progreso_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    // Configuración técnica
    version_pliego: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    criterios_evaluacion: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    configuracion_etapas: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        etapa_1: { dias_limite: 5, notificaciones: true },
        etapa_2: { dias_limite: 15, documentos_requeridos: 13 },
        etapa_3: { dias_limite: 10, requiere_validacion_manual: true },
        etapa_4: { dias_limite: 7, requiere_ia: true },
        etapa_5: { dias_limite: 3, modalidad: 'presencial' },
        etapa_6: { dias_limite: 5, requiere_revision: true },
        etapa_7: { dias_limite: 10, permite_observaciones: true },
        etapa_8: { dias_limite: 5, genera_certificado: true }
      }
    },

    // Información de visita presencial
    direccion_visita: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    fecha_visita_programada: {
      type: DataTypes.DATE,
      allowNull: true
    },

    duracion_estimada_dias: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30
    },

    // Resultados y scoring
    puntaje_total: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    puntajes_por_categoria: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    nivel_cumplimiento: {
      type: DataTypes.ENUM,
      values: ['EXCELENTE', 'BUENO', 'ACEPTABLE', 'DEFICIENTE', 'CRITICO'],
      allowNull: true
    },

    // Observaciones y notas
    observaciones_generales: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    recomendaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    observaciones_proveedor: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Archivos y documentos finales
    informe_final_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    certificado_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    // Metadatos de seguimiento
    notificaciones_enviadas: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    historial_cambios: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    // Campos de auditoría
    creado_por: {
      type: DataTypes.UUID,
      allowNull: true
    },

    actualizado_por: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'auditorias',
    timestamps: true,
    paranoid: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    deletedAt: 'eliminado_en',
    
    indexes: [
      {
        unique: true,
        fields: ['codigo_auditoria']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['etapa_actual']
      },
      {
        fields: ['proveedor_id']
      },
      {
        fields: ['auditor_principal_id']
      },
      {
        fields: ['fecha_programada']
      },
      {
        fields: ['tipo_auditoria']
      }
    ],

    scopes: {
      activas: {
        where: {
          estado: {
            [sequelize.Sequelize.Op.notIn]: ['COMPLETADA', 'CANCELADA']
          }
        }
      },
      
      porEtapa: (etapa) => ({
        where: {
          etapa_actual: etapa
        }
      }),
      
      porAuditor: (auditorId) => ({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { auditor_principal_id: auditorId },
            { auditor_secundario_id: auditorId }
          ]
        }
      })
    }
  });

  // Métodos de instancia
  Auditoria.prototype.puedeAvanzarEtapa = function() {
    return this.estado !== 'COMPLETADA' && this.estado !== 'CANCELADA';
  };

  Auditoria.prototype.avanzarEtapa = async function() {
    if (!this.puedeAvanzarEtapa()) {
      throw new Error('No se puede avanzar la etapa en el estado actual');
    }

    this.etapa_actual += 1;
    this.progreso_porcentaje = (this.etapa_actual / 8) * 100;
    
    // Actualizar estado según la etapa
    const estadosPorEtapa = {
      1: 'ETAPA_1_NOTIFICACION',
      2: 'ETAPA_2_CARGA_DOCUMENTOS',
      3: 'ETAPA_3_VALIDACION_DOCUMENTOS',
      4: 'ETAPA_4_ANALISIS_PARQUE',
      5: 'ETAPA_5_VISITA_PRESENCIAL',
      6: 'ETAPA_6_INFORME_PRELIMINAR',
      7: 'ETAPA_7_REVISION_OBSERVACIONES',
      8: 'ETAPA_8_INFORME_FINAL'
    };

    this.estado = estadosPorEtapa[this.etapa_actual] || 'COMPLETADA';
    
    if (this.etapa_actual >= 8) {
      this.fecha_fin_real = new Date();
      this.estado = 'COMPLETADA';
    }

    await this.save();
  };

  Auditoria.prototype.generarCodigoAuditoria = function() {
    const año = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AUD-${año}${mes}-${random}`;
  };

  Auditoria.prototype.calcularDiasRestantes = function() {
    if (!this.fecha_fin_programada) return null;
    
    const ahora = new Date();
    const fin = new Date(this.fecha_fin_programada);
    const diferencia = fin.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  };

  Auditoria.prototype.estaVencida = function() {
    const diasRestantes = this.calcularDiasRestantes();
    return diasRestantes !== null && diasRestantes < 0;
  };

  // Métodos estáticos
  Auditoria.buscarPorCodigo = async function(codigo) {
    return await this.findOne({
      where: { codigo_auditoria: codigo }
    });
  };

  Auditoria.buscarActivas = async function() {
    return await this.scope('activas').findAll({
      order: [['fecha_programada', 'ASC']]
    });
  };

  Auditoria.buscarPorProveedor = async function(proveedorId) {
    return await this.findAll({
      where: { proveedor_id: proveedorId },
      order: [['creado_en', 'DESC']]
    });
  };

  return Auditoria;
};

module.exports = defineAuditoria;
