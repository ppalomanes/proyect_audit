/**
 * Modelo ParqueInformatico - ETL de Inventario Tecnológico
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');

const defineParqueInformatico = (sequelize) => {
  const ParqueInformatico = sequelize.define('ParqueInformatico', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Relaciones principales
    auditoria_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    documento_origen_id: {
      type: DataTypes.UUID,
      allowNull: true // Puede ser ingresado manualmente
    },

    // === METADATOS DE AUDITORÍA ===
    audit_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    audit_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    audit_cycle: {
      type: DataTypes.STRING(20),
      allowNull: false // Ej: "2025-S1"
    },

    audit_version: {
      type: DataTypes.STRING(20),
      allowNull: false // Ej: "v2.1"
    },

    // === IDENTIFICACIÓN ===
    proveedor: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    sitio: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    atencion: {
      type: DataTypes.ENUM,
      values: ['INBOUND', 'OUTBOUND', 'MIXTO', 'CHAT', 'EMAIL', 'SOPORTE'],
      allowNull: false
    },

    usuario_id: {
      type: DataTypes.STRING(50),
      allowNull: false // ID único del usuario/agente
    },

    hostname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    // === HARDWARE - CPU ===
    cpu_brand: {
      type: DataTypes.ENUM,
      values: ['Intel', 'AMD', 'Apple', 'Otro'],
      allowNull: true
    },

    cpu_model: {
      type: DataTypes.STRING(200),
      allowNull: true
    },

    cpu_speed_ghz: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 0.5,
        max: 10.0
      }
    },

    cpu_cores: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 64
      }
    },

    // === HARDWARE - MEMORIA ===
    ram_gb: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 256
      }
    },

    ram_type: {
      type: DataTypes.ENUM,
      values: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'Otro'],
      allowNull: true
    },

    ram_speed_mhz: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    // === HARDWARE - ALMACENAMIENTO ===
    disk_type: {
      type: DataTypes.ENUM,
      values: ['HDD', 'SSD', 'NVME', 'HYBRID', 'eMMC'],
      allowNull: true
    },

    disk_capacity_gb: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 50
      }
    },

    disk_free_gb: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    disk_usage_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    // === SOFTWARE - SISTEMA OPERATIVO ===
    os_name: {
      type: DataTypes.ENUM,
      values: ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'Chrome OS', 'Otro'],
      allowNull: true
    },

    os_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    os_build: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    os_license_type: {
      type: DataTypes.ENUM,
      values: ['OEM', 'RETAIL', 'VOLUME', 'SUBSCRIPTION', 'FREE'],
      allowNull: true
    },

    // === SOFTWARE - NAVEGADOR ===
    browser_name: {
      type: DataTypes.ENUM,
      values: ['Chrome', 'Firefox', 'Edge', 'Safari', 'Opera', 'Otro'],
      allowNull: true
    },

    browser_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    // === SOFTWARE - ANTIVIRUS ===
    antivirus_brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    antivirus_model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    antivirus_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    antivirus_updated: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },

    // === PERIFÉRICOS ===
    headset_brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    headset_model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    headset_type: {
      type: DataTypes.ENUM,
      values: ['USB', 'ANALOG', 'BLUETOOTH', 'WIRELESS'],
      allowNull: true
    },

    webcam_available: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },

    microphone_type: {
      type: DataTypes.ENUM,
      values: ['HEADSET', 'BUILTIN', 'EXTERNAL', 'ARRAY'],
      allowNull: true
    },

    // === CONECTIVIDAD ===
    isp_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    connection_type: {
      type: DataTypes.ENUM,
      values: ['Fibra', 'Cable', 'DSL', 'Wireless', 'Satelital', 'Celular'],
      allowNull: true
    },

    speed_download_mbps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },

    speed_upload_mbps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },

    latency_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    network_stability: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    // === SCORING Y CALIDAD ===
    score_hardware: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    score_software: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    score_conectividad: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    score_total: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0.00,
        max: 100.00
      }
    },

    nivel_cumplimiento: {
      type: DataTypes.ENUM,
      values: ['EXCELENTE', 'BUENO', 'ACEPTABLE', 'DEFICIENTE', 'CRITICO'],
      allowNull: true
    },

    // === VALIDACIÓN Y ETL ===
    estado_etl: {
      type: DataTypes.ENUM,
      values: ['PROCESANDO', 'VALIDADO', 'ERROR', 'DUPLICADO', 'INCOMPLETO'],
      allowNull: false,
      defaultValue: 'PROCESANDO'
    },

    errores_validacion: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    advertencias: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    datos_originales: {
      type: DataTypes.JSON,
      allowNull: true // Backup de datos originales antes de normalización
    },

    transformaciones_aplicadas: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    // === ANÁLISIS IA ===
    analisis_ia: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    recomendaciones_ia: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    anomalias_detectadas: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    // === METADATOS DE PROCESAMIENTO ===
    procesado_por: {
      type: DataTypes.UUID,
      allowNull: true
    },

    fecha_procesamiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    tiempo_procesamiento_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    version_etl: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0'
    }
  }, {
    tableName: 'parque_informatico',
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
        fields: ['audit_id']
      },
      {
        fields: ['proveedor']
      },
      {
        fields: ['sitio']
      },
      {
        fields: ['usuario_id']
      },
      {
        fields: ['estado_etl']
      },
      {
        fields: ['score_total']
      },
      {
        fields: ['nivel_cumplimiento']
      },
      {
        unique: true,
        fields: ['audit_id', 'usuario_id'] // Evitar duplicados
      }
    ],

    scopes: {
      validados: {
        where: {
          estado_etl: 'VALIDADO'
        }
      },
      
      conErrores: {
        where: {
          estado_etl: 'ERROR'
        }
      },
      
      porSitio: (sitio) => ({
        where: {
          sitio: sitio
        }
      }),
      
      porNivelCumplimiento: (nivel) => ({
        where: {
          nivel_cumplimiento: nivel
        }
      }),

      hardwareMinimo: {
        where: {
          ram_gb: {
            [sequelize.Sequelize.Op.gte]: 4
          },
          cpu_speed_ghz: {
            [sequelize.Sequelize.Op.gte]: 2.0
          }
        }
      }
    }
  });

  // Métodos de instancia
  ParqueInformatico.prototype.calcularScoreTotal = function() {
    const scores = [
      this.score_hardware || 0,
      this.score_software || 0,
      this.score_conectividad || 0
    ].filter(score => score > 0);

    if (scores.length === 0) return 0;
    
    const promedio = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    this.score_total = Math.round(promedio * 100) / 100;
    
    // Determinar nivel de cumplimiento
    if (this.score_total >= 90) this.nivel_cumplimiento = 'EXCELENTE';
    else if (this.score_total >= 80) this.nivel_cumplimiento = 'BUENO';
    else if (this.score_total >= 70) this.nivel_cumplimiento = 'ACEPTABLE';
    else if (this.score_total >= 50) this.nivel_cumplimiento = 'DEFICIENTE';
    else this.nivel_cumplimiento = 'CRITICO';
    
    return this.score_total;
  };

  ParqueInformatico.prototype.cumpleRequisitosMinimos = function() {
    return {
      ram: (this.ram_gb || 0) >= 4,
      cpu: (this.cpu_speed_ghz || 0) >= 2.0,
      os: ['Windows 10', 'Windows 11'].includes(this.os_name),
      navegador: ['Chrome', 'Firefox', 'Edge'].includes(this.browser_name),
      antivirus: this.antivirus_brand && this.antivirus_brand.length > 0,
      conectividad: (this.speed_download_mbps || 0) >= 10
    };
  };

  ParqueInformatico.prototype.getResumenTecnico = function() {
    return {
      cpu: `${this.cpu_brand || 'N/A'} ${this.cpu_model || ''} @ ${this.cpu_speed_ghz || 'N/A'}GHz`,
      memoria: `${this.ram_gb || 'N/A'}GB ${this.ram_type || ''}`,
      almacenamiento: `${this.disk_capacity_gb || 'N/A'}GB ${this.disk_type || ''}`,
      so: `${this.os_name || 'N/A'} ${this.os_version || ''}`,
      conectividad: `${this.speed_download_mbps || 'N/A'}/${this.speed_upload_mbps || 'N/A'} Mbps`
    };
  };

  ParqueInformatico.prototype.tieneAnomalias = function() {
    return this.anomalias_detectadas && this.anomalias_detectadas.length > 0;
  };

  ParqueInformatico.prototype.addError = function(campo, mensaje) {
    if (!this.errores_validacion) {
      this.errores_validacion = [];
    }
    this.errores_validacion.push({
      campo,
      mensaje,
      timestamp: new Date()
    });
    this.estado_etl = 'ERROR';
  };

  ParqueInformatico.prototype.addAdvertencia = function(campo, mensaje) {
    if (!this.advertencias) {
      this.advertencias = [];
    }
    this.advertencias.push({
      campo,
      mensaje,
      timestamp: new Date()
    });
  };

  // Métodos estáticos
  ParqueInformatico.buscarPorAuditoria = async function(auditoriaId) {
    return await this.scope('validados').findAll({
      where: { auditoria_id: auditoriaId },
      order: [['sitio', 'ASC'], ['usuario_id', 'ASC']]
    });
  };

  ParqueInformatico.obtenerEstadisticas = async function(auditoriaId) {
    const registros = await this.findAll({
      where: { auditoria_id: auditoriaId }
    });

    const stats = {
      total: registros.length,
      validados: registros.filter(r => r.estado_etl === 'VALIDADO').length,
      con_errores: registros.filter(r => r.estado_etl === 'ERROR').length,
      procesando: registros.filter(r => r.estado_etl === 'PROCESANDO').length,
      score_promedio: 0,
      cumplimiento: {
        EXCELENTE: 0,
        BUENO: 0,
        ACEPTABLE: 0,
        DEFICIENTE: 0,
        CRITICO: 0
      }
    };

    const scoresValidos = registros
      .filter(r => r.score_total !== null)
      .map(r => r.score_total);

    if (scoresValidos.length > 0) {
      stats.score_promedio = scoresValidos.reduce((sum, score) => sum + score, 0) / scoresValidos.length;
    }

    registros.forEach(registro => {
      if (registro.nivel_cumplimiento) {
        stats.cumplimiento[registro.nivel_cumplimiento]++;
      }
    });

    return stats;
  };

  ParqueInformatico.buscarConProblemas = async function(auditoriaId) {
    return await this.findAll({
      where: {
        auditoria_id: auditoriaId,
        [sequelize.Sequelize.Op.or]: [
          { estado_etl: 'ERROR' },
          { nivel_cumplimiento: 'CRITICO' },
          { nivel_cumplimiento: 'DEFICIENTE' }
        ]
      },
      order: [['score_total', 'ASC']]
    });
  };

  return ParqueInformatico;
};

module.exports = defineParqueInformatico;
