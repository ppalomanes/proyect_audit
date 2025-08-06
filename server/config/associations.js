// associations.js - Configuración de asociaciones entre modelos
const setupAssociations = (models) => {
  const {
    // Auth
    Usuario,
    Rol,
    
    // Entities
    Proveedor,
    Sitio,
    
    // Auditorías
    Auditoria,
    Etapa,
    Documento,
    
    // Notificaciones
    Notificacion,
    
    // Bitácora
    Bitacora,
    
    // Chat
    Conversacion,
    Mensaje
  } = models;

  // === Asociaciones Usuario ===
  if (Usuario && Rol) {
    Usuario.belongsTo(Rol, { 
      foreignKey: 'rol_id',
      as: 'rol' 
    });
  }
  
  if (Usuario && Auditoria) {
    Usuario.hasMany(Auditoria, {
      foreignKey: 'creado_por_id',
      as: 'auditorias_creadas'
    });
    
    Usuario.hasMany(Auditoria, {
      foreignKey: 'auditor_asignado_id',
      as: 'auditorias_asignadas'
    });
  }

  // === Asociaciones Proveedor ===
  if (Proveedor && Sitio) {
    Proveedor.hasMany(Sitio, {
      foreignKey: 'proveedor_id',
      as: 'sitios'
    });
  }
  
  if (Proveedor && Auditoria) {
    Proveedor.hasMany(Auditoria, {
      foreignKey: 'proveedor_id',
      as: 'auditorias'
    });
  }
  
  if (Proveedor && Usuario) {
    Proveedor.hasMany(Usuario, {
      foreignKey: 'proveedor_id',
      as: 'usuarios'
    });
  }

  // === Asociaciones Sitio ===
  if (Sitio && Proveedor) {
    Sitio.belongsTo(Proveedor, {
      foreignKey: 'proveedor_id',
      as: 'proveedor'
    });
  }
  
  if (Sitio && Auditoria) {
    Sitio.hasMany(Auditoria, {
      foreignKey: 'sitio_id',
      as: 'auditorias'
    });
  }

  // === Asociaciones Auditoría ===
  if (Auditoria) {
    if (Proveedor) {
      Auditoria.belongsTo(Proveedor, {
        foreignKey: 'proveedor_id',
        as: 'proveedor'
      });
    }
    
    if (Sitio) {
      Auditoria.belongsTo(Sitio, {
        foreignKey: 'sitio_id',
        as: 'sitio'
      });
    }
    
    if (Usuario) {
      Auditoria.belongsTo(Usuario, {
        foreignKey: 'creado_por_id',
        as: 'creador'
      });
      
      Auditoria.belongsTo(Usuario, {
        foreignKey: 'auditor_asignado_id',
        as: 'auditor'
      });
    }
    
    if (Etapa) {
      Auditoria.hasMany(Etapa, {
        foreignKey: 'auditoria_id',
        as: 'etapas',
        onDelete: 'CASCADE'
      });
    }
    
    if (Documento) {
      Auditoria.hasMany(Documento, {
        foreignKey: 'auditoria_id',
        as: 'documentos',
        onDelete: 'CASCADE'
      });
    }
    
    if (Conversacion) {
      Auditoria.hasMany(Conversacion, {
        foreignKey: 'auditoria_id',
        as: 'conversaciones'
      });
    }
  }

  // === Asociaciones Etapa ===
  if (Etapa) {
    if (Auditoria) {
      Etapa.belongsTo(Auditoria, {
        foreignKey: 'auditoria_id',
        as: 'auditoria'
      });
    }
    
    if (Usuario) {
      Etapa.belongsTo(Usuario, {
        foreignKey: 'responsable_id',
        as: 'responsable'
      });
      
      Etapa.belongsTo(Usuario, {
        foreignKey: 'validado_por_id',
        as: 'validador'
      });
    }
  }

  // === Asociaciones Documento ===
  if (Documento) {
    if (Auditoria) {
      Documento.belongsTo(Auditoria, {
        foreignKey: 'auditoria_id',
        as: 'auditoria'
      });
    }
    
    if (Usuario) {
      Documento.belongsTo(Usuario, {
        foreignKey: 'cargado_por_id',
        as: 'cargado_por'
      });
      
      Documento.belongsTo(Usuario, {
        foreignKey: 'revisado_por_id',
        as: 'revisado_por'
      });
      
      Documento.belongsTo(Usuario, {
        foreignKey: 'aprobado_por_id',
        as: 'aprobado_por'
      });
    }
    
    // Auto-referencia para versionado
    Documento.belongsTo(Documento, {
      foreignKey: 'documento_padre_id',
      as: 'documento_padre'
    });
    
    Documento.hasMany(Documento, {
      foreignKey: 'documento_padre_id',
      as: 'versiones'
    });
  }

  // === Asociaciones Notificación ===
  if (Notificacion) {
    if (Usuario) {
      Notificacion.belongsTo(Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
    }
    
    if (Auditoria) {
      Notificacion.belongsTo(Auditoria, {
        foreignKey: 'auditoria_id',
        as: 'auditoria'
      });
    }
  }

  // === Asociaciones Bitácora ===
  if (Bitacora && Usuario) {
    Bitacora.belongsTo(Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });
  }

  // === Asociaciones Chat ===
  if (Conversacion) {
    if (Auditoria) {
      Conversacion.belongsTo(Auditoria, {
        foreignKey: 'auditoria_id',
        as: 'auditoria'
      });
    }
    
    if (Mensaje) {
      Conversacion.hasMany(Mensaje, {
        foreignKey: 'conversacion_id',
        as: 'mensajes',
        onDelete: 'CASCADE'
      });
    }
    
    if (Usuario) {
      Conversacion.belongsToMany(Usuario, {
        through: 'conversacion_participantes',
        foreignKey: 'conversacion_id',
        otherKey: 'usuario_id',
        as: 'participantes'
      });
    }
  }
  
  if (Mensaje) {
    if (Conversacion) {
      Mensaje.belongsTo(Conversacion, {
        foreignKey: 'conversacion_id',
        as: 'conversacion'
      });
    }
    
    if (Usuario) {
      Mensaje.belongsTo(Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
    }
  }

  console.log('✅ Asociaciones de modelos configuradas');
};

module.exports = setupAssociations;
