/**
 * Servicio ETL - Motor de Procesamiento de Parque Informático
 * Portal de Auditorías Técnicas - VERSIÓN MEJORADA CON INTEGRACIÓN NORMALIZADOR
 */

const path = require('path');
const fs = require('fs').promises;
const { processExcelFile } = require('./utils/excelProcessor');
const { getModels } = require('../../models');

class ETLService {
  constructor() {
    this.models = null;
  }

  /**
   * Procesar archivo de parque informático completo con lógica avanzada
   */
  async procesarParqueInformatico(documentoId, auditoriaId, opciones = {}) {
    const {
      strict_mode = false,
      auto_fix = true,
      skip_validation = [],
      procesado_por = null
    } = opciones;

    let transaction;
    
    try {
      console.log(`🔄 Iniciando procesamiento ETL AVANZADO para documento: ${documentoId}`);
      
      const { ParqueInformatico, Documento, Auditoria, sequelize } = await getModels();
      
      // Iniciar transacción
      transaction = await sequelize.transaction();
      
      // 1. Obtener información del documento
      const documento = await Documento.findByPk(documentoId, {
        include: [{
          model: Auditoria,
          as: 'Auditoria'
        }],
        transaction
      });
      
      if (!documento) {
        throw new Error(`Documento ${documentoId} no encontrado`);
      }

      // 2. Verificar que el archivo existe
      const rutaArchivo = documento.ruta_archivo;
      if (!rutaArchivo) {
        throw new Error('Ruta de archivo no especificada en el documento');
      }

      // 3. Leer archivo como buffer
      const archivoBuffer = await fs.readFile(rutaArchivo);
      console.log(`📄 Archivo leído: ${archivoBuffer.length} bytes`);
      
      // 4. Procesar con lógica avanzada del normalizador-procesadores
      const auditData = {
        audit_id: documento.Auditoria?.codigo_auditoria || `AUDIT_${documentoId}`,
        audit_cycle: this.generateAuditCycle(),
        audit_version: 1,
        auditoria_id: auditoriaId
      };

      const resultadoProcesamiento = await processExcelFile(archivoBuffer, auditData);
      console.log(`🔧 Procesamiento avanzado completado: ${resultadoProcesamiento.totalRows} registros`);
      
      // 5. Convertir datos normalizados al formato de base de datos
      const datosBD = resultadoProcesamiento.normalizedData.map((registro, index) => ({
        // Metadatos de auditoría
        auditoria_id: auditoriaId,
        documento_origen_id: documentoId,
        audit_id: registro.audit_id,
        audit_date: registro.audit_date,
        audit_cycle: registro.audit_cycle,
        audit_version: registro.audit_version,
        
        // Identificación
        proveedor: registro.proveedor,
        sitio: registro.sitio,
        atencion: registro.atencion,
        usuario_id: registro.usuario_id,
        hostname: registro.hostname,
        
        // Hardware normalizado
        cpu_brand: registro.cpu_brand || 'Desconocido',
        cpu_model: registro.cpu_model || 'Desconocido',
        cpu_speed_ghz: registro.cpu_speed_ghz || 0,
        ram_gb: registro.ram_gb || 0,
        disk_type: registro.disk_type || 'Desconocido',
        disk_capacity_gb: registro.disk_capacity_gb || 0,
        
        // Software
        os_name: registro.os_name || 'Desconocido',
        browser_name: registro.browser_name || 'Desconocido',
        antivirus_brand: registro.antivirus_brand || 'Desconocido',
        
        // Periféricos
        headset_brand: registro.headset_brand || 'Desconocido',
        
        // Conectividad
        isp_name: registro.isp_name || 'Desconocido',
        connection_type: registro.connection_type || 'Desconocido',
        speed_download_mbps: registro.speed_download_mbps || 0,
        speed_upload_mbps: registro.speed_upload_mbps || 0,
        
        // Estado de cumplimiento
        overall_compliance: registro.overall_compliance || false,
        cpu_meets_requirements: registro.cpu_meets_requirements || false,
        ram_meets_requirements: registro.ram_meets_requirements || false,
        disk_meets_requirements: registro.disk_meets_requirements || false,
        os_meets_requirements: registro.os_meets_requirements || false,
        speed_meets_requirements: registro.speed_meets_requirements || false,
        
        // Razones de incumplimiento
        overall_failure_reason: registro.overall_failure_reason || '',
        cpu_failure_reason: registro.cpu_failure_reason || '',
        ram_failure_reason: registro.ram_failure_reason || '',
        disk_failure_reason: registro.disk_failure_reason || '',
        os_failure_reason: registro.os_failure_reason || '',
        speed_failure_reason: registro.speed_failure_reason || '',
        
        // Metadatos ETL
        procesado_por: procesado_por,
        procesado_en: new Date(),
        version_etl: '2.0-AVANZADO',
        score_calidad: this.calcularScoreCalidad(registro),
        metadatos_procesamiento: JSON.stringify({
          normalizador_version: '2.0',
          validaciones_aplicadas: ['CPU', 'RAM', 'Storage', 'OS', 'Speed'],
          correcciones_automaticas: auto_fix,
          modo_estricto: strict_mode,
          columnas_detectadas: Object.keys(resultadoProcesamiento.columnMapping).length
        })
      }));
      
      // 6. Filtrar registros según modo estricto
      const datosFinales = strict_mode 
        ? datosBD.filter(r => r.overall_compliance)
        : datosBD;
      
      // 7. Eliminar registros existentes para esta auditoría/documento
      await ParqueInformatico.destroy({
        where: {
          auditoria_id: auditoriaId,
          documento_origen_id: documentoId
        },
        transaction
      });
      
      // 8. Insertar nuevos registros
      const registrosCreados = await ParqueInformatico.bulkCreate(datosFinales, {
        transaction,
        validate: true,
        ignoreDuplicates: true
      });
      
      // 9. Actualizar estado del documento
      await documento.update({
        estado_procesamiento: 'PROCESADO',
        procesado_en: new Date(),
        metadatos_etl: JSON.stringify({
          total_registros: resultadoProcesamiento.totalRows,
          registros_validos: datosFinales.length,
          registros_rechazados: resultadoProcesamiento.totalRows - datosFinales.length,
          score_calidad_promedio: this.calcularScorePromedioGlobal(datosFinales),
          estadisticas: resultadoProcesamiento.stats,
          columnas_detectadas: resultadoProcesamiento.columnMapping,
          version_procesador: '2.0-AVANZADO'
        })
      }, { transaction });
      
      await transaction.commit();
      
      console.log(`✅ Procesamiento ETL AVANZADO completado: ${registrosCreados.length} registros insertados`);
      
      return {
        exito: true,
        registros_procesados: registrosCreados.length,
        registros_originales: resultadoProcesamiento.totalRows,
        registros_rechazados: resultadoProcesamiento.totalRows - datosFinales.length,
        estadisticas_completas: resultadoProcesamiento.stats,
        validaciones: {
          errores: [],
          advertencias: [],
          informacion: ['Procesamiento con normalizador avanzado completado'],
          scoreValidacion: this.calcularScorePromedioGlobal(datosFinales)
        },
        columnas_detectadas: resultadoProcesamiento.columnMapping,
        audit_metadata: resultadoProcesamiento.auditMetadata
      };
      
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('❌ Error en procesamiento ETL AVANZADO:', error.message);
      throw new Error(`Error ETL: ${error.message}`);
    }
  }

  /**
   * Obtener resultados de un trabajo ETL
   */
  async obtenerResultadosJob(jobId) {
    try {
      const { ETLJob, ParqueInformatico, ETLError } = await getModels();
      
      const job = await ETLJob.findByPk(jobId, {
        include: [
          {
            model: ParqueInformatico,
            as: 'parque_registros'
          },
          {
            model: ETLError,
            as: 'errores'
          }
        ]
      });

      if (!job) {
        throw new Error(`Job ETL no encontrado: ${jobId}`);
      }

      const resumen = await ETLError.obtenerResumenErrores(jobId);
      
      return {
        job: job.getEstadoDetallado(),
        registros: job.parque_registros || [],
        errores: resumen,
        estadisticas: {
          total_registros: job.parque_registros?.length || 0,
          registros_validos: job.parque_registros?.filter(r => r.overall_compliance).length || 0,
          registros_con_errores: job.parque_registros?.filter(r => !r.overall_compliance).length || 0,
          score_promedio: this.calcularScorePromedio(job.parque_registros || [])
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo resultados job:', error);
      throw error;
    }
  }

  /**
   * Validar archivo sin procesarlo (dry-run)
   */
  async validarArchivo(archivoPath, opciones = {}) {
    try {
      // Leer archivo como buffer
      const archivoBuffer = await fs.readFile(archivoPath);
      
      // Procesar solo para validación (sin persistir)
      const resultado = await processExcelFile(archivoBuffer, {
        audit_id: 'VALIDATION_RUN',
        audit_cycle: this.generateAuditCycle(),
        audit_version: 1
      });
      
      // Tomar muestra de los primeros 10 registros
      const muestra = resultado.normalizedData.slice(0, 10);
      
      // Analizar problemas comunes
      const problemas = [];
      const sugerencias = [];
      
      // Verificar completitud de datos
      if (resultado.stats.complianceRate < 50) {
        problemas.push('Más del 50% de los equipos no cumplen requisitos');
        sugerencias.push('Revisar especificaciones de hardware y software');
      }
      
      // Verificar detección de columnas
      const columnasEsperadas = ['processorKey', 'ramKey', 'storageKey', 'osKey'];
      const columnasFaltantes = columnasEsperadas.filter(col => !resultado.columnMapping[col]);
      
      if (columnasFaltantes.length > 0) {
        problemas.push(`Columnas no detectadas: ${columnasFaltantes.join(', ')}`);
        sugerencias.push('Verificar que los headers contengan palabras clave reconocibles');
      }
      
      return {
        archivo_valido: problemas.length === 0,
        total_registros: resultado.totalRows,
        campos_encontrados: Object.keys(resultado.columnMapping),
        problemas_detectados: problemas,
        sugerencias_mejora: sugerencias,
        muestra_datos: muestra,
        estadisticas_previas: resultado.stats,
        columnas_detectadas: resultado.columnMapping
      };
      
    } catch (error) {
      console.error('❌ Error validando archivo:', error);
      return {
        archivo_valido: false,
        total_registros: 0,
        campos_encontrados: [],
        problemas_detectados: [error.message],
        sugerencias_mejora: ['Verificar que el archivo sea un Excel válido'],
        muestra_datos: []
      };
    }
  }

  /**
   * Obtener reglas de validación específicas del Portal de Auditorías
   */
  async obtenerReglasValidacion(categoria = null) {
    const reglas = {
      cpu: {
        intel_core_i5: {
          minGeneration: 8,
          minSpeed: 3.0,
          description: 'Intel Core i5 3.0 GHz 8va Gen o superior'
        },
        amd_ryzen_5: {
          minSpeed: 3.7,
          description: 'AMD Ryzen 5 3.7 GHz o superior'
        }
      },
      ram: {
        minCapacity: 16,
        description: '16 GB o superior'
      },
      storage: {
        minCapacity: 500,
        preferSSD: true,
        description: '500 GB SSD o superior'
      },
      os: {
        required: 'Windows 11',
        description: 'Windows 11 requerido'
      },
      speed: {
        homeOffice: {
          minDown: 15,
          minUp: 6,
          description: 'Home Office: 15/6 Mbps mínimo'
        }
      }
    };

    return categoria ? reglas[categoria] : reglas;
  }

  /**
   * Obtener estadísticas de trabajos ETL
   */
  async obtenerEstadisticasETL(auditoriaId = null) {
    try {
      const { ParqueInformatico } = await getModels();
      
      const whereClause = auditoriaId ? { auditoria_id: auditoriaId } : {};
      
      const registros = await ParqueInformatico.findAll({
        where: whereClause,
        attributes: [
          'overall_compliance',
          'cpu_meets_requirements', 
          'ram_meets_requirements',
          'disk_meets_requirements',
          'os_meets_requirements',
          'speed_meets_requirements',
          'atencion',
          'cpu_brand',
          'disk_type',
          'os_name'
        ]
      });

      if (!registros.length) {
        return {
          total_equipos: 0,
          cumplimiento_general: 0,
          distribucion_atencion: {},
          cumplimiento_por_componente: {},
          distribucion_hardware: {}
        };
      }

      const total = registros.length;
      const cumplimiento = registros.filter(r => r.overall_compliance).length;
      
      // Distribución por tipo de atención
      const atencionCount = {};
      registros.forEach(r => {
        atencionCount[r.atencion] = (atencionCount[r.atencion] || 0) + 1;
      });

      // Cumplimiento por componente
      const componentCompliance = {
        cpu: registros.filter(r => r.cpu_meets_requirements).length,
        ram: registros.filter(r => r.ram_meets_requirements).length,
        storage: registros.filter(r => r.disk_meets_requirements).length,
        os: registros.filter(r => r.os_meets_requirements).length,
        speed: registros.filter(r => r.speed_meets_requirements).length
      };

      // Distribución de hardware
      const cpuBrands = {};
      const diskTypes = {};
      const osVersions = {};
      
      registros.forEach(r => {
        if (r.cpu_brand) cpuBrands[r.cpu_brand] = (cpuBrands[r.cpu_brand] || 0) + 1;
        if (r.disk_type) diskTypes[r.disk_type] = (diskTypes[r.disk_type] || 0) + 1;
        if (r.os_name) osVersions[r.os_name] = (osVersions[r.os_name] || 0) + 1;
      });

      return {
        total_equipos: total,
        cumplimiento_general: Math.round((cumplimiento / total) * 100),
        distribucion_atencion: atencionCount,
        cumplimiento_por_componente: Object.fromEntries(
          Object.entries(componentCompliance).map(([key, value]) => [
            key, 
            { total: value, porcentaje: Math.round((value / total) * 100) }
          ])
        ),
        distribucion_hardware: {
          cpu_brands: cpuBrands,
          disk_types: diskTypes,
          os_versions: osVersions
        }
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas ETL:', error);
      throw error;
    }
  }

  /**
   * Generar ciclo de auditoría basado en la fecha actual
   */
  generateAuditCycle() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const semester = month <= 6 ? 'S1' : 'S2';
    return `${year}-${semester}`;
  }

  /**
   * Calcular score de calidad individual
   */
  calcularScoreCalidad(registro) {
    let score = 100;
    
    // Penalizar por cada incumplimiento
    if (!registro.cpu_meets_requirements) score -= 20;
    if (!registro.ram_meets_requirements) score -= 20;
    if (!registro.disk_meets_requirements) score -= 20;
    if (!registro.os_meets_requirements) score -= 20;
    if (!registro.speed_meets_requirements) score -= 20;
    
    return Math.max(0, score);
  }

  /**
   * Calcular score promedio global
   */
  calcularScorePromedioGlobal(registros) {
    if (!registros || registros.length === 0) return 0;
    
    const totalScore = registros.reduce((sum, registro) => {
      return sum + this.calcularScoreCalidad(registro);
    }, 0);
    
    return Math.round(totalScore / registros.length);
  }

  /**
   * Calcular score promedio de registros
   */
  calcularScorePromedio(registros) {
    if (!registros || registros.length === 0) return 0;
    const total = registros.reduce((sum, r) => sum + (r.score_calidad || 0), 0);
    return Math.round(total / registros.length);
  }

  /**
   * Setear modelos para el servicio
   */
  setModels(models) {
    this.models = models;
  }

  /**
   * Obtener estado de un trabajo ETL
   */
  async obtenerEstadoJob(jobId) {
    try {
      const { ETLJob } = await getModels();
      
      if (!ETLJob) {
        return {
          job_id: jobId,
          estado: 'DESCONOCIDO',
          mensaje: 'Modelos ETL no inicializados'
        };
      }

      const job = await ETLJob.findByPk(jobId);
      
      if (!job) {
        return {
          job_id: jobId,
          estado: 'NO_ENCONTRADO',
          mensaje: `Job ETL ${jobId} no encontrado`
        };
      }

      return job.getEstadoDetallado ? job.getEstadoDetallado() : {
        job_id: jobId,
        estado: job.estado || 'UNKNOWN',
        mensaje: 'Estado del job obtenido'
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estado job:', error);
      return {
        job_id: jobId,
        estado: 'ERROR',
        mensaje: error.message
      };
    }
  }

  /**
   * Limpiar trabajos y errores antiguos
   */
  async limpiarDatosAntiguos(diasAntiguedad = 30) {
    try {
      const { ETLJob, ETLError } = await getModels();
      
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      
      const jobsEliminados = await ETLJob.destroy({
        where: {
          createdAt: {
            [require('sequelize').Op.lt]: fechaLimite
          }
        }
      });
      
      const erroresEliminados = await ETLError.destroy({
        where: {
          createdAt: {
            [require('sequelize').Op.lt]: fechaLimite
          }
        }
      });
      
      return {
        jobs_eliminados: jobsEliminados,
        errores_eliminados: erroresEliminados
      };
      
    } catch (error) {
      console.error('❌ Error limpiando datos antiguos:', error);
      return {
        jobs_eliminados: 0,
        errores_eliminados: 0,
        error: error.message
      };
    }
  }
}

module.exports = ETLService;
