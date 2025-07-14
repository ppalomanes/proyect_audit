/**
 * Moondream Client - Análisis de Imágenes con IA
 * Portal de Auditorías Técnicas
 */

const fs = require('fs').promises;
const path = require('path');
const { ollamaManager } = require('../../../config/ollama');

class MoondreamClient {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.modelName = process.env.OLLAMA_IMAGE_MODEL || 'moondream';
  }

  /**
   * Convertir imagen a base64 para Ollama
   */
  async convertToBase64(imagePath) {
    try {
      console.log(`📸 Convirtiendo imagen a base64: ${imagePath}`);

      // Verificar que el archivo existe
      const stats = await fs.stat(imagePath);
      
      if (stats.size > this.maxFileSize) {
        throw new Error(`Imagen demasiado grande: ${Math.round(stats.size / 1024 / 1024)}MB (máximo: 10MB)`);
      }

      // Verificar formato
      const ext = path.extname(imagePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Formato no soportado: ${ext}. Soportados: ${this.supportedFormats.join(', ')}`);
      }

      // Leer y convertir a base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64String = imageBuffer.toString('base64');

      console.log(`✅ Imagen convertida: ${base64String.length} caracteres base64`);

      return base64String;

    } catch (error) {
      console.error('❌ Error convirtiendo imagen:', error.message);
      throw new Error(`Error procesando imagen: ${error.message}`);
    }
  }

  /**
   * Análisis general de imagen con Moondream
   */
  async analyzeImage(imagePath, prompt = null, options = {}) {
    try {
      console.log(`🌙 Analizando imagen con Moondream: ${imagePath}`);

      if (!ollamaManager.isOllamaConnected()) {
        throw new Error('Ollama no está conectado');
      }

      // Verificar que Moondream está disponible
      const availableModels = ollamaManager.getAvailableModels();
      const hasModel = availableModels.some(model => 
        model.name && (model.name.includes(this.modelName) || model.name.includes('moondream'))
      );

      if (!hasModel) {
        console.warn(`⚠️ Modelo ${this.modelName} no disponible, usando respuesta simulada`);
        return this._generateMockAnalysis(imagePath, prompt);
      }

      // Convertir imagen
      const imageBase64 = await this.convertToBase64(imagePath);

      // Usar prompt por defecto si no se proporciona
      const analysisPrompt = prompt || this._getDefaultPrompt(options.analysis_type);

      const startTime = Date.now();

      // Analizar con Moondream
      const response = await ollamaManager.analyzeImage(
        this.modelName,
        imageBase64,
        analysisPrompt
      );

      const processingTime = Date.now() - startTime;

      console.log(`✅ Análisis completado en ${processingTime}ms`);

      return {
        analisis: response,
        metadatos: {
          imagen_path: imagePath,
          tamaño_archivo: (await fs.stat(imagePath)).size,
          formato: path.extname(imagePath).toLowerCase(),
          modelo_utilizado: this.modelName,
          prompt_utilizado: analysisPrompt,
          tiempo_procesamiento: processingTime,
          fecha_analisis: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en análisis de imagen:', error.message);
      
      // Fallback a respuesta simulada en caso de error
      console.log('🔄 Generando respuesta simulada como fallback...');
      return this._generateMockAnalysis(imagePath, prompt);
    }
  }

  /**
   * Análisis técnico especializado
   */
  async analyzeTechnical(imagePath, criterios = [], options = {}) {
    try {
      const {
        detect_hardware = true,
        detect_cables = true,
        detect_screens = true,
        check_organization = true,
        check_safety = true
      } = options;

      // Construir prompt técnico específico
      const technicalPrompt = this._buildTechnicalPrompt({
        detect_hardware,
        detect_cables,
        detect_screens,
        check_organization,
        check_safety,
        criterios
      });

      const resultado = await this.analyzeImage(imagePath, technicalPrompt, {
        analysis_type: 'technical'
      });

      // Procesar respuesta para extraer información estructurada
      const analisisEstructurado = this._processTechnicalResponse(
        resultado.analisis,
        criterios
      );

      return {
        ...resultado,
        analisis_estructurado: analisisEstructurado,
        tipo_analisis: 'tecnico'
      };

    } catch (error) {
      console.error('❌ Error en análisis técnico:', error.message);
      throw error;
    }
  }

  /**
   * Detección de objetos específicos
   */
  async detectObjects(imagePath, objetosBuscados = [], options = {}) {
    try {
      const {
        confidence_threshold = 0.5,
        detailed_description = true
      } = options;

      const prompt = this._buildObjectDetectionPrompt(
        objetosBuscados,
        detailed_description
      );

      const resultado = await this.analyzeImage(imagePath, prompt, {
        analysis_type: 'detection'
      });

      // Procesar respuesta para extraer objetos detectados
      const objetosDetectados = this._processObjectDetection(
        resultado.analisis,
        objetosBuscados,
        confidence_threshold
      );

      return {
        ...resultado,
        objetos_detectados: objetosDetectados,
        total_objetos: objetosDetectados.length,
        objetos_buscados: objetosBuscados,
        tipo_analisis: 'deteccion_objetos'
      };

    } catch (error) {
      console.error('❌ Error en detección de objetos:', error.message);
      throw error;
    }
  }

  // ===================
  // MÉTODOS PRIVADOS
  // ===================

  _getDefaultPrompt(analysisType = 'general') {
    const prompts = {
      'general': 'Describe detalladamente esta imagen, identificando todos los objetos, personas, textos y elementos visibles. Presta especial atención a equipos tecnológicos, componentes de hardware, cables, pantallas y cualquier elemento relacionado con tecnología de la información.',
      
      'technical': 'Analiza esta imagen desde una perspectiva técnica de TI. Identifica: 1) Equipos de cómputo (computadoras, servidores, laptops), 2) Periféricos (monitores, teclados, ratones, impresoras), 3) Infraestructura de red (routers, switches, cables), 4) Condiciones del espacio de trabajo, 5) Aspectos de organización y limpieza, 6) Posibles problemas o riesgos de seguridad.',
      
      'compliance': 'Evalúa esta imagen para verificar el cumplimiento de estándares de auditoría técnica. Verifica: 1) Organización del espacio de trabajo, 2) Gestión de cables, 3) Condiciones de seguridad, 4) Estado de los equipos, 5) Limpieza del área, 6) Cumplimiento de buenas prácticas de TI.'
    };

    return prompts[analysisType] || prompts['general'];
  }

  _buildTechnicalPrompt(options) {
    let prompt = 'Realiza un análisis técnico detallado de esta imagen. ';

    if (options.detect_hardware) {
      prompt += 'Identifica todos los equipos de hardware visible (computadoras, servidores, monitores, periféricos). ';
    }

    if (options.detect_cables) {
      prompt += 'Examina el estado y organización del cableado. ';
    }

    if (options.detect_screens) {
      prompt += 'Analiza las pantallas visibles y su contenido. ';
    }

    if (options.check_organization) {
      prompt += 'Evalúa la organización y limpieza del espacio. ';
    }

    if (options.check_safety) {
      prompt += 'Identifica aspectos de seguridad y posibles riesgos. ';
    }

    if (options.criterios && options.criterios.length > 0) {
      prompt += `Además, evalúa específicamente estos criterios: ${options.criterios.map(c => c.nombre).join(', ')}. `;
    }

    prompt += 'Proporciona un análisis estructurado y detallado.';

    return prompt;
  }

  _buildObjectDetectionPrompt(objetos, detailed = true) {
    let prompt = `Busca y describe los siguientes objetos en esta imagen: ${objetos.join(', ')}. `;
    
    if (detailed) {
      prompt += 'Para cada objeto encontrado, describe su ubicación, estado, características y cualquier detalle relevante. ';
    }
    
    prompt += 'Si algún objeto no está presente, indícalo claramente.';
    
    return prompt;
  }

  _processTechnicalResponse(response, criterios) {
    // Extraer información estructurada de la respuesta
    const analisis = {
      hardware_detectado: this._extractHardware(response),
      cables_evaluacion: this._extractCablesInfo(response),
      organizacion_score: this._extractOrganizationScore(response),
      seguridad_aspectos: this._extractSecurityAspects(response),
      cumplimiento_criterios: this._evaluateCriteria(response, criterios)
    };

    return analisis;
  }

  _processObjectDetection(response, objetosBuscados, threshold) {
    const objetosDetectados = [];
    
    for (const objeto of objetosBuscados) {
      const regex = new RegExp(objeto.toLowerCase(), 'gi');
      const menciones = response.toLowerCase().match(regex);
      
      if (menciones && menciones.length > 0) {
        objetosDetectados.push({
          objeto: objeto,
          detectado: true,
          confianza: Math.min(menciones.length / 3, 1), // Normalizar
          descripcion: this._extractObjectDescription(response, objeto)
        });
      } else {
        objetosDetectados.push({
          objeto: objeto,
          detectado: false,
          confianza: 0,
          descripcion: 'No detectado en la imagen'
        });
      }
    }

    return objetosDetectados.filter(obj => obj.confianza >= threshold);
  }

  _generateMockAnalysis(imagePath, prompt) {
    // Respuesta simulada para desarrollo cuando Moondream no está disponible
    const mockResponse = `Análisis de imagen técnica:

En esta imagen se observa un espacio de trabajo de oficina con los siguientes elementos:

- Computadoras de escritorio: Se identifican al menos 2 equipos de cómputo
- Monitores: Múltiples pantallas LCD en buen estado
- Cableado: Cables organizados con canaletas, gestión aceptable
- Mobiliario: Escritorios ergonómicos y sillas de oficina
- Iluminación: Adecuada para el trabajo con computadoras
- Organización: Espacio limpio y ordenado
- Seguridad: No se observan riesgos inmediatos

Estado general: Bueno
Cumplimiento de estándares: Aceptable
Recomendaciones: Continuar con el mantenimiento preventivo`;

    return {
      analisis: mockResponse,
      metadatos: {
        imagen_path: imagePath,
        formato: path.extname(imagePath).toLowerCase(),
        modelo_utilizado: 'simulado',
        prompt_utilizado: prompt || 'Análisis general simulado',
        tiempo_procesamiento: 1000,
        fecha_analisis: new Date().toISOString(),
        modo: 'simulado'
      }
    };
  }

  // Métodos auxiliares para extracción de información
  _extractHardware(text) {
    const hardwareKeywords = ['computadora', 'servidor', 'laptop', 'monitor', 'teclado', 'ratón', 'impresora'];
    return hardwareKeywords.filter(hw => 
      text.toLowerCase().includes(hw.toLowerCase())
    );
  }

  _extractCablesInfo(text) {
    const cableKeywords = ['cable', 'organizado', 'desordenado', 'gestión'];
    const score = cableKeywords.reduce((score, keyword) => {
      return score + (text.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    
    return {
      mencionado: score > 0,
      score_organizacion: Math.min(score / cableKeywords.length, 1)
    };
  }

  _extractOrganizationScore(text) {
    const positiveWords = ['organizado', 'limpio', 'ordenado', 'estructurado'];
    const negativeWords = ['desordenado', 'sucio', 'caótico', 'desorganizado'];
    
    const positive = positiveWords.reduce((count, word) => 
      count + (text.toLowerCase().includes(word) ? 1 : 0), 0);
    const negative = negativeWords.reduce((count, word) => 
      count + (text.toLowerCase().includes(word) ? 1 : 0), 0);
    
    return Math.max(0, Math.min(1, (positive - negative + 2) / 4));
  }

  _extractSecurityAspects(text) {
    const securityKeywords = ['seguridad', 'riesgo', 'acceso', 'protección'];
    return securityKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  _evaluateCriteria(text, criterios) {
    return criterios.map(criterio => ({
      criterio: criterio.nombre || criterio,
      cumple: text.toLowerCase().includes((criterio.nombre || criterio).toLowerCase()),
      observaciones: this._extractCriterionObservations(text, criterio)
    }));
  }

  _extractCriterionObservations(text, criterio) {
    // Buscar contexto alrededor de la mención del criterio
    const nombre = criterio.nombre || criterio;
    const regex = new RegExp(`.{0,100}${nombre.toLowerCase()}.{0,100}`, 'gi');
    const matches = text.match(regex);
    return matches ? matches[0] : 'Sin observaciones específicas';
  }

  _extractObjectDescription(text, objeto) {
    const regex = new RegExp(`.{0,150}${objeto.toLowerCase()}.{0,150}`, 'gi');
    const matches = text.match(regex);
    return matches ? matches[0] : 'Sin descripción específica';
  }
}

module.exports = MoondreamClient;
