/**
 * Modelo DocumentVersion - Sistema de Control de Versiones
 * Portal de Auditorías Técnicas
 * 
 * Gestiona versiones de documentos según especificación del PDF "Módulos Adicionales"
 */

const { DataTypes } = require('sequelize');

const DocumentVersion = (sequelize) => {
  const model = sequelize.define('DocumentVersion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // === IDENTIFICACIÓN DE VERSIÓN ===
    documento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del documento original'
    },

    numero_version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Número de versión (v1.0, v1.1, v2.0, etc.)'
    },

    version_mayor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Número de versión mayor'
    },

    version_menor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Número de versión menor'
    },

    version_patch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Número de patch/revisión'
    },

    // === METADATOS DE VERSIÓN ===
    es_version_actual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Indica si es la versión más reciente'
    },

    estado_version: {
      type: DataTypes.ENUM('borrador', 'final', 'en_revision', 'aprobado', 'obsoleto'),
      allowNull: false,
      defaultValue: 'borrador',
      comment: 'Estado actual de la versión'
    },

    // === INFORMACIÓN DEL ARCHIVO ===
    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nombre original del archivo'
    },

    ruta_archivo: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Ruta de almacenamiento del archivo'
    },

    tamano_archivo: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Tamaño del archivo en bytes'
    },

    tipo_mime: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tipo MIME del archivo'
    },

    hash_archivo: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'Hash SHA-256 del archivo para integridad'
    },

    // === METADATOS DE AUTORÍA ===
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del usuario que creó esta versión'
    },

    creado_por_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Email del usuario (para referencia rápida)'
    },

    modificado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del último usuario que modificó metadatos'
    },

    // === INFORMACIÓN DE CAMBIOS ===
    comentarios_version: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Comentarios sobre los cambios en esta versión'
    },

    tipo_cambio: {
      type: DataTypes.ENUM('creacion', 'contenido', 'correccion', 'actualizacion', 'restauracion'),
      allowNull: false,
      defaultValue: 'creacion',
      comment: 'Tipo de cambio realizado'
    },

    version_anterior_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Referencia a la versión anterior'
    },

    // === CONTEXTO DE AUDITORÍA ===
    auditoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de auditoría relacionada'
    },

    etapa_auditoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Etapa de auditoría cuando se creó la versión'
    },

    // === METADATOS ADICIONALES ===
    metadata_version: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Metadatos específicos de la versión'
    },

    // === CONTROL DE ACCESO ===
    es_publico: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si la versión es accesible públicamente'
    },

    requiere_aprobacion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si requiere aprobación para ser activada'
    },

    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del usuario que aprobó la versión'
    },

    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de aprobación'
    },

    // === FECHAS ===
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha de creación de la versión'
    },

    fecha_modificacion: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de última modificación de metadatos'
    }

  }, {
    tableName: 'document_versions',
    timestamps: true,
    
    indexes: [
      {
        name: 'idx_version_documento',
        fields: ['documento_id']
      },
      {
        name: 'idx_version_numero',
        fields: ['numero_version']
      },
      {
        name: 'idx_version_actual',
        fields: ['es_version_actual']
      },
      {
        name: 'idx_version_estado',
        fields: ['estado_version']
      },
      {
        name: 'idx_version_auditoria',
        fields: ['auditoria_id']
      },
      {
        name: 'idx_version_creador',
        fields: ['creado_por']
      },
      {
        name: 'idx_version_fecha',
        fields: ['fecha_creacion']
      },
      {
        name: 'idx_version_busqueda',
        fields: ['documento_id', 'version_mayor', 'version_menor', 'version_patch']
      },
      {
        unique: true,
        name: 'unique_version_documento',
        fields: ['documento_id', 'numero_version']
      }
    ],

    comment: 'Control de versiones de documentos con gestión completa de metadatos'
  });

  // === MÉTODOS DE INSTANCIA ===
  
  /**
   * Obtener número de versión completo
   */
  model.prototype.getVersionCompleta = function() {
    return `v${this.version_mayor}.${this.version_menor}.${this.version_patch}`;
  };

  /**
   * Verificar si es la versión más reciente
   */
  model.prototype.esVersionActual = function() {
    return this.es_version_actual;
  };

  /**
   * Obtener información resumida de la versión
   */
  model.prototype.getResumen = function() {
    return {
      id: this.id,
      version: this.getVersionCompleta(),
      estado: this.estado_version,
      creado_por: this.creado_por_email,
      fecha: this.fecha_creacion,
      comentarios: this.comentarios_version,
      es_actual: this.es_version_actual,
      tipo_cambio: this.tipo_cambio
    };
  };

  /**
   * Verificar si puede ser eliminada
   */
  model.prototype.puedeSerEliminada = function() {
    return !this.es_version_actual && this.estado_version !== 'aprobado';
  };

  // === MÉTODOS ESTÁTICOS ===

  /**
   * Crear nueva versión automáticamente
   */
  model.crearNuevaVersion = async function(documentoId, datosVersion, tipoIncremento = 'menor') {
    const transaction = await sequelize.transaction();
    
    try {
      // Obtener la versión actual
      const versionActual = await this.findOne({
        where: { 
          documento_id: documentoId, 
          es_version_actual: true 
        },
        transaction
      });

      let nuevaMayor = 1, nuevaMenor = 0, nuevoPatch = 0;

      if (versionActual) {
        // Calcular nuevo número de versión
        switch (tipoIncremento) {
          case 'mayor':
            nuevaMayor = versionActual.version_mayor + 1;
            nuevaMenor = 0;
            nuevoPatch = 0;
            break;
          case 'menor':
            nuevaMayor = versionActual.version_mayor;
            nuevaMenor = versionActual.version_menor + 1;
            nuevoPatch = 0;
            break;
          case 'patch':
            nuevaMayor = versionActual.version_mayor;
            nuevaMenor = versionActual.version_menor;
            nuevoPatch = versionActual.version_patch + 1;
            break;
        }

        // Marcar versión anterior como no actual
        await this.update(
          { es_version_actual: false },
          { 
            where: { 
              documento_id: documentoId, 
              es_version_actual: true 
            },
            transaction 
          }
        );
      }

      // Crear nueva versión
      const nuevaVersion = await this.create({
        documento_id: documentoId,
        numero_version: `v${nuevaMayor}.${nuevaMenor}.${nuevoPatch}`,
        version_mayor: nuevaMayor,
        version_menor: nuevaMenor,
        version_patch: nuevoPatch,
        es_version_actual: true,
        version_anterior_id: versionActual?.id || null,
        ...datosVersion
      }, { transaction });

      await transaction.commit();
      return nuevaVersion;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Obtener historial de versiones de un documento
   */
  model.obtenerHistorial = async function(documentoId, opciones = {}) {
    const { incluirObsoletas = true, limite = 50 } = opciones;

    const whereClause = { documento_id: documentoId };
    if (!incluirObsoletas) {
      whereClause.estado_version = { [sequelize.Op.ne]: 'obsoleto' };
    }

    return await this.findAll({
      where: whereClause,
      order: [['version_mayor', 'DESC'], ['version_menor', 'DESC'], ['version_patch', 'DESC']],
      limit: limite,
      include: [
        {
          model: sequelize.models.Usuario,
          as: 'Creador',
          attributes: ['id', 'nombre', 'email'],
          required: false
        }
      ]
    });
  };

  /**
   * Comparar dos versiones
   */
  model.compararVersiones = async function(versionId1, versionId2) {
    const [version1, version2] = await Promise.all([
      this.findByPk(versionId1),
      this.findByPk(versionId2)
    ]);

    if (!version1 || !version2) {
      throw new Error('Una o ambas versiones no existen');
    }

    return {
      version_antigua: version1.getResumen(),
      version_nueva: version2.getResumen(),
      diferencias: {
        cambio_mayor: version2.version_mayor !== version1.version_mayor,
        cambio_menor: version2.version_menor !== version1.version_menor,
        cambio_patch: version2.version_patch !== version1.version_patch,
        cambio_estado: version2.estado_version !== version1.estado_version,
        mismo_archivo: version2.hash_archivo === version1.hash_archivo
      }
    };
  };

  /**
   * Restaurar versión anterior como actual
   */
  model.restaurarVersion = async function(versionId, usuarioId) {
    const transaction = await sequelize.transaction();
    
    try {
      const versionARestaurar = await this.findByPk(versionId, { transaction });
      if (!versionARestaurar) {
        throw new Error('Versión no encontrada');
      }

      // Marcar todas las versiones como no actuales
      await this.update(
        { es_version_actual: false },
        { 
          where: { documento_id: versionARestaurar.documento_id },
          transaction 
        }
      );

      // Crear nueva versión basada en la restaurada
      const nuevaVersion = await this.crearNuevaVersion(
        versionARestaurar.documento_id,
        {
          nombre_archivo: versionARestaurar.nombre_archivo,
          ruta_archivo: versionARestaurar.ruta_archivo,
          tamano_archivo: versionARestaurar.tamano_archivo,
          tipo_mime: versionARestaurar.tipo_mime,
          hash_archivo: versionARestaurar.hash_archivo,
          creado_por: usuarioId,
          tipo_cambio: 'restauracion',
          comentarios_version: `Restaurada desde versión ${versionARestaurar.numero_version}`,
          version_anterior_id: versionARestaurar.id
        },
        'menor'
      );

      await transaction.commit();
      return nuevaVersion;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Limpiar versiones antiguas
   */
  model.limpiarVersionesAntiguas = async function(documentoId, mantenerUltimas = 10) {
    const versiones = await this.findAll({
      where: { 
        documento_id: documentoId,
        es_version_actual: false,
        estado_version: { [sequelize.Op.notIn]: ['aprobado'] }
      },
      order: [['fecha_creacion', 'DESC']],
      offset: mantenerUltimas
    });

    if (versiones.length > 0) {
      const idsAEliminar = versiones.map(v => v.id);
      const eliminadas = await this.destroy({
        where: { id: idsAEliminar }
      });
      
      return eliminadas;
    }

    return 0;
  };

  // === ASOCIACIONES ===
  model.associate = (models) => {
    // Relación con Documento
    model.belongsTo(models.Documento, {
      foreignKey: 'documento_id',
      as: 'Documento'
    });

    // Relación con Usuario (creador)
    model.belongsTo(models.Usuario, {
      foreignKey: 'creado_por',
      as: 'Creador'
    });

    // Relación con Usuario (aprobador)
    model.belongsTo(models.Usuario, {
      foreignKey: 'aprobado_por',
      as: 'Aprobador'
    });

    // Relación con versión anterior
    model.belongsTo(model, {
      foreignKey: 'version_anterior_id',
      as: 'VersionAnterior'
    });

    // Relación con versiones siguientes
    model.hasMany(model, {
      foreignKey: 'version_anterior_id',
      as: 'VersionesSiguientes'
    });

    // Relación con Auditoría
    if (models.Auditoria) {
      model.belongsTo(models.Auditoria, {
        foreignKey: 'auditoria_id',
        as: 'Auditoria'
      });
    }
  };

  return model;
};

module.exports = DocumentVersion;