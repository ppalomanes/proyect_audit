const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * Modelo HallazgoVisita
 * Gestiona los hallazgos específicos detectados durante la visita presencial
 * Según flujo documentado: Registra incidencias y observaciones detalladas
 */
const HallazgoVisita = sequelize.define('HallazgoVisita', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // === REFERENCIAS ===
  visita_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'VisitasPresenciales',
      key: 'id'
    },
    comment: 'Referencia a la visita presencial'
  },
  
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
    comment: 'Auditor que detectó el hallazgo'
  },
  
  // === INFORMACIÓN DEL HALLAZGO ===
  codigo_hallazgo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Código único del hallazgo (auto-generado)'
  },
  
  tipo_hallazgo: {
    type: DataTypes.ENUM(
      'cumplimiento',
      'incumplimiento',
      'observacion',
      'mejora',
      'critico',
      'riesgo',
      'oportunidad'
    ),
    allowNull: false,
    comment: 'Tipo de hallazgo detectado'
  },
  
  categoria_hallazgo: {
    type: DataTypes.ENUM(
      'infraestructura',
      'tecnologia',
      'seguridad',
      'operaciones',
      'personal',
      'documentacion',
      'procesos',
      'ambiente'
    ),
    allowNull: false,
    comment: 'Categoría del hallazgo'
  },
  
  // === UBICACIÓN DEL HALLAZGO ===
  seccion_relacionada: {
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
      'parque_informatico',
      'general'
    ),
    allowNull: false,
    comment: 'Sección específica relacionada con el hallazgo'
  },
  
  ubicacion_especifica: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Ubicación específica dentro del sitio donde se detectó'
  },
  
  // === DESCRIPCIÓN DETALLADA ===
  titulo_hallazgo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Título descriptivo del hallazgo'
  },
  
  descripcion_detallada: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Descripción detallada del hallazgo'
  },
  
  evidencia_observada: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Evidencia específica observada'
  },
  
  requisito_incumplido: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Requisito específico del pliego que no se cumple'
  },
  
  // === SEVERIDAD E IMPACTO ===
  nivel_severidad: {
    type: DataTypes.ENUM(
      'baja',
      'media',
      'alta',
      'critica'
    ),
    allowNull: false,
    comment: 'Nivel de severidad del hallazgo'
  },
  
  impacto_estimado: {
    type: DataTypes.ENUM(
      'minimo',
      'bajo',
      'moderado',
      'alto',
      'severo'
    ),
    allowNull: false,
    comment: 'Impacto estimado del hallazgo'
  },
  
  riesgo_asociado: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción del riesgo asociado al hallazgo'
  },
  
  // === EVIDENCIAS DOCUMENTALES ===
  fotografias: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de rutas de fotografías tomadas como evidencia'
  },
  
  documentos_relacionados: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Documentos relacionados con el hallazgo'
  },
  
  mediciones_realizadas: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Mediciones técnicas realizadas (temperatura, voltaje, etc.)'
  },
  
  // === RECOMENDACIONES ===
  accion_correctiva_recomendada: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Acción correctiva recomendada'
  },
  
  plazo_recomendado: {
    type: DataTypes.ENUM(
      'inmediato',
      '24_horas',
      '1_semana',
      '1_mes',
      '3_meses',
      '6_meses'
    ),
    allowNull: true,
    comment: 'Plazo recomendado para implementar la corrección'
  },
  
  recursos_necesarios: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Recursos necesarios para implementar la corrección'
  },
  
  // === SEGUIMIENTO ===
  estado_seguimiento: {
    type: DataTypes.ENUM(
      'abierto',
      'en_seguimiento',
      'corregido',
      'verificado',
      'cerrado',
      'diferido'
    ),
    defaultValue: 'abierto',
    comment: 'Estado actual del seguimiento del hallazgo'
  },
  
  fecha_limite_correccion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha límite acordada para la corrección'
  },
  
  responsable_correccion: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Responsable designado para la corrección'
  },
  
  // === COMUNICACIÓN ===
  comunicado_proveedor: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si el hallazgo fue comunicado al proveedor'
  },
  
  fecha_comunicacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de comunicación del hallazgo al proveedor'
  },
  
  respuesta_proveedor: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Respuesta del proveedor al hallazgo'
  },
  
  fecha_respuesta_proveedor: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de respuesta del proveedor'
  },
  
  // === VERIFICACIÓN ===
  requiere_verificacion: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si el hallazgo requiere verificación posterior'
  },
  
  fecha_verificacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de verificación de la corrección'
  },
  
  resultado_verificacion: {
    type: DataTypes.ENUM(
      'pendiente',
      'corregido_satisfactoriamente',
      'correccion_parcial',
      'no_corregido',
      'nueva_incidencia'
    ),
    defaultValue: 'pendiente',
    comment: 'Resultado de la verificación'
  },
  
  observaciones_verificacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones de la verificación'
  },
  
  // === IMPACTO EN EVALUACIÓN ===
  afecta_puntuacion: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si el hallazgo afecta la puntuación final'
  },
  
  puntos_descuento: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Puntos de descuento en la evaluación'
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
  tableName: 'hallazgos_visita',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  indexes: [
    {
      fields: ['visita_id']
    },
    {
      fields: ['auditoria_id']
    },
    {
      fields: ['auditor_id']
    },
    {
      fields: ['codigo_hallazgo'],
      unique: true
    },
    {
      fields: ['tipo_hallazgo']
    },
    {
      fields: ['categoria_hallazgo']
    },
    {
      fields: ['nivel_severidad']
    },
    {
      fields: ['estado_seguimiento']
    }
  ],
  
  hooks: {
    beforeCreate: (hallazgoVisita, options) => {
      // Generar código único de hallazgo
      if (!hallazgoVisita.codigo_hallazgo) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        hallazgoVisita.codigo_hallazgo = `HAL-${timestamp}-${random}`.toUpperCase();
      }
      
      // Establecer fecha límite basada en plazo recomendado
      if (hallazgoVisita.plazo_recomendado && !hallazgoVisita.fecha_limite_correccion) {
        const fechaBase = new Date();
        switch(hallazgoVisita.plazo_recomendado) {
          case 'inmediato':
          case '24_horas':
            hallazgoVisita.fecha_limite_correccion = new Date(fechaBase.getTime() + (24 * 60 * 60 * 1000));
            break;
          case '1_semana':
            hallazgoVisita.fecha_limite_correccion = new Date(fechaBase.getTime() + (7 * 24 * 60 * 60 * 1000));
            break;
          case '1_mes':
            hallazgoVisita.fecha_limite_correccion = new Date(fechaBase.getTime() + (30 * 24 * 60 * 60 * 1000));
            break;
          case '3_meses':
            hallazgoVisita.fecha_limite_correccion = new Date(fechaBase.getTime() + (90 * 24 * 60 * 60 * 1000));
            break;
          case '6_meses':
            hallazgoVisita.fecha_limite_correccion = new Date(fechaBase.getTime() + (180 * 24 * 60 * 60 * 1000));
            break;
        }
      }
      
      // Establecer usuario creador
      if (options.user_id) {
        hallazgoVisita.created_by = options.user_id;
      }
    },
    
    beforeUpdate: (hallazgoVisita, options) => {
      // Establecer usuario que actualiza
      if (options.user_id) {
        hallazgoVisita.updated_by = options.user_id;
      }
    }
  }
});

/**
 * Asociaciones del modelo
 */
HallazgoVisita.associate = (models) => {
  // Pertenece a una Visita Presencial
  HallazgoVisita.belongsTo(models.VisitaPresencial, {
    foreignKey: 'visita_id',
    as: 'visita'
  });
  
  // Pertenece a una Auditoría
  HallazgoVisita.belongsTo(models.Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  // Pertenece a un Auditor
  HallazgoVisita.belongsTo(models.Usuario, {
    foreignKey: 'auditor_id',
    as: 'auditor'
  });
};

/**
 * Métodos de instancia
 */
HallazgoVisita.prototype.comunicarAProveedor = function() {
  this.comunicado_proveedor = true;
  this.fecha_comunicacion = new Date();
  return this.save();
};

HallazgoVisita.prototype.registrarRespuestaProveedor = function(respuesta) {
  this.respuesta_proveedor = respuesta;
  this.fecha_respuesta_proveedor = new Date();
  this.estado_seguimiento = 'en_seguimiento';
  return this.save();
};

HallazgoVisita.prototype.verificarCorreccion = function(resultado, observaciones) {
  this.resultado_verificacion = resultado;
  this.observaciones_verificacion = observaciones;
  this.fecha_verificacion = new Date();
  
  if (resultado === 'corregido_satisfactoriamente') {
    this.estado_seguimiento = 'cerrado';
  }
  
  return this.save();
};

/**
 * Métodos estáticos
 */
HallazgoVisita.obtenerPorVisita = async function(visitaId) {
  return await this.findAll({
    where: { visita_id: visitaId },
    include: [
      { model: this.sequelize.models.Usuario, as: 'auditor' }
    ],
    order: [['nivel_severidad', 'DESC'], ['created_at', 'ASC']]
  });
};

HallazgoVisita.obtenerPorAuditoria = async function(auditoriaId) {
  return await this.findAll({
    where: { auditoria_id: auditoriaId },
    include: [
      { model: this.sequelize.models.VisitaPresencial, as: 'visita' },
      { model: this.sequelize.models.Usuario, as: 'auditor' }
    ],
    order: [['nivel_severidad', 'DESC'], ['created_at', 'ASC']]
  });
};

HallazgoVisita.obtenerResumenPorSeveridad = async function(auditoriaId) {
  return await this.findAll({
    where: { auditoria_id: auditoriaId },
    attributes: [
      'nivel_severidad',
      [this.sequelize.fn('COUNT', '*'), 'cantidad'],
      [this.sequelize.fn('SUM', this.sequelize.col('puntos_descuento')), 'total_puntos_descuento']
    ],
    group: ['nivel_severidad']
  });
};

module.exports = HallazgoVisita;
