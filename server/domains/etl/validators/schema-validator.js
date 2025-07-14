/**
 * Validador de Esquema - ETL Portal de Auditorías
 * Validación de tipos de datos y formatos
 */

class SchemaValidator {
  constructor() {
    this.schema = this.defineSchema();
  }

  /**
   * Definir esquema de validación
   */
  defineSchema() {
    return {
      // Metadatos
      audit_id: { type: 'string', required: true, maxLength: 50 },
      audit_date: { type: 'date', required: true },
      audit_cycle: { type: 'string', required: true, pattern: /^\d{4}-S[12]$/ },
      audit_version: { type: 'string', required: true, maxLength: 20 },
      
      // Identificación
      proveedor: { type: 'string', required: true, maxLength: 255 },
      sitio: { type: 'string', required: true, maxLength: 100 },
      atencion: { 
        type: 'enum', 
        required: true, 
        values: ['INBOUND', 'OUTBOUND', 'MIXTO', 'CHAT', 'EMAIL', 'SOPORTE'] 
      },
      usuario_id: { type: 'string', required: true, maxLength: 50 },
      hostname: { type: 'string', required: false, maxLength: 100 },
      
      // Hardware - CPU
      cpu_brand: { 
        type: 'enum', 
        required: false, 
        values: ['Intel', 'AMD', 'Apple', 'Otro'] 
      },
      cpu_model: { type: 'string', required: false, maxLength: 200 },
      cpu_speed_ghz: { type: 'decimal', required: false, min: 0.5, max: 10.0 },
      cpu_cores: { type: 'integer', required: false, min: 1, max: 64 },
      
      // Hardware - Memoria
      ram_gb: { type: 'integer', required: false, min: 1, max: 1024 },
      ram_type: { 
        type: 'enum', 
        required: false, 
        values: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'Otro'] 
      },
      
      // Hardware - Almacenamiento
      disk_type: { 
        type: 'enum', 
        required: false, 
        values: ['HDD', 'SSD', 'NVME', 'Híbrido', 'Otro'] 
      },
      disk_capacity_gb: { type: 'integer', required: false, min: 50, max: 10000 },
      
      // Software - OS
      os_name: { 
        type: 'enum', 
        required: false, 
        values: ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'Chrome OS', 'Otro'] 
      },
      os_version: { type: 'string', required: false, maxLength: 50 },
      os_architecture: { 
        type: 'enum', 
        required: false, 
        values: ['x64', 'x86', 'ARM64', 'ARM', 'Otro'] 
      },
      
      // Software - Navegador
      browser_name: { 
        type: 'enum', 
        required: false, 
        values: ['Chrome', 'Firefox', 'Edge', 'Safari', 'Opera', 'Internet Explorer', 'Otro'] 
      },
      browser_version: { type: 'string', required: false, maxLength: 50 },
      
      // Software - Antivirus
      antivirus_brand: { type: 'string', required: false, maxLength: 100 },
      antivirus_version: { type: 'string', required: false, maxLength: 50 },
      antivirus_updated: { type: 'boolean', required: false },
      
      // Periféricos
      headset_brand: { type: 'string', required: false, maxLength: 100 },
      headset_model: { type: 'string', required: false, maxLength: 100 },
      
      // Conectividad
      isp_name: { type: 'string', required: false, maxLength: 100 },
      connection_type: { 
        type: 'enum', 
        required: false, 
        values: ['Fibra', 'Cable', 'DSL', 'Satelital', 'Móvil 4G', 'Móvil 5G', 'Otro'] 
      },
      speed_download_mbps: { type: 'integer', required: false, min: 1, max: 10000 },
      speed_upload_mbps: { type: 'integer', required: false, min: 1, max: 10000 }
    };
  }

  /**
   * Validar un registro contra el esquema
   */
  async validate(record, options = {}) {
    const resultados = {
      errores: [],
      advertencias: [],
      informacion: []
    };

    const { strict_mode = false } = options;

    for (const [fieldName, fieldSchema] of Object.entries(this.schema)) {
      const value = record[fieldName];
      
      try {
        const validationResult = this.validateField(fieldName, value, fieldSchema, strict_mode);
        
        if (validationResult.errores.length > 0) {
          resultados.errores.push(...validationResult.errores);
        }
        
        if (validationResult.advertencias.length > 0) {
          resultados.advertencias.push(...validationResult.advertencias);
        }
        
        if (validationResult.informacion.length > 0) {
          resultados.informacion.push(...validationResult.informacion);
        }
        
      } catch (error) {
        resultados.errores.push({
          campo: fieldName,
          tipo: 'validation_error',
          mensaje: `Error validando campo: ${error.message}`,
          severidad: 'error'
        });
      }
    }

    return resultados;
  }

  /**
   * Validar un campo individual
   */
  validateField(fieldName, value, fieldSchema, strictMode = false) {
    const resultado = {
      errores: [],
      advertencias: [],
      informacion: []
    };

    // Validar campo requerido
    if (fieldSchema.required && (value === null || value === undefined || value === '')) {
      resultado.errores.push({
        campo: fieldName,
        tipo: 'required',
        mensaje: `Campo requerido: ${fieldName}`,
        severidad: 'error'
      });
      return resultado;
    }

    // Si el valor está vacío y no es requerido, no validar más
    if (value === null || value === undefined || value === '') {
      return resultado;
    }

    // Validar tipo de dato
    const typeValidation = this.validateType(fieldName, value, fieldSchema.type);
    if (!typeValidation.valid) {
      if (strictMode) {
        resultado.errores.push(typeValidation.error);
      } else {
        resultado.advertencias.push(typeValidation.error);
      }
    }

    // Validar longitud máxima
    if (fieldSchema.maxLength && value.toString().length > fieldSchema.maxLength) {
      resultado.advertencias.push({
        campo: fieldName,
        tipo: 'max_length',
        mensaje: `Valor excede longitud máxima (${fieldSchema.maxLength}): ${value.toString().length} caracteres`,
        severidad: 'warning'
      });
    }

    // Validar rango numérico
    if (fieldSchema.min !== undefined && typeof value === 'number' && value < fieldSchema.min) {
      resultado.errores.push({
        campo: fieldName,
        tipo: 'min_value',
        mensaje: `Valor menor al mínimo permitido (${fieldSchema.min}): ${value}`,
        severidad: 'error'
      });
    }

    if (fieldSchema.max !== undefined && typeof value === 'number' && value > fieldSchema.max) {
      resultado.errores.push({
        campo: fieldName,
        tipo: 'max_value',
        mensaje: `Valor mayor al máximo permitido (${fieldSchema.max}): ${value}`,
        severidad: 'error'
      });
    }

    // Validar valores enum
    if (fieldSchema.type === 'enum' && fieldSchema.values && !fieldSchema.values.includes(value)) {
      resultado.advertencias.push({
        campo: fieldName,
        tipo: 'invalid_enum',
        mensaje: `Valor no válido para ${fieldName}: "${value}". Valores permitidos: ${fieldSchema.values.join(', ')}`,
        severidad: 'warning',
        valores_permitidos: fieldSchema.values
      });
    }

    // Validar patrón (regex)
    if (fieldSchema.pattern && typeof value === 'string' && !fieldSchema.pattern.test(value)) {
      resultado.errores.push({
        campo: fieldName,
        tipo: 'pattern_mismatch',
        mensaje: `Formato inválido para ${fieldName}: "${value}"`,
        severidad: 'error'
      });
    }

    return resultado;
  }

  /**
   * Validar tipo de dato
   */
  validateType(fieldName, value, expectedType) {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            valid: false,
            error: {
              campo: fieldName,
              tipo: 'type_mismatch',
              mensaje: `Se esperaba string, recibido: ${typeof value}`,
              severidad: 'warning'
            }
          };
        }
        break;

      case 'integer':
        if (!Number.isInteger(Number(value))) {
          return {
            valid: false,
            error: {
              campo: fieldName,
              tipo: 'type_mismatch',
              mensaje: `Se esperaba entero, recibido: ${value}`,
              severidad: 'warning'
            }
          };
        }
        break;

      case 'decimal':
        if (isNaN(Number(value))) {
          return {
            valid: false,
            error: {
              campo: fieldName,
              tipo: 'type_mismatch',
              mensaje: `Se esperaba número decimal, recibido: ${value}`,
              severidad: 'warning'
            }
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            valid: false,
            error: {
              campo: fieldName,
              tipo: 'type_mismatch',
              mensaje: `Se esperaba booleano, recibido: ${typeof value}`,
              severidad: 'warning'
            }
          };
        }
        break;

      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return {
            valid: false,
            error: {
              campo: fieldName,
              tipo: 'type_mismatch',
              mensaje: `Se esperaba fecha válida, recibido: ${value}`,
              severidad: 'warning'
            }
          };
        }
        break;

      case 'enum':
        // La validación de enum se hace por separado
        break;

      default:
        return {
          valid: false,
          error: {
            campo: fieldName,
            tipo: 'unknown_type',
            mensaje: `Tipo de dato desconocido: ${expectedType}`,
            severidad: 'error'
          }
        };
    }

    return { valid: true };
  }

  /**
   * Obtener resumen del esquema
   */
  getSchemaInfo() {
    const info = {
      total_campos: Object.keys(this.schema).length,
      campos_requeridos: [],
      campos_opcionales: [],
      tipos_de_datos: {},
      campos_enum: {}
    };

    Object.entries(this.schema).forEach(([fieldName, fieldSchema]) => {
      if (fieldSchema.required) {
        info.campos_requeridos.push(fieldName);
      } else {
        info.campos_opcionales.push(fieldName);
      }

      // Contar tipos de datos
      const tipo = fieldSchema.type;
      if (!info.tipos_de_datos[tipo]) {
        info.tipos_de_datos[tipo] = 0;
      }
      info.tipos_de_datos[tipo]++;

      // Campos enum
      if (fieldSchema.type === 'enum') {
        info.campos_enum[fieldName] = fieldSchema.values;
      }
    });

    return info;
  }

  /**
   * Validar lote de registros
   */
  async validateBatch(records, options = {}) {
    const resultados = {
      errores_globales: [],
      advertencias_globales: [],
      validaciones_por_registro: {},
      estadisticas: {
        total_registros: records.length,
        registros_validos: 0,
        registros_con_errores: 0,
        registros_con_advertencias: 0
      }
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordId = record.temp_id || record.usuario_id || `registro_${i}`;

      try {
        const validacion = await this.validate(record, options);
        resultados.validaciones_por_registro[recordId] = validacion;

        // Acumular estadísticas
        if (validacion.errores.length === 0 && validacion.advertencias.length === 0) {
          resultados.estadisticas.registros_validos++;
        } else if (validacion.errores.length > 0) {
          resultados.estadisticas.registros_con_errores++;
        } else {
          resultados.estadisticas.registros_con_advertencias++;
        }

        // Acumular errores y advertencias globales
        resultados.errores_globales.push(...validacion.errores);
        resultados.advertencias_globales.push(...validacion.advertencias);

      } catch (error) {
        console.error(`Error validando registro ${recordId}:`, error.message);
        resultados.errores_globales.push({
          registro: recordId,
          tipo: 'validation_error',
          mensaje: `Error procesando registro: ${error.message}`,
          severidad: 'error'
        });
        resultados.estadisticas.registros_con_errores++;
      }
    }

    return resultados;
  }

  /**
   * Generar reporte de calidad de datos
   */
  generarReporteCalidad(resultados) {
    const reporte = {
      resumen: {
        score_calidad: this.calcularScoreCalidad(resultados.estadisticas),
        total_errores: resultados.errores_globales.length,
        total_advertencias: resultados.advertencias_globales.length,
        porcentaje_registros_validos: Math.round(
          (resultados.estadisticas.registros_validos / resultados.estadisticas.total_registros) * 100
        )
      },
      problemas_frecuentes: this.analizarProblemasFrecuentes(resultados.errores_globales),
      campos_problematicos: this.identificarCamposProblematicos(resultados.errores_globales, resultados.advertencias_globales),
      recomendaciones: []
    };

    // Generar recomendaciones
    reporte.recomendaciones = this.generarRecomendacionesCalidad(reporte);

    return reporte;
  }

  /**
   * Calcular score de calidad de datos
   */
  calcularScoreCalidad(estadisticas) {
    const { total_registros, registros_validos, registros_con_advertencias } = estadisticas;
    
    if (total_registros === 0) return 0;
    
    const scoreValidos = (registros_validos / total_registros) * 100;
    const scoreAdvertencias = (registros_con_advertencias / total_registros) * 50; // 50% de peso
    
    return Math.round(scoreValidos + scoreAdvertencias);
  }

  /**
   * Analizar problemas más frecuentes
   */
  analizarProblemasFrecuentes(errores) {
    const conteoProblemas = {};
    
    errores.forEach(error => {
      const clave = `${error.tipo}_${error.campo}`;
      if (!conteoProblemas[clave]) {
        conteoProblemas[clave] = {
          tipo: error.tipo,
          campo: error.campo,
          descripcion: error.mensaje,
          frecuencia: 0
        };
      }
      conteoProblemas[clave].frecuencia++;
    });
    
    return Object.values(conteoProblemas)
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, 10); // Top 10 problemas
  }

  /**
   * Identificar campos más problemáticos
   */
  identificarCamposProblematicos(errores, advertencias) {
    const conteoProblemas = {};
    
    [...errores, ...advertencias].forEach(problema => {
      if (problema.campo) {
        if (!conteoProblemas[problema.campo]) {
          conteoProblemas[problema.campo] = 0;
        }
        conteoProblemas[problema.campo]++;
      }
    });
    
    return Object.entries(conteoProblemas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([campo, frecuencia]) => ({ campo, frecuencia }));
  }

  /**
   * Generar recomendaciones de mejora
   */
  generarRecomendacionesCalidad(reporte) {
    const recomendaciones = [];
    
    // Recomendaciones basadas en score
    if (reporte.resumen.score_calidad < 70) {
      recomendaciones.push({
        tipo: 'calidad_datos',
        prioridad: 'alta',
        mensaje: 'Score de calidad de datos bajo detectado',
        accion: 'Revisar procesos de captura y validación de datos'
      });
    }
    
    // Recomendaciones basadas en problemas frecuentes
    reporte.problemas_frecuentes.forEach(problema => {
      if (problema.frecuencia > 10) {
        recomendaciones.push({
          tipo: 'problema_frecuente',
          prioridad: 'media',
          mensaje: `Problema recurrente en campo ${problema.campo}: ${problema.tipo}`,
          accion: `Implementar validación automática para ${problema.campo}`
        });
      }
    });
    
    // Recomendaciones basadas en campos problemáticos
    reporte.campos_problematicos.forEach(campo => {
      if (campo.frecuencia > 15) {
        recomendaciones.push({
          tipo: 'campo_problematico',
          prioridad: 'media',
          mensaje: `Campo ${campo.campo} presenta múltiples problemas`,
          accion: `Revisar definición y captura del campo ${campo.campo}`
        });
      }
    });
    
    return recomendaciones;
  }
}

module.exports = SchemaValidator;
