/**
 * Parser de Excel - ETL Portal de Auditorías
 * Procesamiento inteligente de archivos Excel/XLSX
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

class ExcelParser {
  constructor() {
    this.fieldMappings = {
      // Mapeos comunes para campos de parque informático
      usuario_id: ['usuario_id', 'id_usuario', 'user_id', 'id', 'usuario', 'cedula', 'documento'],
      proveedor: ['proveedor', 'empresa', 'company', 'cliente'],
      sitio: ['sitio', 'site', 'ubicacion', 'location', 'ciudad'],
      atencion: ['atencion', 'tipo_atencion', 'servicio', 'service_type', 'modalidad'],
      hostname: ['hostname', 'nombre_equipo', 'computer_name', 'pc_name', 'equipo'],
      
      // Hardware
      cpu_brand: ['cpu_brand', 'marca_cpu', 'processor_brand', 'marca_procesador'],
      cpu_model: ['cpu_model', 'modelo_cpu', 'processor_model', 'procesador'],
      cpu_speed: ['cpu_speed', 'velocidad_cpu', 'cpu_ghz', 'frecuencia_cpu'],
      cpu_cores: ['cpu_cores', 'nucleos_cpu', 'cores', 'nucleos'],
      
      ram_gb: ['ram_gb', 'memoria_ram', 'ram', 'memory_gb', 'memoria'],
      ram_type: ['ram_type', 'tipo_ram', 'memory_type'],
      
      disk_type: ['disk_type', 'tipo_disco', 'storage_type', 'disco'],
      disk_capacity: ['disk_capacity', 'capacidad_disco', 'storage_capacity', 'disco_gb'],
      
      // Software
      os_name: ['os_name', 'sistema_operativo', 'operating_system', 'so'],
      os_version: ['os_version', 'version_so', 'os_ver'],
      browser_name: ['browser_name', 'navegador', 'browser'],
      browser_version: ['browser_version', 'version_navegador'],
      antivirus_brand: ['antivirus_brand', 'antivirus', 'av_brand'],
      antivirus_version: ['antivirus_version', 'version_antivirus'],
      
      // Periféricos
      headset_brand: ['headset_brand', 'diadema', 'auriculares', 'headset'],
      headset_model: ['headset_model', 'modelo_diadema'],
      
      // Conectividad
      isp_name: ['isp_name', 'proveedor_internet', 'isp', 'internet_provider'],
      connection_type: ['connection_type', 'tipo_conexion', 'conexion'],
      speed_download: ['speed_download', 'velocidad_bajada', 'download_speed', 'bajada_mbps'],
      speed_upload: ['speed_upload', 'velocidad_subida', 'upload_speed', 'subida_mbps']
    };
  }

  /**
   * Parsear archivo Excel
   */
  async parse(rutaArchivo) {
    try {
      console.log(`📊 Parseando archivo Excel: ${rutaArchivo}`);
      
      // Verificar que el archivo existe
      await fs.access(rutaArchivo);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(rutaArchivo);
      
      // Buscar la hoja con datos
      const worksheet = this.encontrarHojaDatos(workbook);
      
      if (!worksheet) {
        throw new Error('No se encontró una hoja con datos válidos');
      }
      
      console.log(`📋 Procesando hoja: ${worksheet.name}`);
      
      // Detectar encabezados
      const headers = this.detectarEncabezados(worksheet);
      console.log(`🔍 Headers detectados: ${headers.length} columnas`);
      
      // Mapear campos automáticamente
      const fieldMapping = this.mapearCampos(headers);
      console.log(`🗺️ Campos mapeados: ${Object.keys(fieldMapping).length} campos reconocidos`);
      
      // Extraer datos
      const datos = this.extraerDatos(worksheet, headers, fieldMapping);
      console.log(`✅ Datos extraídos: ${datos.length} registros`);
      
      return datos;
      
    } catch (error) {
      console.error('❌ Error parseando Excel:', error.message);
      throw new Error(`Error parseando Excel: ${error.message}`);
    }
  }

  /**
   * Encontrar la hoja principal con datos
   */
  encontrarHojaDatos(workbook) {
    // Priorizar hojas con nombres específicos
    const nombresPrioritarios = ['parque', 'inventario', 'equipment', 'datos', 'data', 'equipos'];
    
    for (const nombre of nombresPrioritarios) {
      const worksheet = workbook.worksheets.find(ws => 
        ws.name.toLowerCase().includes(nombre)
      );
      if (worksheet && this.tieneContenido(worksheet)) {
        return worksheet;
      }
    }
    
    // Si no encuentra por nombre, usar la primera hoja con contenido
    for (const worksheet of workbook.worksheets) {
      if (this.tieneContenido(worksheet)) {
        return worksheet;
      }
    }
    
    return null;
  }

  /**
   * Verificar si una hoja tiene contenido útil
   */
  tieneContenido(worksheet) {
    if (worksheet.rowCount < 2) return false;
    
    const primeraFila = worksheet.getRow(1);
    let columnasConDatos = 0;
    
    primeraFila.eachCell((cell) => {
      if (cell.value && cell.value.toString().trim()) {
        columnasConDatos++;
      }
    });
    
    return columnasConDatos >= 3;
  }

  /**
   * Detectar fila de encabezados y extraerlos
   */
  detectarEncabezados(worksheet) {
    for (let rowNum = 1; rowNum <= Math.min(5, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const headers = [];
      
      row.eachCell((cell, colNumber) => {
        const value = cell.value;
        if (value) {
          headers[colNumber - 1] = this.limpiarHeader(value.toString());
        }
      });
      
      if (this.esFilaDeEncabezados(headers)) {
        return headers.filter(h => h);
      }
    }
    
    throw new Error('No se pudieron detectar los encabezados');
  }

  /**
   * Verificar si una fila parece contener encabezados
   */
  esFilaDeEncabezados(headers) {
    const headersLimpios = headers.filter(h => h && h.trim());
    
    if (headersLimpios.length < 3) return false;
    
    const palabrasClave = [
      'usuario', 'id', 'nombre', 'cpu', 'ram', 'memoria', 'disco',
      'sistema', 'navegador', 'antivirus', 'sitio', 'proveedor'
    ];
    
    const coincidencias = headersLimpios.filter(header =>
      palabrasClave.some(palabra => 
        header.toLowerCase().includes(palabra)
      )
    );
    
    return coincidencias.length >= 2;
  }

  /**
   * Limpiar y normalizar nombres de encabezados
   */
  limpiarHeader(header) {
    return header
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Mapear encabezados a campos normalizados
   */
  mapearCampos(headers) {
    const mapping = {};
    
    headers.forEach((header, index) => {
      if (!header) return;
      
      // Buscar coincidencia exacta primero
      for (const [campoNormalizado, variaciones] of Object.entries(this.fieldMappings)) {
        if (variaciones.includes(header)) {
          mapping[index] = campoNormalizado;
          return;
        }
      }
      
      // Buscar coincidencia parcial
      for (const [campoNormalizado, variaciones] of Object.entries(this.fieldMappings)) {
        for (const variacion of variaciones) {
          if (header.includes(variacion) || variacion.includes(header)) {
            mapping[index] = campoNormalizado;
            return;
          }
        }
      }
      
      mapping[index] = header;
    });
    
    return mapping;
  }

  /**
   * Extraer datos de la hoja
   */
  extraerDatos(worksheet, headers, fieldMapping) {
    const datos = [];
    const filaInicioDatos = this.encontrarFilaInicioDatos(worksheet, headers);
    
    for (let rowNum = filaInicioDatos; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      if (this.filaEstaVacia(row)) continue;
      
      const registro = {};
      let tieneDatos = false;
      
      row.eachCell((cell, colNumber) => {
        const fieldName = fieldMapping[colNumber - 1];
        if (fieldName && cell.value !== null && cell.value !== undefined) {
          registro[fieldName] = this.extraerValorCelda(cell);
          tieneDatos = true;
        }
      });
      
      if (tieneDatos) {
        datos.push(registro);
      }
    }
    
    return datos;
  }

  /**
   * Encontrar la fila donde empiezan los datos
   */
  encontrarFilaInicioDatos(worksheet, headers) {
    for (let rowNum = 1; rowNum <= Math.min(10, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const valores = [];
      
      row.eachCell((cell) => {
        if (cell.value) {
          valores.push(cell.value.toString().toLowerCase());
        }
      });
      
      // Si esta fila parece datos y no headers
      if (valores.length > 0 && !this.esFilaDeEncabezados(valores)) {
        return rowNum;
      }
    }
    
    return 2; // Default: fila 2
  }

  /**
   * Verificar si una fila está vacía
   */
  filaEstaVacia(row) {
    let tieneDatos = false;
    row.eachCell((cell) => {
      if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
        tieneDatos = true;
      }
    });
    return !tieneDatos;
  }

  /**
   * Extraer valor de una celda manejando diferentes tipos
   */
  extraerValorCelda(cell) {
    if (cell.value === null || cell.value === undefined) {
      return null;
    }
    
    // Manejar fechas
    if (cell.value instanceof Date) {
      return cell.value;
    }
    
    // Manejar fórmulas
    if (cell.formula) {
      return cell.result || cell.value;
    }
    
    // Manejar texto enriquecido
    if (typeof cell.value === 'object' && cell.value.richText) {
      return cell.value.richText.map(part => part.text).join('');
    }
    
    return cell.value.toString().trim();
  }
}

module.exports = ExcelParser;
