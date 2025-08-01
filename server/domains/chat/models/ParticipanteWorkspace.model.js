// /server/domains/chat/models/ParticipanteWorkspace.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const ParticipanteWorkspace = sequelize.define('ParticipanteWorkspace', {
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
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  rol: {
    type: DataTypes.ENUM('ADMIN', 'MODERADOR', 'MIEMBRO', 'SOLO_LECTURA'),
    allowNull: false,
    defaultValue: 'MIEMBRO'
  },
  agregado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  ultimo_acceso_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notificaciones_habilitadas: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  configuracion_personal: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      sonidos_habilitados: true,
      notificaciones_push: true,
      mostrar_previews: true
    }
  }
}, {
  tableName: 'chat_participantes_workspace',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['workspace_id', 'usuario_id']
    },
    {
      fields: ['usuario_id']
    },
    {
      fields: ['rol']
    },
    {
      fields: ['ultimo_acceso_at']
    }
  ]
});

module.exports = ParticipanteWorkspace;