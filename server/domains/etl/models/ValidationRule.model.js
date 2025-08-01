/**
 * Modelo ValidationRule - Reglas de validación configurables
 * Portal de Auditorías Técnicas
 */

const { DataTypes } = require('sequelize');

const defineValidationRule = (sequelize) => {
  const ValidationRule = sequelize.define('ValidationRule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Identificación de la regla
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    codigo_regla: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },

    // Configuración de la regla
    campo_objetivo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    tipo_validacion: {
      type: DataTypes.ENUM,
      values: ['REQUIRED', 'TYPE', 'RANGE', 'ENUM', 'PATTERN', 'BUSINESS', 'DEPENDENCY', 'CUSTOM'],
      allowNull: false
    },

    operador: {
      type: DataTypes.ENUM,
      values: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_EQUAL', 'LESS_EQUAL', 'IN', 'NOT_IN', 'CONTAINS', 'NOT_CONTAINS', 'REGEX', 'BETWEEN'],
      allowNull: false
    },

    valor_esperado: {
      type: DataTypes.JSON,
      allowNull: true
    },

    valor_minimo: {
      type: DataTypes.JSON,
      allowNull: true
    },

    valor_maximo: {
      type: DataTypes.JSON,
      allowNull: true
    },

    // Configuración de severidad
    severidad: {
      type: DataTypes.ENUM,
      values: ['ERROR', 'WARNING', 'INFO'],
      allowNull: false,
      defaultValue: 'ERROR'
    },

    bloquea_procesamiento: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    // Mensajes
    mensaje_error: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    mensaje_sugerencia: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Configuración de aplicación
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    aplicar_en: {
      type: DataTypes.ENUM,
      values: ['SIEMPRE', 'SOLO_VALIDACION', 'SOLO_PROCESAMIENTO'],
      allowNull: false,
      defaultValue: 'SIEMPRE'
    },

    // Contexto de aplicación
    proveedores_especificos: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [] // Array de nombres de proveedores
    },

    sitios_especificos: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [] // Array de códigos de sitio
    },

    // Dependencias entre campos
    campos_dependientes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [] // Array de campos que deben validarse junto con este
    },

    condiciones_aplicacion: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {} // Condiciones complejas para aplicar la regla
    },

    // Auto-corrección
    auto_correccion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    logica_correccion: {
      type: DataTypes.JSON,
      allowNull: true
    },

    // Metadatos
    categoria: {
      type: DataTypes.ENUM,
      values: ['HARDWARE', 'SOFTWARE', 'CONECTIVIDAD', 'IDENTIFICACION', 'CALIDAD', 'NEGOCIO'],
      allowNull: false
    },

    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0'
    },

    creado_por: {
      type: DataTypes.UUID,
      allowNull: false
    },

    modificado_por: {
      type: DataTypes.UUID,
      allowNull: true
    },

    // Estadísticas de uso
    veces_aplicada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    veces_fallida: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    ultima_aplicacion: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'validation_rules',
    timestamps: true,
    paranoid: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en',
    deletedAt: 'eliminado_en',
    
    indexes: [
      {
        fields: ['campo_objetivo']
      },
      {
        fields: ['tipo_validacion']
      },
      {
        fields: ['categoria']
      },
      {
        fields: ['activa']
      },
      {
        fields: ['severidad']
      },
      {
        unique: true,
        fields: ['codigo_regla']
      }
    ],

    scopes: {
      activas: {
        where: {
          activa: true
        }
      },
      
      porCategoria: (categoria) => ({
        where: {
          categoria: categoria
        }
      }),
      
      criticas: {
        where: {
          severidad: 'ERROR',
          bloquea_procesamiento: true
        }
      },
      
      conAutoCorreccion: {
        where: {
          auto_correccion: true
        }
      }
    }
  });

  // Métodos de instancia
  ValidationRule.prototype.aplicarRegla = async function(valor, contexto = {}) {
    this.veces_aplicada += 1;
    this.ultima_aplicacion = new Date();
    await this.save();

    try {
      const resultado = this.validarValor(valor, contexto);
      return resultado;
    } catch (error) {
      this.veces_fallida += 1;
      await this.save();
      throw error;
    }
  };

  ValidationRule.prototype.validarValor = function(valor, contexto = {}) {
    // Verificar condiciones de aplicación
    if (!this.debeAplicarse(contexto)) {
      return {
        valido: true,
        omitida: true,
        razon: 'Condiciones de aplicación no cumplidas'
      };
    }

    let esValido = false;
    let valorCorregido = null;

    switch (this.tipo_validacion) {
      case 'REQUIRED':
        esValido = valor !== null && valor !== undefined && valor !== '';
        break;

      case 'TYPE':
        esValido = this.validarTipo(valor);
        break;

      case 'RANGE':
        esValido = this.validarRango(valor);
        break;

      case 'ENUM':
        esValido = this.validarEnum(valor);
        break;

      case 'PATTERN':
        esValido = this.validarPatron(valor);
        break;

      case 'BUSINESS':
        esValido = this.validarReglaNegocios(valor, contexto);
        break;

      case 'DEPENDENCY':
        esValido = this.validarDependencias(valor, contexto);
        break;

      case 'CUSTOM':
        esValido = this.validarCustom(valor, contexto);
        break;

      default:
        esValido = true;
    }

    // Intentar auto-corrección si está habilitada y la validación falló
    if (!esValido && this.auto_correccion && this.logica_correccion) {
      valorCorregido = this.aplicarAutoCorreccion(valor, contexto);
      if (valorCorregido !== null) {
        // Re-validar el valor corregido
        esValido = this.validarValor(valorCorregido, contexto).valido;
      }
    }

    return {
      valido: esValido,
      valor_original: valor,
      valor_corregido: valorCorregido,
      regla_aplicada: this.codigo_regla,
      mensaje: esValido ? null : this.mensaje_error,
      sugerencia: esValido ? null : this.mensaje_sugerencia,
      severidad: this.severidad,
      bloquea_procesamiento: this.bloquea_procesamiento && !esValido
    };
  };

  ValidationRule.prototype.debeAplicarse = function(contexto) {
    // Verificar proveedores específicos
    if (this.proveedores_especificos && this.proveedores_especificos.length > 0) {
      if (!contexto.proveedor || !this.proveedores_especificos.includes(contexto.proveedor)) {
        return false;
      }
    }

    // Verificar sitios específicos
    if (this.sitios_especificos && this.sitios_especificos.length > 0) {
      if (!contexto.sitio || !this.sitios_especificos.includes(contexto.sitio)) {
        return false;
      }
    }

    // Verificar condiciones complejas
    if (this.condiciones_aplicacion && Object.keys(this.condiciones_aplicacion).length > 0) {
      return this.evaluarCondicionesComplejas(contexto);
    }

    return true;
  };

  ValidationRule.prototype.validarTipo = function(valor) {
    const tipoEsperado = this.valor_esperado;
    
    switch (tipoEsperado) {
      case 'string':
        return typeof valor === 'string';
      case 'number':
        return typeof valor === 'number' && !isNaN(valor);
      case 'integer':
        return Number.isInteger(valor);
      case 'boolean':
        return typeof valor === 'boolean';
      case 'date':
        return valor instanceof Date || !isNaN(Date.parse(valor));
      default:
        return true;
    }
  };

  ValidationRule.prototype.validarRango = function(valor) {
    const numValor = parseFloat(valor);
    if (isNaN(numValor)) return false;

    if (this.valor_minimo !== null && numValor < this.valor_minimo) return false;
    if (this.valor_maximo !== null && numValor > this.valor_maximo) return false;

    return true;
  };

  ValidationRule.prototype.validarEnum = function(valor) {
    return this.valor_esperado && this.valor_esperado.includes(valor);
  };

  ValidationRule.prototype.validarPatron = function(valor) {
    if (!this.valor_esperado) return true;
    
    const regex = new RegExp(this.valor_esperado);
    return regex.test(String(valor));
  };

  ValidationRule.prototype.validarReglaNegocios = function(valor, contexto) {
    // Implementar lógica específica de negocio según el código de regla
    switch (this.codigo_regla) {
      case 'RAM_MINIMA_WINDOWS':
        return contexto.os_name && contexto.os_name.includes('Windows') ? 
          parseInt(valor) >= 4 : true;
      
      case 'CPU_MINIMA_PERFORMANCE':
        return parseFloat(valor) >= 2.0;
      
      case 'NAVEGADOR_SOPORTADO':
        const navegadoresSoportados = ['Chrome', 'Firefox', 'Edge'];
        return navegadoresSoportados.includes(valor);
      
      default:
        return true;
    }
  };

  ValidationRule.prototype.validarDependencias = function(valor, contexto) {
    if (!this.campos_dependientes || this.campos_dependientes.length === 0) {
      return true;
    }

    // Verificar que todos los campos dependientes tengan valores válidos
    for (const campo of this.campos_dependientes) {
      if (!contexto[campo] || contexto[campo] === '') {
        return false;
      }
    }

    return true;
  };

  ValidationRule.prototype.validarCustom = function(valor, contexto) {
    // Para reglas personalizadas, se podría implementar un evaluador de JavaScript
    // Por seguridad, limitamos a casos específicos
    return true;
  };

  ValidationRule.prototype.aplicarAutoCorreccion = function(valor, contexto) {
    if (!this.logica_correccion) return null;

    try {
      switch (this.logica_correccion.tipo) {
        case 'NORMALIZACION_RAM':
          return this.normalizarRAM(valor);
        
        case 'NORMALIZACION_CPU':
          return this.normalizarCPU(valor);
        
        case 'LIMPIEZA_TEXTO':
          return String(valor).trim().toLowerCase();
        
        case 'CONVERSION_NUMERICA':
          const numero = parseFloat(valor);
          return isNaN(numero) ? null : numero;
        
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  };

  ValidationRule.prototype.normalizarRAM = function(valor) {
    const texto = String(valor).toLowerCase();
    const match = texto.match(/(\d+)\s*(gb|mb)?/);
    
    if (match) {
      const numero = parseInt(match[1]);
      const unidad = match[2] || 'gb';
      return unidad === 'mb' ? Math.round(numero / 1024) : numero;
    }
    
    return null;
  };

  ValidationRule.prototype.normalizarCPU = function(valor) {
    const texto = String(valor).toLowerCase();
    const match = texto.match(/(\d+\.?\d*)\s*(ghz|mhz)?/);
    
    if (match) {
      const numero = parseFloat(match[1]);
      const unidad = match[2] || 'ghz';
      return unidad === 'mhz' ? numero / 1000 : numero;
    }
    
    return null;
  };

  ValidationRule.prototype.evaluarCondicionesComplejas = function(contexto) {
    // Implementación básica de evaluación de condiciones
    // En un caso real, se podría usar un motor de reglas más sofisticado
    return true;
  };

  // Métodos estáticos
  ValidationRule.obtenerReglasParaCampo = async function(campo, categoria = null) {
    const whereClause = {
      campo_objetivo: campo,
      activa: true
    };

    if (categoria) {
      whereClause.categoria = categoria;
    }

    return await this.findAll({
      where: whereClause,
      order: [['severidad', 'DESC'], ['codigo_regla', 'ASC']]
    });
  };

  ValidationRule.crearReglasPorDefecto = async function(usuarioId) {
    const reglasPorDefecto = [
      {
        nombre: 'RAM Mínima para Windows',
        codigo_regla: 'RAM_MINIMA_WINDOWS',
        descripcion: 'Verifica que equipos con Windows tengan al menos 4GB de RAM',
        campo_objetivo: 'ram_gb',
        tipo_validacion: 'BUSINESS',
        operador: 'GREATER_EQUAL',
        valor_minimo: 4,
        severidad: 'ERROR',
        mensaje_error: 'RAM insuficiente para Windows (mínimo 4GB)',
        mensaje_sugerencia: 'Considerar upgrade de memoria',
        categoria: 'HARDWARE',
        creado_por: usuarioId
      },
      {
        nombre: 'CPU Mínima Performance',
        codigo_regla: 'CPU_MINIMA_PERFORMANCE',
        descripcion: 'Verifica velocidad mínima de CPU',
        campo_objetivo: 'cpu_speed_ghz',
        tipo_validacion: 'RANGE',
        operador: 'GREATER_EQUAL',
        valor_minimo: 2.0,
        severidad: 'WARNING',
        mensaje_error: 'CPU por debajo del rendimiento recomendado',
        mensaje_sugerencia: 'Verificar performance en aplicaciones críticas',
        categoria: 'HARDWARE',
        creado_por: usuarioId
      },
      {
        nombre: 'Navegador Soportado',
        codigo_regla: 'NAVEGADOR_SOPORTADO',
        descripcion: 'Verifica que el navegador esté en la lista de soportados',
        campo_objetivo: 'browser_name',
        tipo_validacion: 'ENUM',
        operador: 'IN',
        valor_esperado: ['Chrome', 'Firefox', 'Edge'],
        severidad: 'ERROR',
        mensaje_error: 'Navegador no soportado',
        mensaje_sugerencia: 'Instalar Chrome, Firefox o Edge',
        categoria: 'SOFTWARE',
        creado_por: usuarioId
      }
    ];

    const reglasCreadas = [];
    for (const reglaData of reglasPorDefecto) {
      const reglaExistente = await this.findOne({
        where: { codigo_regla: reglaData.codigo_regla }
      });

      if (!reglaExistente) {
        const regla = await this.create(reglaData);
        reglasCreadas.push(regla);
      }
    }

    return reglasCreadas;
  };

  ValidationRule.obtenerEstadisticas = async function() {
    const total = await this.count();
    const activas = await this.count({ where: { activa: true } });
    const porCategoria = await this.findAll({
      attributes: [
        'categoria',
        [sequelize.fn('COUNT', '*'), 'cantidad']
      ],
      group: ['categoria']
    });

    const porSeveridad = await this.findAll({
      attributes: [
        'severidad',
        [sequelize.fn('COUNT', '*'), 'cantidad']
      ],
      where: { activa: true },
      group: ['severidad']
    });

    return {
      total_reglas: total,
      reglas_activas: activas,
      por_categoria: porCategoria.reduce((acc, item) => {
        acc[item.get('categoria')] = parseInt(item.get('cantidad'));
        return acc;
      }, {}),
      por_severidad: porSeveridad.reduce((acc, item) => {
        acc[item.get('severidad')] = parseInt(item.get('cantidad'));
        return acc;
      }, {})
    };
  };

  return ValidationRule;
};

module.exports = defineValidationRule;