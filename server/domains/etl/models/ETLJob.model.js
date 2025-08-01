/**
 * Modelo ETLJob - Tracking de trabajos ETL
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');

const defineETLJob = (sequelize) => {
  const ETLJob = sequelize.define('ETLJob', {
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

    documento_id: {
      type: DataTypes.UUID,
      allowNull: true // Puede ser null si es procesamiento manual
    },

    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false // Usuario que inició el proceso
    },

    // Configuración del trabajo
    tipo_archivo: {
      type: DataTypes.ENUM,
      values: ['EXCEL', 'CSV', 'MANUAL'],
      allowNull: false
    },

    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    tamaño_archivo_bytes: {
      type: DataTypes.BIGINT,
      allowNull: true
    },

    // Estado del trabajo
    estado: {
      type: DataTypes.ENUM,
      values: ['INICIADO', 'PARSEANDO', 'NORMALIZANDO', 'VALIDANDO', 'SCORING', 'COMPLETADO', 'ERROR', 'CANCELADO'],
      allowNull: false,
      defaultValue: 'INICIADO'
    },

    // Progreso
    total_registros: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },

    registros_procesados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    registros_validos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    registros_con_errores: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    registros_con_advertencias: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    progreso_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    // Timing
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true
    },

    tiempo_procesamiento_ms: {
      type: DataTypes.BIGINT,
      allowNull: true
    },

    tiempo_estimado_restante_ms: {
      type: DataTypes.BIGINT,
      allowNull: true
    },

    // Configuración del procesamiento
    configuracion: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        strict_mode: false,
        auto_fix: true,
        skip_validation: [],
        scoring_ia: true,
        notificaciones: true
      }
    },

    // Resultados del procesamiento
    resultados: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    // Errores y logs
    error_detalle: {
      type: DataTypes.JSON,
      allowNull: true
    },

    logs_procesamiento: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    // Métricas de calidad
    score_calidad_promedio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    // Metadatos
    version_etl: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0'
    },

    ip_origen: {
      type: DataTypes.STRING(45),
      allowNull: true
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'etl_jobs',
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
        fields: ['usuario_id']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_inicio']
      },
      {
        fields: ['tipo_archivo']
      }
    ],

    scopes: {
      activos: {
        where: {
          estado: {
            [sequelize.Sequelize.Op.in]: ['INICIADO', 'PARSEANDO', 'NORMALIZANDO', 'VALIDANDO', 'SCORING']
          }
        }
      },
      
      completados: {
        where: {
          estado: 'COMPLETADO'
        }
      },
      
      conErrores: {
        where: {
          estado: 'ERROR'
        }
      },
      
      recientes: {
        order: [['creado_en', 'DESC']],
        limit: 10
      }
    }
  });

  // Métodos de instancia
  ETLJob.prototype.actualizarProgreso = function(registrosProcesados, estado = null) {
    this.registros_procesados = registrosProcesados;
    
    if (this.total_registros > 0) {
      this.progreso_porcentaje = (registrosProcesados / this.total_registros) * 100;
    }
    
    if (estado) {
      this.estado = estado;
    }

    // Calcular tiempo estimado restante
    if (this.progreso_porcentaje > 0 && this.progreso_porcentaje < 100) {
      const tiempoTranscurrido = Date.now() - new Date(this.fecha_inicio).getTime();
      const tiempoTotalEstimado = (tiempoTranscurrido / this.progreso_porcentaje) * 100;
      this.tiempo_estimado_restante_ms = tiempoTotalEstimado - tiempoTranscurrido;
    }

    return this.save();
  };

  ETLJob.prototype.marcarCompletado = function(resultados = {}) {
    this.estado = 'COMPLETADO';
    this.fecha_fin = new Date();
    this.progreso_porcentaje = 100;
    this.tiempo_procesamiento_ms = new Date(this.fecha_fin).getTime() - new Date(this.fecha_inicio).getTime();
    this.tiempo_estimado_restante_ms = 0;
    this.resultados = { ...this.resultados, ...resultados };
    
    return this.save();
  };

  ETLJob.prototype.marcarError = function(error) {
    this.estado = 'ERROR';
    this.fecha_fin = new Date();
    this.tiempo_procesamiento_ms = new Date(this.fecha_fin).getTime() - new Date(this.fecha_inicio).getTime();
    
    this.error_detalle = {
      mensaje: error.message,
      stack: error.stack,
      timestamp: new Date(),
      paso_fallido: error.step || 'DESCONOCIDO'
    };
    
    return this.save();
  };

  ETLJob.prototype.addLog = function(nivel, mensaje, datos = {}) {
    if (!this.logs_procesamiento) {
      this.logs_procesamiento = [];
    }
    
    this.logs_procesamiento.push({
      timestamp: new Date(),
      nivel: nivel, // 'INFO', 'WARN', 'ERROR', 'DEBUG'
      mensaje: mensaje,
      datos: datos
    });
    
    // Mantener solo los últimos 100 logs para evitar que crezca demasiado
    if (this.logs_procesamiento.length > 100) {
      this.logs_procesamiento = this.logs_procesamiento.slice(-100);
    }
    
    return this.save();
  };

  ETLJob.prototype.getTiempoTranscurrido = function() {
    const inicio = new Date(this.fecha_inicio);
    const fin = this.fecha_fin ? new Date(this.fecha_fin) : new Date();
    return fin.getTime() - inicio.getTime();
  };

  ETLJob.prototype.getTiempoTranscurridoFormateado = function() {
    const ms = this.getTiempoTranscurrido();
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  };

  ETLJob.prototype.getEstadoDetallado = function() {
    return {
      id: this.id,
      estado: this.estado,
      progreso: {
        porcentaje: this.progreso_porcentaje,
        registros_procesados: this.registros_procesados,
        registros_total: this.total_registros,
        tiempo_transcurrido: this.getTiempoTranscurridoFormateado(),
        tiempo_estimado_restante: this.tiempo_estimado_restante_ms ? 
          Math.round(this.tiempo_estimado_restante_ms / 1000) + 's' : null
      },
      estadisticas: {
        registros_validos: this.registros_validos,
        registros_con_errores: this.registros_con_errores,
        registros_con_advertencias: this.registros_con_advertencias,
        score_calidad_promedio: this.score_calidad_promedio
      },
      archivo: {
        nombre: this.nombre_archivo,
        tipo: this.tipo_archivo,
        tamaño_mb: this.tamaño_archivo_bytes ? (this.tamaño_archivo_bytes / 1024 / 1024).toFixed(2) : null
      }
    };
  };

  // Métodos estáticos
  ETLJob.buscarActivos = async function() {
    return await this.scope('activos').findAll({
      order: [['creado_en', 'DESC']]
    });
  };

  ETLJob.obtenerEstadisticas = async function(auditoriaId = null) {
    const whereClause = auditoriaId ? { auditoria_id: auditoriaId } : {};
    
    const jobs = await this.findAll({
      where: whereClause,
      attributes: [
        'estado',
        [sequelize.fn('COUNT', '*'), 'cantidad'],
        [sequelize.fn('AVG', sequelize.col('tiempo_procesamiento_ms')), 'tiempo_promedio'],
        [sequelize.fn('AVG', sequelize.col('score_calidad_promedio')), 'calidad_promedio']
      ],
      group: ['estado']
    });

    const estadisticas = {
      total_jobs: 0,
      por_estado: {},
      tiempo_promedio_ms: 0,
      calidad_promedio: 0
    };

    let totalTiempo = 0;
    let totalCalidad = 0;
    let jobsConTiempo = 0;
    let jobsConCalidad = 0;

    jobs.forEach(job => {
      const estado = job.get('estado');
      const cantidad = parseInt(job.get('cantidad'));
      const tiempo = job.get('tiempo_promedio');
      const calidad = job.get('calidad_promedio');

      estadisticas.total_jobs += cantidad;
      estadisticas.por_estado[estado] = cantidad;

      if (tiempo) {
        totalTiempo += tiempo * cantidad;
        jobsConTiempo += cantidad;
      }

      if (calidad) {
        totalCalidad += calidad * cantidad;
        jobsConCalidad += cantidad;
      }
    });

    if (jobsConTiempo > 0) {
      estadisticas.tiempo_promedio_ms = Math.round(totalTiempo / jobsConTiempo);
    }

    if (jobsConCalidad > 0) {
      estadisticas.calidad_promedio = Math.round((totalCalidad / jobsConCalidad) * 100) / 100;
    }

    return estadisticas;
  };

  ETLJob.limpiarJobsAntiguos = async function(diasAntiguedad = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    return await this.destroy({
      where: {
        estado: {
          [sequelize.Sequelize.Op.in]: ['COMPLETADO', 'ERROR', 'CANCELADO']
        },
        creado_en: {
          [sequelize.Sequelize.Op.lt]: fechaLimite
        }
      },
      force: true // Eliminación permanente
    });
  };

  return ETLJob;
};

module.exports = defineETLJob;