// /server/domains/chat/models/Workspace.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM('AUDITORIA', 'PROYECTO', 'EQUIPO', 'GENERAL'),
    allowNull: false,
    defaultValue: 'GENERAL'
  },
  icono: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '💬'
  },
  color: {
    type: DataTypes.STRING(7), // Hex color #FFFFFF
    allowNull: false,
    defaultValue: '#7C3AED',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Auditorias',
      key: 'id'
    }
  },
  creado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  configuracion: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      notificaciones_habilitadas: true,
      archivos_permitidos: true,
      max_participantes: 50
    }
  }
}, {
  tableName: 'chat_workspaces',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['auditoria_id']
    },
    {
      fields: ['creado_por']
    },
    {
      fields: ['activo']
    }
  ]
});

module.exports = Workspace;