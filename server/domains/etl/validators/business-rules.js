/**
 * Validador de Reglas de Negocio - ETL Portal de Auditorías
 * Aplicación de reglas específicas del dominio de auditorías técnicas
 */

class BusinessRulesValidator {
  constructor() {
    this.rules = this.initializeBusinessRules();
  }

  /**
   * Inicializar reglas de negocio
   */
  initializeBusinessRules() {
    return [
      // Reglas de Hardware Mínimo
      {
        name: 'ram_minima_requirement',
        description: 'RAM mínima requerida según tipo de atención',
        validate: (record) => {
          const ramGb = record.ram_gb;
          const atencion = record.atencion;
          
          if (!ramGb || !atencion) return { valid: true };
          
          const requisitos = {
            'INBOUND': 4,
            'OUTBOUND': 4,
            'MIXTO': 6,
            'CHAT': 6,
            'EMAIL': 4,
            'SOPORTE': 8
          };
          
          const ramMinima = requisitos[atencion] || 4;
          
          if (ramGb < ramMinima) {
            return {
              valid: false,
              severity: 'error',
              message: `RAM insuficiente: ${ramGb}GB. Mínimo requerido para ${atencion}: ${ramMinima}GB`,
              field: 'ram_gb',
              suggested_action: `Upgrade de memoria a mínimo ${ramMinima}GB`
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'cpu_performance_requirement',
        description: 'Rendimiento mínimo de CPU',
        validate: (record) => {
          const cpuSpeed = record.cpu_speed_ghz;
          const cpuCores = record.cpu_cores;
          
          if (!cpuSpeed) return { valid: true };
          
          if (cpuSpeed < 2.0) {
            return {
              valid: false,
              severity: 'warning',
              message: `CPU por debajo del rendimiento recomendado: ${cpuSpeed}GHz. Mínimo recomendado: 2.0GHz`,
              field: 'cpu_speed_ghz',
              impact: 'Posible degradación de performance en aplicaciones'
            };
          }
          
          if (cpuCores && cpuCores < 2) {
            return {
              valid: false,
              severity: 'warning',
              message: `CPU de núcleo único detectada. Recomendado: mínimo 2 núcleos`,
              field: 'cpu_cores',
              impact: 'Multitarea limitada'
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'os_compatibility',
        description: 'Compatibilidad de sistema operativo',
        validate: (record) => {
          const osName = record.os_name;
          
          if (!osName) {
            return {
              valid: false,
              severity: 'error',
              message: 'Sistema operativo no especificado',
              field: 'os_name',
              suggested_action: 'Verificar y documentar SO instalado'
            };
          }
          
          const osesNoSoportados = ['Windows 7', 'Windows 8', 'Windows XP'];
          const osDeprecados = ['Windows 8.1'];
          
          if (osesNoSoportados.some(os => osName.includes(os))) {
            return {
              valid: false,
              severity: 'error',
              message: `Sistema operativo no soportado: ${osName}`,
              field: 'os_name',
              suggested_action: 'Actualización obligatoria a Windows 10 o superior'
            };
          }
          
          if (osDeprecados.some(os => osName.includes(os))) {
            return {
              valid: false,
              severity: 'warning',
              message: `Sistema operativo en fase de deprecación: ${osName}`,
              field: 'os_name',
              suggested_action: 'Planificar actualización a Windows 10 o superior'
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'browser_compatibility',
        description: 'Compatibilidad de navegador',
        validate: (record) => {
          const browserName = record.browser_name;
          const browserVersion = record.browser_version;
          
          if (!browserName) {
            return {
              valid: false,
              severity: 'warning',
              message: 'Navegador no especificado',
              field: 'browser_name',
              suggested_action: 'Documentar navegador principal utilizado'
            };
          }
          
          if (browserName === 'Internet Explorer') {
            return {
              valid: false,
              severity: 'error',
              message: 'Internet Explorer no es compatible con aplicaciones modernas',
              field: 'browser_name',
              suggested_action: 'Migrar a Chrome, Firefox o Edge'
            };
          }
          
          const versionesMinimas = {
            'Chrome': 90,
            'Firefox': 88,
            'Edge': 90,
            'Safari': 14
          };
          
          if (browserVersion && versionesMinimas[browserName]) {
            const version = parseInt(browserVersion);
            const minima = versionesMinimas[browserName];
            
            if (version < minima) {
              return {
                valid: false,
                severity: 'warning',
                message: `Versión de ${browserName} desactualizada: v${version}. Mínima recomendada: v${minima}`,
                field: 'browser_version',
                suggested_action: `Actualizar ${browserName} a la última versión`
              };
            }
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'antivirus_requirement',
        description: 'Antivirus instalado y actualizado',
        validate: (record) => {
          const antivirusBrand = record.antivirus_brand;
          const antivirusUpdated = record.antivirus_updated;
          
          if (!antivirusBrand || antivirusBrand.trim() === '') {
            return {
              valid: false,
              severity: 'error',
              message: 'No se detectó antivirus instalado',
              field: 'antivirus_brand',
              suggested_action: 'Instalar solución antivirus corporativa'
            };
          }
          
          const antivirusBasicos = ['Windows Defender'];
          if (antivirusBasicos.includes(antivirusBrand)) {
            return {
              valid: false,
              severity: 'info',
              message: `Antivirus básico detectado: ${antivirusBrand}`,
              field: 'antivirus_brand',
              suggested_action: 'Considerar solución antivirus empresarial'
            };
          }
          
          if (antivirusUpdated === false) {
            return {
              valid: false,
              severity: 'warning',
              message: 'Antivirus no está actualizado',
              field: 'antivirus_updated',
              suggested_action: 'Actualizar definiciones de antivirus'
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'connectivity_requirement',
        description: 'Requisitos mínimos de conectividad',
        validate: (record) => {
          const speedDownload = record.speed_download_mbps;
          const speedUpload = record.speed_upload_mbps;
          const atencion = record.atencion;
          
          if (!speedDownload || !speedUpload) {
            return {
              valid: false,
              severity: 'warning',
              message: 'Velocidades de internet no especificadas',
              field: 'speed_download_mbps',
              suggested_action: 'Realizar test de velocidad y documentar'
            };
          }
          
          const requisitos = {
            'INBOUND': { download: 10, upload: 5 },
            'OUTBOUND': { download: 10, upload: 5 },
            'MIXTO': { download: 15, upload: 8 },
            'CHAT': { download: 20, upload: 10 },
            'EMAIL': { download: 10, upload: 5 },
            'SOPORTE': { download: 25, upload: 15 }
          };
          
          const req = requisitos[atencion] || { download: 10, upload: 5 };
          
          if (speedDownload < req.download) {
            return {
              valid: false,
              severity: 'error',
              message: `Velocidad de descarga insuficiente: ${speedDownload}Mbps. Mínimo para ${atencion}: ${req.download}Mbps`,
              field: 'speed_download_mbps',
              suggested_action: `Upgrade de plan de internet a mínimo ${req.download}Mbps bajada`
            };
          }
          
          if (speedUpload < req.upload) {
            return {
              valid: false,
              severity: 'error',
              message: `Velocidad de subida insuficiente: ${speedUpload}Mbps. Mínimo para ${atencion}: ${req.upload}Mbps`,
              field: 'speed_upload_mbps',
              suggested_action: `Upgrade de plan de internet a mínimo ${req.upload}Mbps subida`
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'disk_space_requirement',
        description: 'Espacio en disco suficiente',
        validate: (record) => {
          const diskCapacity = record.disk_capacity_gb;
          const diskType = record.disk_type;
          
          if (!diskCapacity) return { valid: true };
          
          if (diskCapacity < 100) {
            return {
              valid: false,
              severity: 'error',
              message: `Capacidad de disco insuficiente: ${diskCapacity}GB. Mínimo requerido: 100GB`,
              field: 'disk_capacity_gb',
              suggested_action: 'Upgrade de almacenamiento'
            };
          }
          
          if (diskType === 'HDD' && diskCapacity < 250) {
            return {
              valid: false,
              severity: 'warning',
              message: `Disco mecánico con capacidad limitada: ${diskCapacity}GB. Recomendado: migrar a SSD`,
              field: 'disk_type',
              suggested_action: 'Considerar migración a SSD para mejor performance'
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'headset_requirement',
        description: 'Equipo de audio requerido',
        validate: (record) => {
          const headsetBrand = record.headset_brand;
          const atencion = record.atencion;
          
          const tiposQueRequierenAudio = ['INBOUND', 'OUTBOUND', 'MIXTO', 'SOPORTE'];
          
          if (tiposQueRequierenAudio.includes(atencion) && (!headsetBrand || headsetBrand.trim() === '')) {
            return {
              valid: false,
              severity: 'error',
              message: `Diadema/headset requerido para tipo de atención: ${atencion}`,
              field: 'headset_brand',
              suggested_action: 'Proveer equipo de audio profesional'
            };
          }
          
          return { valid: true };
        }
      },
      
      {
        name: 'data_completeness',
        description: 'Completitud de datos básicos',
        validate: (record) => {
          const camposRequeridos = ['usuario_id', 'proveedor', 'sitio', 'atencion'];
          const camposFaltantes = [];
          
          camposRequeridos.forEach(campo => {
            if (!record[campo] || record[campo].toString().trim() === '') {
              camposFaltantes.push(campo);
            }
          });
          
          if (camposFaltantes.length > 0) {
            return {
              valid: false,
              severity: 'error',
              message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`,
              field: camposFaltantes[0],
              suggested_action: 'Completar información básica del registro'
            };
          }
          
          return { valid: true };
        }
      }
    ];
  }

  /**
   * Validar un registro contra todas las reglas de negocio
   */
  async validate(record, options = {}) {
    const resultados = {
      errores: [],
      advertencias: [],
      informacion: [],
      scoreValidacion: 100
    };

    const { skip_validation = [] } = options;

    for (const rule of this.rules) {
      // Saltar reglas específicas si están en la lista de exclusión
      if (skip_validation.includes(rule.name)) {
        continue;
      }

      try {
        const resultado = rule.validate(record);
        
        if (!resultado.valid) {
          const detalle = {
            regla: rule.name,
            descripcion: rule.description,
            campo: resultado.field,
            mensaje: resultado.message,
            severidad: resultado.severity,
            accion_sugerida: resultado.suggested_action,
            impacto: resultado.impact
          };

          switch (resultado.severity) {
            case 'error':
              resultados.errores.push(detalle);
              resultados.scoreValidacion -= 15;
              break;
            case 'warning':
              resultados.advertencias.push(detalle);
              resultados.scoreValidacion -= 5;
              break;
            case 'info':
              resultados.informacion.push(detalle);
              break;
          }
        }
      } catch (error) {
        console.error(`Error ejecutando regla ${rule.name}:`, error.message);
        resultados.advertencias.push({
          regla: rule.name,
          descripcion: 'Error en validación',
          mensaje: `Error interno validando: ${error.message}`,
          severidad: 'warning'
        });
      }
    }

    // Asegurar que el score no sea negativo
    resultados.scoreValidacion = Math.max(0, resultados.scoreValidacion);

    return resultados;
  }

  /**
   * Obtener lista de reglas disponibles
   */
  getRulesInfo() {
    return this.rules.map(rule => ({
      name: rule.name,
      description: rule.description
    }));
  }

  /**
   * Validar lote de registros
   */
  async validateBatch(records, options = {}) {
    const resultadosGlobales = {
      errores: [],
      advertencias: [],
      informacion: [],
      erroresPorRegistro: {},
      advertenciasPorRegistro: {},
      scorePromedio: 0
    };

    let scoreTotal = 0;
    let registrosProcesados = 0;

    for (const record of records) {
      try {
        const resultadoRegistro = await this.validate(record, options);
        
        // Acumular errores globales
        resultadosGlobales.errores.push(...resultadoRegistro.errores);
        resultadosGlobales.advertencias.push(...resultadoRegistro.advertencias);
        resultadosGlobales.informacion.push(...resultadoRegistro.informacion);
        
        // Errores por registro
        if (resultadoRegistro.errores.length > 0) {
          resultadosGlobales.erroresPorRegistro[record.temp_id || record.usuario_id] = resultadoRegistro.errores;
        }
        
        if (resultadoRegistro.advertencias.length > 0) {
          resultadosGlobales.advertenciasPorRegistro[record.temp_id || record.usuario_id] = resultadoRegistro.advertencias;
        }
        
        scoreTotal += resultadoRegistro.scoreValidacion;
        registrosProcesados++;
        
      } catch (error) {
        console.error(`Error validando registro:`, error.message);
        resultadosGlobales.errores.push({
          regla: 'validation_error',
          mensaje: `Error procesando registro: ${error.message}`,
          severidad: 'error'
        });
      }
    }

    // Calcular score promedio
    resultadosGlobales.scorePromedio = registrosProcesados > 0 
      ? Math.round(scoreTotal / registrosProcesados)
      : 0;

    return resultadosGlobales;
  }

  /**
   * Generar reporte de validación
   */
  generarReporte(resultados) {
    const reporte = {
      resumen: {
        total_errores: resultados.errores.length,
        total_advertencias: resultados.advertencias.length,
        total_informacion: resultados.informacion.length,
        score_promedio: resultados.scorePromedio || resultados.scoreValidacion
      },
      errores_por_regla: {},
      advertencias_por_regla: {},
      campos_problematicos: {},
      recomendaciones: []
    };

    // Agrupar errores por regla
    resultados.errores.forEach(error => {
      const regla = error.regla;
      if (!reporte.errores_por_regla[regla]) {
        reporte.errores_por_regla[regla] = [];
      }
      reporte.errores_por_regla[regla].push(error);
    });

    // Agrupar advertencias por regla
    resultados.advertencias.forEach(advertencia => {
      const regla = advertencia.regla;
      if (!reporte.advertencias_por_regla[regla]) {
        reporte.advertencias_por_regla[regla] = [];
      }
      reporte.advertencias_por_regla[regla].push(advertencia);
    });

    // Identificar campos problemáticos
    [...resultados.errores, ...resultados.advertencias].forEach(item => {
      if (item.campo) {
        if (!reporte.campos_problematicos[item.campo]) {
          reporte.campos_problematicos[item.campo] = 0;
        }
        reporte.campos_problematicos[item.campo]++;
      }
    });

    // Generar recomendaciones
    reporte.recomendaciones = this.generarRecomendaciones(reporte);

    return reporte;
  }

  /**
   * Generar recomendaciones basadas en errores frecuentes
   */
  generarRecomendaciones(reporte) {
    const recomendaciones = [];

    // Recomendaciones basadas en errores frecuentes
    Object.entries(reporte.errores_por_regla).forEach(([regla, errores]) => {
      if (errores.length > 5) {
        switch (regla) {
          case 'ram_minima_requirement':
            recomendaciones.push({
              tipo: 'hardware',
              prioridad: 'alta',
              mensaje: 'Múltiples equipos con RAM insuficiente detectados',
              accion: 'Implementar plan de upgrade masivo de memoria RAM'
            });
            break;
          case 'os_compatibility':
            recomendaciones.push({
              tipo: 'software',
              prioridad: 'crítica',
              mensaje: 'Sistemas operativos obsoletos detectados',
              accion: 'Migración urgente a sistemas operativos soportados'
            });
            break;
          case 'connectivity_requirement':
            recomendaciones.push({
              tipo: 'infraestructura',
              prioridad: 'alta',
              mensaje: 'Problemas de conectividad generalizados',
              accion: 'Revisar planes de internet y proveedores ISP'
            });
            break;
        }
      }
    });

    return recomendaciones;
  }
}

module.exports = BusinessRulesValidator;
