const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Conversacion = sequelize.define('Conversacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de la auditoría asociada'
  },
  tipo: {
    type: DataTypes.ENUM('AUDITORIA', 'SOPORTE', 'CONSULTA'),
    defaultValue: 'AUDITORIA',
    comment: 'Tipo de conversación'
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Título descriptivo de la conversación'
  },
  estado: {
    type: DataTypes.ENUM('ACTIVA', 'ARCHIVADA', 'CERRADA'),
    defaultValue: 'ACTIVA',
    comment: 'Estado actual de la conversación'
  },
  ultimo_mensaje_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del último mensaje para optimización'
  },
  ultimo_mensaje_fecha: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp del último mensaje'
  },
  creado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Usuario que inició la conversación'
  },
  metadatos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información adicional de la conversación'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'conversaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_conversacion_auditoria',
      fields: ['auditoria_id']
    },
    {
      name: 'idx_conversacion_estado',
      fields: ['estado']
    },
    {
      name: 'idx_conversacion_ultimo_mensaje',
      fields: ['ultimo_mensaje_fecha']
    }
  ]
});

// Hooks para mantener sincronizado el último mensaje
Conversacion.addHook('afterCreate', async (conversacion) => {
  console.log(`✅ Conversación creada: ${conversacion.titulo} para auditoría ${conversacion.auditoria_id}`);
});

module.exports = Conversacion;