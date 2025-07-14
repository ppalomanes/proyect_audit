/**
 * Configuración de Ollama para Portal de Auditorías Técnicas
 * Gestiona conexión y configuración de modelos de IA local:
 * - LLaMA 3.2:1b para análisis de documentos PDF/texto
 * - Moondream para análisis de imágenes
 * Incluye health checks, fallbacks y gestión de recursos
 */

const axios = require('axios');

// Variables de entorno con valores por defecto
const {
  OLLAMA_HOST = 'localhost',
  OLLAMA_PORT = 11434,
  OLLAMA_TIMEOUT = 300000,    // 5 minutos para análisis complejos
  OLLAMA_MAX_RETRIES = 3,
  NODE_ENV = 'development'
} = process.env;

// URL base de Ollama
const OLLAMA_BASE_URL = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;

// Configuración de modelos para auditorías técnicas
const MODELS_CONFIG = {
  // Modelo principal para análisis de texto y documentos PDF
  text_analysis: {
    name: 'llama3.2:1b',
    alias: 'llama-auditorias',
    description: 'LLaMA 3.2 1B optimizado para análisis de documentos técnicos',
    context_length: 4096,
    temperature: 0.1,          // Baja temperatura para respuestas precisas
    top_p: 0.9,
    top_k: 40,
    repeat_penalty: 1.1,
    timeout: 180000            // 3 minutos para análisis de documentos
  },
  
  // Modelo para análisis de imágenes (screenshots, diagramas)
  image_analysis: {
    name: 'moondream',
    alias: 'moondream-auditorias',
    description: 'Moondream para análisis de imágenes técnicas',
    context_length: 2048,
    temperature: 0.2,
    timeout: 120000            // 2 minutos para análisis de imágenes
  }
};

// Cliente Axios configurado para Ollama
const ollamaClient = axios.create({
  baseURL: OLLAMA_BASE_URL,
  timeout: OLLAMA_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logging en desarrollo
if (NODE_ENV === 'development') {
  ollamaClient.interceptors.request.use(
    (config) => {
      console.log(`🤖 Ollama Request: ${config.method.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ Ollama Request Error:', error.message);
      return Promise.reject(error);
    }
  );
  
  ollamaClient.interceptors.response.use(
    (response) => {
      console.log(`✅ Ollama Response: ${response.status} ${response.statusText}`);
      return response;
    },
    (error) => {
      console.error('❌ Ollama Response Error:', error.response?.status, error.message);
      return Promise.reject(error);
    }
  );
}

/**
 * Función para verificar si Ollama está ejecutándose
 */
const checkOllamaHealth = async () => {
  try {
    console.log('🔍 Verificando estado de Ollama...');
    
    const response = await ollamaClient.get('/api/tags');
    const availableModels = response.data.models || [];
    
    console.log('✅ Ollama está ejecutándose');
    console.log(`📋 Modelos disponibles: ${availableModels.length}`);
    
    return {
      status: 'healthy',
      available_models: availableModels.map(m => m.name),
      ollama_version: response.headers['ollama-version'] || 'unknown'
    };
  } catch (error) {
    console.error('❌ Ollama no está disponible:', error.message);
    
    // Sugerencias de troubleshooting
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Sugerencia: Ejecutar "ollama serve" en terminal');
    }
    
    return {
      status: 'unhealthy',
      error: error.message,
      available_models: []
    };
  }
};

/**
 * Función para verificar y instalar modelos necesarios
 */
const ensureModelsAvailable = async () => {
  try {
    const health = await checkOllamaHealth();
    
    if (health.status !== 'healthy') {
      throw new Error('Ollama no está disponible');
    }
    
    const requiredModels = Object.values(MODELS_CONFIG).map(m => m.name);
    const availableModels = health.available_models;
    const missingModels = requiredModels.filter(model => 
      !availableModels.some(available => available.includes(model.split(':')[0]))
    );
    
    if (missingModels.length > 0) {
      console.log(`⚠️  Modelos faltantes: ${missingModels.join(', ')}`);
      console.log('📥 Para instalar los modelos ejecuta:');
      missingModels.forEach(model => {
        console.log(`   ollama pull ${model}`);
      });
      
      return {
        status: 'models_missing',
        missing_models: missingModels,
        available_models: availableModels
      };
    }
    
    console.log('✅ Todos los modelos requeridos están disponibles');
    return {
      status: 'ready',
      available_models: availableModels
    };
    
  } catch (error) {
    console.error('❌ Error verificando modelos:', error.message);
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * Función para generar respuesta de IA con configuración optimizada
 */
const generateResponse = async (model, prompt, options = {}) => {
  try {
    const modelConfig = MODELS_CONFIG[model] || MODELS_CONFIG.text_analysis;
    
    const requestData = {
      model: modelConfig.name,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || modelConfig.temperature,
        top_p: options.top_p || modelConfig.top_p,
        top_k: options.top_k || modelConfig.top_k,
        repeat_penalty: options.repeat_penalty || modelConfig.repeat_penalty,
        num_ctx: options.context_length || modelConfig.context_length
      }
    };
    
    console.log(`🤖 Generando respuesta con ${modelConfig.name}...`);
    const startTime = Date.now();
    
    const response = await ollamaClient.post('/api/generate', requestData, {
      timeout: modelConfig.timeout
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Respuesta generada en ${duration}ms`);
    
    return {
      response: response.data.response,
      model: modelConfig.name,
      duration_ms: duration,
      tokens_evaluated: response.data.eval_count,
      tokens_per_second: response.data.eval_count / (duration / 1000)
    };
    
  } catch (error) {
    console.error(`❌ Error generando respuesta con ${model}:`, error.message);
    
    // Manejo específico de errores
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama no está ejecutándose. Ejecuta "ollama serve"');
    }
    if (error.response?.status === 404) {
      throw new Error(`Modelo ${model} no encontrado. Ejecuta "ollama pull ${MODELS_CONFIG[model]?.name}"`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout en generación de respuesta. El documento puede ser muy complejo');
    }
    
    throw error;
  }
};

/**
 * Función para análisis de texto con LLaMA optimizado
 */
const analyzeText = async (text, analysisType = 'general', options = {}) => {
  try {
    const maxRetries = options.retries || OLLAMA_MAX_RETRIES;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await generateResponse('text_analysis', text, {
          ...options,
          temperature: 0.1 // Muy baja para análisis técnico preciso
        });
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`⚠️  Intento ${attempt} falló, reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  } catch (error) {
    console.error('❌ Error en análisis de texto:', error.message);
    throw error;
  }
};

/**
 * Función para análisis de imágenes con Moondream
 */
const analyzeImage = async (imageData, analysisType = 'general', options = {}) => {
  try {
    const maxRetries = options.retries || OLLAMA_MAX_RETRIES;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Convertir imagen a base64 si es necesario
        const base64Image = typeof imageData === 'string' 
          ? imageData 
          : Buffer.from(imageData).toString('base64');
        
        const requestData = {
          model: MODELS_CONFIG.image_analysis.name,
          prompt: options.prompt || 'Describe esta imagen técnica en detalle',
          images: [base64Image],
          stream: false,
          options: {
            temperature: options.temperature || MODELS_CONFIG.image_analysis.temperature
          }
        };
        
        console.log(`📸 Analizando imagen con ${MODELS_CONFIG.image_analysis.name}...`);
        const startTime = Date.now();
        
        const response = await ollamaClient.post('/api/generate', requestData, {
          timeout: MODELS_CONFIG.image_analysis.timeout
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ Imagen analizada en ${duration}ms`);
        
        return {
          response: response.data.response,
          model: MODELS_CONFIG.image_analysis.name,
          duration_ms: duration,
          analysis_type: analysisType
        };
        
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⚠️  Intento ${attempt} falló, reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  } catch (error) {
    console.error('❌ Error en análisis de imagen:', error.message);
    throw error;
  }
};

/**
 * Función para obtener información detallada de un modelo
 */
const getModelInfo = async (modelName) => {
  try {
    const response = await ollamaClient.post('/api/show', {
      name: modelName
    });
    
    return {
      name: response.data.modelfile,
      parameters: response.data.parameters,
      template: response.data.template,
      details: response.data.details,
      model_info: response.data.model_info
    };
  } catch (error) {
    console.error(`❌ Error obteniendo info del modelo ${modelName}:`, error.message);
    return null;
  }
};

/**
 * Función para obtener estadísticas de rendimiento de Ollama
 */
const getOllamaStats = async () => {
  try {
    const health = await checkOllamaHealth();
    
    if (health.status !== 'healthy') {
      return { status: 'unavailable', ...health };
    }
    
    // Obtener información de cada modelo
    const modelStats = {};
    for (const [key, config] of Object.entries(MODELS_CONFIG)) {
      const modelInfo = await getModelInfo(config.name);
      if (modelInfo) {
        modelStats[key] = {
          name: config.name,
          alias: config.alias,
          status: 'available',
          details: modelInfo.details
        };
      } else {
        modelStats[key] = {
          name: config.name,
          alias: config.alias,
          status: 'not_found'
        };
      }
    }
    
    return {
      status: 'healthy',
      ollama_version: health.ollama_version,
      models: modelStats,
      connection: {
        host: OLLAMA_HOST,
        port: OLLAMA_PORT,
        timeout: OLLAMA_TIMEOUT
      }
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas Ollama:', error.message);
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * Función para simular respuesta cuando Ollama no está disponible
 * Útil para desarrollo y testing sin dependencia de IA
 */
const simulateResponse = (analysisType, content) => {
  console.log('🎭 Generando respuesta simulada (Ollama no disponible)');
  
  const simulatedResponses = {
    document_compliance: {
      cumplimiento_tecnico: 85,
      aspectos_positivos: [
        'Documento presenta estructura técnica adecuada',
        'Información de hardware está detallada',
        'Especificaciones de software están completas'
      ],
      aspectos_mejora: [
        'Algunos campos requieren mayor especificidad',
        'Faltan algunos detalles de configuración'
      ],
      score_total: 85
    },
    
    security_analysis: {
      nivel_seguridad: 78,
      controles_identificados: [
        'Antivirus configurado correctamente',
        'Sistema operativo actualizado',
        'Configuraciones de red seguras'
      ],
      vulnerabilidades: [
        'Algunos puertos pueden requerir revisión',
        'Configuración de firewall necesita validación'
      ],
      score_total: 78
    },
    
    image_analysis: {
      elementos_detectados: [
        'Interfaz de configuración visible',
        'Elementos de sistema identificados',
        'Pantalla de diagnóstico mostrada'
      ],
      calidad_imagen: 'Buena resolución y claridad',
      score_total: 80
    },
    
    general: {
      resumen: 'Análisis completado con datos simulados',
      score_total: 75,
      notas: 'Respuesta generada en modo fallback'
    }
  };
  
  return {
    response: JSON.stringify(simulatedResponses[analysisType] || simulatedResponses.general),
    model: 'simulado',
    duration_ms: 100,
    simulated: true,
    timestamp: new Date().toISOString()
  };
};

/**
 * Configuración de prompts optimizados para auditorías técnicas
 */
const AUDIT_PROMPTS = {
  document_analysis: {
    compliance: `Analiza el siguiente documento técnico desde la perspectiva de cumplimiento para auditorías de call center. 
Evalúa:
1. Completitud de especificaciones técnicas
2. Cumplimiento de estándares mínimos
3. Claridad y precisión de la información
4. Aspectos que requieren mejora

Devuelve un JSON con: cumplimiento_tecnico (0-100), aspectos_positivos[], aspectos_mejora[], score_total.

Documento a analizar:\n`,
    
    security: `Evalúa la seguridad técnica del siguiente documento de auditoría de call center.
Analiza:
1. Configuraciones de seguridad implementadas
2. Controles de acceso y autenticación
3. Protección de datos y privacidad
4. Vulnerabilidades potenciales

Devuelve un JSON con: nivel_seguridad (0-100), controles_identificados[], vulnerabilidades[], score_total.

Documento:\n`,
    
    infrastructure: `Revisa la infraestructura técnica descrita en el documento de auditoría.
Evalúa:
1. Capacidad y rendimiento del hardware
2. Configuración y compatibilidad del software
3. Conectividad y redes
4. Escalabilidad y disponibilidad

Devuelve un JSON con: capacidad_infraestructura (0-100), puntos_fuertes[], areas_mejora[], score_total.

Documento:\n`
  },
  
  image_analysis: {
    screenshot: `Analiza esta captura de pantalla de un sistema de call center.
Identifica:
1. Elementos de interfaz visibles
2. Configuraciones mostradas
3. Estado del sistema
4. Posibles problemas o alertas

Devuelve un JSON con: elementos_detectados[], configuraciones[], estado_sistema, score_total (0-100).`,
    
    diagram: `Examina este diagrama técnico de infraestructura de call center.
Analiza:
1. Arquitectura y componentes
2. Conexiones y flujos de datos
3. Puntos críticos identificados
4. Conformidad con buenas prácticas

Devuelve un JSON con: componentes[], arquitectura_score (0-100), puntos_criticos[], recomendaciones[].`,
    
    equipment: `Analiza esta imagen de equipamiento técnico de call center.
Evalúa:
1. Estado físico del equipamiento
2. Configuración y conexiones
3. Etiquetado y documentación
4. Cumplimiento de estándares

Devuelve un JSON con: estado_fisico (0-100), configuracion_correcta, observaciones[], score_total.`
  }
};

module.exports = {
  // Configuraciones principales
  OLLAMA_BASE_URL,
  MODELS_CONFIG,
  AUDIT_PROMPTS,
  
  // Funciones de gestión
  checkOllamaHealth,
  ensureModelsAvailable,
  getOllamaStats,
  getModelInfo,
  
  // Funciones de análisis
  generateResponse,
  analyzeText,
  analyzeImage,
  simulateResponse,
  
  // Cliente Axios configurado
  ollamaClient,
  
  // Utilidades
  isOllamaAvailable: async () => {
    try {
      const health = await checkOllamaHealth();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  },
  
  // Configuración para otros módulos
  config: {
    host: OLLAMA_HOST,
    port: OLLAMA_PORT,
    timeout: OLLAMA_TIMEOUT,
    models: MODELS_CONFIG
  }
};
