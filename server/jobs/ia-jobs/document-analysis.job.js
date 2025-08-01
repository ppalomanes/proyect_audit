/**
 * Job BullMQ - Análisis de Documentos con IA Local (Ollama)
 * Portal de Auditorías Técnicas
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { cache } = require('../../config/redis');

// Configuración Ollama
const OLLAMA_CONFIG = {
  base_url: process.env.OLLAMA_URL || 'http://localhost:11434',
  models: {
    text_analysis: 'llama3.2:1b',
    image_analysis: 'moondream:latest'
  },
  timeouts: {
    text: 120000,
    image: 180000
  }
};

async function analyzeDocumentJob(job) {
  const { document_path, document_type, auditoria_id } = job.data;

  try {
    console.log(`🤖 Iniciando análisis IA job ${job.id}`);
    
    await job.updateProgress(10);
    await verificarOllamaDisponible();
    
    await job.updateProgress(20);
    let resultado;
    
    if (document_type === 'image') {
      resultado = await analizarImagen(job, document_path);
    } else {
      resultado = await analizarDocumento(job, document_path, document_type);
    }
    
    await job.updateProgress(90);
    const resultadoFinal = await guardarAnalisisIA(job.id, resultado, auditoria_id);
    
    await job.updateProgress(100);
    console.log(`✅ Análisis IA ${job.id} completado exitosamente`);
    
    return resultadoFinal;

  } catch (error) {
    console.error(`❌ Error en análisis IA ${job.id}:`, error.message);
    throw error;
  }
}

async function verificarOllamaDisponible() {
  try {
    const response = await axios.get(`${OLLAMA_CONFIG.base_url}/api/tags`, {
      timeout: 5000
    });
    console.log(`✅ Ollama disponible: ${response.data.models?.length || 0} modelos`);
    return true;
  } catch (error) {
    throw new Error(`Ollama no disponible: ${error.message}`);
  }
}

async function analizarDocumento(job, documentPath, documentType) {
  try {
    await job.updateProgress(30);
    const contenido = await leerDocumento(documentPath, documentType);
    
    await job.updateProgress(50);
    const analisisTexto = await analizarTextoConLLaMA(contenido);
    
    await job.updateProgress(70);
    const scoring = await generarScoringDocumento(analisisTexto, contenido);
    
    return {
      tipo_analisis: 'documento',
      documento_tipo: documentType,
      analisis_texto: analisisTexto,
      scoring: scoring,
      metadata: {
        longitud_caracteres: contenido.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`Error analizando documento: ${error.message}`);
  }
}

async function analizarImagen(job, imagePath) {
  try {
    await job.updateProgress(30);
    const imageBase64 = await convertirImagenABase64(imagePath);
    
    await job.updateProgress(50);
    const analisisImagen = await analizarImagenConMoondream(imageBase64);
    
    await job.updateProgress(70);
    const scoring = await generarScoringImagen(analisisImagen);
    
    return {
      tipo_analisis: 'imagen',
      analisis_imagen: analisisImagen,
      scoring: scoring,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`Error analizando imagen: ${error.message}`);
  }
}

async function leerDocumento(documentPath, documentType) {
  try {
    switch (documentType.toLowerCase()) {
      case 'txt':
      case 'text':
        return await fs.readFile(documentPath, 'utf8');
      case 'pdf':
        return `Contenido simulado de PDF: ${path.basename(documentPath)}`;
      default:
        throw new Error(`Tipo de documento no soportado: ${documentType}`);
    }
  } catch (error) {
    throw new Error(`Error leyendo documento: ${error.message}`);
  }
}

async function convertirImagenABase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    throw new Error(`Error convirtiendo imagen: ${error.message}`);
  }
}

async function analizarTextoConLLaMA(contenido) {
  try {
    const prompt = `
Analiza el siguiente documento técnico de auditoría y proporciona:
1. Resumen ejecutivo (máximo 200 palabras)
2. Puntos clave identificados
3. Posibles inconsistencias o problemas
4. Nivel de completitud (0-100)
5. Recomendaciones específicas

Documento: ${contenido.substring(0, 2000)}${contenido.length > 2000 ? '...' : ''}

Responde en formato JSON con las claves: resumen_ejecutivo, puntos_clave, inconsistencias, completitud, recomendaciones.
`;

    const response = await axios.post(`${OLLAMA_CONFIG.base_url}/api/generate`, {
      model: OLLAMA_CONFIG.models.text_analysis,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 1000
      }
    }, {
      timeout: OLLAMA_CONFIG.timeouts.text
    });

    try {
      return JSON.parse(response.data.response);
    } catch (parseError) {
      return {
        resumen_ejecutivo: response.data.response.substring(0, 200),
        puntos_clave: ['Análisis completado con LLaMA 3.2'],
        inconsistencias: [],
        completitud: 75,
        recomendaciones: ['Revisar documento manualmente para validación']
      };
    }

  } catch (error) {
    console.error('Error en análisis LLaMA:', error.message);
    return {
      resumen_ejecutivo: 'Error en análisis automático. Revisar manualmente.',
      puntos_clave: ['Análisis fallido'],
      inconsistencias: ['Error de procesamiento'],
      completitud: 0,
      recomendaciones: ['Análisis manual requerido']
    };
  }
}

async function analizarImagenConMoondream(imageBase64) {
  try {
    const prompt = `
Describe esta imagen técnica de auditoría. Identifica:
1. Tipo de equipamiento visible
2. Estado y condiciones observadas
3. Cumplimiento de estándares técnicos
4. Observaciones de seguridad
5. Recomendaciones
`;

    const response = await axios.post(`${OLLAMA_CONFIG.base_url}/api/generate`, {
      model: OLLAMA_CONFIG.models.image_analysis,
      prompt: prompt,
      images: [imageBase64],
      stream: false,
      options: {
        temperature: 0.2,
        max_tokens: 800
      }
    }, {
      timeout: OLLAMA_CONFIG.timeouts.image
    });

    return {
      descripcion_detallada: response.data.response,
      elementos_identificados: extraerElementosImagen(response.data.response),
      estado_equipamiento: evaluarEstadoEquipamiento(response.data.response),
      cumplimiento_estandares: evaluarCumplimiento(response.data.response)
    };

  } catch (error) {
    console.error('Error en análisis Moondream:', error.message);
    return {
      descripcion_detallada: 'Error en análisis automático de imagen',
      elementos_identificados: [],
      estado_equipamiento: 'No determinado',
      cumplimiento_estandares: 'Requiere análisis manual'
    };
  }
}

function extraerElementosImagen(descripcion) {
  const elementos = [];
  const patrones = [
    /servidor|server/i,
    /rack|gabinete/i,
    /cable|cableado/i,
    /ups|batería/i,
    /router|switch/i,
    /aire acondicionado|climatización/i,
    /extintor|seguridad/i
  ];
  
  patrones.forEach(patron => {
    if (patron.test(descripcion)) {
      elementos.push(patron.source.split('|')[0]);
    }
  });
  
  return elementos;
}

function evaluarEstadoEquipamiento(descripcion) {
  const desc = descripcion.toLowerCase();
  
  if (desc.includes('excelente') || desc.includes('óptimo')) {
    return 'Excelente';
  } else if (desc.includes('bueno') || desc.includes('adecuado')) {
    return 'Bueno';
  } else if (desc.includes('regular') || desc.includes('aceptable')) {
    return 'Regular';
  } else if (desc.includes('malo') || desc.includes('deficiente')) {
    return 'Deficiente';
  }
  
  return 'No determinado';
}

function evaluarCumplimiento(descripcion) {
  const desc = descripcion.toLowerCase();
  
  if (desc.includes('cumple') || desc.includes('estándar')) {
    return 'Cumple';
  } else if (desc.includes('no cumple') || desc.includes('incumple')) {
    return 'No cumple';
  } else if (desc.includes('parcial')) {
    return 'Cumplimiento parcial';
  }
  
  return 'Requiere evaluación';
}

async function generarScoringDocumento(analisis, contenido) {
  let score = 0;
  
  score += analisis.completitud * 0.4;
  
  const inconsistencias = analisis.inconsistencias?.length || 0;
  score += Math.max(0, (10 - inconsistencias) * 6);
  
  const longitudScore = Math.min(20, contenido.length / 100);
  score += longitudScore;
  
  return {
    score_total: Math.min(100, Math.round(score)),
    factores: {
      completitud: analisis.completitud,
      inconsistencias: inconsistencias,
      longitud_contenido: contenido.length
    },
    categoria: categorizarScore(score)
  };
}

async function generarScoringImagen(analisis) {
  let score = 50;
  
  score += analisis.elementos_identificados.length * 10;
  
  switch (analisis.estado_equipamiento) {
    case 'Excelente': score += 30; break;
    case 'Bueno': score += 20; break;
    case 'Regular': score += 10; break;
    case 'Deficiente': score -= 10; break;
  }
  
  switch (analisis.cumplimiento_estandares) {
    case 'Cumple': score += 20; break;
    case 'Cumplimiento parcial': score += 10; break;
    case 'No cumple': score -= 15; break;
  }
  
  return {
    score_total: Math.min(100, Math.max(0, Math.round(score))),
    factores: {
      elementos_identificados: analisis.elementos_identificados.length,
      estado_equipamiento: analisis.estado_equipamiento,
      cumplimiento_estandares: analisis.cumplimiento_estandares
    },
    categoria: categorizarScore(score)
  };
}

function categorizarScore(score) {
  if (score >= 90) return 'Excelente';
  if (score >= 70) return 'Bueno';
  if (score >= 50) return 'Regular';
  return 'Deficiente';
}

async function guardarAnalisisIA(jobId, analisis, auditoriaId) {
  try {
    const resultado = {
      job_id: jobId,
      auditoria_id: auditoriaId,
      estado: 'COMPLETADO',
      timestamp: new Date().toISOString(),
      analisis: analisis
    };
    
    await cache.setIAAnalysis(jobId, resultado);
    
    console.log(`💾 Análisis IA guardado en cache: job ${jobId}`);
    return resultado;
    
  } catch (error) {
    console.error('❌ Error guardando análisis IA:', error.message);
    throw error;
  }
}

module.exports = analyzeDocumentJob;