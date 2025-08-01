/**
 * Servicio de Control de Versiones - Portal de Auditorías Técnicas
 * 
 * Implementa la lógica de negocio para gestión de versiones de documentos
 * según especificación del PDF "Módulos Adicionales"
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { DocumentVersion } = require('../models');
const BitacoraService = require('../../bitacora/bitacora.service');

class VersionesService {
  constructor() {
    this.bitacoraService = new BitacoraService();
    this.directorioBase = path.join(__dirname, '../../uploads/versiones');
  }

  /**
   * Crear nueva versión de documento
   */
  async crearVersion(documentoId, archivo, usuario, opciones = {}) {
    try {
      const {
        comentarios = '',
        tipoIncremento = 'menor',
        requiereAprobacion = false,
        auditoriaId = null,
        etapaAuditoria = null
      } = opciones;

      // Validar que el archivo existe
      if (!archivo || !archivo.buffer) {
        throw new Error('Archivo requerido para crear versión');
      }

      // Generar hash del archivo para integridad
      const hash = crypto.createHash('sha256')
        .update(archivo.buffer)
        .digest('hex');

      // Verificar si ya existe una versión con el mismo hash
      const versionExistente = await DocumentVersion.findOne({
        where: { 
          documento_id: documentoId,
          hash_archivo: hash
        }
      });

      if (versionExistente) {
        throw new Error('Ya existe una versión con el mismo contenido');
      }

      // Crear directorio de versiones si no existe
      const directorioDocumento = path.join(this.directorioBase, documentoId.toString());
      await this.asegurarDirectorio(directorioDocumento);

      // Crear nueva versión en BD
      const nuevaVersion = await DocumentVersion.crearNuevaVersion(
        documentoId,
        {
          nombre_archivo: archivo.originalname,
          ruta_archivo: '', // Se asignará después de guardar el archivo
          tamano_archivo: archivo.size,
          tipo_mime: archivo.mimetype,
          hash_archivo: hash,
          creado_por: usuario.id,
          creado_por_email: usuario.email,
          comentarios_version: comentarios,
          tipo_cambio: 'contenido',
          auditoria_id: auditoriaId,
          etapa_auditoria: etapaAuditoria,
          requiere_aprobacion: requiereAprobacion,
          metadata_version: {
            size_original: archivo.size,
            upload_timestamp: new Date().toISOString(),
            cliente_info: opciones.clienteInfo || null
          }
        },
        tipoIncremento
      );

      // Generar nombre de archivo único con timestamp y versión
      const timestamp = Date.now();
      const extension = path.extname(archivo.originalname);
      const nombreArchivo = `v${nuevaVersion.version_mayor}.${nuevaVersion.version_menor}.${nuevaVersion.version_patch}_${timestamp}${extension}`;
      const rutaCompleta = path.join(directorioDocumento, nombreArchivo);

      // Guardar archivo físico
      await fs.writeFile(rutaCompleta, archivo.buffer);

      // Actualizar ruta en la BD
      await nuevaVersion.update({
        ruta_archivo: rutaCompleta
      });

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'DOCUMENTO_VERSION_NUEVA',
        descripcion: `Nueva versión ${nuevaVersion.numero_version} creada para documento ${documentoId}`,
        usuario: usuario,
        seccion: 'Control de Versiones',
        documento_id: documentoId,
        metadata: {
          version: nuevaVersion.numero_version,
          archivo: archivo.originalname,
          hash: hash,
          tamaño: archivo.size
        },
        critico: true,
        tags: ['version', 'documento', 'creacion']
      });

      return {
        success: true,
        version: nuevaVersion,
        mensaje: `Versión ${nuevaVersion.numero_version} creada exitosamente`
      };

    } catch (error) {
      console.error('❌ Error creando versión:', error);
      throw error;
    }
  }

  /**
   * Obtener historial completo de versiones
   */
  async obtenerHistorial(documentoId, opciones = {}) {
    try {
      const {
        incluirObsoletas = true,
        limite = 50,
        incluirMetadatos = false
      } = opciones;

      const versiones = await DocumentVersion.obtenerHistorial(documentoId, {
        incluirObsoletas,
        limite
      });

      const historial = versiones.map(version => {
        const resumen = version.getResumen();
        
        if (incluirMetadatos) {
          resumen.metadata = version.metadata_version;
          resumen.hash = version.hash_archivo;
          resumen.ruta = version.ruta_archivo;
        }

        return resumen;
      });

      return {
        success: true,
        historial,
        total: versiones.length,
        version_actual: versiones.find(v => v.es_version_actual)?.numero_version || null
      };

    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Comparar dos versiones específicas
   */
  async compararVersiones(versionId1, versionId2, usuario) {
    try {
      const comparacion = await DocumentVersion.compararVersiones(versionId1, versionId2);

      // Registrar consulta en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'DOCUMENTO_VERSION_COMPARACION',
        descripcion: `Comparación entre versiones ${comparacion.version_antigua.version} y ${comparacion.version_nueva.version}`,
        usuario: usuario,
        seccion: 'Control de Versiones',
        metadata: {
          version_1: comparacion.version_antigua.version,
          version_2: comparacion.version_nueva.version,
          diferencias: comparacion.diferencias
        },
        critico: false,
        tags: ['version', 'comparacion']
      });

      return {
        success: true,
        comparacion
      };

    } catch (error) {
      console.error('❌ Error comparando versiones:', error);
      throw error;
    }
  }

  /**
   * Descargar versión específica
   */
  async descargarVersion(versionId, usuario) {
    try {
      const version = await DocumentVersion.findByPk(versionId);
      
      if (!version) {
        throw new Error('Versión no encontrada');
      }

      // Verificar que el archivo existe
      const archivoExiste = await fs.access(version.ruta_archivo).then(() => true).catch(() => false);
      if (!archivoExiste) {
        throw new Error('Archivo físico no encontrado');
      }

      // Registrar descarga en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'DOCUMENTO_VERSION_DESCARGA',
        descripcion: `Descarga de versión ${version.numero_version}`,
        usuario: usuario,
        seccion: 'Control de Versiones',
        documento_id: version.documento_id,
        metadata: {
          version: version.numero_version,
          archivo: version.nombre_archivo
        },
        critico: false,
        tags: ['version', 'descarga']
      });

      return {
        success: true,
        archivo: {
          ruta: version.ruta_archivo,
          nombre: version.nombre_archivo,
          tipo: version.tipo_mime,
          tamano: version.tamano_archivo
        },
        version: version.getResumen()
      };

    } catch (error) {
      console.error('❌ Error descargando versión:', error);
      throw error;
    }
  }

  /**
   * Restaurar versión anterior como actual
   */
  async restaurarVersion(versionId, usuario, comentarios = '') {
    try {
      const versionRestaurada = await DocumentVersion.restaurarVersion(versionId, usuario.id);

      // Registrar restauración en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'DOCUMENTO_VERSION_RESTAURACION',
        descripcion: `Versión restaurada: ${versionRestaurada.numero_version}`,
        usuario: usuario,
        seccion: 'Control de Versiones',
        documento_id: versionRestaurada.documento_id,
        metadata: {
          version_nueva: versionRestaurada.numero_version,
          version_origen: versionId,
          comentarios: comentarios
        },
        critico: true,
        tags: ['version', 'restauracion']
      });

      return {
        success: true,
        version_restaurada: versionRestaurada,
        mensaje: `Versión ${versionRestaurada.numero_version} restaurada exitosamente`
      };

    } catch (error) {
      console.error('❌ Error restaurando versión:', error);
      throw error;
    }
  }

  /**
   * Aprobar versión (cambiar estado)
   */
  async aprobarVersion(versionId, usuario, comentarios = '') {
    try {
      const version = await DocumentVersion.findByPk(versionId);
      
      if (!version) {
        throw new Error('Versión no encontrada');
      }

      if (!version.requiere_aprobacion) {
        throw new Error('Esta versión no requiere aprobación');
      }

      const estadoAnterior = version.estado_version;

      await version.update({
        estado_version: 'aprobado',
        aprobado_por: usuario.id,
        fecha_aprobacion: new Date(),
        comentarios_version: version.comentarios_version + 
          (comentarios ? `\n\nAprobación: ${comentarios}` : '')
      });

      // Registrar aprobación en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'DOCUMENTO_VERSION_APROBACION',
        descripcion: `Versión ${version.numero_version} aprobada`,
        usuario: usuario,
        seccion: 'Control de Versiones',
        documento_id: version.documento_id,
        datos_anteriores: { estado: estadoAnterior },
        datos_nuevos: { estado: 'aprobado' },
        metadata: {
          version: version.numero_version,
          comentarios_aprobacion: comentarios
        },
        critico: true,
        tags: ['version', 'aprobacion']
      });

      return {
        success: true,
        version,
        mensaje: `Versión ${version.numero_version} aprobada exitosamente`
      };

    } catch (error) {
      console.error('❌ Error aprobando versión:', error);
      throw error;
    }
  }

  /**
   * Eliminar versión (solo si no es actual y no está aprobada)
   */
  async eliminarVersion(versionId, usuario) {
    try {
      const version = await DocumentVersion.findByPk(versionId);
      
      if (!version) {
        throw new Error('Versión no encontrada');
      }

      if (!version.puedeSerEliminada()) {
        throw new Error('Esta versión no puede ser eliminada (es actual o está aprobada)');
      }

      const datosVersion = version.getResumen();

      // Eliminar archivo físico
      try {
        await fs.unlink(version.ruta_archivo);
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar archivo físico:', version.ruta_archivo);
      }

      // Eliminar registro de BD
      await version.destroy();

      // Registrar eliminación en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'DOCUMENTO_VERSION_ELIMINACION',
        descripcion: `Versión ${datosVersion.version} eliminada`,
        usuario: usuario,
        seccion: 'Control de Versiones',
        documento_id: version.documento_id,
        metadata: {
          version_eliminada: datosVersion,
          archivo: version.nombre_archivo
        },
        critico: true,
        tags: ['version', 'eliminacion']
      });

      return {
        success: true,
        mensaje: `Versión ${datosVersion.version} eliminada exitosamente`
      };

    } catch (error) {
      console.error('❌ Error eliminando versión:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de versiones
   */
  async obtenerEstadisticas(documentoId = null, fechaDesde = null, fechaHasta = null) {
    try {
      const whereClause = {};
      if (documentoId) whereClause.documento_id = documentoId;
      if (fechaDesde || fechaHasta) {
        whereClause.fecha_creacion = {};
        if (fechaDesde) whereClause.fecha_creacion[require('sequelize').Op.gte] = new Date(fechaDesde);
        if (fechaHasta) whereClause.fecha_creacion[require('sequelize').Op.lte] = new Date(fechaHasta);
      }

      const [
        totalVersiones,
        porEstado,
        porTipoCambio,
        versionesRecientes
      ] = await Promise.all([
        // Total de versiones
        DocumentVersion.count({ where: whereClause }),
        
        // Por estado
        DocumentVersion.findAll({
          where: whereClause,
          attributes: [
            'estado_version',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']
          ],
          group: ['estado_version'],
          raw: true
        }),
        
        // Por tipo de cambio
        DocumentVersion.findAll({
          where: whereClause,
          attributes: [
            'tipo_cambio',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']
          ],
          group: ['tipo_cambio'],
          raw: true
        }),
        
        // Versiones más recientes
        DocumentVersion.findAll({
          where: whereClause,
          order: [['fecha_creacion', 'DESC']],
          limit: 10,
          attributes: ['id', 'numero_version', 'documento_id', 'fecha_creacion', 'creado_por_email']
        })
      ]);

      return {
        success: true,
        estadisticas: {
          total_versiones: totalVersiones,
          por_estado: porEstado,
          por_tipo_cambio: porTipoCambio,
          versiones_recientes: versionesRecientes.map(v => ({
            id: v.id,
            version: v.numero_version,
            documento_id: v.documento_id,
            fecha: v.fecha_creacion,
            creado_por: v.creado_por_email
          }))
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Limpiar versiones antiguas automáticamente
   */
  async limpiarVersionesAntiguas(documentoId = null, mantenerUltimas = 10, diasAntiguedad = 30) {
    try {
      let whereClause = {
        es_version_actual: false,
        estado_version: { [require('sequelize').Op.notIn]: ['aprobado'] }
      };

      // Filtro por documento específico
      if (documentoId) {
        whereClause.documento_id = documentoId;
      }

      // Filtro por antigüedad
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      whereClause.fecha_creacion = { [require('sequelize').Op.lt]: fechaLimite };

      // Obtener versiones a eliminar
      const versionesAEliminar = await DocumentVersion.findAll({
        where: whereClause,
        order: [['fecha_creacion', 'ASC']] // Más antiguos primero
      });

      let eliminadas = 0;
      let errores = [];

      for (const version of versionesAEliminar) {
        try {
          // Verificar que no sea de las últimas N versiones del documento
          const versionesDocumento = await DocumentVersion.count({
            where: { documento_id: version.documento_id }
          });

          if (versionesDocumento > mantenerUltimas) {
            // Eliminar archivo físico
            try {
              await fs.unlink(version.ruta_archivo);
            } catch (error) {
              console.warn('⚠️ No se pudo eliminar archivo físico:', version.ruta_archivo);
            }

            // Eliminar registro
            await version.destroy();
            eliminadas++;
          }
        } catch (error) {
          errores.push({
            version_id: version.id,
            error: error.message
          });
        }
      }

      return {
        success: true,
        eliminadas,
        errores,
        mensaje: `${eliminadas} versiones antiguas eliminadas`
      };

    } catch (error) {
      console.error('❌ Error limpiando versiones:', error);
      throw error;
    }
  }

  /**
   * Validar integridad de archivos
   */
  async validarIntegridad(documentoId = null) {
    try {
      const whereClause = {};
      if (documentoId) whereClause.documento_id = documentoId;

      const versiones = await DocumentVersion.findAll({
        where: whereClause
      });

      const resultados = [];

      for (const version of versiones) {
        const resultado = {
          version_id: version.id,
          numero_version: version.numero_version,
          documento_id: version.documento_id,
          integridad: 'ok',
          errores: []
        };

        try {
          // Verificar que el archivo existe
          await fs.access(version.ruta_archivo);

          // Verificar hash si está disponible
          if (version.hash_archivo) {
            const buffer = await fs.readFile(version.ruta_archivo);
            const hashCalculado = crypto.createHash('sha256').update(buffer).digest('hex');
            
            if (hashCalculado !== version.hash_archivo) {
              resultado.integridad = 'corrupto';
              resultado.errores.push('Hash no coincide - archivo modificado');
            }
          }

        } catch (error) {
          resultado.integridad = 'error';
          resultado.errores.push(`Archivo no encontrado: ${error.message}`);
        }

        resultados.push(resultado);
      }

      const resumen = {
        total: resultados.length,
        ok: resultados.filter(r => r.integridad === 'ok').length,
        corruptos: resultados.filter(r => r.integridad === 'corrupto').length,
        errores: resultados.filter(r => r.integridad === 'error').length
      };

      return {
        success: true,
        resumen,
        detalle: resultados
      };

    } catch (error) {
      console.error('❌ Error validando integridad:', error);
      throw error;
    }
  }

  /**
   * Asegurar que existe el directorio
   */
  async asegurarDirectorio(ruta) {
    try {
      await fs.mkdir(ruta, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Health check del servicio
   */
  async healthCheck() {
    try {
      // Verificar directorio base
      await this.asegurarDirectorio(this.directorioBase);
      
      // Verificar conexión a BD
      const totalVersiones = await DocumentVersion.count();
      
      return {
        success: true,
        status: 'healthy',
        directorio_base: this.directorioBase,
        total_versiones: totalVersiones,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = VersionesService;