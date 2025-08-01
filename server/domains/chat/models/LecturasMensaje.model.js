// /server/domains/chat/models/LecturasMensaje.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const LecturasMensaje = sequelize.define('LecturasMensaje', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mensaje_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_mensajes',
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  leido_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chat_lecturas_mensaje',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['mensaje_id', 'usuario_id']
    },
    {
      fields: ['usuario_id']
    },
    {
      fields: ['leido_at']
    }
  ]
});

module.exports = LecturasMensaje;