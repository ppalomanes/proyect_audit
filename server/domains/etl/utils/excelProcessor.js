// /server/domains/etl/utils/excelProcessor.js
// Portal de Auditorías Técnicas - Procesamiento Avanzado de Excel
// Integrado desde normalizador-procesadores con umbrales específicos del Portal

const XLSX = require('xlsx');
const { normalizeProcessor } = require('./processorNormalizer');
const { normalizeRAM, validateRAM, normalizeStorage, validateStorage } = require('./hardwareNormalizer');

/**
 * Procesa un archivo Excel con información de parque informático
 * @param {Buffer} excelBuffer - Buffer del archivo Excel
 * @param {Object} auditData - Datos de la auditoría
 * @returns {Object} Objeto con datos normalizados y estadísticas
 */
const processExcelFile = async (excelBuffer, auditData = {}) => {
  try {
    // Leer el excel con opciones completas
    const workbook = XLSX.read(excelBuffer, {
      type: "buffer",
      cellStyles: true,
      cellFormulas: true,
      cellDates: true,
      cellNF: true,
      sheetStubs: true,
    });

    // Tomar la primera hoja
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convertir a JSON manteniendo los encabezados
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });

    if (!jsonData || jsonData.length === 0) {
      throw new Error(
        "El archivo no contiene datos o tiene un formato incorrecto."
      );
    }

    // Buscar columnas automáticamente
    const columnMapping = findColumns(jsonData[0]);

    if (!columnMapping.processorKey) {
      throw new Error(
        "No se pudo identificar una columna de procesador en el archivo. " +
        "Asegúrese de que exista una columna con un nombre que contenga 'procesador', 'processor' o 'cpu'."
      );
    }

    console.log('Columnas detectadas:', columnMapping);

    // Procesar cada fila
    const normalizedData = await Promise.all(
      jsonData.map(async (row, index) => {
        return await processRow(row, columnMapping, auditData, index);
      })
    );

    // Generar estadísticas completas
    const stats = generateStatistics(normalizedData);

    // Generar metadatos de auditoría
    const auditMetadata = {
      audit_id: auditData.audit_id || `AUDIT_${Date.now()}`,
      audit_date: new Date().toISOString().split('T')[0],
      audit_cycle: auditData.audit_cycle || generateAuditCycle(),
      audit_version: auditData.audit_version || 1,
    };

    return {
      normalizedData,
      stats,
      auditMetadata,
      columnMapping,
      totalRows: normalizedData.length,
    };

  } catch (error) {
    console.error("Error procesando el archivo:", error);
    throw new Error(`Error al procesar el archivo Excel: ${error.message}`);
  }
};

/**
 * Busca columnas automáticamente en el archivo Excel
 */
const findColumns = (firstRow) => {
  const columnMapping = {
    // Identificación
    proveedorKey: null,
    sitioKey: null,
    atencionKey: null,
    usuarioKey: null,
    hostnameKey: null,
    
    // Hardware
    processorKey: null,
    ramKey: null,
    storageKey: null,
    
    // Software
    osKey: null,
    browserKey: null,
    antivirusKey: null,
    
    // Periféricos
    headsetKey: null,
    
    // Conectividad
    ispKey: null,
    connectionTypeKey: null,
    speedDownKey: null,
    speedUpKey: null,
  };

  Object.keys(firstRow).forEach(key => {
    if (!key || typeof key !== "string") return;
    
    const lowerKey = key.toLowerCase();

    // Identificación
    if (['proveedor', 'provider', 'supplier'].some(name => lowerKey.includes(name))) {
      columnMapping.proveedorKey = key;
    }
    if (['sitio', 'site', 'location'].some(name => lowerKey.includes(name))) {
      columnMapping.sitioKey = key;
    }
    if (['atencion', 'atención', 'attention', 'tipo'].some(name => lowerKey.includes(name))) {
      columnMapping.atencionKey = key;
    }
    if (['usuario', 'user', 'id'].some(name => lowerKey.includes(name))) {
      columnMapping.usuarioKey = key;
    }
    if (['hostname', 'host', 'equipo', 'pc'].some(name => lowerKey.includes(name))) {
      columnMapping.hostnameKey = key;
    }
    
    // Hardware
    if (['procesador', 'processor', 'cpu', 'micro'].some(name => lowerKey.includes(name))) {
      columnMapping.processorKey = key;
    }
    if (['ram', 'memoria', 'memory'].some(name => lowerKey.includes(name))) {
      columnMapping.ramKey = key;
    }
    if (['disco', 'disk', 'hdd', 'ssd', 'storage', 'almacenamiento'].some(name => lowerKey.includes(name))) {
      columnMapping.storageKey = key;
    }
    
    // Software
    if (['sistema', 'os', 'operativo', 'operating'].some(name => lowerKey.includes(name))) {
      columnMapping.osKey = key;
    }
    if (['navegador', 'browser', 'explorador'].some(name => lowerKey.includes(name))) {
      columnMapping.browserKey = key;
    }
    if (['antivirus', 'av', 'seguridad'].some(name => lowerKey.includes(name))) {
      columnMapping.antivirusKey = key;
    }
    
    // Periféricos
    if (['headset', 'diadema', 'auricular', 'audio'].some(name => lowerKey.includes(name))) {
      columnMapping.headsetKey = key;
    }
    
    // Conectividad
    if (['isp', 'proveedor', 'internet'].some(name => lowerKey.includes(name)) && !columnMapping.proveedorKey) {
      columnMapping.ispKey = key;
    }
    if (['conexion', 'connection', 'tipo'].some(name => lowerKey.includes(name)) && !columnMapping.atencionKey) {
      columnMapping.connectionTypeKey = key;
    }
    if (['velocidad', 'speed', 'down', 'bajada'].some(name => lowerKey.includes(name))) {
      columnMapping.speedDownKey = key;
    }
    if (['velocidad', 'speed', 'up', 'subida'].some(name => lowerKey.includes(name)) && !columnMapping.speedDownKey) {
      columnMapping.speedUpKey = key;
    }
  });

  return columnMapping;
};

/**
 * Procesa una fila individual del Excel
 */
const processRow = async (row, columnMapping, auditData, index) => {
  let result = { ...row };
  
  // Metadatos de auditoría
  result.audit_id = auditData.audit_id || `AUDIT_${Date.now()}`;
  result.audit_date = new Date().toISOString().split('T')[0];
  result.audit_cycle = auditData.audit_cycle || generateAuditCycle();
  result.audit_version = auditData.audit_version || 1;

  // Normalizar identificación
  result.proveedor = getValue(row, columnMapping.proveedorKey) || 'No especificado';
  result.sitio = getValue(row, columnMapping.sitioKey) || 'No especificado';
  result.atencion = normalizeAtencion(getValue(row, columnMapping.atencionKey));
  result.usuario_id = getValue(row, columnMapping.usuarioKey) || `USER_${index + 1}`;
  result.hostname = getValue(row, columnMapping.hostnameKey) || `PC_${index + 1}`;

  // Procesar CPU
  let processorResult = { meetsRequirements: false, reason: "No se procesó" };
  if (columnMapping.processorKey && row[columnMapping.processorKey]) {
    try {
      const normalizedProcessor = normalizeProcessor(row[columnMapping.processorKey]);
      processorResult = normalizedProcessor;

      // Añadir campos normalizados
      result.cpu_brand = normalizedProcessor.brand;
      result.cpu_model = normalizedProcessor.model;
      result.cpu_speed_ghz = normalizedProcessor.speedValue || 0;
      result.cpu_generation = normalizedProcessor.generation;
      result.cpu_normalized = normalizedProcessor.normalized;
      result.cpu_meets_requirements = normalizedProcessor.meetsRequirements;
      result.cpu_failure_reason = normalizedProcessor.reason || '';
    } catch (error) {
      console.error(`Error normalizando procesador: ${row[columnMapping.processorKey]}`, error);
      processorResult = { meetsRequirements: false, reason: "Error en procesamiento" };
      
      result.cpu_brand = 'Desconocido';
      result.cpu_model = 'Desconocido';
      result.cpu_speed_ghz = 0;
      result.cpu_generation = null;
      result.cpu_normalized = 'Error: No se pudo procesar';
      result.cpu_meets_requirements = false;
      result.cpu_failure_reason = 'Error en procesamiento';
    }
  }

  // Procesar RAM
  let ramResult = { meetsRequirements: true, reason: "" };
  if (columnMapping.ramKey && row[columnMapping.ramKey]) {
    try {
      const normalizedRAM = normalizeRAM(row[columnMapping.ramKey]);
      const ramValidation = validateRAM(normalizedRAM);
      ramResult = ramValidation;

      result.ram_gb = normalizedRAM.capacityGB;
      result.ram_type = normalizedRAM.type;
      result.ram_normalized = normalizedRAM.normalized;
      result.ram_meets_requirements = ramValidation.meetsRequirements;
      result.ram_failure_reason = ramValidation.reason || '';
    } catch (error) {
      console.error(`Error normalizando RAM: ${row[columnMapping.ramKey]}`, error);
      ramResult = { meetsRequirements: false, reason: "Error en procesamiento" };
      
      result.ram_gb = 0;
      result.ram_type = 'Desconocido';
      result.ram_normalized = 'Error: No se pudo procesar';
      result.ram_meets_requirements = false;
      result.ram_failure_reason = 'Error en procesamiento';
    }
  }

  // Procesar Almacenamiento
  let storageResult = { meetsRequirements: true, reason: "" };
  if (columnMapping.storageKey && row[columnMapping.storageKey]) {
    try {
      const normalizedStorage = normalizeStorage(row[columnMapping.storageKey]);
      const storageValidation = validateStorage(normalizedStorage);
      storageResult = storageValidation;

      result.disk_type = normalizedStorage.type;
      result.disk_capacity_gb = normalizedStorage.capacityGB;
      result.disk_normalized = normalizedStorage.normalized;
      result.disk_meets_requirements = storageValidation.meetsRequirements;
      result.disk_failure_reason = storageValidation.reason || '';
    } catch (error) {
      console.error(`Error normalizando almacenamiento: ${row[columnMapping.storageKey]}`, error);
      storageResult = { meetsRequirements: false, reason: "Error en procesamiento" };
      
      result.disk_type = 'Desconocido';
      result.disk_capacity_gb = 0;
      result.disk_normalized = 'Error: No se pudo procesar';
      result.disk_meets_requirements = false;
      result.disk_failure_reason = 'Error en procesamiento';
    }
  }

  // Procesar Software
  result.os_name = normalizeOS(getValue(row, columnMapping.osKey));
  result.os_meets_requirements = result.os_name === 'Windows 11';
  result.os_failure_reason = result.os_meets_requirements ? '' : 'Se requiere Windows 11';

  result.browser_name = normalizeBrowser(getValue(row, columnMapping.browserKey));
  result.antivirus_brand = getValue(row, columnMapping.antivirusKey) || 'No especificado';

  // Procesar Periféricos
  result.headset_brand = getValue(row, columnMapping.headsetKey) || 'No especificado';

  // Procesar Conectividad
  result.isp_name = getValue(row, columnMapping.ispKey) || 'No especificado';
  result.connection_type = getValue(row, columnMapping.connectionTypeKey) || 'No especificado';
  
  const speedDown = parseSpeed(getValue(row, columnMapping.speedDownKey));
  const speedUp = parseSpeed(getValue(row, columnMapping.speedUpKey));
  
  result.speed_download_mbps = speedDown;
  result.speed_upload_mbps = speedUp;

  // Validar velocidades para Home Office
  let speedResult = { meetsRequirements: true, reason: "" };
  if (result.atencion === 'Remoto') {
    const minDown = 15;
    const minUp = 6;
    
    if (speedDown < minDown || speedUp < minUp) {
      speedResult = {
        meetsRequirements: false,
        reason: `Velocidad insuficiente para Home Office: ${speedDown}/${speedUp} Mbps (requiere ${minDown}/${minUp} Mbps)`
      };
    }
  }

  result.speed_meets_requirements = speedResult.meetsRequirements;
  result.speed_failure_reason = speedResult.reason;

  // Determinar cumplimiento global
  const overallCompliance = 
    processorResult.meetsRequirements &&
    ramResult.meetsRequirements &&
    storageResult.meetsRequirements &&
    result.os_meets_requirements &&
    speedResult.meetsRequirements;

  // Determinar motivo de incumplimiento global
  let overallReason = "";
  if (!overallCompliance) {
    const reasons = [
      !processorResult.meetsRequirements ? processorResult.reason : null,
      !ramResult.meetsRequirements ? ramResult.reason : null,
      !storageResult.meetsRequirements ? storageResult.reason : null,
      !result.os_meets_requirements ? result.os_failure_reason : null,
      !speedResult.meetsRequirements ? speedResult.reason : null,
    ].filter(Boolean);
    
    overallReason = reasons.join('; ');
  }

  result.overall_compliance = overallCompliance;
  result.overall_failure_reason = overallReason;

  return result;
};

/**
 * Funciones auxiliares de normalización
 */
const getValue = (row, key) => {
  if (!key || !row[key]) return null;
  return row[key].toString().trim();
};

const normalizeAtencion = (atencion) => {
  if (!atencion) return 'No especificado';
  
  const lower = atencion.toLowerCase();
  if (lower.includes('ho') || lower.includes('home') || lower.includes('remot')) {
    return 'Remoto';
  }
  if (lower.includes('os') || lower.includes('presencial') || lower.includes('sitio')) {
    return 'Presencial';
  }
  return atencion;
};

const normalizeOS = (osInfo) => {
  if (!osInfo) return 'No especificado';
  
  const lower = osInfo.toLowerCase();
  if (lower.includes('windows 11')) return 'Windows 11';
  if (lower.includes('windows 10')) return 'Windows 10';
  if (lower.includes('linux')) return 'Linux';
  if (lower.includes('macos') || lower.includes('mac os')) return 'macOS';
  
  return osInfo;
};

const normalizeBrowser = (browserInfo) => {
  if (!browserInfo) return 'No especificado';
  
  const lower = browserInfo.toLowerCase();
  if (lower.includes('chrome')) return 'Chrome';
  if (lower.includes('firefox')) return 'Firefox';
  if (lower.includes('edge')) return 'Edge';
  if (lower.includes('safari')) return 'Safari';
  
  return browserInfo;
};

const parseSpeed = (speedInfo) => {
  if (!speedInfo) return 0;
  
  const match = speedInfo.toString().match(/(\d+[\.,]?\d*)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return 0;
};

/**
 * Genera estadísticas completas del procesamiento
 */
const generateStatistics = (normalizedData) => {
  const totalRows = normalizedData.length;
  const meetingReqs = normalizedData.filter(row => row.overall_compliance).length;
  const notMeetingReqs = totalRows - meetingReqs;

  // Contadores por tipo de atención
  const osCount = normalizedData.filter(row => row.atencion === 'Presencial').length;
  const hoCount = normalizedData.filter(row => row.atencion === 'Remoto').length;

  // Contadores por marca de CPU
  const cpuBrands = {};
  const cpuModels = {};
  normalizedData.forEach(row => {
    if (row.cpu_brand) {
      cpuBrands[row.cpu_brand] = (cpuBrands[row.cpu_brand] || 0) + 1;
    }
    if (row.cpu_model) {
      cpuModels[row.cpu_model] = (cpuModels[row.cpu_model] || 0) + 1;
    }
  });

  // Estadísticas de RAM
  const ramSizes = {};
  let totalRAM = 0;
  let ramCount = 0;
  normalizedData.forEach(row => {
    if (row.ram_gb && row.ram_gb > 0) {
      ramSizes[row.ram_gb] = (ramSizes[row.ram_gb] || 0) + 1;
      totalRAM += row.ram_gb;
      ramCount++;
    }
  });

  // Estadísticas de almacenamiento
  const storageTypes = {};
  let totalStorage = 0;
  let storageCount = 0;
  normalizedData.forEach(row => {
    if (row.disk_type) {
      storageTypes[row.disk_type] = (storageTypes[row.disk_type] || 0) + 1;
    }
    if (row.disk_capacity_gb && row.disk_capacity_gb > 0) {
      totalStorage += row.disk_capacity_gb;
      storageCount++;
    }
  });

  // Contadores de cumplimiento por componente
  const complianceStats = {
    cpu: normalizedData.filter(row => row.cpu_meets_requirements).length,
    ram: normalizedData.filter(row => row.ram_meets_requirements).length,
    storage: normalizedData.filter(row => row.disk_meets_requirements).length,
    os: normalizedData.filter(row => row.os_meets_requirements).length,
    speed: normalizedData.filter(row => row.speed_meets_requirements).length,
  };

  // Motivos de incumplimiento
  const failureReasons = {};
  normalizedData.forEach(row => {
    if (!row.overall_compliance && row.overall_failure_reason) {
      const reasons = row.overall_failure_reason.split(';').map(r => r.trim());
      reasons.forEach(reason => {
        if (reason) {
          failureReasons[reason] = (failureReasons[reason] || 0) + 1;
        }
      });
    }
  });

  return {
    totalEquipment: totalRows,
    meetingRequirements: meetingReqs,
    notMeetingRequirements: notMeetingReqs,
    complianceRate: totalRows > 0 ? (meetingReqs / totalRows) * 100 : 0,
    
    // Por tipo de atención
    onSiteCount: osCount,
    homeOfficeCount: hoCount,
    
    // Distribuciones
    cpuBrandDistribution: cpuBrands,
    cpuModelDistribution: cpuModels,
    ramSizeDistribution: ramSizes,
    storageTypeDistribution: storageTypes,
    
    // Promedios
    averageRAM: ramCount > 0 ? totalRAM / ramCount : 0,
    averageStorage: storageCount > 0 ? totalStorage / storageCount : 0,
    
    // Cumplimiento por componente
    componentCompliance: {
      cpu: { total: complianceStats.cpu, percentage: (complianceStats.cpu / totalRows) * 100 },
      ram: { total: complianceStats.ram, percentage: (complianceStats.ram / totalRows) * 100 },
      storage: { total: complianceStats.storage, percentage: (complianceStats.storage / totalRows) * 100 },
      os: { total: complianceStats.os, percentage: (complianceStats.os / totalRows) * 100 },
      speed: { total: complianceStats.speed, percentage: (complianceStats.speed / totalRows) * 100 },
    },
    
    // Motivos de incumplimiento
    failureReasons,
  };
};

/**
 * Genera el ciclo de auditoría basado en la fecha actual
 */
const generateAuditCycle = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Enero = 1
  
  // Determinar semestre
  const semester = month <= 6 ? 'S1' : 'S2';
  
  return `${year}-${semester}`;
};

module.exports = {
  processExcelFile,
  generateStatistics,
  generateAuditCycle,
};
