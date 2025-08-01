/**
 * Modelo ChatCategoriaMensaje - Categorización de Mensajes según PDF
 * Portal de Auditorías Técnicas
 * 
 * Implementa las categorías específicas mencionadas en el PDF "Módulos Adicionales"
 */

const { DataTypes } = require('sequelize');

const ChatCategoriaMensaje = (sequelize) => {
  return sequelize.define('ChatCategoriaMensaje', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.ENUM(
        'CONSULTA_GENERAL',
        'ACLARACION_TECNICA', 
        'SOLICITUD_PRORROGA',
        'REPORTE_PROBLEMA',
        'RESPUESTA_OBSERVACION',
        'SOLICITUD_INFORMACION',
        'NOTIFICACION_CAMBIO',
        'ESCALAMIENTO'
      ),
      allowNull: false,
      unique: true,
      comment: 'Código único de la categoría según PDF'
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nombre descriptivo de la categoría'
    },
    descripcion: {
      type: DataTypes.TEXT,
      comment: 'Descripción detallada del tipo de mensaje'
    },
    color_hex: {
      type: DataTypes.STRING(7),
      defaultValue: '#6B7280',
      comment: 'Color para UI - formato #RRGGBB'
    },
    icono: {
      type: DataTypes.STRING(50),
      comment: 'Nombre del icono para UI (lucide-react)'
    },
    requiere_respuesta: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si la categoría requiere respuesta obligatoria'
    },
    tiempo_respuesta_horas: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      comment: 'Tiempo esperado de respuesta en horas'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'chat_categorias_mensaje',
    timestamps: true,
    indexes: [
      { fields: ['codigo'] },
      { fields: ['activo'] }
    ],
    hooks: {
      beforeCreate: (categoria) => {
        // Asignar configuraciones predeterminadas según tipo
        const configuraciones = {
          'CONSULTA_GENERAL': {
            color_hex: '#3B82F6',
            icono: 'MessageCircle',
            tiempo_respuesta_horas: 24
          },
          'ACLARACION_TECNICA': {
            color_hex: '#F59E0B',
            icono: 'HelpCircle',
            tiempo_respuesta_horas: 12
          },
          'SOLICITUD_PRORROGA': {
            color_hex: '#8B5CF6',
            icono: 'Clock',
            tiempo_respuesta_horas: 4
          },
          'REPORTE_PROBLEMA': {
            color_hex: '#EF4444',
            icono: 'AlertTriangle',
            tiempo_respuesta_horas: 6
          },
          'RESPUESTA_OBSERVACION': {
            color_hex: '#10B981',
            icono: 'CheckCircle',
            tiempo_respuesta_horas: 48
          },
          'SOLICITUD_INFORMACION': {
            color_hex: '#6366F1',
            icono: 'Info',
            tiempo_respuesta_horas: 24
          },
          'NOTIFICACION_CAMBIO': {
            color_hex: '#F97316',
            icono: 'Bell',
            tiempo_respuesta_horas: 2
          },
          'ESCALAMIENTO': {
            color_hex: '#DC2626',
            icono: 'ArrowUp',
            tiempo_respuesta_horas: 1
          }
        };

        const config = configuraciones[categoria.codigo];
        if (config) {
          Object.assign(categoria, config);
        }
      }
    }
  });
};

module.exports = ChatCategoriaMensaje;
