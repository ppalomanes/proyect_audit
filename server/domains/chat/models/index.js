const Conversacion = require('./Conversacion.model');
const Mensaje = require('./Mensaje.model');
const ParticipanteChat = require('./ParticipanteChat.model');

// Definir relaciones entre modelos
const setupChatAssociations = () => {
  
  // Conversación → Mensajes (1:N)
  Conversacion.hasMany(Mensaje, {
    foreignKey: 'conversacion_id',
    as: 'mensajes',
    onDelete: 'CASCADE'
  });
  
  Mensaje.belongsTo(Conversacion, {
    foreignKey: 'conversacion_id',
    as: 'conversacion'
  });

  // Conversación → Participantes (1:N)
  Conversacion.hasMany(ParticipanteChat, {
    foreignKey: 'conversacion_id',
    as: 'participantes',
    onDelete: 'CASCADE'
  });
  
  ParticipanteChat.belongsTo(Conversacion, {
    foreignKey: 'conversacion_id',
    as: 'conversacion'
  });

  // Mensaje → Respuestas (Self-reference)
  Mensaje.hasMany(Mensaje, {
    foreignKey: 'respuesta_a',
    as: 'respuestas'
  });
  
  Mensaje.belongsTo(Mensaje, {
    foreignKey: 'respuesta_a',
    as: 'mensaje_padre'
  });

  // Conversación → Último Mensaje (1:1)
  Conversacion.belongsTo(Mensaje, {
    foreignKey: 'ultimo_mensaje_id',
    as: 'ultimo_mensaje'
  });

  // ParticipanteChat → Último Mensaje Leído (1:1)
  ParticipanteChat.belongsTo(Mensaje, {
    foreignKey: 'ultimo_mensaje_leido_id',
    as: 'ultimo_mensaje_leido'
  });

  console.log('✅ Asociaciones del Chat configuradas');
};

module.exports = {
  Conversacion,
  Mensaje,
  ParticipanteChat,
  setupChatAssociations
};