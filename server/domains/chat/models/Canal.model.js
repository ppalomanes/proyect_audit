// /server/domains/chat/models/Canal.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Canal = sequelize.define('Canal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workspace_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_workspaces',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50],
      // Nombre de canal sin espacios, solo letras, números, guiones
      is: /^[a-z0-9-_]+$/
    }
  },
  nombre_display: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM('GENERAL', 'DOCUMENTOS', 'SEGUIMIENTO', 'PRIVADO', 'ANUNCIOS'),
    allowNull: false,
    defaultValue: 'GENERAL'
  },
  icono: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '💬'
  },
  privado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  solo_lectura: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  archivado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  creado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  configuracion: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      pestanas_habilitadas: ['chat', 'lista', 'documentos', 'actividad'],
      notificaciones_default: true,
      threads_habilitados: true,
      reacciones_habilitadas: true
    }
  },
  estadisticas: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      total_mensajes: 0,
      participantes_activos: 0,
      ultimo_mensaje_at: null
    }
  }
}, {
  tableName: 'chat_canales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['workspace_id']
    },
    {
      fields: ['creado_por']
    },
    {
      unique: true,
      fields: ['workspace_id', 'nombre']
    },
    {
      fields: ['tipo']
    },
    {
      fields: ['privado']
    }
  ]
});

module.exports = Canal;