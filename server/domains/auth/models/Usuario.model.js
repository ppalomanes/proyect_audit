/**
 * Modelo Usuario - Sistema de Autenticación
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// Este modelo será inicializado dinámicamente
const defineUsuario = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Información básica
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Debe ser un email válido'
        },
        len: {
          args: [5, 255],
          msg: 'Email debe tener entre 5 y 255 caracteres'
        }
      }
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [8, 255],
          msg: 'Password debe tener al menos 8 caracteres'
        }
      }
    },

    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Nombres debe tener entre 2 y 100 caracteres'
        }
      }
    },

    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Apellidos debe tener entre 2 y 100 caracteres'
        }
      }
    },

    documento: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [5, 50],
          msg: 'Documento debe tener entre 5 y 50 caracteres'
        }
      }
    },

    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[\+]?[\d\s\-\(\)]{7,20}$/,
          msg: 'Formato de teléfono inválido'
        }
      }
    },

    // Rol y permisos
    rol: {
      type: DataTypes.ENUM,
      values: ['ADMIN', 'AUDITOR', 'PROVEEDOR', 'SUPERVISOR'],
      allowNull: false,
      defaultValue: 'PROVEEDOR'
    },

    // Estado de la cuenta
    estado: {
      type: DataTypes.ENUM,
      values: ['ACTIVO', 'INACTIVO', 'BLOQUEADO', 'PENDIENTE_VERIFICACION'],
      allowNull: false,
      defaultValue: 'PENDIENTE_VERIFICACION'
    },

    // Verificación de email
    email_verificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    email_verificado_en: {
      type: DataTypes.DATE,
      allowNull: true
    },

    token_verificacion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    // Recuperación de contraseña
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Sesión y seguridad
    ultimo_login: {
      type: DataTypes.DATE,
      allowNull: true
    },

    intentos_login_fallidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    bloqueado_hasta: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Información adicional
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Avatar URL debe ser una URL válida'
        }
      }
    },

    configuracion: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        notificaciones_email: true,
        notificaciones_web: true,
        idioma: 'es',
        zona_horaria: 'America/Bogota'
      }
    },

    // Metadatos de auditoría
    creado_por: {
      type: DataTypes.UUID,
      allowNull: true
    },

    actualizado_por: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    paranoid: true, // Soft delete
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    deletedAt: 'eliminado_en',
    
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['documento']
      },
      {
        fields: ['rol']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['email_verificado']
      },
      {
        fields: ['ultimo_login']
      }
    ],

    scopes: {
      // Scope para usuarios activos
      activos: {
        where: {
          estado: 'ACTIVO',
          email_verificado: true
        }
      },
      
      // Scope para auditores
      auditores: {
        where: {
          rol: ['AUDITOR', 'SUPERVISOR', 'ADMIN']
        }
      },
      
      // Scope para proveedores
      proveedores: {
        where: {
          rol: 'PROVEEDOR'
        }
      },

      // Scope sin campos sensibles
      publico: {
        attributes: {
          exclude: [
            'password_hash',
            'token_verificacion', 
            'reset_password_token',
            'reset_password_expires',
            'intentos_login_fallidos'
          ]
        }
      }
    }
  });

  // Hooks para encriptar password
  Usuario.beforeCreate(async (usuario) => {
    if (usuario.password_hash) {
      const salt = await bcrypt.genSalt(12);
      usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
    }
  });

  Usuario.beforeUpdate(async (usuario) => {
    if (usuario.changed('password_hash')) {
      const salt = await bcrypt.genSalt(12);
      usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
    }
  });

  // Métodos de instancia
  Usuario.prototype.verificarPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  Usuario.prototype.getNombreCompleto = function() {
    return `${this.nombres} ${this.apellidos}`;
  };

  Usuario.prototype.puedeActualizarPerfil = function() {
    return this.estado === 'ACTIVO' && this.email_verificado;
  };

  Usuario.prototype.esAuditor = function() {
    return ['AUDITOR', 'SUPERVISOR', 'ADMIN'].includes(this.rol);
  };

  Usuario.prototype.esProveedor = function() {
    return this.rol === 'PROVEEDOR';
  };

  Usuario.prototype.tienePermiso = function(permiso) {
    const permisosPorRol = {
      'ADMIN': ['*'], // Todos los permisos
      'SUPERVISOR': [
        'auditorias.crear', 'auditorias.editar', 'auditorias.eliminar', 'auditorias.ver',
        'usuarios.ver', 'usuarios.editar',
        'reportes.generar', 'reportes.ver',
        'dashboards.ver'
      ],
      'AUDITOR': [
        'auditorias.crear', 'auditorias.editar', 'auditorias.ver',
        'documentos.subir', 'documentos.validar',
        'etl.procesar', 'etl.validar',
        'ia.analizar', 'reportes.ver'
      ],
      'PROVEEDOR': [
        'auditorias.ver_propias', 'documentos.subir_propios',
        'etl.subir_parque', 'chat.participar',
        'perfil.editar'
      ]
    };

    const permisos = permisosPorRol[this.rol] || [];
    return permisos.includes('*') || permisos.includes(permiso);
  };

  Usuario.prototype.incrementarIntentosLogin = async function() {
    this.intentos_login_fallidos += 1;
    
    // Bloquear cuenta después de 5 intentos fallidos
    if (this.intentos_login_fallidos >= 5) {
      this.bloqueado_hasta = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    }
    
    await this.save();
  };

  Usuario.prototype.resetearIntentosLogin = async function() {
    this.intentos_login_fallidos = 0;
    this.bloqueado_hasta = null;
    this.ultimo_login = new Date();
    await this.save();
  };

  Usuario.prototype.estaBloqueado = function() {
    return this.bloqueado_hasta && new Date() < this.bloqueado_hasta;
  };

  // Métodos estáticos (de clase)
  Usuario.buscarPorEmail = async function(email) {
    return await this.findOne({
      where: { email: email.toLowerCase() }
    });
  };

  Usuario.buscarPorDocumento = async function(documento) {
    return await this.findOne({
      where: { documento }
    });
  };

  Usuario.buscarActivos = async function(filtros = {}) {
    return await this.scope('activos').findAll({
      where: filtros,
      order: [['creado_en', 'DESC']]
    });
  };

  return Usuario;
};

module.exports = defineUsuario;
