/**
 * Modelo ETLError - Log detallado de errores ETL
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');

const defineETLError = (sequelize) => {
  const ETLError = sequelize.define('ETLError', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Relaciones
    job_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    parque_informatico_id: {
      type: DataTypes.UUID,
      allowNull: true // Puede ser null si el error es a nivel de job
    },

    // Información del error
    tipo: {
      type: DataTypes.ENUM,
      values: ['PARSING', 'VALIDATION', 'NORMALIZATION', 'SCORING', 'DATABASE', 'BUSINESS_RULE', 'SYSTEM'],
      allowNull: false
    },

    severidad: {
      type: DataTypes.ENUM,
      values: ['ERROR', 'WARNING', 'INFO', 'CRITICAL'],
      allowNull: false,
      defaultValue: 'ERROR'
    },

    codigo_error: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    campo_afectado: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    valor_original: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    valor_esperado: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Contexto del error
    fila_archivo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    columna_archivo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    paso_etl: {
      type: DataTypes.ENUM,
      values: ['UPLOAD', 'PARSING', 'FIELD_DETECTION', 'NORMALIZATION', 'VALIDATION', 'SCORING', 'PERSISTENCE'],
      allowNull: false
    },

    // Detalles técnicos
    stack_trace: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    datos_contexto: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    // Resolución
    resuelto: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    resolucion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    resuelto_por: {
      type: DataTypes.UUID,
      allowNull: true
    },

    fecha_resolucion: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Acciones sugeridas
    accion_sugerida: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    accion_automatica_aplicada: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Recurrencia
    es_recurrente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    veces_ocurrido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },

    primera_ocurrencia: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    ultima_ocurrencia: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'etl_errors',
    timestamps: true,
    paranoid: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    deletedAt: 'eliminado_en',
    
    indexes: [
      {
        fields: ['job_id']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['severidad']
      },
      {
        fields: ['paso_etl']
      },
      {
        fields: ['resuelto']
      },
      {
        fields: ['es_recurrente']
      },
      {
        fields: ['codigo_error']
      }
    ],

    scopes: {
      erroresCriticos: {
        where: {
          severidad: ['ERROR', 'CRITICAL']
        }
      },
      
      noResueltos: {
        where: {
          resuelto: false
        }
      },
      
      recurrentes: {
        where: {
          es_recurrente: true
        }
      },
      
      porTipo: (tipo) => ({
        where: {
          tipo: tipo
        }
      }),
      
      porSeveridad: (severidad) => ({
        where: {
          severidad: severidad
        }
      })
    }
  });

  // Métodos de instancia
  ETLError.prototype.marcarResuelto = function(resolucion, usuarioId) {
    this.resuelto = true;
    this.resolucion = resolucion;
    this.resuelto_por = usuarioId;
    this.fecha_resolucion = new Date();
    
    return this.save();
  };

  ETLError.prototype.incrementarOcurrencia = function() {
    this.veces_ocurrido += 1;
    this.ultima_ocurrencia = new Date();
    
    if (this.veces_ocurrido > 1) {
      this.es_recurrente = true;
    }
    
    return this.save();
  };

  ETLError.prototype.getContextoCompleto = function() {
    return {
      error: {
        id: this.id,
        tipo: this.tipo,
        severidad: this.severidad,
        codigo: this.codigo_error,
        mensaje: this.mensaje
      },
      ubicacion: {
        campo: this.campo_afectado,
        fila: this.fila_archivo,
        columna: this.columna_archivo,
        paso: this.paso_etl
      },
      valores: {
        original: this.valor_original,
        esperado: this.valor_esperado
      },
      recurrencia: {
        es_recurrente: this.es_recurrente,
        veces_ocurrido: this.veces_ocurrido,
        primera_vez: this.primera_ocurrencia,
        ultima_vez: this.ultima_ocurrencia
      },
      resolucion: {
        resuelto: this.resuelto,
        descripcion: this.resolucion,
        fecha: this.fecha_resolucion
      },
      sugerencias: {
        accion_sugerida: this.accion_sugerida,
        accion_automatica: this.accion_automatica_aplicada
      }
    };
  };

  // Métodos estáticos
  ETLError.crearError = async function(jobId, tipo, mensaje, opciones = {}) {
    const errorData = {
      job_id: jobId,
      tipo: tipo,
      mensaje: mensaje,
      severidad: opciones.severidad || 'ERROR',
      codigo_error: opciones.codigo || null,
      campo_afectado: opciones.campo || null,
      valor_original: opciones.valorOriginal || null,
      valor_esperado: opciones.valorEsperado || null,
      fila_archivo: opciones.fila || null,
      columna_archivo: opciones.columna || null,
      paso_etl: opciones.paso || 'UNKNOWN',
      stack_trace: opciones.stack || null,
      datos_contexto: opciones.contexto || {},
      accion_sugerida: opciones.accionSugerida || null,
      parque_informatico_id: opciones.parqueId || null
    };

    // Verificar si es un error recurrente
    const errorExistente = await this.findOne({
      where: {
        job_id: jobId,
        tipo: tipo,
        codigo_error: errorData.codigo_error,
        campo_afectado: errorData.campo_afectado,
        mensaje: mensaje
      }
    });

    if (errorExistente) {
      return await errorExistente.incrementarOcurrencia();
    }

    return await this.create(errorData);
  };

  ETLError.obtenerResumenErrores = async function(jobId) {
    const errores = await this.findAll({
      where: { job_id: jobId },
      attributes: [
        'tipo',
        'severidad',
        [sequelize.fn('COUNT', '*'), 'cantidad'],
        [sequelize.fn('MAX', sequelize.col('ultima_ocurrencia')), 'ultimo_error']
      ],
      group: ['tipo', 'severidad'],
      order: [['cantidad', 'DESC']]
    });

    const resumen = {
      total_errores: 0,
      por_tipo: {},
      por_severidad: {},
      errores_criticos: 0,
      errores_recurrentes: 0
    };

    for (const error of errores) {
      const tipo = error.get('tipo');
      const severidad = error.get('severidad');
      const cantidad = parseInt(error.get('cantidad'));

      resumen.total_errores += cantidad;

      if (!resumen.por_tipo[tipo]) {
        resumen.por_tipo[tipo] = 0;
      }
      resumen.por_tipo[tipo] += cantidad;

      if (!resumen.por_severidad[severidad]) {
        resumen.por_severidad[severidad] = 0;
      }
      resumen.por_severidad[severidad] += cantidad;

      if (['ERROR', 'CRITICAL'].includes(severidad)) {
        resumen.errores_criticos += cantidad;
      }
    }

    // Contar errores recurrentes
    const recurrentes = await this.count({
      where: {
        job_id: jobId,
        es_recurrente: true
      }
    });

    resumen.errores_recurrentes = recurrentes;

    return resumen;
  };

  ETLError.obtenerTopErrores = async function(limit = 10, diasAtras = 7) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAtras);

    return await this.findAll({
      where: {
        creado_en: {
          [sequelize.Sequelize.Op.gte]: fechaLimite
        }
      },
      attributes: [
        'codigo_error',
        'tipo',
        'mensaje',
        [sequelize.fn('COUNT', '*'), 'ocurrencias'],
        [sequelize.fn('MAX', sequelize.col('ultima_ocurrencia')), 'ultima_vez']
      ],
      group: ['codigo_error', 'tipo', 'mensaje'],
      order: [[sequelize.literal('ocurrencias'), 'DESC']],
      limit: limit
    });
  };

  ETLError.limpiarErroresAntiguos = async function(diasAntiguedad = 90) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    return await this.destroy({
      where: {
        resuelto: true,
        fecha_resolucion: {
          [sequelize.Sequelize.Op.lt]: fechaLimite
        }
      },
      force: true
    });
  };

  return ETLError;
};

module.exports = defineETLError;