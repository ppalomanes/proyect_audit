const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Canal = sequelize.define('Canal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // === RELACIONES ===
    espacio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del espacio de auditoría al que pertenece'
    },
    
    // === DATOS BÁSICOS ===
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nombre del canal'
    },
    
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción del propósito del canal'
    },
    
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'URL-friendly version del nombre'
    },
    
    // === CLASIFICACIÓN ===
    tipo: {
      type: DataTypes.ENUM(
        'GENERAL',      // Canal principal
        'EQUIPO',       // Solo equipo interno
        'PROVEEDOR',    // Comunicación con proveedor
        'DOCUMENTOS',   // Intercambio de archivos
        'NOTAS',        // Notas internas
        'NOTIFICACIONES', // Notificaciones automáticas
        'CUSTOM'        // Canal personalizado
      ),
      allowNull: false,
      defaultValue: 'GENERAL',
      comment: 'Tipo de canal'
    },
    
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Categoría para agrupar canales (ej: "Auditoría", "Administración")'
    },
    
    // === CONFIGURACIÓN ===
    privado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si es true, solo participantes invitados pueden ver/escribir'
    },
    
    solo_lectura: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si es true, solo admins pueden escribir'
    },
    
    archivado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Canal archivado (solo lectura)'
    },
    
    // === APARIENCIA ===
    icono: {
      type: DataTypes.STRING(10),
      defaultValue: '💬',
      comment: 'Emoji que representa al canal'
    },
    
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      comment: 'Color hex para el canal (ej: #FF5733)'
    },
    
    // === PROPIETARIO ===
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Usuario que creó el canal'
    },
    
    // === CONFIGURACIONES AVANZADAS ===
    configuracion: {
      type: DataTypes.JSON,
      defaultValue: {
        permitir_threads: true,
        permitir_archivos: true,
        permitir_menciones: true,
        notificaciones_activas: true,
        retention_mensajes_dias: 365,
        max_archivos_mb: 100,
        tipos_archivos_permitidos: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'zip'],
        moderacion_activa: false,
        auto_archivar_dias: null
      },
      comment: 'Configuraciones específicas del canal'
    },
    
    // === PESTAÑAS HABILITADAS ===
    pestanas_habilitadas: {
      type: DataTypes.JSON,
      defaultValue: {
        canal: true,        // Chat principal
        publicaciones: true, // Anuncios y updates
        lista: false,       // Tareas y checklist
        tablero: false,     // Kanban board
        calendario: false,  // Eventos y fechas
        gantt: false,       // Timeline
        tabla: false,       // Vista tabular
        documentos: true,   // Archivos
        actividad: true     // Feed de actividad
      },
      comment: 'Pestañas disponibles para este canal'
    },
    
    // === ESTADÍSTICAS ===
    estadisticas: {
      type: DataTypes.JSON,
      defaultValue: {
        total_mensajes: 0,
        total_participantes: 0,
        total_archivos: 0,
        ultimo_mensaje_fecha: null,
        mensajes_por_dia: {},
        participantes_activos: 0
      },
      comment: 'Estadísticas del canal'
    },
    
    // === ESTADO DEL CANAL ===
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'PAUSADO', 'ARCHIVADO'),
      defaultValue: 'ACTIVO',
      comment: 'Estado actual del canal'
    },
    
    // === ORDEN ===
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Orden de visualización en la lista'
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
    
    ultimo_mensaje_en: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha del último mensaje en el canal'
    }
  }, {
    tableName: 'canales',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    
    indexes: [
      {
        fields: ['espacio_id']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['privado']
      },
      {
        fields: ['slug']
      },
      {
        unique: true,
        fields: ['espacio_id', 'slug']
      },
      {
        fields: ['orden']
      }
    ],
    
    hooks: {
      beforeCreate: (canal, options) => {
        // Generar slug automáticamente
        if (!canal.slug) {
          canal.slug = canal.nombre
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        }
      },
      
      beforeUpdate: (canal, options) => {
        canal.actualizado_en = new Date();
      },
      
      afterCreate: async (canal, options) => {
        // Actualizar estadísticas del espacio
        const espacio = await canal.getEspacio();
        if (espacio) {
          await espacio.actualizarEstadisticas();
        }
      }
    }
  });

  // === MÉTODOS DE INSTANCIA ===
  Canal.prototype.agregarParticipante = async function(usuarioId, rol = 'PARTICIPANTE') {
    const ParticipanteCanal = sequelize.models.ParticipanteCanal;
    
    return await ParticipanteCanal.create({
      canal_id: this.id,
      usuario_id: usuarioId,
      rol: rol,
      fecha_union: new Date()
    });
  };

  Canal.prototype.eliminarParticipante = async function(usuarioId) {
    const ParticipanteCanal = sequelize.models.ParticipanteCanal;
    
    return await ParticipanteCanal.destroy({
      where: {
        canal_id: this.id,
        usuario_id: usuarioId
      }
    });
  };

  Canal.prototype.actualizarEstadisticas = async function() {
    const Mensaje = sequelize.models.Mensaje;
    const ParticipanteCanal = sequelize.models.ParticipanteCanal;
    
    const totalMensajes = await Mensaje.count({ where: { canal_id: this.id } });
    const totalParticipantes = await ParticipanteCanal.count({ where: { canal_id: this.id } });
    
    const ultimoMensaje = await Mensaje.findOne({
      where: { canal_id: this.id },
      order: [['creado_en', 'DESC']]
    });
    
    this.estadisticas = {
      ...this.estadisticas,
      total_mensajes: totalMensajes,
      total_participantes: totalParticipantes,
      ultimo_mensaje_fecha: ultimoMensaje ? ultimoMensaje.creado_en : null
    };
    
    this.ultimo_mensaje_en = ultimoMensaje ? ultimoMensaje.creado_en : null;
    
    await this.save();
  };

  Canal.prototype.marcarComoLeido = async function(usuarioId) {
    const LecturaCanal = sequelize.models.LecturaCanal;
    
    return await LecturaCanal.upsert({
      canal_id: this.id,
      usuario_id: usuarioId,
      ultima_lectura: new Date()
    });
  };

  Canal.prototype.obtenerMensajesNoLeidos = async function(usuarioId) {
    const Mensaje = sequelize.models.Mensaje;
    const LecturaCanal = sequelize.models.LecturaCanal;
    
    const lectura = await LecturaCanal.findOne({
      where: { canal_id: this.id, usuario_id: usuarioId }
    });
    
    const fechaLectura = lectura ? lectura.ultima_lectura : new Date('1970-01-01');
    
    return await Mensaje.count({
      where: {
        canal_id: this.id,
        creado_en: {
          [sequelize.Sequelize.Op.gt]: fechaLectura
        }
      }
    });
  };

  Canal.prototype.habilitarPestana = async function(pestana, habilitada = true) {
    this.pestanas_habilitadas = {
      ...this.pestanas_habilitadas,
      [pestana]: habilitada
    };
    await this.save();
  };

  Canal.prototype.archivar = async function() {
    this.estado = 'ARCHIVADO';
    this.archivado = true;
    this.solo_lectura = true;
    await this.save();
  };

  // === MÉTODOS ESTÁTICOS ===
  Canal.crearCanalesPorDefecto = async function(espacioId, propietarioId) {
    const canalesPorDefecto = [
      {
        nombre: 'General',
        descripcion: 'Canal principal para discusiones generales',
        tipo: 'GENERAL',
        icono: '💬',
        orden: 1
      },
      {
        nombre: 'Equipo Auditores',
        descripcion: 'Comunicación interna del equipo de auditoría',
        tipo: 'EQUIPO',
        icono: '👥',
        privado: true,
        orden: 2
      },
      {
        nombre: 'Comunicación Proveedor',
        descripcion: 'Canal para comunicación directa con el proveedor',
        tipo: 'PROVEEDOR',
        icono: '🏢',
        orden: 3
      },
      {
        nombre: 'Documentos',
        descripcion: 'Intercambio y discusión de documentos',
        tipo: 'DOCUMENTOS',
        icono: '📄',
        pestanas_habilitadas: {
          canal: true,
          publicaciones: false,
          lista: true,
          tablero: false,
          calendario: false,
          gantt: false,
          tabla: true,
          documentos: true,
          actividad: true
        },
        orden: 4
      },
      {
        nombre: 'Notas Internas',
        descripcion: 'Notas y observaciones del equipo auditor',
        tipo: 'NOTAS',
        icono: '📝',
        privado: true,
        orden: 5
      },
      {
        nombre: 'Notificaciones',
        descripcion: 'Notificaciones automáticas del sistema',
        tipo: 'NOTIFICACIONES',
        icono: '🔔',
        solo_lectura: true,
        orden: 6
      }
    ];

    const canalesCreados = [];
    for (const canalData of canalesPorDefecto) {
      const canal = await this.create({
        ...canalData,
        espacio_id: espacioId,
        creado_por: propietarioId
      });
      canalesCreados.push(canal);
    }

    return canalesCreados;
  };

  Canal.buscarPorEspacio = async function(espacioId, filtros = {}) {
    const where = { espacio_id: espacioId };
    
    if (filtros.tipo) where.tipo = filtros.tipo;
    if (filtros.privado !== undefined) where.privado = filtros.privado;
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.categoria) where.categoria = filtros.categoria;
    
    return await this.findAll({
      where,
      order: [['orden', 'ASC'], ['creado_en', 'ASC']],
      include: [
        {
          model: sequelize.models.Usuario,
          as: 'creador',
          attributes: ['id', 'nombre', 'email']
        }
      ]
    });
  };

  // === ASOCIACIONES ===
  Canal.associate = function(models) {
    // Un canal pertenece a un espacio
    Canal.belongsTo(models.AuditoriaEspacio, {
      foreignKey: 'espacio_id',
      as: 'espacio'
    });
    
    // Un canal pertenece a un creador
    Canal.belongsTo(models.Usuario, {
      foreignKey: 'creado_por',
      as: 'creador'
    });
    
    // Un canal tiene muchos mensajes
    Canal.hasMany(models.Mensaje, {
      foreignKey: 'canal_id',
      as: 'mensajes'
    });
    
    // Un canal tiene muchos participantes
    Canal.hasMany(models.ParticipanteCanal, {
      foreignKey: 'canal_id',
      as: 'participantes'
    });
    
    // Un canal tiene muchas lecturas
    Canal.hasMany(models.LecturaCanal, {
      foreignKey: 'canal_id',
      as: 'lecturas'
    });
  };

  return Canal;
};
