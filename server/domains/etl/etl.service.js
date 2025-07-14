/**
 * Servicio ETL - Motor de Procesamiento de Parque Informático
 * Portal de Auditorías Técnicas
 */

const ExcelParser = require('./parsers/excel-parser');
const CSVParser = require('./parsers/csv-parser');
const FieldNormalizer = require('./transformers/field-normalizer');
const BusinessRulesValidator = require('./validators/business-rules');
const SchemaValidator = require('./validators/schema-validator');
const { getModels } = require('../../models');

class ETLService {
  constructor() {
    this.excelParser = new ExcelParser();
    this.csvParser = new CSVParser();
    this.fieldNormalizer = new FieldNormalizer();
    this.businessValidator = new BusinessRulesValidator();
    this.schemaValidator = new SchemaValidator();
  }

  /**
   * Procesar archivo de parque informático completo
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
      console.log(`🔄 Iniciando procesamiento ETL para documento: ${documentoId}`);
      
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
      
      // 2. Detectar formato y parsear archivo
      const datosRaw = await this.parserarArchivo(documento.ruta_archivo);
      console.log(`📄 Archivo parseado: ${datosRaw.length} registros detectados`);
      
      // 3. Normalizar datos
      const datosNormalizados = await this.normalizarDatos(datosRaw, documento.Auditoria);
      console.log(`🔧 Datos normalizados: ${datosNormalizados.length} registros`);
      
      // 4. Validar datos
      const resultadosValidacion = await this.validarDatos(datosNormalizados, {
        strict_mode,
        skip_validation
      });
      
      // 5. Aplicar correcciones automáticas si está habilitado
      let datosProcesados = datosNormalizados;
      if (auto_fix) {
        datosProcesados = await this.aplicarCorreccionesAutomaticas(datosNormalizados, resultadosValidacion);
      }
      
      // 6. Filtrar registros según modo estricto
      const datosFinales = strict_mode 
        ? datosProcesados.filter(r => !resultadosValidacion.erroresPorRegistro[r.temp_id])
        : datosProcesados;
      
      // 7. Agregar metadatos ETL
      const datosConMetadatos = datosFinales.map(registro => ({
        ...registro,
        documento_origen_id: documentoId,
        procesado_por: procesado_por,
        procesado_en: new Date(),
        version_etl: '1.0',
        metadatos_procesamiento: {
          validaciones_aplicadas: resultadosValidacion.reglasAplicadas,
          correcciones_automaticas: auto_fix,
          modo_estricto: strict_mode
        }
      }));
      
      // 8. Eliminar registros existentes para esta auditoría (si los hay)
      await ParqueInformatico.destroy({
        where: {
          auditoria_id: auditoriaId,
          documento_origen_id: documentoId
        },
        transaction
      });
      
      // 9. Insertar nuevos registros
      const registrosCreados = await ParqueInformatico.bulkCreate(datosConMetadatos, {
        transaction,
        validate: true
      });
      
      // 10. Actualizar estado del documento
      await documento.update({
        estado_procesamiento: 'PROCESADO',
        procesado_en: new Date(),
        metadatos_etl: {
          total_registros: datosFinales.length,
          registros_validos: datosFinales.length - (resultadosValidacion.errores?.length || 0),
          registros_con_advertencias: resultadosValidacion.advertencias?.length || 0,
          score_calidad_promedio: this.calcularScoreCalidadPromedio(resultadosValidacion)
        }
      }, { transaction });
      
      await transaction.commit();
      
      console.log(`✅ Procesamiento ETL completado: ${registrosCreados.length} registros insertados`);
      
      return {
        exito: true,
        registros_procesados: registrosCreados.length,
        registros_originales: datosRaw.length,
        validaciones: resultadosValidacion,
        estadisticas: this.generarEstadisticas(datosFinales, resultadosValidacion)
      };
      
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('❌ Error en procesamiento ETL:', error.message);
      throw new Error(`Error ETL: ${error.message}`);
    }
  }

  /**
   * Detectar formato y parsear archivo
   */
  async parserarArchivo(rutaArchivo) {
    const extension = rutaArchivo.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return await this.excelParser.parse(rutaArchivo);
      case 'csv':
        return await this.csvParser.parse(rutaArchivo);
      default:
        throw new Error(`Formato de archivo no soportado: ${extension}`);
    }
  }

  /**
   * Normalizar datos según esquema de 28 campos
   */
  async normalizarDatos(datosRaw, auditoria) {
    const datosNormalizados = [];
    
    for (let i = 0; i < datosRaw.length; i++) {
      const registro = datosRaw[i];
      
      try {
        const registroNormalizado = {
          // Agregar ID temporal para tracking
          temp_id: `temp_${i}`,
          
          // Metadatos de auditoría
          audit_id: auditoria.codigo_auditoria,
          audit_date: new Date(),
          audit_cycle: this.extraerCicloAuditoria(auditoria.codigo_auditoria),
          audit_version: auditoria.version_pliego || '1.0',
          
          // Identificación (normalizada)
          proveedor: await this.fieldNormalizer.normalizeField(registro.proveedor || auditoria.Proveedor?.razon_social, 'proveedor'),
          sitio: await this.fieldNormalizer.normalizeField(registro.sitio, 'sitio'),
          atencion: await this.fieldNormalizer.normalizeField(registro.atencion, 'atencion'),
          usuario_id: await this.fieldNormalizer.normalizeField(registro.usuario_id || registro.id_usuario, 'usuario_id'),
          hostname: await this.fieldNormalizer.normalizeField(registro.hostname || registro.nombre_equipo, 'hostname'),
          
          // Hardware - CPU
          cpu_brand: await this.fieldNormalizer.normalizeField(registro.cpu_brand || registro.marca_cpu, 'cpu_brand'),
          cpu_model: await this.fieldNormalizer.normalizeField(registro.cpu_model || registro.modelo_cpu, 'cpu_model'),
          cpu_speed_ghz: await this.fieldNormalizer.normalizeField(registro.cpu_speed || registro.velocidad_cpu, 'cpu_speed_ghz'),
          cpu_cores: await this.fieldNormalizer.normalizeField(registro.cpu_cores || registro.nucleos_cpu, 'cpu_cores'),
          
          // Hardware - Memoria
          ram_gb: await this.fieldNormalizer.normalizeField(registro.ram_gb || registro.memoria_ram || registro.ram, 'ram_gb'),
          ram_type: await this.fieldNormalizer.normalizeField(registro.ram_type || registro.tipo_ram, 'ram_type'),
          
          // Hardware - Almacenamiento
          disk_type: await this.fieldNormalizer.normalizeField(registro.disk_type || registro.tipo_disco, 'disk_type'),
          disk_capacity_gb: await this.fieldNormalizer.normalizeField(registro.disk_capacity || registro.capacidad_disco, 'disk_capacity_gb'),
          
          // Software - OS
          os_name: await this.fieldNormalizer.normalizeField(registro.os_name || registro.sistema_operativo, 'os_name'),
          os_version: await this.fieldNormalizer.normalizeField(registro.os_version || registro.version_os, 'os_version'),
          os_architecture: await this.fieldNormalizer.normalizeField(registro.os_architecture || registro.arquitectura_os, 'os_architecture'),
          
          // Software - Navegador
          browser_name: await this.fieldNormalizer.normalizeField(registro.browser_name || registro.navegador, 'browser_name'),
          browser_version: await this.fieldNormalizer.normalizeField(registro.browser_version || registro.version_navegador, 'browser_version'),
          
          // Software - Antivirus
          antivirus_brand: await this.fieldNormalizer.normalizeField(registro.antivirus_brand || registro.antivirus, 'antivirus_brand'),
          antivirus_version: await this.fieldNormalizer.normalizeField(registro.antivirus_version || registro.version_antivirus, 'antivirus_version'),
          antivirus_updated: await this.fieldNormalizer.normalizeField(registro.antivirus_updated || registro.antivirus_actualizado, 'antivirus_updated'),
          
          // Periféricos
          headset_brand: await this.fieldNormalizer.normalizeField(registro.headset_brand || registro.diadema, 'headset_brand'),
          headset_model: await this.fieldNormalizer.normalizeField(registro.headset_model || registro.modelo_diadema, 'headset_model'),
          
          // Conectividad
          isp_name: await this.fieldNormalizer.normalizeField(registro.isp_name || registro.proveedor_internet, 'isp_name'),
          connection_type: await this.fieldNormalizer.normalizeField(registro.connection_type || registro.tipo_conexion, 'connection_type'),
          speed_download_mbps: await this.fieldNormalizer.normalizeField(registro.speed_download || registro.velocidad_bajada, 'speed_download_mbps'),
          speed_upload_mbps: await this.fieldNormalizer.normalizeField(registro.speed_upload || registro.velocidad_subida, 'speed_upload_mbps'),
          
          // Relaciones
          auditoria_id: auditoria.id
        };
        
        datosNormalizados.push(registroNormalizado);
        
      } catch (error) {
        console.error(`Error normalizando registro ${i}:`, error.message);
        // Continuar con el siguiente registro
      }
    }
    
    return datosNormalizados;
  }

  /**
   * Validar datos normalizados
   */
  async validarDatos(datos, opciones = {}) {
    const resultados = {
      errores: [],
      advertencias: [],
      informacion: [],
      erroresPorRegistro: {},
      advertenciasPorRegistro: {},
      reglasAplicadas: [],
      scoreValidacion: 100
    };
    
    for (const registro of datos) {
      // Validación de esquema
      const validacionEsquema = await this.schemaValidator.validate(registro, opciones);
      
      // Validación de reglas de negocio
      const validacionNegocio = await this.businessValidator.validate(registro, opciones);
      
      // Consolidar resultados
      if (validacionEsquema.errores.length > 0) {
        resultados.errores.push(...validacionEsquema.errores);
        resultados.erroresPorRegistro[registro.temp_id] = validacionEsquema.errores;
      }
      
      if (validacionNegocio.errores.length > 0) {
        resultados.errores.push(...validacionNegocio.errores);
        if (!resultados.erroresPorRegistro[registro.temp_id]) {
          resultados.erroresPorRegistro[registro.temp_id] = [];
        }
        resultados.erroresPorRegistro[registro.temp_id].push(...validacionNegocio.errores);
      }
      
      // Advertencias
      resultados.advertencias.push(...validacionEsquema.advertencias, ...validacionNegocio.advertencias);
      
      // Información
      resultados.informacion.push(...validacionEsquema.informacion, ...validacionNegocio.informacion);
    }
    
    // Calcular score de validación
    const totalRegistros = datos.length;
    const registrosConErrores = Object.keys(resultados.erroresPorRegistro).length;
    resultados.scoreValidacion = Math.max(0, Math.round(((totalRegistros - registrosConErrores) / totalRegistros) * 100));
    
    return resultados;
  }

  /**
   * Aplicar correcciones automáticas
   */
  async aplicarCorreccionesAutomaticas(datos, validaciones) {
    // Implementar correcciones automáticas básicas
    return datos.map(registro => {
      let registroCorregido = { ...registro };
      
      // Ejemplo: corregir valores nulos en campos no críticos
      if (!registroCorregido.hostname) {
        registroCorregido.hostname = `HOST_${registroCorregido.usuario_id}`;
      }
      
      // Ejemplo: normalizar valores de RAM
      if (registroCorregido.ram_gb && registroCorregido.ram_gb < 1) {
        registroCorregido.ram_gb = Math.round(registroCorregido.ram_gb * 1024); // Convertir de TB a GB
      }
      
      return registroCorregido;
    });
  }

  /**
   * Extraer ciclo de auditoría del código
   */
  extraerCicloAuditoria(codigoAuditoria) {
    const match = codigoAuditoria.match(/(\d{4})-?(S[12])/);
    return match ? `${match[1]}-${match[2]}` : '2025-S1';
  }

  /**
   * Calcular score de calidad promedio
   */
  calcularScoreCalidadPromedio(validaciones) {
    return validaciones.scoreValidacion || 85;
  }

  /**
   * Generar estadísticas del procesamiento
   */
  generarEstadisticas(datos, validaciones) {
    const stats = {
      total_registros: datos.length,
      registros_validos: datos.length - (validaciones.errores?.length || 0),
      registros_con_errores: validaciones.errores?.length || 0,
      registros_con_advertencias: validaciones.advertencias?.length || 0,
      score_calidad_promedio: validaciones.scoreValidacion,
      distribucion_por_sitio: {},
      distribucion_por_atencion: {},
      hardware_stats: {
        ram_promedio: 0,
        cpu_brands: {},
        os_distribution: {}
      }
    };
    
    // Calcular distribuciones
    datos.forEach(registro => {
      // Por sitio
      stats.distribucion_por_sitio[registro.sitio] = (stats.distribucion_por_sitio[registro.sitio] || 0) + 1;
      
      // Por tipo de atención
      stats.distribucion_por_atencion[registro.atencion] = (stats.distribucion_por_atencion[registro.atencion] || 0) + 1;
      
      // Hardware stats
      if (registro.ram_gb) {
        stats.hardware_stats.ram_promedio += registro.ram_gb;
      }
      
      if (registro.cpu_brand) {
        stats.hardware_stats.cpu_brands[registro.cpu_brand] = (stats.hardware_stats.cpu_brands[registro.cpu_brand] || 0) + 1;
      }
      
      if (registro.os_name) {
        stats.hardware_stats.os_distribution[registro.os_name] = (stats.hardware_stats.os_distribution[registro.os_name] || 0) + 1;
      }
    });
    
    // Calcular promedio de RAM
    if (datos.length > 0) {
      stats.hardware_stats.ram_promedio = Math.round(stats.hardware_stats.ram_promedio / datos.length);
    }
    
    return stats;
  }

  /**
   * Obtener estadísticas de procesamiento para una auditoría
   */
  async obtenerEstadisticasAuditoria(auditoriaId) {
    try {
      const { ParqueInformatico } = await getModels();
      
      const registros = await ParqueInformatico.findAll({
        where: { auditoria_id: auditoriaId },
        raw: true
      });
      
      if (registros.length === 0) {
        return { mensaje: 'No hay datos de parque informático para esta auditoría' };
      }
      
      return this.generarEstadisticas(registros, { scoreValidacion: 100 });
      
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error.message);
      throw error;
    }
  }
}

module.exports = ETLService;
