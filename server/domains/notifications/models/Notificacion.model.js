// Notificacion.model.js - Modelo para notificaciones del sistema
const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario destinatario de la notificación'
  },
  tipo: {
    type: DataTypes.ENUM(
      'AUDITORIA_INICIADA',
      'DOCUMENTOS_PENDIENTES',
      'RECORDATORIO_CARGA',
      'VALIDACION_COMPLETADA',
      'REVISION_REQUERIDA',
      'VISITA_PROGRAMADA',
      'VISITA_COMPLETADA',
      'INFORME_DISPONIBLE',
      'AUDITORIA_CERRADA',
      'MENSAJE_NUEVO',
      'DOCUMENTO_RECHAZADO',
      'EXCEPCION_APROBADA',
      'SISTEMA'
    ),
    allowNull: false,
    comment: 'Tipo de notificación'
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Título de la notificación'
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Contenido del mensaje'
  },
  
  // Referencias
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'auditorias',
      key: 'id'
    },
    comment: 'Auditoría relacionada si aplica'
  },
  documento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'documentos_auditoria',
      key: 'id'
    },
    comment: 'Documento relacionado si aplica'
  },
  conversacion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'conversaciones',
      key: 'id'
    },
    comment: 'Conversación relacionada si aplica'
  },
  
  // Estado y tracking
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'ENVIADA', 'LEIDA', 'ARCHIVADA'),
    defaultValue: 'PENDIENTE',
    allowNull: false
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si la notificación ha sido leída'
  },
  fecha_lectura: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando fue leída'
  },
  
  // Canales de envío
  enviada_email: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si fue enviada por email'
  },
  fecha_envio_email: {
    type: DataTypes.DATE,
    allowNull: true
  },
  enviada_push: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si fue enviada como push notification'
  },
  fecha_envio_push: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Prioridad y configuración
  prioridad: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'),
    defaultValue: 'MEDIA',
    allowNull: false
  },
  requiere_accion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si requiere acción del usuario'
  },
  accion_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de la acción requerida'
  },
  accion_texto: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Texto del botón de acción'
  },
  
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Datos adicionales según el tipo de notificación'
  },
  
  // Expiración
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha después de la cual la notificación no es relevante'
  },
  
  // Control
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'notificaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['usuario_id', 'leida']
    },
    {
      fields: ['tipo']
    },
    {
      fields: ['auditoria_id']
    },
    {
      fields: ['fecha_expiracion']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Hooks
Notificacion.beforeUpdate(async (notificacion) => {
  // Marcar fecha de lectura cuando se marca como leída
  if (notificacion.changed('leida') && notificacion.leida && !notificacion.fecha_lectura) {
    notificacion.fecha_lectura = new Date();
    notificacion.estado = 'LEIDA';
  }
});

// Métodos de instancia
Notificacion.prototype.marcarComoLeida = async function() {
  this.leida = true;
  this.fecha_lectura = new Date();
  this.estado = 'LEIDA';
  return await this.save();
};

Notificacion.prototype.archivar = async function() {
  this.estado = 'ARCHIVADA';
  return await this.save();
};

// Métodos estáticos
Notificacion.contarNoLeidas = async function(usuarioId) {
  return await this.count({
    where: {
      usuario_id: usuarioId,
      leida: false,
      activo: true
    }
  });
};

Notificacion.obtenerRecientes = async function(usuarioId, limite = 10) {
  return await this.findAll({
    where: {
      usuario_id: usuarioId,
      activo: true
    },
    order: [['created_at', 'DESC']],
    limit: limite
  });
};

module.exports = Notificacion;
