const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Bitacora = sequelize.define('Bitacora', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  auditoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'auditorias',
      key: 'id'
    },
    comment: 'ID de auditoría (null para acciones globales)'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario que realizó la acción (null para acciones automáticas)'
  },
  tipo_accion: {
    type: DataTypes.ENUM(
      // Acciones de usuario
      'LOGIN',
      'LOGOUT',
      'AUDITORIA_CREADA',
      'AUDITORIA_ACTUALIZADA',
      'DOCUMENTO_CARGADO',
      'DOCUMENTO_ACTUALIZADO',
      'DOCUMENTO_ELIMINADO',
      'ETAPA_AVANZADA',
      'EVALUACION_REALIZADA',
      'EVALUACION_ACTUALIZADA',
      'COMENTARIO_AGREGADO',
      'CONFIGURACION_ACTUALIZADA',
      
      // Acciones automáticas del sistema
      'VALIDACION_AUTOMATICA',
      'NOTIFICACION_ENVIADA',
      'ETL_PROCESADO',
      'IA_SCORING',
      'INFORME_GENERADO',
      'WORKFLOW_AUTOMATICO',
      'SISTEMA_BACKUP',
      'LIMPIEZA_AUTOMATICA',
      
      // Acciones de administración
      'USUARIO_CREADO',
      'USUARIO_MODIFICADO',
      'PERMISOS_MODIFICADOS',
      'PERIODO_CONFIGURADO',
      'SISTEMA_MANTENIMIENTO'
    ),
    allowNull: false,
    comment: 'Tipo de acción realizada'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Descripción detallada de la acción'
  },
  
  // Contexto de la acción
  seccion_afectada: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Sección específica afectada por la acción'
  },
  modulo_origen: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Módulo del sistema que generó la acción'
  },
  
  // Datos del cambio (para trazabilidad)
  datos_antes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Estado de los datos antes del cambio'
  },
  datos_despues: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Estado de los datos después del cambio'
  },
  
  // Metadatos técnicos
  ip_origen: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Dirección IP de origen'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent del navegador'
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ID de sesión del usuario'
  },
  
  // Clasificación y severidad
  categoria: {
    type: DataTypes.ENUM('SEGURIDAD', 'OPERACIONAL', 'ADMINISTRATIVO', 'SISTEMA'),
    defaultValue: 'OPERACIONAL',
    allowNull: false,
    comment: 'Categoría de la acción para clasificación'
  },
  severidad: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA'),
    defaultValue: 'BAJA',
    allowNull: false,
    comment: 'Nivel de severidad/importancia'
  },
  
  // Metadatos adicionales
  metadatos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información adicional contextual'
  },
  
  // Timestamps
  fecha_hora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'Timestamp exacto de la acción'
  },
  
  // Control de procesamiento
  procesado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si la entrada ha sido procesada para reportes'
  },
  alerta_generada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si se generó una alerta por esta acción'
  }
}, {
  tableName: 'bitacora',
  timestamps: false,
  indexes: [
    {
      fields: ['auditoria_id', 'fecha_hora']
    },
    {
      fields: ['usuario_id', 'tipo_accion']
    },
    {
      fields: ['tipo_accion', 'fecha_hora']
    },
    {
      fields: ['categoria', 'severidad']
    },
    {
      fields: ['fecha_hora'],
      order: [['fecha_hora', 'DESC']]
    },
    {
      fields: ['ip_origen']
    },
    {
      fields: ['procesado', 'alerta_generada']
    }
  ]
});

// Métodos estáticos para logging
Bitacora.registrar = async function(datos) {
  try {
    const entrada = await this.create({
      auditoria_id: datos.auditoria_id || null,
      usuario_id: datos.usuario_id || null,
      tipo_accion: datos.tipo_accion,
      descripcion: datos.descripcion,
      seccion_afectada: datos.seccion || null,
      modulo_origen: datos.modulo || 'AUDITORIAS',
      datos_antes: datos.antes ? JSON.stringify(datos.antes) : null,
      datos_despues: datos.despues ? JSON.stringify(datos.despues) : null,
      ip_origen: datos.ip || null,
      user_agent: datos.user_agent || null,
      session_id: datos.session_id || null,
      categoria: datos.categoria || 'OPERACIONAL',
      severidad: datos.severidad || 'BAJA',
      metadatos: datos.metadatos ? JSON.stringify(datos.metadatos) : null,
      fecha_hora: new Date()
    });
    
    // Verificar si necesita generar alerta
    if (datos.severidad === 'CRITICA' || datos.categoria === 'SEGURIDAD') {
      await this.generarAlerta(entrada);
    }
    
    return entrada;
  } catch (error) {
    console.error('Error registrando en bitácora:', error);
    // No lanzar error para evitar interrumpir el flujo principal
    return null;
  }
};

Bitacora.generarAlerta = async function(entrada) {
  // Implementar lógica de alertas si es necesario
  entrada.alerta_generada = true;
  await entrada.save();
};

// Métodos de consulta
Bitacora.obtenerPorAuditoria = async function(auditoria_id, limite = 100) {
  return await this.findAll({
    where: { auditoria_id },
    order: [['fecha_hora', 'DESC']],
    limit: limite,
    include: [
      {
        model: require('./Usuario.model'),
        as: 'usuario',
        attributes: ['id', 'nombre', 'email']
      }
    ]
  });
};

Bitacora.obtenerPorUsuario = async function(usuario_id, fechaDesde = null, limite = 50) {
  const where = { usuario_id };
  
  if (fechaDesde) {
    where.fecha_hora = {
      [sequelize.Sequelize.Op.gte]: fechaDesde
    };
  }
  
  return await this.findAll({
    where,
    order: [['fecha_hora', 'DESC']],
    limit: limite
  });
};

Bitacora.obtenerEventosCriticos = async function(fechaDesde = null, limite = 20) {
  const where = {
    severidad: ['ALTA', 'CRITICA']
  };
  
  if (fechaDesde) {
    where.fecha_hora = {
      [sequelize.Sequelize.Op.gte]: fechaDesde
    };
  }
  
  return await this.findAll({
    where,
    order: [['fecha_hora', 'DESC']],
    limit: limite
  });
};

module.exports = Bitacora;