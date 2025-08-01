// /server/domains/chat/models/ArchivosMensaje.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const ArchivosMensaje = sequelize.define('ArchivosMensaje', {
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
  nombre_original: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ruta_archivo: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  tipo_mime: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tamaño_bytes: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  es_imagen: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  thumbnail_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  descargado_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'chat_archivos_mensaje',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['mensaje_id']
    },
    {
      fields: ['tipo_mime']
    },
    {
      fields: ['es_imagen']
    }
  ]
});

module.exports = ArchivosMensaje;