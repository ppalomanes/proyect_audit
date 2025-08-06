// Etapa.model.js - Modelo para tracking de etapas del proceso de auditoría
const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Etapa = sequelize.define('Etapa', {
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
    },
    onDelete: 'CASCADE'
  },
  numero_etapa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 8
    },
    comment: 'Número de etapa (1-8)'
  },
  nombre_etapa: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre descriptivo de la etapa'
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'OMITIDA'),
    defaultValue: 'PENDIENTE',
    allowNull: false
  },
  
  // Fechas de tracking
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Cuando inició esta etapa'
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Cuando finalizó esta etapa'
  },
  fecha_limite: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha límite para completar la etapa'
  },
  
  // Métricas de la etapa
  duracion_horas: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Duración en horas de la etapa'
  },
  cumplimiento: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Porcentaje de cumplimiento'
  },
  
  // Responsable y validación
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario responsable de completar la etapa'
  },
  validado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario que validó la completitud'
  },
  
  // Detalles específicos por etapa
  detalles: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Detalles específicos según el tipo de etapa'
  },
  
  // Documentos y evidencias
  documentos_requeridos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de documentos requeridos en esta etapa'
  },
  documentos_completados: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de documentos completados'
  },
  
  // Observaciones
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  razones_omision: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razones si la etapa fue omitida'
  },
  
  // Notificaciones
  notificacion_enviada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si se envió notificación de inicio'
  },
  recordatorio_enviado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si se envió recordatorio'
  },
  
  // Control
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'etapas_auditoria',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['auditoria_id', 'numero_etapa'],
      unique: true
    },
    {
      fields: ['estado']
    },
    {
      fields: ['responsable_id']
    }
  ]
});

// Definición de las 8 etapas estándar
Etapa.ETAPAS_ESTANDAR = [
  {
    numero: 1,
    nombre: 'Notificación y Apertura',
    duracion_estimada_horas: 1,
    documentos_requeridos: []
  },
  {
    numero: 2,
    nombre: 'Carga de Documentación',
    duracion_estimada_horas: 72,
    documentos_requeridos: [
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
      'hardware_software'
    ]
  },
  {
    numero: 3,
    nombre: 'Validación Automática',
    duracion_estimada_horas: 2,
    documentos_requeridos: []
  },
  {
    numero: 4,
    nombre: 'Revisión por Auditor',
    duracion_estimada_horas: 24,
    documentos_requeridos: []
  },
  {
    numero: 5,
    nombre: 'Visita Presencial (Opcional)',
    duracion_estimada_horas: 8,
    documentos_requeridos: ['acta_visita', 'fotografias_visita']
  },
  {
    numero: 6,
    nombre: 'Análisis y Evaluación',
    duracion_estimada_horas: 16,
    documentos_requeridos: []
  },
  {
    numero: 7,
    nombre: 'Generación de Informe',
    duracion_estimada_horas: 4,
    documentos_requeridos: ['informe_final']
  },
  {
    numero: 8,
    nombre: 'Notificación y Cierre',
    duracion_estimada_horas: 1,
    documentos_requeridos: []
  }
];

// Hook para calcular duración al completar
Etapa.beforeUpdate(async (etapa) => {
  if (etapa.changed('estado') && etapa.estado === 'COMPLETADA') {
    if (etapa.fecha_inicio && !etapa.fecha_fin) {
      etapa.fecha_fin = new Date();
      const duracionMs = etapa.fecha_fin - etapa.fecha_inicio;
      etapa.duracion_horas = duracionMs / (1000 * 60 * 60);
    }
  }
});

module.exports = Etapa;
