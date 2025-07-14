/**
 * Modelo AnalisisIA para Portal de Auditorías Técnicas
 * Almacena resultados de análisis de IA realizados por Ollama
 * Incluye metadatos de procesamiento y scoring multidimensional
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const AnalisisIA = sequelize.define('AnalisisIA', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único del análisis de IA'
  },

  // === IDENTIFICACIÓN Y CONTEXTO ===
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de la auditoría a la que pertenece',
    references: {
      model: 'Auditorias',
      key: 'id'
    }
  },

  documento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del documento analizado (si aplica)',
    references: {
      model: 'Documentos',
      key: 'id'
    }
  },

  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del usuario que solicitó el análisis',
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },

  // === CONFIGURACIÓN DEL ANÁLISIS ===
  tipo_analisis: {
    type: DataTypes.ENUM(
      'document_compliance',    // Análisis de cumplimiento documental
      'security_analysis',      // Análisis de seguridad técnica
      'infrastructure_review',  // Revisión de infraestructura
      'image_analysis',         // Análisis de imágenes/capturas
      'batch_analysis'          // Análisis por lotes
    ),
    allowNull: false,
    comment: 'Tipo específico de análisis realizado'
  },

  modelo_ia: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'llama3.2:1b',
    comment: 'Modelo de IA utilizado (llama3.2:1b, moondream, etc.)'
  },

  criterios_aplicados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Criterios de scoring personalizados aplicados',
    get() {
      const rawValue = this.getDataValue('criterios_aplicados');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('criterios_aplicados', JSON.stringify(value));
    }
  },

  // === CONTENIDO ANALIZADO ===
  contenido_original: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Contenido original enviado para análisis'
  },

  prompt_utilizado: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Prompt específico utilizado para el análisis'
  },

  // === RESULTADOS DEL ANÁLISIS ===
  respuesta_ia: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'Respuesta completa generada por la IA'
  },

  resultado_estructurado: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Resultado parseado y estructurado en JSON',
    get() {
      const rawValue = this.getDataValue('resultado_estructurado');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('resultado_estructurado', JSON.stringify(value));
    }
  },

  // === SCORING MULTIDIMENSIONAL ===
  score_cumplimiento: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 100 },
    comment: 'Score de cumplimiento técnico (0-100)'
  },

  score_seguridad: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 100 },
    comment: 'Score de seguridad (0-100)'
  },

  score_calidad: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 100 },
    comment: 'Score de calidad técnica (0-100)'
  },

  score_completitud: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 100 },
    comment: 'Score de completitud de información (0-100)'
  },

  score_total: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0, max: 100 },
    comment: 'Score total promedio ponderado (0-100)'
  },

  // === METADATOS DE PROCESAMIENTO ===
  estado: {
    type: DataTypes.ENUM(
      'INICIADO',
      'PROCESANDO',
      'COMPLETADO',
      'ERROR',
      'CANCELADO'
    ),
    allowNull: false,
    defaultValue: 'INICIADO',
    comment: 'Estado actual del análisis'
  },

  confianza_resultado: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 100 },
    comment: 'Nivel de confianza del resultado de IA (0-100)'
  },

  tiempo_procesamiento_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tiempo de procesamiento en milisegundos'
  },

  tokens_procesados: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número total de tokens procesados'
  },

  tokens_por_segundo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Velocidad de procesamiento (tokens/segundo)'
  },

  // === INFORMACIÓN DE ERRORES ===
  error_detalle: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Detalles del error si el análisis falló',
    get() {
      const rawValue = this.getDataValue('error_detalle');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('error_detalle', JSON.stringify(value));
    }
  },

  fallback_usado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se usó respuesta simulada por indisponibilidad de IA'
  },

  // === VALIDACIÓN Y REVISIÓN ===
  revisado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del auditor que revisó el análisis',
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },

  comentarios_revision: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentarios del auditor sobre el análisis'
  },

  estado_revision: {
    type: DataTypes.ENUM(
      'PENDIENTE',
      'APROBADO',
      'RECHAZADO',
      'REQUIERE_AJUSTES'
    ),
    allowNull: false,
    defaultValue: 'PENDIENTE',
    comment: 'Estado de la revisión manual'
  },

  fecha_revision: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora de la revisión manual'
  }

}, {
  tableName: 'analisis_ia',
  timestamps: true,
  paranoid: true,
  underscored: true,
  
  indexes: [
    // Índices para consultas frecuentes
    {
      fields: ['auditoria_id', 'tipo_analisis']
    },
    {
      fields: ['estado', 'created_at']
    },
    {
      fields: ['score_total'],
      name: 'idx_score_total'
    },
    {
      fields: ['modelo_ia', 'created_at'],
      name: 'idx_modelo_fecha'
    },
    {
      fields: ['usuario_id', 'estado_revision'],
      name: 'idx_usuario_revision'
    }
  ],

  // Hooks para automatización
  hooks: {
    beforeCreate: (analisis, options) => {
      // Calcular score total si no está definido
      if (!analisis.score_total && analisis.score_cumplimiento) {
        const scores = [
          analisis.score_cumplimiento || 0,
          analisis.score_seguridad || 0,
          analisis.score_calidad || 0,
          analisis.score_completitud || 0
        ].filter(score => score > 0);

        if (scores.length > 0) {
          analisis.score_total = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
      }
    },

    beforeUpdate: (analisis, options) => {
      // Actualizar fecha de revisión si cambia el estado
      if (analisis.changed('estado_revision') && analisis.estado_revision !== 'PENDIENTE') {
        analisis.fecha_revision = new Date();
      }
    }
  }
});

// === ASOCIACIONES ===
AnalisisIA.associate = (models) => {
  // Pertenece a una auditoría
  AnalisisIA.belongsTo(models.Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });

  // Puede estar asociado a un documento
  AnalisisIA.belongsTo(models.Documento, {
    foreignKey: 'documento_id',
    as: 'documento'
  });

  // Creado por un usuario
  AnalisisIA.belongsTo(models.Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
  });

  // Revisado por un auditor
  AnalisisIA.belongsTo(models.Usuario, {
    foreignKey: 'revisado_por',
    as: 'revisor'
  });

  // Tiene muchos criterios de scoring aplicados
  AnalisisIA.hasMany(models.CriterioScoring, {
    foreignKey: 'analisis_id',
    as: 'criterios'
  });
};

// === MÉTODOS DE INSTANCIA ===
AnalisisIA.prototype.calcularScoreTotal = function() {
  const scores = [
    this.score_cumplimiento,
    this.score_seguridad,
    this.score_calidad,
    this.score_completitud
  ].filter(score => score !== null && score !== undefined);

  if (scores.length === 0) return 0;
  
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100;
};

AnalisisIA.prototype.estaCompleto = function() {
  return this.estado === 'COMPLETADO' && this.respuesta_ia && this.score_total > 0;
};

AnalisisIA.prototype.requiereRevision = function() {
  return this.score_total < 60 || this.confianza_resultado < 70;
};

// === MÉTODOS ESTÁTICOS ===
AnalisisIA.obtenerEstadisticas = async function(filtros = {}) {
  const whereClause = {};
  
  if (filtros.auditoria_id) whereClause.auditoria_id = filtros.auditoria_id;
  if (filtros.tipo_analisis) whereClause.tipo_analisis = filtros.tipo_analisis;
  if (filtros.fecha_desde) whereClause.created_at = { [Op.gte]: filtros.fecha_desde };
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      'tipo_analisis',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_analisis'],
      [sequelize.fn('AVG', sequelize.col('score_total')), 'score_promedio'],
      [sequelize.fn('AVG', sequelize.col('tiempo_procesamiento_ms')), 'tiempo_promedio'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN fallback_usado = 1 THEN 1 ELSE 0 END')), 'fallbacks_usados']
    ],
    group: ['tipo_analisis'],
    raw: true
  });

  return stats;
};

module.exports = AnalisisIA;
