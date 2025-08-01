const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * Modelo InformeAuditoria
 * Gestiona el informe final consolidado de las Etapas 6-8
 * Según flujo documentado: Consolidación, Informe Final y Cierre
 */
const InformeAuditoria = sequelize.define('InformeAuditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // === REFERENCIAS ===
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Auditorias',
      key: 'id'
    },
    comment: 'Referencia única a la auditoría principal'
  },
  
  auditor_responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Auditor responsable del informe final'
  },
  
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Supervisor que aprueba el informe'
  },
  
  // === INFORMACIÓN BÁSICA ===
  codigo_informe: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    comment: 'Código único del informe (auto-generado)'
  },
  
  version_informe: {
    type: DataTypes.STRING(10),
    defaultValue: '1.0',
    comment: 'Versión del informe'
  },
  
  tipo_informe: {
    type: DataTypes.ENUM(
      'informe_completo',
      'informe_parcial',
      'informe_seguimiento',
      'informe_excepcion'
    ),
    defaultValue: 'informe_completo',
    comment: 'Tipo de informe generado'
  },
  
  periodo_auditoria: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Período de auditoría (ej: "2025-S1", "2025-S2")'
  },
  
  // === INFORMACIÓN DEL PROVEEDOR ===
  proveedor_nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nombre del proveedor auditado'
  },
  
  proveedor_codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Código del proveedor'
  },
  
  sitios_auditados: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Lista de sitios incluidos en la auditoría'
  },
  
  total_sitios: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de sitios auditados'
  },
  
  // === FECHAS DEL PROCESO ===
  fecha_inicio_auditoria: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha de inicio del proceso de auditoría'
  },
  
  fecha_fin_auditoria: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha de finalización del proceso de auditoría'
  },
  
  fecha_visita_presencial: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de la visita presencial (si aplica)'
  },
  
  fecha_generacion_informe: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de generación del informe'
  },
  
  duracion_total_dias: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duración total del proceso en días'
  },
  
  // === RESUMEN EJECUTIVO ===
  resumen_ejecutivo: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Resumen ejecutivo del informe'
  },
  
  conclusion_general: {
    type: DataTypes.ENUM(
      'cumple_totalmente',
      'cumple_con_observaciones',
      'cumple_parcialmente',
      'no_cumple',
      'requiere_seguimiento'
    ),
    allowNull: false,
    comment: 'Conclusión general de la auditoría'
  },
  
  recomendacion_principal: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Recomendación principal para el proveedor'
  },
  
  // === PUNTUACIONES Y MÉTRICAS ===
  puntuacion_total: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Puntuación total de la auditoría (0-100)'
  },
  
  puntuacion_por_seccion: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Puntuaciones detalladas por cada sección'
  },
  
  nivel_cumplimiento: {
    type: DataTypes.ENUM(
      'excelente',
      'satisfactorio',
      'aceptable',
      'deficiente',
      'critico'
    ),
    allowNull: false,
    comment: 'Nivel de cumplimiento general'
  },
  
  // === ANÁLISIS DETALLADO ===
  secciones_evaluadas: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Detalle de todas las secciones evaluadas'
  },
  
  incumplimientos_criticos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de incumplimientos críticos identificados'
  },
  
  observaciones_menores: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de observaciones menores'
  },
  
  fortalezas_identificadas: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Fortalezas identificadas en el proveedor'
  },
  
  // === HALLAZGOS DE VISITA PRESENCIAL ===
  total_hallazgos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total de hallazgos de la visita presencial'
  },
  
  hallazgos_criticos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de hallazgos críticos'
  },
  
  hallazgos_por_categoria: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Resumen de hallazgos por categoría'
  },
  
  resumen_visita_presencial: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Resumen de la visita presencial'
  },
  
  // === VALIDACIONES AUTOMÁTICAS ===
  resultados_etl: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Resultados del procesamiento ETL del parque informático'
  },
  
  equipos_conformes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de equipos que cumplen los requisitos'
  },
  
  equipos_no_conformes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de equipos que no cumplen los requisitos'
  },
  
  porcentaje_conformidad_tecnica: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Porcentaje de conformidad técnica del parque informático'
  },
  
  // === PLAN DE ACCIÓN ===
  plan_accion_requerido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si se requiere un plan de acción'
  },
  
  fecha_limite_plan_accion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha límite para presentar plan de acción'
  },
  
  elementos_plan_accion: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Elementos que debe incluir el plan de acción'
  },
  
  // === SEGUIMIENTO ===
  requiere_seguimiento: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si la auditoría requiere seguimiento'
  },
  
  tipo_seguimiento: {
    type: DataTypes.ENUM(
      'seguimiento_documental',
      'visita_verificacion',
      'auditoria_especial',
      'monitoreo_continuo'
    ),
    allowNull: true,
    comment: 'Tipo de seguimiento requerido'
  },
  
  fecha_sugerida_seguimiento: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha sugerida para el seguimiento'
  },
  
  // === COMUNICACIÓN Y ENTREGA ===
  estado_informe: {
    type: DataTypes.ENUM(
      'borrador',
      'en_revision',
      'aprobado',
      'entregado',
      'aceptado_proveedor',
      'objetado_proveedor'
    ),
    defaultValue: 'borrador',
    comment: 'Estado actual del informe'
  },
  
  fecha_entrega_proveedor: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de entrega del informe al proveedor'
  },
  
  fecha_respuesta_proveedor: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de respuesta del proveedor'
  },
  
  observaciones_proveedor: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones del proveedor al informe'
  },
  
  // === ARCHIVOS Y DOCUMENTOS ===
  ruta_archivo_pdf: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Ruta del archivo PDF del informe'
  },
  
  // === VALIDACIÓN Y APROBACIÓN ===
  aprobado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Usuario que aprobó el informe'
  },
  
  fecha_aprobacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de aprobación del informe'
  },
  
  observaciones_aprobacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones de la aprobación'
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
  tableName: 'informes_auditoria',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  indexes: [
    {
      fields: ['auditoria_id'],
      unique: true
    },
    {
      fields: ['codigo_informe'],
      unique: true
    },
    {
      fields: ['auditor_responsable_id']
    },
    {
      fields: ['proveedor_codigo']
    },
    {
      fields: ['periodo_auditoria']
    },
    {
      fields: ['estado_informe']
    },
    {
      fields: ['conclusion_general']
    },
    {
      fields: ['fecha_generacion_informe']
    }
  ],
  
  hooks: {
    beforeCreate: (informeAuditoria, options) => {
      // Generar código único de informe
      if (!informeAuditoria.codigo_informe) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const timestamp = Date.now().toString(36);
        informeAuditoria.codigo_informe = `INF-${year}${month}-${timestamp}`.toUpperCase();
      }
      
      // Calcular duración del proceso
      if (informeAuditoria.fecha_inicio_auditoria && informeAuditoria.fecha_fin_auditoria) {
        const inicio = new Date(informeAuditoria.fecha_inicio_auditoria);
        const fin = new Date(informeAuditoria.fecha_fin_auditoria);
        informeAuditoria.duracion_total_dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
      }
      
      // Establecer usuario creador
      if (options.user_id) {
        informeAuditoria.created_by = options.user_id;
      }
    },
    
    beforeUpdate: (informeAuditoria, options) => {
      // Establecer usuario que actualiza
      if (options.user_id) {
        informeAuditoria.updated_by = options.user_id;
      }
    }
  }
});

/**
 * Asociaciones del modelo
 */
InformeAuditoria.associate = (models) => {
  // Pertenece a una Auditoría
  InformeAuditoria.belongsTo(models.Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  // Pertenece a un Auditor Responsable
  InformeAuditoria.belongsTo(models.Usuario, {
    foreignKey: 'auditor_responsable_id',
    as: 'auditorResponsable'
  });
  
  // Pertenece a un Supervisor
  InformeAuditoria.belongsTo(models.Usuario, {
    foreignKey: 'supervisor_id',
    as: 'supervisor'
  });
  
  // Usuario que aprobó
  InformeAuditoria.belongsTo(models.Usuario, {
    foreignKey: 'aprobado_por',
    as: 'aprobador'
  });
};

/**
 * Métodos de instancia
 */
InformeAuditoria.prototype.calcularPuntuacionTotal = async function() {
  // Obtener todas las secciones evaluadas de la auditoría
  const SeccionEvaluacion = this.sequelize.models.SeccionEvaluacion;
  const secciones = await SeccionEvaluacion.findAll({
    where: { auditoria_id: this.auditoria_id }
  });
  
  if (secciones.length === 0) {
    this.puntuacion_total = 0;
    return this.save();
  }
  
  // Calcular promedio ponderado de las secciones
  let totalPuntos = 0;
  let totalPeso = 0;
  const puntuacionesPorSeccion = {};
  
  for (const seccion of secciones) {
    const peso = seccion.es_obligatoria ? 2 : 1; // Secciones obligatorias pesan más
    const puntuacion = seccion.puntuacion || seccion.calcularScore();
    
    totalPuntos += puntuacion * peso;
    totalPeso += peso;
    
    puntuacionesPorSeccion[seccion.seccion_nombre] = puntuacion;
  }
  
  this.puntuacion_total = totalPeso > 0 ? totalPuntos / totalPeso : 0;
  this.puntuacion_por_seccion = puntuacionesPorSeccion;
  
  // Determinar nivel de cumplimiento basado en puntuación
  if (this.puntuacion_total >= 90) {
    this.nivel_cumplimiento = 'excelente';
    this.conclusion_general = 'cumple_totalmente';
  } else if (this.puntuacion_total >= 80) {
    this.nivel_cumplimiento = 'satisfactorio';
    this.conclusion_general = 'cumple_con_observaciones';
  } else if (this.puntuacion_total >= 70) {
    this.nivel_cumplimiento = 'aceptable';
    this.conclusion_general = 'cumple_parcialmente';
  } else if (this.puntuacion_total >= 50) {
    this.nivel_cumplimiento = 'deficiente';
    this.conclusion_general = 'no_cumple';
  } else {
    this.nivel_cumplimiento = 'critico';
    this.conclusion_general = 'no_cumple';
  }
  
  return this.save();
};

InformeAuditoria.prototype.consolidarHallazgos = async function() {
  const HallazgoVisita = this.sequelize.models.HallazgoVisita;
  const hallazgos = await HallazgoVisita.obtenerPorAuditoria(this.auditoria_id);
  
  this.total_hallazgos = hallazgos.length;
  this.hallazgos_criticos = hallazgos.filter(h => h.nivel_severidad === 'critica').length;
  
  // Agrupar por categoría
  const hallazgosPorCategoria = {};
  for (const hallazgo of hallazgos) {
    if (!hallazgosPorCategoria[hallazgo.categoria_hallazgo]) {
      hallazgosPorCategoria[hallazgo.categoria_hallazgo] = 0;
    }
    hallazgosPorCategoria[hallazgo.categoria_hallazgo]++;
  }
  
  this.hallazgos_por_categoria = hallazgosPorCategoria;
  return this.save();
};

InformeAuditoria.prototype.aprobar = function(usuarioId, observaciones) {
  this.estado_informe = 'aprobado';
  this.aprobado_por = usuarioId;
  this.fecha_aprobacion = new Date();
  this.observaciones_aprobacion = observaciones;
  return this.save();
};

InformeAuditoria.prototype.entregar = function() {
  this.estado_informe = 'entregado';
  this.fecha_entrega_proveedor = new Date();
  return this.save();
};

InformeAuditoria.prototype.registrarRespuestaProveedor = function(observaciones) {
  this.observaciones_proveedor = observaciones;
  this.fecha_respuesta_proveedor = new Date();
  this.estado_informe = observaciones ? 'objetado_proveedor' : 'aceptado_proveedor';
  return this.save();
};

/**
 * Métodos estáticos
 */
InformeAuditoria.obtenerPorPeriodo = async function(periodo) {
  return await this.findAll({
    where: { periodo_auditoria: periodo },
    include: [
      { model: this.sequelize.models.Usuario, as: 'auditorResponsable' },
      { model: this.sequelize.models.Auditoria, as: 'auditoria' }
    ],
    order: [['fecha_generacion_informe', 'DESC']]
  });
};

InformeAuditoria.obtenerEstadisticasPeriodo = async function(periodo) {
  const informes = await this.findAll({
    where: { periodo_auditoria: periodo },
    attributes: [
      'conclusion_general',
      'nivel_cumplimiento',
      [this.sequelize.fn('COUNT', '*'), 'cantidad'],
      [this.sequelize.fn('AVG', this.sequelize.col('puntuacion_total')), 'promedio_puntuacion']
    ],
    group: ['conclusion_general', 'nivel_cumplimiento']
  });
  
  return informes;
};

InformeAuditoria.obtenerPorProveedor = async function(proveedorCodigo) {
  return await this.findAll({
    where: { proveedor_codigo: proveedorCodigo },
    include: [
      { model: this.sequelize.models.Usuario, as: 'auditorResponsable' }
    ],
    order: [['fecha_generacion_informe', 'DESC']]
  });
};

module.exports = InformeAuditoria;
