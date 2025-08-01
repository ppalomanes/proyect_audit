// /server/domains/chat/models/index.js
const Workspace = require('./Workspace.model');
const Canal = require('./Canal.model');
const Mensaje = require('./Mensaje.model');
const ParticipanteWorkspace = require('./ParticipanteWorkspace.model');
const LecturasMensaje = require('./LecturasMensaje.model');
const ArchivosMensaje = require('./ArchivosMensaje.model');

// Relaciones entre modelos
// Workspace -> Canales
Workspace.hasMany(Canal, {
  foreignKey: 'workspace_id',
  as: 'canales'
});
Canal.belongsTo(Workspace, {
  foreignKey: 'workspace_id',
  as: 'workspace'
});

// Canal -> Mensajes
Canal.hasMany(Mensaje, {
  foreignKey: 'canal_id',
  as: 'mensajes'
});
Mensaje.belongsTo(Canal, {
  foreignKey: 'canal_id',
  as: 'canal'
});

// Mensaje -> Thread (auto-referencia)
Mensaje.hasMany(Mensaje, {
  foreignKey: 'parent_mensaje_id',
  as: 'replies'
});
Mensaje.belongsTo(Mensaje, {
  foreignKey: 'parent_mensaje_id',
  as: 'parent'
});

// Workspace -> Participantes
Workspace.hasMany(ParticipanteWorkspace, {
  foreignKey: 'workspace_id',
  as: 'participantes'
});
ParticipanteWorkspace.belongsTo(Workspace, {
  foreignKey: 'workspace_id',
  as: 'workspace'
});

// Mensaje -> Lecturas
Mensaje.hasMany(LecturasMensaje, {
  foreignKey: 'mensaje_id',
  as: 'lecturas'
});
LecturasMensaje.belongsTo(Mensaje, {
  foreignKey: 'mensaje_id',
  as: 'mensaje'
});

// Mensaje -> Archivos
Mensaje.hasMany(ArchivosMensaje, {
  foreignKey: 'mensaje_id',
  as: 'archivos_adjuntos'
});
ArchivosMensaje.belongsTo(Mensaje, {
  foreignKey: 'mensaje_id',
  as: 'mensaje'
});

module.exports = {
  Workspace,
  Canal,
  Mensaje,
  ParticipanteWorkspace,
  LecturasMensaje,
  ArchivosMensaje
};