/**
 * Parser de CSV - ETL Portal de Auditorías
 * Procesamiento robusto de archivos CSV
 */

const Papa = require('papaparse');
const fs = require('fs').promises;
const iconv = require('iconv-lite');

class CSVParser {
  constructor() {
    this.delimitersToGuess = [',', ';', '\t', '|'];
    this.encodingsToTry = ['utf8', 'latin1', 'cp1252'];
  }

  /**
   * Parsear archivo CSV
   */
  async parse(rutaArchivo) {
    try {
      console.log(`📄 Parseando archivo CSV: ${rutaArchivo}`);
      
      // Leer archivo con detección de encoding
      const { content, encoding } = await this.leerArchivoConEncoding(rutaArchivo);
      console.log(`🔤 Encoding detectado: ${encoding}`);
      
      // Detectar delimitador
      const delimiter = this.detectarDelimitador(content);
      console.log(`🔍 Delimitador detectado: "${delimiter}"`);
      
      // Parsear con PapaParse
      const parseResult = Papa.parse(content, {
        header: true,
        delimiter: delimiter,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: this.limpiarHeader,
        transform: this.transformarValor,
        encoding: encoding
      });
      
      if (parseResult.errors.length > 0) {
        console.warn('⚠️ Errores en parsing CSV:', parseResult.errors);
      }
      
      const datos = parseResult.data.filter(row => this.filaEsValida(row));
      console.log(`✅ Datos extraídos: ${datos.length} registros`);
      
      return datos;
      
    } catch (error) {
      console.error('❌ Error parseando CSV:', error.message);
      throw new Error(`Error parseando CSV: ${error.message}`);
    }
  }

  /**
   * Leer archivo con detección automática de encoding
   */
  async leerArchivoConEncoding(rutaArchivo) {
    for (const encoding of this.encodingsToTry) {
      try {
        const buffer = await fs.readFile(rutaArchivo);
        const content = iconv.decode(buffer, encoding);
        
        // Verificar si el contenido es válido (no tiene caracteres extraños)
        if (this.esEncodingValido(content)) {
          return { content, encoding };
        }
      } catch (error) {
        console.warn(`⚠️ Error con encoding ${encoding}:`, error.message);
        continue;
      }
    }
    
    // Fallback: UTF-8 por defecto
    const buffer = await fs.readFile(rutaArchivo);
    return { 
      content: buffer.toString('utf8'), 
      encoding: 'utf8' 
    };
  }

  /**
   * Verificar si un encoding produce contenido válido
   */
  esEncodingValido(content) {
    // Verificar que no haya demasiados caracteres de reemplazo
    const caracteresRaros = (content.match(/�/g) || []).length;
    const longitudTotal = content.length;
    
    if (longitudTotal === 0) return false;
    
    const ratioCaracteresRaros = caracteresRaros / longitudTotal;
    return ratioCaracteresRaros < 0.01; // Menos del 1% de caracteres raros
  }

  /**
   * Detectar delimitador más probable
   */
  detectarDelimitador(content) {
    const muestraLineas = content.split('\n').slice(0, 10).join('\n');
    let mejorDelimitador = ',';
    let maxColumnas = 0;
    
    for (const delimiter of this.delimitersToGuess) {
      try {
        const testResult = Papa.parse(muestraLineas, {
          delimiter: delimiter,
          header: false,
          skipEmptyLines: true
        });
        
        if (testResult.data.length > 0) {
          const numeroColumnas = testResult.data[0].length;
          const consistencia = this.calcularConsistenciaColumnas(testResult.data);
          
          // Priorizar consistencia y número de columnas
          const score = numeroColumnas * consistencia;
          
          if (score > maxColumnas) {
            maxColumnas = score;
            mejorDelimitador = delimiter;
          }
        }
      } catch (error) {
        // Continuar con el siguiente delimitador
        continue;
      }
    }
    
    return mejorDelimitador;
  }

  /**
   * Calcular consistencia en número de columnas
   */
  calcularConsistenciaColumnas(data) {
    if (data.length === 0) return 0;
    
    const longitudPrimera = data[0].length;
    let coincidencias = 0;
    
    for (const fila of data) {
      if (fila.length === longitudPrimera) {
        coincidencias++;
      }
    }
    
    return coincidencias / data.length;
  }

  /**
   * Limpiar nombres de headers
   */
  limpiarHeader = (header) => {
    if (!header || typeof header !== 'string') {
      return header;
    }
    
    return header
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Transformar valores de celdas
   */
  transformarValor = (value, header) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // Si ya es un número, devolverlo
    if (typeof value === 'number') {
      return value;
    }
    
    // Si es string, limpiar y procesar
    if (typeof value === 'string') {
      const valorLimpio = value.trim();
      
      // Intentar convertir a número si parece un número
      if (this.pareceNumero(valorLimpio)) {
        const numero = this.convertirANumero(valorLimpio);
        if (numero !== null) {
          return numero;
        }
      }
      
      // Intentar convertir a booleano
      const valorLower = valorLimpio.toLowerCase();
      if (['true', 'false', 'sí', 'si', 'no', 'yes', 'y', 'n'].includes(valorLower)) {
        return ['true', 'sí', 'si', 'yes', 'y'].includes(valorLower);
      }
      
      return valorLimpio;
    }
    
    return value;
  }

  /**
   * Verificar si un string parece un número
   */
  pareceNumero(valor) {
    // Permitir números con puntos, comas, espacios y signos
    const patronNumero = /^[+-]?[\d\s.,]+$/;
    return patronNumero.test(valor);
  }

  /**
   * Convertir string a número manejando diferentes formatos
   */
  convertirANumero(valor) {
    try {
      // Remover espacios
      let numeroLimpio = valor.replace(/\s/g, '');
      
      // Manejar formato europeo (punto para miles, coma para decimales)
      if (numeroLimpio.includes(',') && numeroLimpio.includes('.')) {
        // Si tiene ambos, el último es decimal
        const ultimoPunto = numeroLimpio.lastIndexOf('.');
        const ultimaComa = numeroLimpio.lastIndexOf(',');
        
        if (ultimaComa > ultimoPunto) {
          // Formato: 1.234,56
          numeroLimpio = numeroLimpio.replace(/\./g, '').replace(',', '.');
        } else {
          // Formato: 1,234.56
          numeroLimpio = numeroLimpio.replace(/,/g, '');
        }
      } else if (numeroLimpio.includes(',')) {
        // Solo coma - puede ser decimal o miles
        const partes = numeroLimpio.split(',');
        if (partes.length === 2 && partes[1].length <= 2) {
          // Probablemente decimal
          numeroLimpio = numeroLimpio.replace(',', '.');
        } else {
          // Probablemente miles
          numeroLimpio = numeroLimpio.replace(/,/g, '');
        }
      }
      
      const numero = parseFloat(numeroLimpio);
      return isNaN(numero) ? null : numero;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar si una fila es válida (tiene al menos un campo con datos)
   */
  filaEsValida(fila) {
    if (!fila || typeof fila !== 'object') {
      return false;
    }
    
    const valores = Object.values(fila);
    return valores.some(valor => 
      valor !== null && 
      valor !== undefined && 
      valor !== '' && 
      valor.toString().trim() !== ''
    );
  }

  /**
   * Obtener estadísticas del parsing
   */
  obtenerEstadisticas(datos) {
    if (!datos || datos.length === 0) {
      return {
        total_registros: 0,
        columnas_detectadas: 0,
        tipos_de_datos: {}
      };
    }
    
    const primerRegistro = datos[0];
    const columnas = Object.keys(primerRegistro);
    const tiposDatos = {};
    
    // Analizar tipos de datos por columna
    columnas.forEach(columna => {
      const tiposEncontrados = new Set();
      
      datos.slice(0, 100).forEach(registro => { // Analizar primeros 100 registros
        const valor = registro[columna];
        if (valor !== null && valor !== undefined) {
          tiposEncontrados.add(typeof valor);
        }
      });
      
      tiposDatos[columna] = Array.from(tiposEncontrados);
    });
    
    return {
      total_registros: datos.length,
      columnas_detectadas: columnas.length,
      columnas: columnas,
      tipos_de_datos: tiposDatos
    };
  }
}

module.exports = CSVParser;
