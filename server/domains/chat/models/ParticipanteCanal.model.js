const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ParticipanteCanal = sequelize.define('ParticipanteCanal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // === RELACIONES ===
    canal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del canal'
    },
    
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del usuario participante'
    },
    
    // === ROL EN EL CANAL ===
    rol: {
      type: DataTypes.ENUM(
        'ADMINISTRADOR',  // Control total del canal
        'MODERADOR',      // Puede moderar contenido
        'PARTICIPANTE',   // Participación normal
        'OBSERVADOR'      // Solo lectura
      ),
      allowNull: false,
      defaultValue: 'PARTICIPANTE',
      comment: 'Rol del usuario en el canal'
    },
    
    // === ESTADO ===
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'SILENCIADO', 'BLOQUEADO'),
      defaultValue: 'ACTIVO',
      comment: 'Estado del participante en el canal'
    },
    
    // === CONFIGURACIONES ===
    notificaciones_activas: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si recibe notificaciones de este canal'
    },
    
    seguir_canal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si sigue las actualizaciones del canal'
    },
    
    // === METADATOS ===
    fecha_union: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha en que se unió al canal'
    },
    
    ultima_lectura: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de la última lectura del canal'
    },
    
    invitado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Usuario que invitó a este canal'
    }
  }, {
    tableName: 'participantes_canal',
    timestamps: false,
    
    indexes: [
      {
        unique: true,
        fields: ['canal_id', 'usuario_id']
      },
      {
        fields: ['rol']
      },
      {
        fields: ['estado']
      }
    ]
  });

  // === MÉTODOS DE INSTANCIA ===
  ParticipanteCanal.prototype.marcarComoLeido = async function() {
    this.ultima_lectura = new Date();
    await this.save();
  };

  ParticipanteCanal.prototype.silenciar = async function() {
    this.notificaciones_activas = false;
    this.estado = 'SILENCIADO';
    await this.save();
  };

  ParticipanteCanal.prototype.desilenciar = async function() {
    this.notificaciones_activas = true;
    this.estado = 'ACTIVO';
    await this.save();
  };

  // === ASOCIACIONES ===
  ParticipanteCanal.associate = function(models) {
    // Un participante pertenece a un canal
    ParticipanteCanal.belongsTo(models.Canal, {
      foreignKey: 'canal_id',
      as: 'canal'
    });
    
    // Un participante es un usuario
    ParticipanteCanal.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });
    
    // Un participante fue invitado por alguien
    ParticipanteCanal.belongsTo(models.Usuario, {
      foreignKey: 'invitado_por',
      as: 'invitador'
    });
  };

  return ParticipanteCanal;
};
