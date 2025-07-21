const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Mensaje = sequelize.define('Mensaje', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // === RELACIONES ===
    canal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del canal donde se envió el mensaje'
    },
    
    conversacion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de conversación (para retrocompatibilidad)'
    },
    
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Usuario que envió el mensaje'
    },
    
    // === CONTENIDO ===
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Contenido del mensaje'
    },
    
    contenido_raw: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Contenido sin formato (markdown, etc.)'
    },
    
    // === TIPO Y FORMATO ===
    tipo: {
      type: DataTypes.ENUM(
        'TEXTO',        // Mensaje de texto normal
        'ARCHIVO',      // Archivo adjunto
        'IMAGEN',       // Imagen
        'SISTEMA',      // Mensaje del sistema
        'PUBLICACION',  // Publicación formal
        'TAREA',        // Mensaje tipo tarea
        'EVENTO',       // Evento de calendario
        'NOTA'          // Nota interna
      ),
      defaultValue: 'TEXTO',
      comment: 'Tipo de mensaje'
    },
    
    formato: {
      type: DataTypes.ENUM('PLAIN', 'MARKDOWN', 'HTML', 'RICH'),
      defaultValue: 'PLAIN',
      comment: 'Formato del contenido'
    },
    
    // === THREADING Y RESPUESTAS ===
    respuesta_a: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del mensaje al que responde (threading)'
    },
    
    es_thread_principal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si este mensaje inicia un thread'
    },
    
    thread_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Número de respuestas en el thread'
    },
    
    // === ARCHIVOS ===
    archivo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL del archivo adjunto'
    },
    
    archivo_nombre: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nombre original del archivo'
    },
    
    archivo_tipo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tipo MIME del archivo'
    },
    
    archivo_tamaño: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tamaño del archivo en bytes'
    },
    
    // === ESTADO ===
    estado: {
      type: DataTypes.ENUM('ENVIADO', 'ENTREGADO', 'LEIDO', 'FALLIDO', 'BORRADO'),
      defaultValue: 'ENVIADO',
      comment: 'Estado del mensaje'
    },
    
    // === EDICIÓN ===
    editado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si el mensaje fue editado'
    },
    
    editado_fecha: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de la última edición'
    },
    
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Versión del mensaje (para historial de ediciones)'
    },
    
    // === MENCIONES Y NOTIFICACIONES ===
    menciones: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array de IDs de usuarios mencionados'
    },
    
    // === REACCIONES ===
    reacciones: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Objeto con reacciones emoji y usuarios'
    },
    
    // === PRIORIDAD Y CATEGORIZACIÓN ===
    prioridad: {
      type: DataTypes.ENUM('BAJA', 'NORMAL', 'ALTA', 'URGENTE'),
      defaultValue: 'NORMAL',
      comment: 'Prioridad del mensaje'
    },
    
    etiquetas: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array de etiquetas del mensaje'
    },
    
    // === METADATOS AVANZADOS ===
    metadatos: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Metadatos adicionales específicos del tipo'
    },
    
    // === INTEGRACIÓN CON AUDITORÍA ===
    relacionado_con: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Referencias a otros elementos (auditoría, ETL, IA, etc.)'
    },
    
    // === TIMESTAMPS ===
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    actualizado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    enviado_en: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de envío efectiva'
    },
    
    programado_para: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Para mensajes programados'
    }
  }, {
    tableName: 'mensajes',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    
    indexes: [
      {
        fields: ['canal_id']
      },
      {
        fields: ['usuario_id']
      },
      {
        fields: ['respuesta_a']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['creado_en']
      },
      {
        fields: ['es_thread_principal']
      },
      {
        fields: ['prioridad']
      }
    ],
    
    hooks: {
      beforeCreate: (mensaje, options) => {
        mensaje.enviado_en = new Date();
        
        // Extraer menciones del contenido
        if (mensaje.contenido) {
          const menciones = mensaje.contenido.match(/@\[([^\]]+)\]/g);
          if (menciones) {
            mensaje.menciones = menciones.map(m => {
              const match = m.match(/@\[([^\]]+)\]/);
              return match ? match[1] : null;
            }).filter(Boolean);
          }
        }
      },
      
      afterCreate: async (mensaje, options) => {
        // Actualizar estadísticas del canal
        const canal = await mensaje.getCanal();
        if (canal) {
          await canal.actualizarEstadisticas();
        }
        
        // Actualizar thread count si es respuesta
        if (mensaje.respuesta_a) {
          await sequelize.models.Mensaje.increment('thread_count', {
            where: { id: mensaje.respuesta_a }
          });
          
          // Marcar mensaje padre como thread principal
          await sequelize.models.Mensaje.update(
            { es_thread_principal: true },
            { where: { id: mensaje.respuesta_a } }
          );
        }
      },
      
      beforeUpdate: (mensaje, options) => {
        if (mensaje.changed('contenido')) {
          mensaje.editado = true;
          mensaje.editado_fecha = new Date();
          mensaje.version += 1;
        }
      }
    }
  });

  // === MÉTODOS DE INSTANCIA ===
  Mensaje.prototype.agregarReaccion = async function(emoji, usuarioId) {
    const reacciones = this.reacciones || {};
    if (!reacciones[emoji]) {
      reacciones[emoji] = [];
    }
    
    if (!reacciones[emoji].includes(usuarioId)) {
      reacciones[emoji].push(usuarioId);
      this.reacciones = reacciones;
      await this.save();
    }
  };

  Mensaje.prototype.quitarReaccion = async function(emoji, usuarioId) {
    const reacciones = this.reacciones || {};
    if (reacciones[emoji]) {
      const index = reacciones[emoji].indexOf(usuarioId);
      if (index > -1) {
        reacciones[emoji].splice(index, 1);
        if (reacciones[emoji].length === 0) {
          delete reacciones[emoji];
        }
        this.reacciones = reacciones;
        await this.save();
      }
    }
  };

  Mensaje.prototype.marcarComoLeido = async function(usuarioId) {
    // Implementar lógica de lectura
    const LecturaCanal = sequelize.models.LecturaCanal;
    await LecturaCanal.marcarComoLeido(this.canal_id, usuarioId, this.id);
  };

  Mensaje.prototype.obtenerRespuestas = async function() {
    return await Mensaje.findAll({
      where: { respuesta_a: this.id },
      include: [
        {
          model: sequelize.models.Usuario,
          as: 'autor',
          attributes: ['id', 'nombre', 'email', 'avatar']
        }
      ],
      order: [['creado_en', 'ASC']]
    });
  };

  Mensaje.prototype.esVisiblePara = async function(usuarioId) {
    const canal = await this.getCanal();
    if (!canal) return false;
    
    // Si el canal es privado, verificar que el usuario sea participante
    if (canal.privado) {
      const ParticipanteCanal = sequelize.models.ParticipanteCanal;
      const participante = await ParticipanteCanal.findOne({
        where: {
          canal_id: canal.id,
          usuario_id: usuarioId,
          estado: 'ACTIVO'
        }
      });
      return !!participante;
    }
    
    return true;
  };

  // === MÉTODOS ESTÁTICOS ===
  Mensaje.obtenerPorCanal = async function(canalId, filtros = {}) {
    const where = { canal_id: canalId };
    
    if (filtros.tipo) where.tipo = filtros.tipo;
    if (filtros.usuario_id) where.usuario_id = filtros.usuario_id;
    if (filtros.desde) where.creado_en = { [sequelize.Sequelize.Op.gte]: filtros.desde };
    if (filtros.hasta) where.creado_en = { ...where.creado_en, [sequelize.Sequelize.Op.lte]: filtros.hasta };
    
    return await this.findAll({
      where,
      include: [
        {
          model: sequelize.models.Usuario,
          as: 'autor',
          attributes: ['id', 'nombre', 'email', 'avatar']
        },
        {
          model: this,
          as: 'mensajePadre',
          attributes: ['id', 'contenido', 'usuario_id'],
          required: false,
          include: [
            {
              model: sequelize.models.Usuario,
              as: 'autor',
              attributes: ['id', 'nombre']
            }
          ]
        }
      ],
      order: [['creado_en', filtros.orden || 'ASC']],
      limit: filtros.limite || 50,
      offset: filtros.offset || 0
    });
  };

  Mensaje.buscarEnCanales = async function(espacioId, busqueda, filtros = {}) {
    const Canal = sequelize.models.Canal;
    
    return await this.findAll({
      where: {
        contenido: {
          [sequelize.Sequelize.Op.like]: `%${busqueda}%`
        },
        ...(filtros.tipo && { tipo: filtros.tipo }),
        ...(filtros.usuario_id && { usuario_id: filtros.usuario_id })
      },
      include: [
        {
          model: Canal,
          as: 'canal',
          where: { espacio_id: espacioId },
          attributes: ['id', 'nombre', 'icono']
        },
        {
          model: sequelize.models.Usuario,
          as: 'autor',
          attributes: ['id', 'nombre', 'avatar']
        }
      ],
      order: [['creado_en', 'DESC']],
      limit: filtros.limite || 25
    });
  };

  // === ASOCIACIONES ===
  Mensaje.associate = function(models) {
    // Un mensaje pertenece a un canal
    Mensaje.belongsTo(models.Canal, {
      foreignKey: 'canal_id',
      as: 'canal'
    });
    
    // Un mensaje pertenece a un autor
    Mensaje.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'autor'
    });
    
    // Un mensaje puede responder a otro mensaje
    Mensaje.belongsTo(models.Mensaje, {
      foreignKey: 'respuesta_a',
      as: 'mensajePadre'
    });
    
    // Un mensaje puede tener respuestas
    Mensaje.hasMany(models.Mensaje, {
      foreignKey: 'respuesta_a',
      as: 'respuestas'
    });
    
    // Conversación para retrocompatibilidad
    Mensaje.belongsTo(models.Conversacion, {
      foreignKey: 'conversacion_id',
      as: 'conversacion'
    });
  };

  return Mensaje;
};