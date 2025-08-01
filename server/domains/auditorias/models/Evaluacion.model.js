const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Evaluacion = sequelize.define('Evaluacion', {
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
  auditor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Auditor que realiza la evaluación'
  },
  seccion: {
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
      'parque_hardware',
      'evaluacion_general'
    ),
    allowNull: false,
    comment: 'Sección evaluada por el auditor'
  },
  
  // Calificación de la sección
  calificacion: {
    type: DataTypes.ENUM(
      'CUMPLE',
      'NO_CUMPLE', 
      'CUMPLE_CON_OBSERVACIONES',
      'NO_APLICA',
      'PENDIENTE_ACLARACION'
    ),
    allowNull: false,
    comment: 'Calificación asignada por el auditor'
  },
  score_numerico: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Score numérico (0-100) si aplica'
  },
  
  // Comentarios del auditor
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentarios generales del auditor'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones específicas o recomendaciones'
  },
  hallazgos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista detallada de hallazgos'
  },
  
  // Evidencias y referencias
  documentos_revisados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de documentos que el auditor revisó'
  },
  evidencias_adicionales: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Referencias a evidencias adicionales'
  },
  
  // Criticidad y riesgos
  nivel_riesgo: {
    type: DataTypes.ENUM('BAJO', 'MEDIO', 'ALTO', 'CRITICO'),
    allowNull: true,
    comment: 'Nivel de riesgo identificado'
  },
  impacto_negocio: {
    type: DataTypes.ENUM('BAJO', 'MEDIO', 'ALTO'),
    allowNull: true,
    comment: 'Impacto potencial en el negocio'
  },
  
  // Acciones requeridas
  requiere_accion_inmediata: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si requiere acción inmediata'
  },
  acciones_recomendadas: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de acciones recomendadas'
  },
  fecha_limite_accion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha límite para implementar acciones'
  },
  
  // Estado de la evaluación
  estado: {
    type: DataTypes.ENUM('BORRADOR', 'COMPLETADA', 'REVISADA', 'APROBADA'),
    defaultValue: 'BORRADOR',
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(10),
    defaultValue: '1.0',
    comment: 'Versión de la evaluación'
  },
  
  // Metadatos
  fecha_evaluacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_completado: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se completó la evaluación'
  },
  tiempo_evaluacion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tiempo total dedicado a la evaluación'
  },
  
  // Información técnica
  metadatos_tecnicos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información técnica adicional de la evaluación'
  }
}, {
  tableName: 'evaluaciones',
  timestamps: true,
  createdAt: 'fecha_evaluacion',
  updatedAt: 'fecha_completado',
  indexes: [
    {
      fields: ['auditoria_id', 'seccion']
    },
    {
      fields: ['auditor_id', 'fecha_evaluacion']
    },
    {
      fields: ['calificacion', 'nivel_riesgo']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['requiere_accion_inmediata']
    },
    {
      unique: true,
      fields: ['auditoria_id', 'seccion', 'auditor_id', 'version']
    }
  ]
});

// Métodos de instancia
Evaluacion.prototype.calcularScoreNumerico = function() {
  const scores = {
    'CUMPLE': 100,
    'CUMPLE_CON_OBSERVACIONES': 75,
    'NO_CUMPLE': 0,
    'NO_APLICA': null,
    'PENDIENTE_ACLARACION': null
  };
  
  return scores[this.calificacion] || null;
};

Evaluacion.prototype.esCritica = function() {
  return this.calificacion === 'NO_CUMPLE' || 
         this.nivel_riesgo === 'CRITICO' || 
         this.requiere_accion_inmediata;
};

Evaluacion.prototype.obtenerResumen = function() {
  return {
    seccion: this.seccion,
    calificacion: this.calificacion,
    score: this.score_numerico || this.calcularScoreNumerico(),
    nivel_riesgo: this.nivel_riesgo,
    comentarios_resumen: this.comentarios?.substring(0, 200) + '...',
    fecha: this.fecha_evaluacion,
    auditor: this.auditor_id
  };
};

// Métodos estáticos
Evaluacion.obtenerProgresoAuditoria = async function(auditoria_id) {
  const secciones_requeridas = [
    'topologia', 'cuarto_tecnologia', 'conectividad', 'energia',
    'temperatura_ct', 'servidores', 'internet', 'seguridad_informatica',
    'personal_capacitado', 'escalamiento', 'informacion_entorno', 'parque_hardware'
  ];
  
  const evaluaciones = await this.findAll({
    where: { 
      auditoria_id,
      estado: ['COMPLETADA', 'REVISADA', 'APROBADA']
    }
  });
  
  const seccionesEvaluadas = evaluaciones.map(e => e.seccion);
  const progreso = (seccionesEvaluadas.length / secciones_requeridas.length) * 100;
  
  return {
    total_secciones: secciones_requeridas.length,
    secciones_evaluadas: seccionesEvaluadas.length,
    progreso_porcentaje: Math.round(progreso),
    secciones_pendientes: secciones_requeridas.filter(s => !seccionesEvaluadas.includes(s)),
    evaluaciones_criticas: evaluaciones.filter(e => e.esCritica()).length
  };
};

Evaluacion.generarResumenEjecutivo = async function(auditoria_id) {
  const evaluaciones = await this.findAll({
    where: { 
      auditoria_id,
      estado: ['COMPLETADA', 'REVISADA', 'APROBADA']
    }
  });
  
  if (evaluaciones.length === 0) {
    return null;
  }
  
  const stats = {
    total_evaluaciones: evaluaciones.length,
    cumple: evaluaciones.filter(e => e.calificacion === 'CUMPLE').length,
    cumple_con_observaciones: evaluaciones.filter(e => e.calificacion === 'CUMPLE_CON_OBSERVACIONES').length,
    no_cumple: evaluaciones.filter(e => e.calificacion === 'NO_CUMPLE').length,
    no_aplica: evaluaciones.filter(e => e.calificacion === 'NO_APLICA').length,
    pendiente_aclaracion: evaluaciones.filter(e => e.calificacion === 'PENDIENTE_ACLARACION').length
  };
  
  const scoresValidos = evaluaciones
    .map(e => e.score_numerico || e.calcularScoreNumerico())
    .filter(s => s !== null);
  
  const scorePromedio = scoresValidos.length > 0 
    ? scoresValidos.reduce((sum, score) => sum + score, 0) / scoresValidos.length 
    : 0;
  
  return {
    ...stats,
    score_general: Math.round(scorePromedio * 100) / 100,
    porcentaje_cumplimiento: Math.round(((stats.cumple + stats.cumple_con_observaciones) / stats.total_evaluaciones) * 100),
    evaluaciones_criticas: evaluaciones.filter(e => e.esCritica()).length,
    requieren_accion_inmediata: evaluaciones.filter(e => e.requiere_accion_inmediata).length
  };
};

module.exports = Evaluacion;