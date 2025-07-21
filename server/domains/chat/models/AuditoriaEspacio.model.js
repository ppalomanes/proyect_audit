const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditoriaEspacio = sequelize.define('AuditoriaEspacio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // === DATOS BÁSICOS ===
    auditoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de la auditoría asociada'
    },
    
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Nombre del espacio (ej: "Auditoría Proveedor XYZ - Q1 2025")'
    },
    
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción del espacio de auditoría'
    },
    
    // === CONFIGURACIÓN ===
    tipo: {
      type: DataTypes.ENUM('AUDITORIA', 'EQUIPO', 'GENERAL'),
      defaultValue: 'AUDITORIA',
      comment: 'Tipo de espacio de trabajo'
    },
    
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'PAUSADO', 'COMPLETADO', 'ARCHIVADO'),
      defaultValue: 'ACTIVO',
      comment: 'Estado del espacio'
    },
    
    visibilidad: {
      type: DataTypes.ENUM('PUBLICO', 'PRIVADO', 'RESTRINGIDO'),
      defaultValue: 'RESTRINGIDO',
      comment: 'Nivel de visibilidad del espacio'
    },
    
    // === PROPIETARIO ===
    propietario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del usuario propietario (normalmente el auditor principal)'
    },
    
    // === CONFIGURACIONES ADICIONALES ===
    configuracion: {
      type: DataTypes.JSON,
      defaultValue: {
        auto_crear_canales: true,
        permitir_invitaciones: true,
        notificaciones_activas: true,
        retention_mensajes_dias: 365,
        canales_predefinidos: [
          'general',
          'equipo-auditores', 
          'comunicacion-proveedor',
          'documentos',
          'notas-internas'
        ]
      },
      comment: 'Configuraciones específicas del espacio'
    },
    
    // === METADATOS ===
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de inicio de la auditoría'
    },
    
    fecha_limite: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha límite de la auditoría'
    },
    
    proveedor_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Información del proveedor auditado'
    },
    
    // === ESTADÍSTICAS ===
    estadisticas: {
      type: DataTypes.JSON,
      defaultValue: {
        total_canales: 0,
        total_mensajes: 0,
        total_participantes: 0,
        ultima_actividad: null,
        mensajes_por_canal: {}
      },
      comment: 'Estadísticas del espacio'
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
    
    archivado_en: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'auditoria_espacios',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    paranoid: true,
    deletedAt: 'archivado_en',
    
    indexes: [
      {
        fields: ['auditoria_id']
      },
      {
        fields: ['propietario_id']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['fecha_inicio', 'fecha_limite']
      }
    ],
    
    hooks: {
      afterCreate: async (espacio, options) => {
        // Auto-crear canales predefinidos si está habilitado
        if (espacio.configuracion?.auto_crear_canales) {
          await espacio.crearCanalesPredefinidos();
        }
      },
      
      beforeUpdate: (espacio, options) => {
        espacio.actualizado_en = new Date();
      }
    }
  });

  // === MÉTODOS DE INSTANCIA ===
  AuditoriaEspacio.prototype.crearCanalesPredefinidos = async function() {
    const Canal = sequelize.models.Canal;
    const canalesPredefinidos = this.configuracion?.canales_predefinidos || [];
    
    const definicionesCanales = {
      'general': {
        nombre: 'General',
        descripcion: 'Canal principal de la auditoría',
        tipo: 'GENERAL',
        icono: '💬'
      },
      'equipo-auditores': {
        nombre: 'Equipo Auditores',
        descripcion: 'Comunicación interna del equipo de auditoría',
        tipo: 'EQUIPO',
        icono: '👥',
        privado: true
      },
      'comunicacion-proveedor': {
        nombre: 'Comunicación Proveedor',
        descripcion: 'Canal para comunicación con el proveedor',
        tipo: 'PROVEEDOR',
        icono: '🏢'
      },
      'documentos': {
        nombre: 'Documentos',
        descripcion: 'Intercambio y discusión de documentos',
        tipo: 'DOCUMENTOS',
        icono: '📄'
      },
      'notas-internas': {
        nombre: 'Notas Internas',
        descripcion: 'Notas y observaciones internas',
        tipo: 'NOTAS',
        icono: '📝',
        privado: true
      }
    };
    
    for (const canalId of canalesPredefinidos) {
      const definicion = definicionesCanales[canalId];
      if (definicion) {
        await Canal.create({
          espacio_id: this.id,
          nombre: definicion.nombre,
          descripcion: definicion.descripcion,
          tipo: definicion.tipo,
          icono: definicion.icono,
          privado: definicion.privado || false,
          creado_por: this.propietario_id
        });
      }
    }
  };

  AuditoriaEspacio.prototype.agregarParticipante = async function(usuarioId, rol = 'PARTICIPANTE') {
    const ParticipanteEspacio = sequelize.models.ParticipanteEspacio;
    
    return await ParticipanteEspacio.create({
      espacio_id: this.id,
      usuario_id: usuarioId,
      rol: rol,
      fecha_union: new Date()
    });
  };

  AuditoriaEspacio.prototype.actualizarEstadisticas = async function() {
    const Canal = sequelize.models.Canal;
    const Mensaje = sequelize.models.Mensaje;
    const ParticipanteEspacio = sequelize.models.ParticipanteEspacio;
    
    const totalCanales = await Canal.count({ where: { espacio_id: this.id } });
    const totalMensajes = await Mensaje.count({
      include: [{
        model: Canal,
        where: { espacio_id: this.id }
      }]
    });
    const totalParticipantes = await ParticipanteEspacio.count({ 
      where: { espacio_id: this.id } 
    });
    
    this.estadisticas = {
      ...this.estadisticas,
      total_canales: totalCanales,
      total_mensajes: totalMensajes,
      total_participantes: totalParticipantes,
      ultima_actividad: new Date()
    };
    
    await this.save();
  };

  // === MÉTODOS ESTÁTICOS ===
  AuditoriaEspacio.crearDesdeAuditoria = async function(auditoriaData, propietarioId) {
    const espacio = await this.create({
      auditoria_id: auditoriaData.id,
      nombre: `Auditoría ${auditoriaData.proveedor_nombre} - ${auditoriaData.periodo}`,
      descripcion: `Espacio de colaboración para la auditoría técnica del proveedor ${auditoriaData.proveedor_nombre}`,
      propietario_id: propietarioId,
      fecha_inicio: auditoriaData.fecha_inicio,
      fecha_limite: auditoriaData.fecha_limite,
      proveedor_info: {
        id: auditoriaData.proveedor_id,
        nombre: auditoriaData.proveedor_nombre,
        sitios: auditoriaData.sitios || []
      }
    });
    
    // Agregar propietario como administrador
    await espacio.agregarParticipante(propietarioId, 'ADMINISTRADOR');
    
    return espacio;
  };

  // === ASOCIACIONES ===
  AuditoriaEspacio.associate = function(models) {
    // Un espacio pertenece a una auditoría
    AuditoriaEspacio.belongsTo(models.Auditoria, {
      foreignKey: 'auditoria_id',
      as: 'auditoria'
    });
    
    // Un espacio pertenece a un propietario
    AuditoriaEspacio.belongsTo(models.Usuario, {
      foreignKey: 'propietario_id',
      as: 'propietario'
    });
    
    // Un espacio tiene muchos canales
    AuditoriaEspacio.hasMany(models.Canal, {
      foreignKey: 'espacio_id',
      as: 'canales'
    });
    
    // Un espacio tiene muchos participantes
    AuditoriaEspacio.hasMany(models.ParticipanteEspacio, {
      foreignKey: 'espacio_id',
      as: 'participantes'
    });
  };

  return AuditoriaEspacio;
};
