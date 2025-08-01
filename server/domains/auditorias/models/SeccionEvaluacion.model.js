const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * Modelo SeccionEvaluacion
 * Gestiona las evaluaciones detalladas por sección en la Etapa 4
 * Según flujo documentado: Evaluación por Auditores
 */
const SeccionEvaluacion = sequelize.define('SeccionEvaluacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // === REFERENCIAS ===
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Auditorias',
      key: 'id'
    },
    comment: 'Referencia a la auditoría principal'
  },
  
  auditor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Auditor asignado para esta evaluación'
  },
  
  // === INFORMACIÓN DE SECCIÓN ===
  seccion_nombre: {
    type: DataTypes.ENUM(
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
      'parque_informatico'
    ),
    allowNull: false,
    comment: 'Nombre de la sección evaluada'
  },
  
  seccion_display: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre legible de la sección'
  },
  
  es_obligatoria: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si la sección es obligatoria (*)'
  },
  
  // === EVALUACIÓN ===
  estado_evaluacion: {
    type: DataTypes.ENUM(
      'pendiente',
      'en_revision',
      'completada',
      'requiere_aclaracion'
    ),
    defaultValue: 'pendiente',
    comment: 'Estado actual de la evaluación'
  },
  
  resultado_evaluacion: {
    type: DataTypes.ENUM(
      'cumple',
      'no_cumple',
      'cumple_con_observaciones',
      'no_aplica',
      'pendiente_visita'
    ),
    allowNull: true,
    comment: 'Resultado final de la evaluación'
  },
  
  puntuacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Puntuación de 0-100 para la sección'
  },
  
  // === COMENTARIOS Y OBSERVACIONES ===
  comentarios_auditor: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentarios detallados del auditor'
  },
  
  observaciones_tecnicas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones técnicas específicas'
  },
  
  incumplimientos_detectados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array de incumplimientos específicos detectados'
  },
  
  recomendaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Recomendaciones para mejora'
  },
  
  // === DOCUMENTOS EVALUADOS ===
  documentos_revisados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de documentos/archivos revisados'
  },
  
  requiere_visita_presencial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si requiere verificación en visita presencial'
  },
  
  // === SEGUIMIENTO ===
  fecha_inicio_evaluacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de inicio de la evaluación'
  },
  
  fecha_fin_evaluacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de finalización de la evaluación'
  },
  
  tiempo_evaluacion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tiempo total dedicado a la evaluación en minutos'
  },
  
  // === VALIDACIONES AUTOMÁTICAS ===
  validaciones_automaticas: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Resultados de validaciones automáticas ETL/IA'
  },
  
  score_automatico: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Score automático generado por IA/ETL'
  },
  
  // === COMUNICACIÓN ===
  consultas_realizadas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de consultas realizadas al proveedor'
  },
  
  aclaraciones_pendientes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si hay aclaraciones pendientes'
  },
  
  // === METADATOS ===
  version_pliego: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Versión del pliego técnico utilizada'
  },
  
  criterios_aplicados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Criterios específicos aplicados en la evaluación'
  },
  
  // === CAMPOS DE AUDITORÍA ===
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de creación del registro'
  },
  
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de última actualización'
  },
  
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Usuario que creó el registro'
  },
  
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Usuario que actualizó el registro'
  }

}, {
  tableName: 'secciones_evaluacion',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  indexes: [
    {
      fields: ['auditoria_id']
    },
    {
      fields: ['auditor_id']
    },
    {
      fields: ['seccion_nombre']
    },
    {
      fields: ['estado_evaluacion']
    },
    {
      fields: ['resultado_evaluacion']
    },
    {
      unique: true,
      fields: ['auditoria_id', 'seccion_nombre'],
      name: 'unique_auditoria_seccion'
    }
  ],
  
  hooks: {
    beforeUpdate: (seccionEvaluacion, options) => {
      // Calcular tiempo de evaluación automáticamente
      if (seccionEvaluacion.fecha_inicio_evaluacion && seccionEvaluacion.fecha_fin_evaluacion) {
        const inicio = new Date(seccionEvaluacion.fecha_inicio_evaluacion);
        const fin = new Date(seccionEvaluacion.fecha_fin_evaluacion);
        seccionEvaluacion.tiempo_evaluacion_minutos = Math.round((fin - inicio) / (1000 * 60));
      }
      
      // Establecer usuario que actualiza
      if (options.user_id) {
        seccionEvaluacion.updated_by = options.user_id;
      }
    },
    
    beforeCreate: (seccionEvaluacion, options) => {
      // Establecer usuario creador
      if (options.user_id) {
        seccionEvaluacion.created_by = options.user_id;
      }
    }
  }
});

/**
 * Asociaciones del modelo
 */
SeccionEvaluacion.associate = (models) => {
  // Pertenece a una Auditoría
  SeccionEvaluacion.belongsTo(models.Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  // Pertenece a un Auditor (Usuario)
  SeccionEvaluacion.belongsTo(models.Usuario, {
    foreignKey: 'auditor_id',
    as: 'auditor'
  });
  
  // Usuario que creó
  SeccionEvaluacion.belongsTo(models.Usuario, {
    foreignKey: 'created_by',
    as: 'creador'
  });
  
  // Usuario que actualizó
  SeccionEvaluacion.belongsTo(models.Usuario, {
    foreignKey: 'updated_by', 
    as: 'actualizador'
  });
};

/**
 * Métodos de instancia
 */
SeccionEvaluacion.prototype.marcarComoCompletada = function() {
  this.estado_evaluacion = 'completada';
  this.fecha_fin_evaluacion = new Date();
  return this.save();
};

SeccionEvaluacion.prototype.requiereAclaracion = function(comentario) {
  this.estado_evaluacion = 'requiere_aclaracion';
  this.aclaraciones_pendientes = true;
  this.comentarios_auditor = comentario;
  return this.save();
};

SeccionEvaluacion.prototype.calcularScore = function() {
  // Lógica para calcular score combinando automático y manual
  let scoreBase = this.score_automatico || 0;
  
  switch(this.resultado_evaluacion) {
    case 'cumple':
      return Math.max(scoreBase, 85);
    case 'cumple_con_observaciones':
      return Math.max(scoreBase * 0.8, 70);
    case 'no_cumple':
      return Math.min(scoreBase, 50);
    default:
      return scoreBase;
  }
};

/**
 * Métodos estáticos
 */
SeccionEvaluacion.obtenerPorAuditoria = async function(auditoriaId) {
  return await this.findAll({
    where: { auditoria_id: auditoriaId },
    include: [
      { model: this.sequelize.models.Usuario, as: 'auditor' }
    ],
    order: [['seccion_nombre', 'ASC']]
  });
};

SeccionEvaluacion.obtenerResumenEvaluacion = async function(auditoriaId) {
  const secciones = await this.findAll({
    where: { auditoria_id: auditoriaId },
    attributes: [
      'resultado_evaluacion',
      [this.sequelize.fn('COUNT', '*'), 'cantidad'],
      [this.sequelize.fn('AVG', this.sequelize.col('puntuacion')), 'promedio_puntuacion']
    ],
    group: ['resultado_evaluacion']
  });
  
  return secciones;
};

module.exports = SeccionEvaluacion;
