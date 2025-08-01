const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Validacion = sequelize.define('Validacion', {
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
  documento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'documentos',
      key: 'id'
    },
    comment: 'Documento validado (null para validaciones generales)'
  },
  tipo_validacion: {
    type: DataTypes.ENUM(
      'FORMATO_ARCHIVO',
      'CONTENIDO_DOCUMENTO', 
      'PARQUE_INFORMATICO',
      'COMPLETITUD_SECCION',
      'REGLAS_NEGOCIO',
      'CONSISTENCIA_DATOS',
      'SCORING_IA',
      'VALIDACION_MANUAL'
    ),
    allowNull: false,
    comment: 'Tipo de validación ejecutada'
  },
  seccion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Sección específica validada'
  },
  
  // Resultado de la validación
  resultado: {
    type: DataTypes.ENUM('EXITOSO', 'CON_ADVERTENCIAS', 'FALLIDO', 'PENDIENTE'),
    allowNull: false,
    comment: 'Resultado general de la validación'
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Score numérico de la validación (0-100)'
  },
  
  // Detalles de errores y advertencias
  errores_criticos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de errores críticos encontrados'
  },
  advertencias: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de advertencias encontradas'
  },
  sugerencias: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Sugerencias de mejora'
  },
  
  // Estadísticas de validación
  total_elementos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total de elementos validados'
  },
  elementos_validos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Elementos que pasaron la validación'
  },
  elementos_con_errores: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Elementos con errores'
  },
  
  // Validación específica de parque informático
  equipos_validados: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total de equipos procesados'
  },
  equipos_cumplen: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Equipos que cumplen requisitos'
  },
  equipos_no_cumplen: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Equipos que no cumplen requisitos'
  },
  
  // Desglose por modalidad
  total_os: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total equipos On Site'
  },
  total_ho: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total equipos Home Office'
  },
  
  // Metadatos de ejecución
  ejecutado_por: {
    type: DataTypes.ENUM('SISTEMA', 'USUARIO', 'ETL', 'IA'),
    defaultValue: 'SISTEMA',
    allowNull: false,
    comment: 'Quién ejecutó la validación'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario que ejecutó la validación manual'
  },
  fecha_ejecucion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  tiempo_ejecucion_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tiempo de ejecución en milisegundos'
  },
  
  // Configuración aplicada
  reglas_aplicadas: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Reglas de validación aplicadas'
  },
  umbrales_utilizados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Umbrales técnicos utilizados'
  },
  
  // Resultados detallados
  detalle_validacion: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Detalle completo de la validación'
  },
  
  // Control de procesamiento
  procesado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si los resultados han sido procesados'
  },
  notificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si se ha notificado al usuario'
  }
}, {
  tableName: 'validaciones',
  timestamps: true,
  createdAt: 'fecha_ejecucion',
  updatedAt: false,
  indexes: [
    {
      fields: ['auditoria_id', 'tipo_validacion']
    },
    {
      fields: ['documento_id']
    },
    {
      fields: ['resultado', 'score']
    },
    {
      fields: ['fecha_ejecucion']
    },
    {
      fields: ['ejecutado_por', 'usuario_id']
    },
    {
      fields: ['procesado', 'notificado']
    }
  ]
});

// Métodos de instancia
Validacion.prototype.obtenerResumen = function() {
  return {
    id: this.id,
    tipo: this.tipo_validacion,
    resultado: this.resultado,
    score: this.score,
    errores: this.errores_criticos?.length || 0,
    advertencias: this.advertencias?.length || 0,
    fecha: this.fecha_ejecucion,
    tiempo_ms: this.tiempo_ejecucion_ms
  };
};

Validacion.prototype.esCritica = function() {
  return this.resultado === 'FALLIDO' || (this.errores_criticos && this.errores_criticos.length > 0);
};

// Métodos estáticos
Validacion.crearValidacionParque = async function(auditoria_id, resultadoETL, configuracion = {}) {
  const validacion = await this.create({
    auditoria_id,
    tipo_validacion: 'PARQUE_INFORMATICO',
    resultado: resultadoETL.tiene_errores_criticos ? 'FALLIDO' : 
               resultadoETL.tiene_advertencias ? 'CON_ADVERTENCIAS' : 'EXITOSO',
    score: resultadoETL.score_general,
    errores_criticos: resultadoETL.errores_criticos,
    advertencias: resultadoETL.advertencias,
    sugerencias: resultadoETL.sugerencias,
    equipos_validados: resultadoETL.total_equipos,
    equipos_cumplen: resultadoETL.equipos_validos,
    equipos_no_cumplen: resultadoETL.equipos_con_errores,
    total_os: resultadoETL.total_os,
    total_ho: resultadoETL.total_ho,
    ejecutado_por: 'ETL',
    reglas_aplicadas: configuracion.reglas,
    umbrales_utilizados: configuracion.umbrales,
    detalle_validacion: resultadoETL.detalle_completo,
    tiempo_ejecucion_ms: resultadoETL.tiempo_procesamiento_ms
  });
  
  return validacion;
};

Validacion.obtenerUltimaValidacion = async function(auditoria_id, tipo = null) {
  const where = { auditoria_id };
  if (tipo) where.tipo_validacion = tipo;
  
  return await this.findOne({
    where,
    order: [['fecha_ejecucion', 'DESC']]
  });
};

Validacion.obtenerResumenAuditoria = async function(auditoria_id) {
  const validaciones = await this.findAll({
    where: { auditoria_id },
    order: [['fecha_ejecucion', 'DESC']]
  });
  
  return {
    total_validaciones: validaciones.length,
    validaciones_exitosas: validaciones.filter(v => v.resultado === 'EXITOSO').length,
    validaciones_con_advertencias: validaciones.filter(v => v.resultado === 'CON_ADVERTENCIAS').length,
    validaciones_fallidas: validaciones.filter(v => v.resultado === 'FALLIDO').length,
    score_promedio: validaciones.length > 0 
      ? validaciones.reduce((sum, v) => sum + (v.score || 0), 0) / validaciones.length 
      : 0,
    ultima_validacion: validaciones[0]?.fecha_ejecucion
  };
};

module.exports = Validacion;