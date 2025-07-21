const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ParticipanteEspacio = sequelize.define('ParticipanteEspacio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // === RELACIONES ===
    espacio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del espacio de auditoría'
    },
    
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del usuario participante'
    },
    
    // === ROL EN EL ESPACIO ===
    rol: {
      type: DataTypes.ENUM(
        'ADMINISTRADOR',  // Control total del espacio
        'MODERADOR',      // Puede moderar pero no administrar
        'AUDITOR',        // Miembro del equipo auditor
        'PROVEEDOR',      // Representante del proveedor
        'OBSERVADOR',     // Solo lectura
        'PARTICIPANTE'    // Participación normal
      ),
      allowNull: false,
      defaultValue: 'PARTICIPANTE',
      comment: 'Rol del usuario en el espacio'
    },
    
    // === PERMISOS ESPECÍFICOS ===
    permisos: {
      type: DataTypes.JSON,
      defaultValue: {
        crear_canales: false,
        eliminar_canales: false,
        invitar_usuarios: false,
        eliminar_mensajes: false,
        moderar_contenido: false,
        ver_estadisticas: false,
        exportar_datos: false,
        administrar_integraciones: false
      },
      comment: 'Permisos específicos del usuario'
    },
    
    // === ESTADO DEL PARTICIPANTE ===
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO'),
      defaultValue: 'ACTIVO',
      comment: 'Estado del participante en el espacio'
    },
    
    // === CONFIGURACIONES PERSONALES ===
    configuracion_personal: {
      type: DataTypes.JSON,
      defaultValue: {
        notificaciones_push: true,
        notificaciones_email: false,
        notificaciones_menciones: true,
        notificaciones_canales_seguidos: true,
        modo_no_molestar: false,
        horario_no_molestar: {
          inicio: '22:00',
          fin: '08:00'
        },
        canales_silenciados: [],
        frecuencia_resumen_email: 'diario'
      },
      comment: 'Configuraciones personales del usuario'
    },
    
    // === METADATOS ===
    invitado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Usuario que invitó a este participante'
    },
    
    fecha_union: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha en que se unió al espacio'
    },
    
    ultima_actividad: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última vez que estuvo activo en el espacio'
    },
    
    // === ESTADÍSTICAS ===
    estadisticas: {
      type: DataTypes.JSON,
      defaultValue: {
        mensajes_enviados: 0,
        canales_activos: 0,
        tiempo_total_minutos: 0,
        dias_activos: 0,
        ultimo_canal_visitado: null,
        canales_creados: 0
      },
      comment: 'Estadísticas del participante'
    }
  }, {
    tableName: 'participantes_espacio',
    timestamps: true,
    createdAt: 'fecha_union',
    updatedAt: 'ultima_actividad',
    
    indexes: [
      {
        unique: true,
        fields: ['espacio_id', 'usuario_id']
      },
      {
        fields: ['rol']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_union']
      }
    ]
  });

  // === MÉTODOS DE INSTANCIA ===
  ParticipanteEspacio.prototype.actualizarUltimaActividad = async function() {
    this.ultima_actividad = new Date();
    await this.save();
  };

  ParticipanteEspacio.prototype.incrementarEstadistica = async function(campo, valor = 1) {
    this.estadisticas = {
      ...this.estadisticas,
      [campo]: (this.estadisticas[campo] || 0) + valor
    };
    await this.save();
  };

  ParticipanteEspacio.prototype.tienePermiso = function(permiso) {
    // Administradores tienen todos los permisos
    if (this.rol === 'ADMINISTRADOR') {
      return true;
    }
    
    // Verificar permisos específicos
    return this.permisos[permiso] === true;
  };

  ParticipanteEspacio.prototype.silenciarCanal = async function(canalId) {
    const canalesSilenciados = this.configuracion_personal.canales_silenciados || [];
    if (!canalesSilenciados.includes(canalId)) {
      canalesSilenciados.push(canalId);
      this.configuracion_personal = {
        ...this.configuracion_personal,
        canales_silenciados: canalesSilenciados
      };
      await this.save();
    }
  };

  ParticipanteEspacio.prototype.desilenciarCanal = async function(canalId) {
    const canalesSilenciados = this.configuracion_personal.canales_silenciados || [];
    const index = canalesSilenciados.indexOf(canalId);
    if (index > -1) {
      canalesSilenciados.splice(index, 1);
      this.configuracion_personal = {
        ...this.configuracion_personal,
        canales_silenciados: canalesSilenciados
      };
      await this.save();
    }
  };

  // === MÉTODOS ESTÁTICOS ===
  ParticipanteEspacio.obtenerPorEspacio = async function(espacioId, filtros = {}) {
    const where = { espacio_id: espacioId };
    
    if (filtros.rol) where.rol = filtros.rol;
    if (filtros.estado) where.estado = filtros.estado;
    
    return await this.findAll({
      where,
      include: [
        {
          model: sequelize.models.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'avatar']
        },
        {
          model: sequelize.models.Usuario,
          as: 'invitador',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      order: [['fecha_union', 'ASC']]
    });
  };

  ParticipanteEspacio.obtenerEspaciosPorUsuario = async function(usuarioId) {
    return await this.findAll({
      where: { usuario_id: usuarioId, estado: 'ACTIVO' },
      include: [
        {
          model: sequelize.models.AuditoriaEspacio,
          as: 'espacio',
          include: [
            {
              model: sequelize.models.Canal,
              as: 'canales',
              where: { estado: 'ACTIVO' },
              required: false
            }
          ]
        }
      ],
      order: [['ultima_actividad', 'DESC']]
    });
  };

  // === ASOCIACIONES ===
  ParticipanteEspacio.associate = function(models) {
    // Un participante pertenece a un espacio
    ParticipanteEspacio.belongsTo(models.AuditoriaEspacio, {
      foreignKey: 'espacio_id',
      as: 'espacio'
    });
    
    // Un participante es un usuario
    ParticipanteEspacio.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });
    
    // Un participante fue invitado por alguien
    ParticipanteEspacio.belongsTo(models.Usuario, {
      foreignKey: 'invitado_por',
      as: 'invitador'
    });
  };

  return ParticipanteEspacio;
};
