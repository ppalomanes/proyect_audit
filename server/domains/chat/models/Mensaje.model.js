// /server/domains/chat/models/Mensaje.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Mensaje = sequelize.define('Mensaje', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  canal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_canales',
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
  parent_mensaje_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'chat_mensajes',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('TEXTO', 'ARCHIVO', 'IMAGEN', 'SISTEMA', 'ANUNCIO', 'THREAD'),
    allowNull: false,
    defaultValue: 'TEXTO'
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contenido_html: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  archivos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    // Estructura: [{ nombre, url, tipo, tamaño, thumbnail? }]
  },
  metadatos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    // Para menciones, enlaces, reacciones, etc.
  },
  editado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  editado_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  eliminado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  eliminado_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fijado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  thread_replies_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  reacciones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    // Estructura: { "👍": [user_ids], "❤️": [user_ids] }
  }
}, {
  tableName: 'chat_mensajes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['canal_id']
    },
    {
      fields: ['usuario_id']
    },
    {
      fields: ['parent_mensaje_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['tipo']
    },
    {
      fields: ['eliminado']
    },
    {
      fields: ['fijado']
    }
  ]
});

module.exports = Mensaje;