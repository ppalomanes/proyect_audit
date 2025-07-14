/**
 * Modelo Proveedor - Gestión de Proveedores
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');

const defineProveedor = (sequelize) => {
  const Proveedor = sequelize.define('Proveedor', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Información legal y comercial
    razon_social: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [3, 255],
          msg: 'Razón social debe tener entre 3 y 255 caracteres'
        }
      }
    },

    nombre_comercial: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    nit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [5, 50],
          msg: 'NIT debe tener entre 5 y 50 caracteres'
        }
      }
    },

    // Información de contacto
    email_principal: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Debe ser un email válido'
        }
      }
    },

    telefono_principal: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        is: {
          args: /^[\+]?[\d\s\-\(\)]{7,20}$/,
          msg: 'Formato de teléfono inválido'
        }
      }
    },

    sitio_web: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Sitio web debe ser una URL válida'
        }
      }
    },

    // Ubicación
    direccion: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    departamento: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    pais: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Colombia'
    },

    codigo_postal: {
      type: DataTypes.STRING(20),
      allowNull: true
    },

    // Información del negocio
    servicios_ofrecidos: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidServices(value) {
          const validServices = ['inbound', 'outbound', 'chat', 'email', 'soporte_tecnico', 'ventas', 'cobranzas'];
          if (!Array.isArray(value)) {
            throw new Error('Servicios ofrecidos debe ser un array');
          }
          for (const service of value) {
            if (!validServices.includes(service)) {
              throw new Error(`Servicio '${service}' no es válido`);
            }
          }
        }
      }
    },

    capacidad_agentes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: 'Capacidad mínima es 1 agente'
        },
        max: {
          args: 10000,
          msg: 'Capacidad máxima es 10,000 agentes'
        }
      }
    },

    turnos_operacion: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        "24x7": false,
        "horarios": []
      }
    },

    // Certificaciones y calidad
    certificaciones: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },

    nivel_tier: {
      type: DataTypes.ENUM,
      values: ['TIER_1', 'TIER_2', 'TIER_3', 'PREMIUM'],
      allowNull: true
    },

    // Estado y clasificación
    estado: {
      type: DataTypes.ENUM,
      values: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'EN_EVALUACION'],
      allowNull: false,
      defaultValue: 'EN_EVALUACION'
    },

    tipo_contrato: {
      type: DataTypes.ENUM,
      values: ['DIRECTO', 'SUBCONTRATISTA', 'ALIADO_ESTRATEGICO'],
      allowNull: true
    },

    // Información financiera
    facturacion_anual_estimada: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },

    moneda: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'COP'
    },

    // Contactos clave
    representante_legal: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    contacto_tecnico: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    contacto_comercial: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },

    // Información adicional
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Metadatos
    creado_por: {
      type: DataTypes.UUID,
      allowNull: true
    },

    actualizado_por: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'proveedores',
    timestamps: true,
    paranoid: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    deletedAt: 'eliminado_en',
    
    indexes: [
      {
        unique: true,
        fields: ['nit']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['ciudad']
      },
      {
        fields: ['tipo_contrato']
      },
      {
        fields: ['nivel_tier']
      }
    ],

    scopes: {
      activos: {
        where: {
          estado: 'ACTIVO'
        }
      },
      
      porTier: (tier) => ({
        where: {
          nivel_tier: tier
        }
      }),
      
      porCapacidad: (min, max) => ({
        where: {
          capacidad_agentes: {
            [sequelize.Sequelize.Op.between]: [min, max]
          }
        }
      })
    }
  });

  // Métodos de instancia
  Proveedor.prototype.getNombreDisplay = function() {
    return this.nombre_comercial || this.razon_social;
  };

  Proveedor.prototype.tieneServicio = function(servicio) {
    return this.servicios_ofrecidos.includes(servicio);
  };

  Proveedor.prototype.puedeRecibirAuditorias = function() {
    return this.estado === 'ACTIVO';
  };

  Proveedor.prototype.getContactoPrincipal = function() {
    return {
      email: this.email_principal,
      telefono: this.telefono_principal,
      representante: this.representante_legal
    };
  };

  // Métodos estáticos
  Proveedor.buscarPorNit = async function(nit) {
    return await this.findOne({
      where: { nit }
    });
  };

  Proveedor.buscarActivos = async function(filtros = {}) {
    return await this.scope('activos').findAll({
      where: filtros,
      order: [['razon_social', 'ASC']]
    });
  };

  Proveedor.buscarPorServicio = async function(servicio) {
    return await this.findAll({
      where: {
        servicios_ofrecidos: {
          [sequelize.Sequelize.Op.contains]: [servicio]
        },
        estado: 'ACTIVO'
      }
    });
  };

  return Proveedor;
};

module.exports = defineProveedor;
