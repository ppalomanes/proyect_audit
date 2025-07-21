const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const ParticipanteChat = sequelize.define('ParticipanteChat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de la conversación'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del usuario participante'
  },
  rol_en_chat: {
    type: DataTypes.ENUM('MODERADOR', 'PARTICIPANTE', 'OBSERVADOR'),
    defaultValue: 'PARTICIPANTE',
    comment: 'Rol del usuario en la conversación'
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'SILENCIADO', 'BLOQUEADO', 'INACTIVO'),
    defaultValue: 'ACTIVO',
    comment: 'Estado del participante'
  },
  ultimo_mensaje_leido_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del último mensaje leído por el usuario'
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que accedió a la conversación'
  },
  notificaciones_habilitadas: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si recibe notificaciones de esta conversación'
  },
  unido_fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha en que se unió a la conversación'
  },
  agregado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Usuario que agregó a este participante'
  },
  metadatos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información adicional del participante'
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
  tableName: 'participantes_chat',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_participante_conversacion',
      fields: ['conversacion_id']
    },
    {
      name: 'idx_participante_usuario',
      fields: ['usuario_id']
    },
    {
      name: 'idx_participante_conversacion_usuario',
      fields: ['conversacion_id', 'usuario_id'],
      unique: true
    },
    {
      name: 'idx_participante_estado',
      fields: ['estado']
    },
    {
      name: 'idx_participante_ultimo_acceso',
      fields: ['ultimo_acceso']
    }
  ]
});

// Hook para logging
ParticipanteChat.addHook('afterCreate', async (participante) => {
  console.log(`👥 Usuario ${participante.usuario_id} agregado a conversación ${participante.conversacion_id} como ${participante.rol_en_chat}`);
});

// Método para calcular mensajes no leídos
ParticipanteChat.prototype.getMensajesNoLeidos = async function() {
  const Mensaje = require('./Mensaje.model');
  
  const whereCondition = {
    conversacion_id: this.conversacion_id
  };
  
  if (this.ultimo_mensaje_leido_id) {
    whereCondition.id = {
      [sequelize.Sequelize.Op.gt]: this.ultimo_mensaje_leido_id
    };
  }
  
  return await Mensaje.count({
    where: whereCondition
  });
};

module.exports = ParticipanteChat;