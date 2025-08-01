const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    comment: 'Código único: AUD-2025-001'
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'ID del proveedor (usuario con rol PROVEEDOR)'
  },
  auditor_principal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios', 
      key: 'id'
    },
    comment: 'ID del auditor principal asignado'
  },
  periodo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Período semestral: 2025-S1, 2025-S2'
  },
  fecha_programada: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha programada para la auditoría'
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de inicio del proceso'
  },
  fecha_limite: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha límite para carga de documentos'
  },
  fecha_finalizacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de finalización de la auditoría'
  },
  estado: {
    type: DataTypes.ENUM(
      'CONFIGURACION',
      'NOTIFICACION', 
      'CARGA_PRESENCIAL',
      'CARGA_PARQUE',
      'VALIDACION_AUTOMATICA',
      'REVISION_AUDITOR',
      'NOTIFICACION_RESULTADOS',
      'COMPLETADA',
      'SUSPENDIDA',
      'CANCELADA'
    ),
    defaultValue: 'CONFIGURACION',
    allowNull: false
  },
  etapa_actual: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    validate: {
      min: 1,
      max: 8
    },
    comment: 'Etapa actual del workflow (1-8)'
  },
  alcance: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Descripción del alcance de la auditoría'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones generales'
  },
  
  // Configuración de umbrales técnicos
  umbrales_tecnicos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Umbrales técnicos específicos para esta auditoría'
  },
  
  // Contadores automáticos
  total_puestos_os: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total de puestos On Site'
  },
  total_puestos_ho: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total de puestos Home Office'
  },
  sin_home_office: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Sitio sin modalidad Home Office'
  },
  
  // Resultados consolidados
  score_general: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Score general de cumplimiento (0-100)'
  },
  cumplimiento_critico: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'Cumple con todos los requisitos críticos'
  },
  
  // Metadatos
  creado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_ultima_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  // Control de versiones
  version: {
    type: DataTypes.STRING(10),
    defaultValue: '1.0',
    comment: 'Versión de la auditoría'
  },
  
  // Flags de control
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  archivada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'auditorias',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_ultima_actualizacion',
  indexes: [
    {
      fields: ['codigo'],
      unique: true
    },
    {
      fields: ['proveedor_id', 'periodo']
    },
    {
      fields: ['estado', 'etapa_actual']
    },
    {
      fields: ['fecha_programada']
    },
    {
      fields: ['activa', 'archivada']
    }
  ],
  hooks: {
    beforeUpdate: (auditoria) => {
      auditoria.fecha_ultima_actualizacion = new Date();
    }
  }
});

// Métodos de instancia
Auditoria.prototype.puedeAvanzarEtapa = function() {
  const etapasFinales = ['COMPLETADA', 'SUSPENDIDA', 'CANCELADA'];
  return !etapasFinales.includes(this.estado) && this.etapa_actual < 8;
};

Auditoria.prototype.obtenerProgresoWorkflow = function() {
  return {
    etapa_actual: this.etapa_actual,
    progreso_porcentaje: Math.round((this.etapa_actual / 8) * 100),
    estado: this.estado,
    puede_avanzar: this.puedeAvanzarEtapa()
  };
};

// Métodos estáticos
Auditoria.generarCodigo = async function(año = new Date().getFullYear()) {
  const ultimaAuditoria = await this.findOne({
    where: {
      codigo: {
        [sequelize.Sequelize.Op.like]: `AUD-${año}-%`
      }
    },
    order: [['codigo', 'DESC']]
  });
  
  let numeroSecuencial = 1;
  if (ultimaAuditoria) {
    const match = ultimaAuditoria.codigo.match(/AUD-\d{4}-(\d{3})/);
    if (match) {
      numeroSecuencial = parseInt(match[1]) + 1;
    }
  }
  
  return `AUD-${año}-${numeroSecuencial.toString().padStart(3, '0')}`;
};

module.exports = Auditoria;