const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LecturaCanal = sequelize.define('LecturaCanal', {
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
      comment: 'ID del usuario'
    },
    
    // === LECTURA ===
    ultima_lectura: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha y hora de la última lectura'
    },
    
    ultimo_mensaje_leido: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del último mensaje leído'
    },
    
    mensajes_no_leidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Contador de mensajes no leídos'
    }
  }, {
    tableName: 'lecturas_canal',
    timestamps: false,
    
    indexes: [
      {
        unique: true,
        fields: ['canal_id', 'usuario_id']
      },
      {
        fields: ['ultima_lectura']
      }
    ]
  });

  // === MÉTODOS ESTÁTICOS ===
  LecturaCanal.marcarComoLeido = async function(canalId, usuarioId, mensajeId = null) {
    return await this.upsert({
      canal_id: canalId,
      usuario_id: usuarioId,
      ultima_lectura: new Date(),
      ultimo_mensaje_leido: mensajeId,
      mensajes_no_leidos: 0
    });
  };

  LecturaCanal.obtenerNoLeidos = async function(usuarioId) {
    return await this.findAll({
      where: {
        usuario_id: usuarioId,
        mensajes_no_leidos: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      include: [
        {
          model: sequelize.models.Canal,
          as: 'canal',
          attributes: ['id', 'nombre', 'icono']
        }
      ]
    });
  };

  // === ASOCIACIONES ===
  LecturaCanal.associate = function(models) {
    LecturaCanal.belongsTo(models.Canal, {
      foreignKey: 'canal_id',
      as: 'canal'
    });
    
    LecturaCanal.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });
  };

  return LecturaCanal;
};
