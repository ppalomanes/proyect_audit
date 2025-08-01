/**
 * Job BullMQ - Procesamiento de Archivos Excel para Parque Informático
 * Portal de Auditorías Técnicas
 */

const ExcelJS = require('exceljs');
const path = require('path');
const { cache } = require('../../config/redis');

// Esquema normalizado de 28 campos
const ESQUEMA_NORMALIZADO = {
  audit_id: { tipo: 'string', requerido: true },
  proveedor: { tipo: 'string', requerido: true },
  sitio: { tipo: 'string', requerido: true },
  atencion: { tipo: 'string', requerido: true },
  usuario_id: { tipo: 'string', requerido: true },
  cpu_brand: { tipo: 'string', valores: ['Intel', 'AMD'] },
  cpu_model: { tipo: 'string', requerido: true },
  cpu_speed_ghz: { tipo: 'float', min: 1.0, max: 6.0 },
  ram_gb: { tipo: 'integer', min: 2, max: 128 },
  disk_type: { tipo: 'string', valores: ['HDD', 'SSD', 'NVME'] },
  disk_capacity_gb: { tipo: 'integer', min: 100 },
  os_name: { tipo: 'string', valores: ['Windows 10', 'Windows 11', 'Linux'] },
  os_version: { tipo: 'string', requerido: true },
  browser_name: { tipo: 'string', valores: ['Chrome', 'Firefox', 'Edge'] },
  browser_version: { tipo: 'string', requerido: true },
  antivirus_brand: { tipo: 'string', requerido: true },
  antivirus_model: { tipo: 'string', requerido: true },
  headset_brand: { tipo: 'string', requerido: true },
  headset_model: { tipo: 'string', requerido: true },
  isp_name: { tipo: 'string', requerido: true },
  connection_type: { tipo: 'string', valores: ['Fibra', 'Cable', 'DSL'] },
  speed_download_mbps: { tipo: 'integer', min: 10 },
  speed_upload_mbps: { tipo: 'integer', min: 5 }
};

// Reglas de validación del pliego técnico
const REGLAS_VALIDACION = {
  ram_minima_gb: 16,
  disco_minimo: { tipo: 'SSD', capacidad: 500 },
  os_soportados: ['Windows 11'],
  velocidad_ho: { download: 15, upload: 6 }
};

/**
 * Job principal de procesamiento Excel
 */
async function processExcelJob(job) {
  const { filePath, auditoria_id, configuracion = {} } = job.data;

  try {
    console.log(`🔄 Iniciando procesamiento ETL job ${job.id}`);
    
    // Etapa 1: Cargar archivo (20% progreso)
    await job.updateProgress(20);
    const workbook = await cargarArchivo(filePath);
    
    // Etapa 2: Detectar estructura (40% progreso)
    await job.updateProgress(40);
    const datosRaw = await detectarYMapearCampos(workbook);
    
    // Etapa 3: Normalizar datos (60% progreso)  
    await job.updateProgress(60);
    const datosNormalizados = await normalizarDatos(datosRaw, auditoria_id);
    
    // Etapa 4: Validar según reglas (80% progreso)
    await job.updateProgress(80);
    const resultadosValidacion = await validarReglasDenegocio(datosNormalizados);
    
    // Etapa 5: Calcular scoring (90% progreso)
    await job.updateProgress(90);
    const datosConScore = await calcularScoringCalidad(datosNormalizados, resultadosValidacion);
    
    // Etapa 6: Guardar resultados (100% progreso)
    await job.updateProgress(100);
    const resultado = await guardarResultados(job.id, {
      datos_procesados: datosConScore,
      estadisticas: calcularEstadisticas(datosConScore, resultadosValidacion),
      validaciones: resultadosValidacion
    });

    console.log(`✅ Job ETL ${job.id} completado exitosamente`);
    return resultado;

  } catch (error) {
    console.error(`❌ Error en job ETL ${job.id}:`, error.message);
    throw error;
  }
}

async function cargarArchivo(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log(`📄 Archivo Excel cargado: ${path.basename(filePath)}`);
  return workbook;
}

async function detectarYMapearCampos(workbook) {
  const worksheet = workbook.worksheets[0];
  const datos = [];
  const headers = [];
  let headerRow = null;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      headerRow = rowNumber;
      row.eachCell((cell, colNumber) => {
        if (cell.value) {
          headers[colNumber] = String(cell.value).trim().toLowerCase();
        }
      });
    } else if (headerRow !== null && rowNumber > headerRow) {
      const fila = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          fila[header] = cell.value;
        }
      });
      
      if (Object.keys(fila).length > 0) {
        datos.push(fila);
      }
    }
  });

  console.log(`📊 Headers detectados: ${Object.values(headers).filter(h => h).length}`);
  console.log(`📋 Registros encontrados: ${datos.length}`);

  return { headers: Object.values(headers).filter(h => h), datos };
}

async function normalizarDatos(datosRaw, auditoria_id) {
  const datosNormalizados = [];
  const mapeoHeaders = crearMapeoHeaders(datosRaw.headers);

  for (let i = 0; i < datosRaw.datos.length; i++) {
    const filaRaw = datosRaw.datos[i];
    const filaNormalizada = {
      audit_id: auditoria_id,
      usuario_id: filaRaw[mapeoHeaders.usuario_id] || `user_${i + 1}`,
      proveedor: extraerValor(filaRaw, mapeoHeaders.proveedor),
      sitio: extraerValor(filaRaw, mapeoHeaders.sitio),
      atencion: normalizarAtencion(extraerValor(filaRaw, mapeoHeaders.atencion)),
      cpu_brand: normalizarCPUBrand(extraerValor(filaRaw, mapeoHeaders.cpu_brand)),
      cpu_model: extraerValor(filaRaw, mapeoHeaders.cpu_model),
      cpu_speed_ghz: normalizarVelocidadCPU(extraerValor(filaRaw, mapeoHeaders.cpu_speed)),
      ram_gb: normalizarRAM(extraerValor(filaRaw, mapeoHeaders.ram)),
      disk_type: normalizarTipoDisco(extraerValor(filaRaw, mapeoHeaders.disk_type)),
      disk_capacity_gb: normalizarCapacidadDisco(extraerValor(filaRaw, mapeoHeaders.disk_capacity)),
      os_name: normalizarOS(extraerValor(filaRaw, mapeoHeaders.os_name)),
      os_version: extraerValor(filaRaw, mapeoHeaders.os_version),
      browser_name: normalizarBrowser(extraerValor(filaRaw, mapeoHeaders.browser_name)),
      browser_version: extraerValor(filaRaw, mapeoHeaders.browser_version),
      antivirus_brand: extraerValor(filaRaw, mapeoHeaders.antivirus_brand),
      antivirus_model: extraerValor(filaRaw, mapeoHeaders.antivirus_model),
      headset_brand: extraerValor(filaRaw, mapeoHeaders.headset_brand),
      headset_model: extraerValor(filaRaw, mapeoHeaders.headset_model),
      isp_name: extraerValor(filaRaw, mapeoHeaders.isp_name),
      connection_type: normalizarTipoConexion(extraerValor(filaRaw, mapeoHeaders.connection_type)),
      speed_download_mbps: normalizarVelocidad(extraerValor(filaRaw, mapeoHeaders.speed_download)),
      speed_upload_mbps: normalizarVelocidad(extraerValor(filaRaw, mapeoHeaders.speed_upload))
    };

    datosNormalizados.push(filaNormalizada);
  }

  console.log(`🔄 ${datosNormalizados.length} registros normalizados`);
  return datosNormalizados;
}

function crearMapeoHeaders(headers) {
  const mapeo = {};
  const patrones = {
    proveedor: /proveedor|empresa|company/i,
    sitio: /sitio|site|centro|location/i,
    atencion: /atencion|type|modalidad|home.*office|ho|os/i,
    usuario_id: /usuario|user.*id|id.*usuario|empleado/i,
    cpu_brand: /cpu.*brand|marca.*cpu|procesador.*marca/i,
    cpu_model: /cpu.*model|modelo.*cpu|procesador.*modelo/i,
    cpu_speed: /cpu.*speed|velocidad.*cpu|ghz|frequency/i,
    ram: /ram|memoria|memory/i,
    disk_type: /disk.*type|tipo.*disco|storage.*type/i,
    disk_capacity: /disk.*capacity|capacidad.*disco|storage.*size/i,
    os_name: /os|sistema.*operativo|operating.*system|windows|linux/i,
    os_version: /os.*version|version.*os|sistema.*version/i,
    browser_name: /browser|navegador|chrome|firefox|edge/i,
    browser_version: /browser.*version|version.*browser/i,
    antivirus_brand: /antivirus.*brand|marca.*antivirus/i,
    antivirus_model: /antivirus.*model|modelo.*antivirus/i,
    headset_brand: /headset.*brand|marca.*headset|diadema.*marca/i,
    headset_model: /headset.*model|modelo.*headset|diadema.*modelo/i,
    isp_name: /isp|internet.*provider|proveedor.*internet/i,
    connection_type: /connection.*type|tipo.*conexion|fibra|cable|dsl/i,
    speed_download: /download.*speed|velocidad.*bajada|down.*speed/i,
    speed_upload: /upload.*speed|velocidad.*subida|up.*speed/i
  };

  headers.forEach(header => {
    for (const [campo, patron] of Object.entries(patrones)) {
      if (patron.test(header)) {
        mapeo[campo] = header;
        break;
      }
    }
  });

  return mapeo;
}

function extraerValor(fila, headerMapeado) {
  if (!headerMapeado || !fila[headerMapeado]) return null;
  const valor = fila[headerMapeado];
  return typeof valor === 'string' ? valor.trim() : valor;
}

function normalizarAtencion(valor) {
  if (!valor) return null;
  const valorLower = String(valor).toLowerCase();
  if (valorLower.includes('home') || valorLower.includes('ho')) return 'HO';
  if (valorLower.includes('site') || valorLower.includes('os')) return 'OS';
  return valor;
}

function normalizarCPUBrand(valor) {
  if (!valor) return null;
  const valorLower = String(valor).toLowerCase();
  if (valorLower.includes('intel')) return 'Intel';
  if (valorLower.includes('amd')) return 'AMD';
  return valor;
}

function normalizarVelocidadCPU(valor) {
  if (!valor) return null;
  const match = String(valor).match(/(\d+\.?\d*)\s*(ghz|mhz)?/i);
  if (match) {
    const numero = parseFloat(match[1]);
    const unidad = (match[2] || 'ghz').toLowerCase();
    return unidad === 'mhz' ? numero / 1000 : numero;
  }
  return null;
}

function normalizarRAM(valor) {
  if (!valor) return null;
  const match = String(valor).match(/(\d+)\s*(gb|mb)?/i);
  if (match) {
    const numero = parseInt(match[1]);
    const unidad = (match[2] || 'gb').toLowerCase();
    return unidad === 'mb' ? Math.round(numero / 1024) : numero;
  }
  return null;
}

function normalizarTipoDisco(valor) {
  if (!valor) return null;
  const valorLower = String(valor).toLowerCase();
  if (valorLower.includes('ssd')) return 'SSD';
  if (valorLower.includes('nvme')) return 'NVME';
  if (valorLower.includes('hdd')) return 'HDD';
  return valor;
}

function normalizarCapacidadDisco(valor) {
  if (!valor) return null;
  const match = String(valor).match(/(\d+\.?\d*)\s*(gb|tb|mb)?/i);
  if (match) {
    const numero = parseFloat(match[1]);
    const unidad = (match[2] || 'gb').toLowerCase();
    switch (unidad) {
      case 'tb': return Math.round(numero * 1024);
      case 'mb': return Math.round(numero / 1024);
      default: return Math.round(numero);
    }
  }
  return null;
}

function normalizarOS(valor) {
  if (!valor) return null;
  const valorLower = String(valor).toLowerCase();
  if (valorLower.includes('windows 11')) return 'Windows 11';
  if (valorLower.includes('windows 10')) return 'Windows 10';
  if (valorLower.includes('linux') || valorLower.includes('ubuntu')) return 'Linux';
  return valor;
}

function normalizarBrowser(valor) {
  if (!valor) return null;
  const valorLower = String(valor).toLowerCase();
  if (valorLower.includes('chrome')) return 'Chrome';
  if (valorLower.includes('firefox')) return 'Firefox';
  if (valorLower.includes('edge')) return 'Edge';
  return valor;
}

function normalizarTipoConexion(valor) {
  if (!valor) return null;
  const valorLower = String(valor).toLowerCase();
  if (valorLower.includes('fibra')) return 'Fibra';
  if (valorLower.includes('cable')) return 'Cable';
  if (valorLower.includes('dsl')) return 'DSL';
  return valor;
}

function normalizarVelocidad(valor) {
  if (!valor) return null;
  const match = String(valor).match(/(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

async function validarReglasDenegocio(datosNormalizados) {
  const resultados = [];
  
  for (const registro of datosNormalizados) {
    const validacion = {
      usuario_id: registro.usuario_id,
      errores: [],
      advertencias: [],
      score_validacion: 100
    };
    
    // Validar RAM
    if (!registro.ram_gb || registro.ram_gb < REGLAS_VALIDACION.ram_minima_gb) {
      validacion.errores.push({
        campo: 'ram',
        mensaje: 'RAM insuficiente',
        valor_actual: `${registro.ram_gb || 0}GB`,
        valor_requerido: `${REGLAS_VALIDACION.ram_minima_gb}GB minimo`
      });
      validacion.score_validacion -= 20;
    }
    
    // Validar disco
    if (registro.disk_type !== 'SSD' || 
        !registro.disk_capacity_gb || 
        registro.disk_capacity_gb < REGLAS_VALIDACION.disco_minimo.capacidad) {
      validacion.errores.push({
        campo: 'disco',
        mensaje: 'Disco no cumple especificaciones',
        valor_actual: `${registro.disk_type} ${registro.disk_capacity_gb}GB`,
        valor_requerido: `SSD ${REGLAS_VALIDACION.disco_minimo.capacidad}GB minimo`
      });
      validacion.score_validacion -= 15;
    }
    
    // Validar OS
    if (!REGLAS_VALIDACION.os_soportados.includes(registro.os_name)) {
      validacion.errores.push({
        campo: 'os',
        mensaje: 'Sistema operativo no soportado',
        valor_actual: registro.os_name,
        valor_requerido: REGLAS_VALIDACION.os_soportados.join(' o ')
      });
      validacion.score_validacion -= 10;
    }
    
    // Validar velocidad para Home Office
    if (registro.atencion === 'HO') {
      if (!registro.speed_download_mbps || 
          registro.speed_download_mbps < REGLAS_VALIDACION.velocidad_ho.download) {
        validacion.errores.push({
          campo: 'velocidad_download',
          mensaje: 'Velocidad de bajada insuficiente para Home Office',
          valor_actual: `${registro.speed_download_mbps || 0}Mbps`,
          valor_requerido: `${REGLAS_VALIDACION.velocidad_ho.download}Mbps minimo`
        });
        validacion.score_validacion -= 10;
      }
    }
    
    validacion.score_validacion = Math.max(0, validacion.score_validacion);
    resultados.push(validacion);
  }
  
  console.log(`✅ Validaciones completadas: ${resultados.length} registros`);
  return resultados;
}

async function calcularScoringCalidad(datosNormalizados, resultadosValidacion) {
  const datosConScore = datosNormalizados.map((registro, index) => {
    const validacion = resultadosValidacion[index];
    
    const camposRequeridos = Object.entries(ESQUEMA_NORMALIZADO)
      .filter(([campo, config]) => config.requerido);
    
    const camposCompletos = camposRequeridos.filter(([campo]) => 
      registro[campo] && registro[campo] !== ''
    ).length;
    
    const scoreCompletitud = (camposCompletos / camposRequeridos.length) * 50;
    const scoreValidacion = (validacion.score_validacion / 100) * 50;
    const scoreTotal = Math.round(scoreCompletitud + scoreValidacion);
    
    return {
      ...registro,
      score_calidad: scoreTotal,
      validaciones: validacion
    };
  });
  
  console.log(`📊 Scoring de calidad calculado para ${datosConScore.length} registros`);
  return datosConScore;
}

async function guardarResultados(jobId, resultados) {
  try {
    await cache.setETLResult(jobId, resultados);
    console.log(`💾 Resultados ETL guardados en cache: job ${jobId}`);
    return {
      job_id: jobId,
      estado: 'COMPLETADO',
      timestamp: new Date().toISOString(),
      ...resultados
    };
  } catch (error) {
    console.error('❌ Error guardando resultados:', error.message);
    throw error;
  }
}

function calcularEstadisticas(datosConScore, resultadosValidacion) {
  const total = datosConScore.length;
  const conErrores = resultadosValidacion.filter(r => r.errores.length > 0).length;
  const scorePromedio = datosConScore.reduce((sum, item) => sum + item.score_calidad, 0) / total;
  
  return {
    total_registros: total,
    registros_validos: total - conErrores,
    registros_con_errores: conErrores,
    score_calidad_promedio: Math.round(scorePromedio * 100) / 100,
    tasa_exito: Math.round(((total - conErrores) / total) * 100 * 100) / 100
  };
}

module.exports = processExcelJob;