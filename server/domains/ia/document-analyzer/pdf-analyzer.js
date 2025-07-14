/**
 * PDF Analyzer - Extracción y Análisis de Documentos PDF
 * Portal de Auditorías Técnicas
 */

const fs = require('fs').promises;
const path = require('path');

class PDFAnalyzer {
  constructor() {
    this.supportedFormats = ['.pdf'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  /**
   * Extraer texto completo de un archivo PDF
   */
  async extractText(filePath) {
    try {
      console.log(`📄 Extrayendo texto de: ${filePath}`);

      // Verificar que el archivo existe
      const stats = await fs.stat(filePath);
      
      if (stats.size > this.maxFileSize) {
        throw new Error(`Archivo demasiado grande: ${Math.round(stats.size / 1024 / 1024)}MB (máximo: 50MB)`);
      }

      // Verificar extensión
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Formato no soportado: ${ext}. Soportados: ${this.supportedFormats.join(', ')}`);
      }

      // Por ahora, implementación simulada para desarrollo
      // En producción, aquí se usaría una librería como pdf-parse
      const mockText = `Documento de auditoría técnica
      
Especificaciones del sistema:
- Procesador: Intel Core i7-8700K @ 3.70GHz
- Memoria RAM: 16 GB DDR4
- Almacenamiento: SSD 512GB + HDD 2TB
- Sistema Operativo: Windows 11 Pro
- Red: Gigabit Ethernet + WiFi 6

Configuraciones de red:
- IP: 192.168.1.100
- Gateway: 192.168.1.1
- DNS: 8.8.8.8, 8.8.4.4

Estado del equipamiento:
Los equipos se encuentran en buen estado general, con mantenimiento actualizado.
Se recomienda actualizar el firmware del router para mejorar la seguridad.

Fecha de documento: ${new Date().toLocaleDateString()}
Páginas: 3
Tamaño: ${Math.round(stats.size / 1024)} KB`;

      console.log(`✅ Texto extraído: ${mockText.length} caracteres (SIMULADO)`);

      return {
        texto: mockText,
        metadatos: {
          paginas: 3,
          caracteres: mockText.length,
          palabras: this._countWords(mockText),
          tamaño_archivo: stats.size,
          fecha_procesamiento: new Date().toISOString(),
          modo: 'simulado'
        }
      };

    } catch (error) {
      console.error('❌ Error extrayendo texto del PDF:', error.message);
      throw new Error(`Error procesando PDF: ${error.message}`);
    }
  }

  /**
   * Analizar estructura del documento
   */
  async analyzeStructure(filePath) {
    try {
      const { texto, metadatos } = await this.extractText(filePath);

      const estructura = {
        tipo_documento: this._detectDocumentType(texto),
        secciones: this._detectSections(texto),
        fechas: this._extractDates(texto),
        numeros: this._extractNumbers(texto)
      };

      return {
        metadatos,
        estructura,
        resumen: this._generateStructureSummary(estructura)
      };

    } catch (error) {
      console.error('❌ Error analizando estructura:', error.message);
      throw error;
    }
  }

  /**
   * Preparar texto para análisis de IA
   */
  async prepareForAI(filePath, options = {}) {
    try {
      const {
        max_tokens = 8000,
        include_structure = true,
        include_metadata = true
      } = options;

      const { texto, metadatos } = await this.extractText(filePath);
      let processedText = texto;

      // Si el texto es muy largo, truncar
      if (processedText.length > max_tokens * 4) {
        processedText = this._truncateText(processedText, max_tokens * 4);
      }

      const aiReady = {
        contenido_principal: processedText,
        longitud_original: texto.length,
        longitud_procesada: processedText.length,
        fue_resumido: processedText.length < texto.length
      };

      if (include_structure) {
        const estructura = await this.analyzeStructure(filePath);
        aiReady.estructura = estructura.estructura;
      }

      if (include_metadata) {
        aiReady.metadatos = metadatos;
      }

      return aiReady;

    } catch (error) {
      console.error('❌ Error preparando para IA:', error.message);
      throw error;
    }
  }

  // ===================
  // MÉTODOS PRIVADOS
  // ===================

  _countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  _detectDocumentType(texto) {
    const indicators = {
      'informe_tecnico': ['especificaciones', 'requisitos', 'hardware', 'software', 'configuración'],
      'contrato': ['acuerdo', 'cláusula', 'términos', 'condiciones', 'proveedor'],
      'manual': ['instrucciones', 'procedimiento', 'pasos', 'guía', 'tutorial'],
      'auditoria': ['hallazgo', 'observación', 'recomendación', 'evaluación', 'cumplimiento'],
      'certificado': ['certificado', 'válido', 'autorizado', 'emitido', 'vigencia']
    };

    const textoLower = texto.toLowerCase();
    const scores = {};

    for (const [tipo, keywords] of Object.entries(indicators)) {
      scores[tipo] = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = textoLower.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
    }

    const maxScore = Math.max(...Object.values(scores));
    const detectedType = Object.keys(scores).find(key => scores[key] === maxScore);

    return {
      tipo_detectado: maxScore > 0 ? detectedType : 'documento_general',
      confianza: Math.min(maxScore / 10, 1),
      scores: scores
    };
  }

  _detectSections(texto) {
    const sectionPatterns = [
      /^\d+\.\s+.+$/gm, // 1. Título
      /^[A-Z][A-Z\s]{5,}$/gm, // TÍTULOS EN MAYÚSCULAS
      /^\w+:/gm // Etiqueta:
    ];

    const sections = [];
    sectionPatterns.forEach((pattern, index) => {
      const matches = texto.match(pattern) || [];
      sections.push(...matches.map(match => ({
        tipo: `patron_${index + 1}`,
        contenido: match.trim(),
        posicion: texto.indexOf(match)
      })));
    });

    return sections.sort((a, b) => a.posicion - b.posicion);
  }

  _extractDates(texto) {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g
    ];

    const dates = [];
    datePatterns.forEach(pattern => {
      const matches = texto.match(pattern) || [];
      dates.push(...matches);
    });

    return [...new Set(dates)];
  }

  _extractNumbers(texto) {
    const numberPatterns = {
      'monetarios': /\$[\d,]+\.?\d*/g,
      'porcentajes': /\d+%/g,
      'medidas': /\d+\s*(gb|mb|ghz|mhz|kg|cm|mm)/gi,
      'identificadores': /[A-Z]{2,3}-?\d{4,}/g
    };

    const numbers = {};
    for (const [tipo, pattern] of Object.entries(numberPatterns)) {
      const matches = texto.match(pattern) || [];
      numbers[tipo] = [...new Set(matches)];
    }

    return numbers;
  }

  _generateStructureSummary(estructura) {
    return {
      tipo_documento: estructura.tipo_documento.tipo_detectado,
      confianza_tipo: estructura.tipo_documento.confianza,
      total_secciones: estructura.secciones.length,
      fechas_encontradas: estructura.fechas.length,
      elementos_identificados: Object.keys(estructura.numeros).length,
      complejidad: this._calculateComplexity(estructura)
    };
  }

  _calculateComplexity(estructura) {
    const factors = [
      estructura.secciones.length,
      estructura.fechas.length,
      Object.values(estructura.numeros).flat().length
    ];

    const totalComplexity = factors.reduce((sum, factor) => sum + factor, 0);

    if (totalComplexity < 10) return 'baja';
    if (totalComplexity < 25) return 'media';
    return 'alta';
  }

  _truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.8 ? 
      truncated.substring(0, lastSpace) + '...\n[CONTENIDO TRUNCADO]' :
      truncated + '...\n[CONTENIDO TRUNCADO]';
  }
}

module.exports = PDFAnalyzer;
