/**
 * Modelo ChatEstadoMensaje - Estados Avanzados de Seguimiento
 * Portal de Auditorías Técnicas
 * 
 * Implementa el seguimiento detallado de estados según PDF "Módulos Adicionales"
 */

const { DataTypes } = require('sequelize');

const ChatEstadoMensaje = (sequelize) => {
  return sequelize.define('ChatEstadoMensaje', {
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
      },
      onDelete: 'CASCADE'
    },
    estado: {
      type: DataTypes.ENUM(
        'ENVIADO',
        'ENTREGADO', 
        'LEIDO',
        'EN_PROCESO',
        'RESPONDIDO',
        'CERRADO',
        'ESCALADO',
        'ARCHIVADO'
      ),
      allowNull: false,
      comment: 'Estado actual del mensaje según flujo del PDF'
    },
    usuario_actualizacion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario que cambió el estado'
    },
    comentario_cambio: {
      type: DataTypes.TEXT,
      comment: 'Comentario opcional del cambio de estado'
    },
    fecha_cambio: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    notificacion_enviada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si se envió notificación del cambio'
    },
    metadata_estado: {
      type: DataTypes.JSON,
      comment: 'Información adicional del estado'
    }
  }, {
    tableName: 'chat_estados_mensaje',
    timestamps: true,
    indexes: [
      { fields: ['mensaje_id', 'estado'] },
      { fields: ['fecha_cambio'] },
      { fields: ['usuario_actualizacion'] },
      { fields: ['estado'] }
    ],
    hooks: {
      afterCreate: async (estadoMensaje) => {
        // Auto-generar metadata según el tipo de estado
        const metadata = {};
        
        switch (estadoMensaje.estado) {
          case 'ENVIADO':
            metadata.timestamp_envio = new Date();
            break;
          case 'LEIDO':
            metadata.timestamp_lectura = new Date();
            break;
          case 'EN_PROCESO':
            metadata.timestamp_inicio_proceso = new Date();
            break;
          case 'RESPONDIDO':
            metadata.timestamp_respuesta = new Date();
            break;
          case 'ESCALADO':
            metadata.timestamp_escalamiento = new Date();
            metadata.nivel_escalamiento = 1;
            break;
        }
        
        if (Object.keys(metadata).length > 0) {
          await estadoMensaje.update({ metadata_estado: metadata });
        }
      }
    }
  });
};

module.exports = ChatEstadoMensaje;
