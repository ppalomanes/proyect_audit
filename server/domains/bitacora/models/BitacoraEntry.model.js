/**
 * Modelo BitacoraEntry - Sistema de Registro Automático
 * Portal de Auditorías Técnicas
 * 
 * Registra todas las acciones realizadas en el sistema para trazabilidad completa
 */

const { DataTypes } = require('sequelize');

const BitacoraEntry = (sequelize) => {
  const model = sequelize.define('BitacoraEntry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // === IDENTIFICACIÓN DE LA ACCIÓN ===
    accion_tipo: {
      type: DataTypes.ENUM(
        'LOGIN', 'LOGOUT', 
        'DOCUMENTO_CARGA', 'DOCUMENTO_MODIFICACION', 'DOCUMENTO_ELIMINACION',
        'AUDITORIA_CREACION', 'AUDITORIA_MODIFICACION', 'AUDITORIA_FINALIZACION',
        'EVALUACION_REALIZADA', 'EVALUACION_MODIFICADA',
        'NOTIFICACION_ENVIADA', 'NOTIFICACION_LEIDA',
        'DASHBOARD_ACCESO', 'REPORTE_GENERACION',
        'ETL_PROCESAMIENTO', 'ETL_VALIDACION',
        'CHAT_MENSAJE', 'CHAT_ARCHIVO',
        'CONFIGURACION_CAMBIO', 'USUARIO_CREACION', 'USUARIO_MODIFICACION',
        'OTRO'
      ),
      allowNull: false,
      comment: 'Tipo específico de acción realizada'
    },

    accion_descripcion: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Descripción detallada de la acción'
    },

    // === INFORMACIÓN DEL USUARIO ===
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Puede ser null para acciones del sistema
      comment: 'ID del usuario que realizó la acción'
    },

    usuario_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Email del usuario (para referencia rápida)'
    },

    usuario_rol: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Rol del usuario al momento de la acción'
    },

    // === CONTEXTO TÉCNICO ===
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 compatible
      allowNull: true,
      comment: 'Dirección IP desde donde se realizó la acción'
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent del navegador'
    },

    session_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de la sesión asociada'
    },

    // === CONTEXTO DE AUDITORÍA ===
    auditoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de auditoría relacionada (si aplica)'
    },

    documento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de documento relacionado (si aplica)'
    },

    seccion_afectada: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Sección o módulo del sistema afectado'
    },

    // === DATOS DE CAMBIO ===
    datos_anteriores: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Estado anterior de los datos (para cambios)'
    },

    datos_nuevos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Estado nuevo de los datos (para cambios)'
    },

    // === METADATOS ADICIONALES ===
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Información adicional específica del contexto'
    },

    // === RESULTADO Y ESTADO ===
    resultado: {
      type: DataTypes.ENUM('EXITOSO', 'ERROR', 'ADVERTENCIA'),
      allowNull: false,
      defaultValue: 'EXITOSO',
      comment: 'Resultado de la acción'
    },

    error_detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detalle del error (si resultado = ERROR)'
    },

    // === FECHAS ===
    fecha_accion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha y hora exacta de la acción'
    },

    // === ÍNDICES Y BÚSQUEDAS ===
    tags: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Tags para búsqueda rápida (separados por comas)'
    },

    es_critico: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Marca si la acción es crítica para auditoría'
    }

  }, {
    tableName: 'bitacora_entries',
    timestamps: true,
    
    indexes: [
      {
        name: 'idx_bitacora_usuario',
        fields: ['usuario_id']
      },
      {
        name: 'idx_bitacora_fecha',
        fields: ['fecha_accion']
      },
      {
        name: 'idx_bitacora_tipo',
        fields: ['accion_tipo']
      },
      {
        name: 'idx_bitacora_auditoria',
        fields: ['auditoria_id']
      },
      {
        name: 'idx_bitacora_documento',
        fields: ['documento_id']
      },
      {
        name: 'idx_bitacora_critico',
        fields: ['es_critico']
      },
      {
        name: 'idx_bitacora_resultado',
        fields: ['resultado']
      },
      {
        name: 'idx_bitacora_busqueda',
        fields: ['accion_tipo', 'fecha_accion', 'usuario_id']
      }
    ],

    comment: 'Registro completo de todas las acciones del sistema para trazabilidad'
  });

  // === MÉTODOS DE INSTANCIA ===
  
  /**
   * Obtener resumen legible de la entrada
   */
  model.prototype.getResumen = function() {
    return {
      id: this.id,
      fecha: this.fecha_accion,
      usuario: this.usuario_email || 'Sistema',
      accion: this.accion_tipo,
      descripcion: this.accion_descripcion,
      resultado: this.resultado,
      critico: this.es_critico
    };
  };

  /**
   * Verificar si la entrada es de un tipo específico
   */
  model.prototype.esTipo = function(tipo) {
    return this.accion_tipo === tipo;
  };

  /**
   * Obtener contexto completo
   */
  model.prototype.getContextoCompleto = function() {
    return {
      accion: {
        tipo: this.accion_tipo,
        descripcion: this.accion_descripcion,
        fecha: this.fecha_accion,
        resultado: this.resultado
      },
      usuario: {
        id: this.usuario_id,
        email: this.usuario_email,
        rol: this.usuario_rol
      },
      tecnico: {
        ip: this.ip_address,
        userAgent: this.user_agent,
        sessionId: this.session_id
      },
      contexto: {
        auditoria: this.auditoria_id,
        documento: this.documento_id,
        seccion: this.seccion_afectada
      },
      datos: {
        anteriores: this.datos_anteriores,
        nuevos: this.datos_nuevos,
        metadata: this.metadata
      }
    };
  };

  // === MÉTODOS ESTÁTICOS ===

  /**
   * Registrar una nueva acción en la bitácora
   */
  model.registrarAccion = async function(datosAccion) {
    try {
      const entrada = await this.create({
        accion_tipo: datosAccion.tipo,
        accion_descripcion: datosAccion.descripcion,
        usuario_id: datosAccion.usuario?.id || null,
        usuario_email: datosAccion.usuario?.email || null,
        usuario_rol: datosAccion.usuario?.rol || null,
        ip_address: datosAccion.ip || null,
        user_agent: datosAccion.userAgent || null,
        session_id: datosAccion.sessionId || null,
        auditoria_id: datosAccion.auditoria_id || null,
        documento_id: datosAccion.documento_id || null,
        seccion_afectada: datosAccion.seccion || null,
        datos_anteriores: datosAccion.datos_anteriores || null,
        datos_nuevos: datosAccion.datos_nuevos || null,
        metadata: datosAccion.metadata || null,
        resultado: datosAccion.resultado || 'EXITOSO',
        error_detalle: datosAccion.error || null,
        tags: datosAccion.tags ? datosAccion.tags.join(',') : null,
        es_critico: datosAccion.critico || false
      });

      return entrada;
    } catch (error) {
      console.error('❌ Error registrando en bitácora:', error);
      // No lanzar error para evitar afectar el flujo principal
      return null;
    }
  };

  /**
   * Buscar entradas con filtros avanzados
   */
  model.buscarConFiltros = async function(filtros = {}) {
    const whereClause = {};
    
    if (filtros.usuario_id) whereClause.usuario_id = filtros.usuario_id;
    if (filtros.accion_tipo) whereClause.accion_tipo = filtros.accion_tipo;
    if (filtros.auditoria_id) whereClause.auditoria_id = filtros.auditoria_id;
    if (filtros.documento_id) whereClause.documento_id = filtros.documento_id;
    if (filtros.resultado) whereClause.resultado = filtros.resultado;
    if (filtros.es_critico !== undefined) whereClause.es_critico = filtros.es_critico;
    
    // Filtros de fecha
    if (filtros.fecha_desde || filtros.fecha_hasta) {
      whereClause.fecha_accion = {};
      if (filtros.fecha_desde) {
        whereClause.fecha_accion[require('sequelize').Op.gte] = new Date(filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        whereClause.fecha_accion[require('sequelize').Op.lte] = new Date(filtros.fecha_hasta);
      }
    }

    return await this.findAll({
      where: whereClause,
      order: [['fecha_accion', 'DESC']],
      limit: filtros.limite || 100,
      offset: filtros.offset || 0
    });
  };

  /**
   * Obtener estadísticas de la bitácora
   */
  model.obtenerEstadisticas = async function(filtros = {}) {
    const whereClause = {};
    
    if (filtros.fecha_desde || filtros.fecha_hasta) {
      whereClause.fecha_accion = {};
      if (filtros.fecha_desde) {
        whereClause.fecha_accion[require('sequelize').Op.gte] = new Date(filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        whereClause.fecha_accion[require('sequelize').Op.lte] = new Date(filtros.fecha_hasta);
      }
    }

    const stats = await Promise.all([
      // Total de entradas
      this.count({ where: whereClause }),
      
      // Por tipo de acción
      this.findAll({
        where: whereClause,
        attributes: [
          'accion_tipo',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']
        ],
        group: ['accion_tipo'],
        raw: true
      }),
      
      // Por resultado
      this.findAll({
        where: whereClause,
        attributes: [
          'resultado',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']
        ],
        group: ['resultado'],
        raw: true
      }),
      
      // Usuarios más activos
      this.findAll({
        where: { ...whereClause, usuario_id: { [require('sequelize').Op.ne]: null } },
        attributes: [
          'usuario_email',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']
        ],
        group: ['usuario_email'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
        limit: 10,
        raw: true
      })
    ]);

    return {
      total_entradas: stats[0],
      por_tipo_accion: stats[1],
      por_resultado: stats[2],
      usuarios_mas_activos: stats[3]
    };
  };

  /**
   * Limpiar entradas antiguas
   */
  model.limpiarEntradas = async function(diasAntiguedad = 90) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
    
    const eliminadas = await this.destroy({
      where: {
        fecha_accion: {
          [require('sequelize').Op.lt]: fechaLimite
        },
        es_critico: false // Solo eliminar entradas no críticas
      }
    });
    
    return eliminadas;
  };

  // === ASOCIACIONES ===
  model.associate = (models) => {
    // Relación con Usuario (opcional)
    if (models.Usuario) {
      model.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'Usuario',
        constraints: false
      });
    }

    // Relación con Auditoría (opcional)
    if (models.Auditoria) {
      model.belongsTo(models.Auditoria, {
        foreignKey: 'auditoria_id',
        as: 'Auditoria',
        constraints: false
      });
    }

    // Relación con Documento (opcional)
    if (models.Documento) {
      model.belongsTo(models.Documento, {
        foreignKey: 'documento_id',
        as: 'Documento',
        constraints: false
      });
    }
  };

  return model;
};

module.exports = BitacoraEntry;