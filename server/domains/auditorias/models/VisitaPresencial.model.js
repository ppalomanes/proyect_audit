const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * Modelo VisitaPresencial
 * Gestiona las visitas presenciales de la Etapa 5 del proceso de auditoría
 * Según flujo documentado: Visita Presencial con verificación GPS
 */
const VisitaPresencial = sequelize.define('VisitaPresencial', {
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
  
  auditor_principal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Auditor principal responsable de la visita'
  },
  
  auditor_acompanante_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuarios',
      key: 'id'
    },
    comment: 'Auditor acompañante (opcional)'
  },
  
  // === INFORMACIÓN DE SITIO ===
  sitio_codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Código del sitio visitado'
  },
  
  sitio_nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nombre del sitio visitado'
  },
  
  sitio_direccion: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Dirección completa del sitio'
  },
  
  sitio_coordenadas_referencia: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Coordenadas GPS de referencia del sitio'
  },
  
  // === PROGRAMACIÓN DE VISITA ===
  fecha_programada: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha y hora programada para la visita'
  },
  
  fecha_confirmacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de confirmación por parte del proveedor'
  },
  
  contacto_sitio_nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del contacto en sitio'
  },
  
  contacto_sitio_telefono: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Teléfono del contacto en sitio'
  },
  
  contacto_sitio_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email del contacto en sitio'
  },
  
  // === EJECUCIÓN DE VISITA ===
  estado_visita: {
    type: DataTypes.ENUM(
      'programada',
      'confirmada',
      'en_curso',
      'completada',
      'reprogramada',
      'cancelada'
    ),
    defaultValue: 'programada',
    comment: 'Estado actual de la visita'
  },
  
  fecha_inicio_real: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora real de inicio de la visita'
  },
  
  fecha_fin_real: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora real de finalización de la visita'
  },
  
  duracion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duración total de la visita en minutos'
  },
  
  // === VERIFICACIÓN GPS ===
  gps_llegada: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Coordenadas GPS al llegar al sitio'
  },
  
  gps_salida: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Coordenadas GPS al salir del sitio'
  },
  
  distancia_referencia_metros: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Distancia en metros respecto a coordenadas de referencia'
  },
  
  verificacion_ubicacion: {
    type: DataTypes.ENUM(
      'pendiente',
      'verificada',
      'discrepancia_menor',
      'discrepancia_mayor',
      'no_verificable'
    ),
    defaultValue: 'pendiente',
    comment: 'Estado de verificación de ubicación GPS'
  },
  
  // === AGENDA DE VERIFICACIÓN ===
  items_agenda: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de items a verificar durante la visita'
  },
  
  secciones_verificar: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Secciones específicas que requieren verificación presencial'
  },
  
  // === OBSERVACIONES ===
  observaciones_generales: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones generales de la visita'
  },
  
  hallazgos_principales: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Principales hallazgos de la visita'
  },
  
  recomendaciones_inmediatas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Recomendaciones que requieren acción inmediata'
  },
  
  // === EVALUACIÓN GENERAL ===
  cumplimiento_general: {
    type: DataTypes.ENUM(
      'excelente',
      'bueno', 
      'regular',
      'deficiente',
      'critico'
    ),
    allowNull: true,
    comment: 'Evaluación general del cumplimiento observado'
  },
  
  puntuacion_visita: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Puntuación general de la visita (0-100)'
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
  tableName: 'visitas_presenciales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  indexes: [
    {
      fields: ['auditoria_id']
    },
    {
      fields: ['auditor_principal_id']
    },
    {
      fields: ['sitio_codigo']
    },
    {
      fields: ['estado_visita']
    },
    {
      fields: ['fecha_programada']
    }
  ],
  
  hooks: {
    beforeUpdate: (visitaPresencial, options) => {
      // Calcular duración automáticamente
      if (visitaPresencial.fecha_inicio_real && visitaPresencial.fecha_fin_real) {
        const inicio = new Date(visitaPresencial.fecha_inicio_real);
        const fin = new Date(visitaPresencial.fecha_fin_real);
        visitaPresencial.duracion_minutos = Math.round((fin - inicio) / (1000 * 60));
      }
      
      // Establecer usuario que actualiza
      if (options.user_id) {
        visitaPresencial.updated_by = options.user_id;
      }
    },
    
    beforeCreate: (visitaPresencial, options) => {
      // Establecer usuario creador
      if (options.user_id) {
        visitaPresencial.created_by = options.user_id;
      }
    }
  }
});

/**
 * Asociaciones del modelo
 */
VisitaPresencial.associate = (models) => {
  // Pertenece a una Auditoría
  VisitaPresencial.belongsTo(models.Auditoria, {
    foreignKey: 'auditoria_id',
    as: 'auditoria'
  });
  
  // Pertenece a un Auditor Principal
  VisitaPresencial.belongsTo(models.Usuario, {
    foreignKey: 'auditor_principal_id',
    as: 'auditorPrincipal'
  });
  
  // Pertenece a un Auditor Acompañante (opcional)
  VisitaPresencial.belongsTo(models.Usuario, {
    foreignKey: 'auditor_acompanante_id',
    as: 'auditorAcompanante'
  });
  
  // Tiene muchos hallazgos
  VisitaPresencial.hasMany(models.HallazgoVisita, {
    foreignKey: 'visita_id',
    as: 'hallazgos'
  });
};

/**
 * Métodos de instancia
 */
VisitaPresencial.prototype.iniciarVisita = function(coordenadasGPS) {
  this.estado_visita = 'en_curso';
  this.fecha_inicio_real = new Date();
  this.gps_llegada = coordenadasGPS;
  return this.save();
};

VisitaPresencial.prototype.finalizarVisita = function(coordenadasGPS) {
  this.estado_visita = 'completada';
  this.fecha_fin_real = new Date();
  this.gps_salida = coordenadasGPS;
  return this.save();
};

VisitaPresencial.prototype.calcularDistanciaReferencia = function() {
  if (!this.gps_llegada || !this.sitio_coordenadas_referencia) {
    return null;
  }
  
  const lat1 = this.gps_llegada.latitude;
  const lon1 = this.gps_llegada.longitude;
  const lat2 = this.sitio_coordenadas_referencia.latitude;
  const lon2 = this.sitio_coordenadas_referencia.longitude;
  
  // Fórmula de Haversine para calcular distancia
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;
  
  this.distancia_referencia_metros = distancia;
  
  // Determinar estado de verificación basado en distancia
  if (distancia <= 50) {
    this.verificacion_ubicacion = 'verificada';
  } else if (distancia <= 200) {
    this.verificacion_ubicacion = 'discrepancia_menor';
  } else {
    this.verificacion_ubicacion = 'discrepancia_mayor';
  }
  
  return this.save();
};

/**
 * Métodos estáticos
 */
VisitaPresencial.obtenerPorAuditoria = async function(auditoriaId) {
  return await this.findAll({
    where: { auditoria_id: auditoriaId },
    include: [
      { model: this.sequelize.models.Usuario, as: 'auditorPrincipal' },
      { model: this.sequelize.models.Usuario, as: 'auditorAcompanante' },
      { model: this.sequelize.models.HallazgoVisita, as: 'hallazgos' }
    ],
    order: [['fecha_programada', 'ASC']]
  });
};

module.exports = VisitaPresencial;
