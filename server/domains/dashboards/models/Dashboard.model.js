const { DataTypes } = require('sequelize');

/**
 * Modelo Dashboard - Configuración de dashboards personalizados
 */
function createDashboardModel(sequelize) {
  const Dashboard = sequelize.define('Dashboard', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nombre del dashboard personalizado'
    },
    
    tipo: {
      type: DataTypes.ENUM('ejecutivo', 'operativo', 'proveedor', 'personalizado'),
      allowNull: false,
      defaultValue: 'personalizado',
      comment: 'Tipo de dashboard'
    },
    
    configuracion: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Configuración JSON del dashboard (widgets, filtros, etc.)'
    },
    
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del usuario propietario del dashboard'
    },
    
    publico: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Si el dashboard es público o privado'
    },
    
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Estado del dashboard'
    },
    
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'dashboards',
    timestamps: false,
    indexes: [
      {
        fields: ['usuario_id']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['activo']
      }
    ]
  });

  return Dashboard;
}

module.exports = createDashboardModel;