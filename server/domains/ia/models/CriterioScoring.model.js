/**
 * Modelo CriterioScoring para Portal de Auditorías Técnicas
 * Define criterios personalizables de scoring para análisis de IA
 * Permite configuración específica por tipo de auditoría y dominio técnico
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const CriterioScoring = sequelize.define('CriterioScoring', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único del criterio de scoring'
  },

  // === IDENTIFICACIÓN Y CONTEXTO ===
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nombre descriptivo del criterio'
  },

  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Código único identificador del criterio'
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del criterio y su aplicación'
  },

  // === CATEGORIZACIÓN ===
  categoria: {
    type: DataTypes.ENUM(
      'CUMPLIMIENTO',      // Criterios de cumplimiento normativo
      'SEGURIDAD',         // Criterios de seguridad técnica
      'CALIDAD',           // Criterios de calidad técnica
      'COMPLETITUD',       // Criterios de completitud de información
      'PERFORMANCE',       // Criterios de rendimiento
      'INFRAESTRUCTURA'    // Criterios de infraestructura
    ),
    allowNull: false,
    comment: 'Categoría principal del criterio'
  },

  tipo_analisis: {
    type: DataTypes.ENUM(
      'document_compliance',
      'security_analysis',
      'infrastructure_review',
      'image_analysis',
      'batch_analysis'
    ),
    allowNull: false,
    comment: 'Tipo de análisis al que aplica este criterio'
  },

  dominio_tecnico: {
    type: DataTypes.ENUM(
      'HARDWARE',          // Criterios específicos de hardware
      'SOFTWARE',          // Criterios específicos de software
      'REDES',            // Criterios de conectividad y redes
      'SEGURIDAD',        // Criterios de seguridad informática
      'GENERAL'           // Criterios generales
    ),
    allowNull: false,
    defaultValue: 'GENERAL',
    comment: 'Dominio técnico específico'
  },

  // === CONFIGURACIÓN DE SCORING ===
  peso: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 1.0,
    validate: { min: 0.1, max: 10.0 },
    comment: 'Peso relativo del criterio en el cálculo total (0.1-10.0)'
  },

  valor_minimo: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
    comment: 'Valor mínimo esperado para considerar cumplimiento (0-100)'
  },

  valor_objetivo: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 80,
    validate: { min: 0, max: 100 },
    comment: 'Valor objetivo para scoring óptimo (0-100)'
  },

  es_critico: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si es un criterio crítico (falla automática si no cumple)'
  },

  es_obligatorio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si es obligatorio evaluar este criterio'
  },

  // === CONFIGURACIÓN DE EVALUACIÓN ===
  patron_deteccion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Patrón regex o keywords para detectar en contenido'
  },

  prompt_evaluacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Prompt específico para evaluar este criterio con IA'
  },

  metrica_evaluacion: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración específica de cómo medir/evaluar el criterio'
  },

  // === VALIDACIONES Y REGLAS ===
  reglas_validacion: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Reglas específicas de validación en formato JSON'
  },

  condiciones_aplicacion: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Condiciones bajo las cuales aplica este criterio'
  },

  // === RESULTADOS ESPERADOS ===
  valores_referencia: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Valores de referencia por categoría o tipo'
  },

  mensajes_feedback: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Mensajes personalizados según resultado de evaluación'
  },

  // === CONFIGURACIÓN DE ESTADO ===
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el criterio está activo para evaluaciones'
  },

  version: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Versión del criterio para control de cambios'
  },

  fecha_vigencia_desde: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha desde la cual es válido este criterio'
  },

  fecha_vigencia_hasta: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha hasta la cual es válido este criterio'
  },

  // === METADATOS ===
  creado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del usuario que creó el criterio'
  },

  modificado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del usuario que modificó por última vez'
  },

  tags: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Tags separados por coma para categorización adicional'
  },

  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones adicionales sobre el criterio'
  }

}, {
  tableName: 'criterios_scoring',
  timestamps: true,
  paranoid: true,
  underscored: true,
  
  indexes: [
    {
      fields: ['categoria', 'tipo_analisis']
    },
    {
      fields: ['activo', 'es_obligatorio'],
      name: 'idx_activo_obligatorio'
    },
    {
      fields: ['codigo'],
      unique: true,
      name: 'idx_unique_codigo'
    },
    {
      fields: ['dominio_tecnico', 'peso'],
      name: 'idx_dominio_peso'
    },
    {
      fields: ['fecha_vigencia_desde', 'fecha_vigencia_hasta'],
      name: 'idx_vigencia'
    }
  ]
});

// === MÉTODOS DE INSTANCIA ===
CriterioScoring.prototype.estaVigente = function() {
  const ahora = new Date();
  
  if (this.fecha_vigencia_desde && ahora < this.fecha_vigencia_desde) {
    return false;
  }
  
  if (this.fecha_vigencia_hasta && ahora > this.fecha_vigencia_hasta) {
    return false;
  }
  
  return this.activo;
};

CriterioScoring.prototype.calcularScore = function(valorObtenido) {
  if (!valorObtenido || valorObtenido < 0) return 0;
  
  if (this.es_critico && valorObtenido < this.valor_minimo) {
    return 0;
  }
  
  if (valorObtenido <= this.valor_minimo) {
    return this.valor_minimo;
  }
  
  if (valorObtenido >= this.valor_objetivo) {
    return 100;
  }
  
  const rango = this.valor_objetivo - this.valor_minimo;
  const progreso = valorObtenido - this.valor_minimo;
  
  return Math.round((progreso / rango) * (100 - this.valor_minimo) + this.valor_minimo);
};

module.exports = CriterioScoring;
