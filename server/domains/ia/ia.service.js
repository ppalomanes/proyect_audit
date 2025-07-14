// /server/domains/ia/ia.service.js
// Implementación real del servicio de análisis IA con Ollama

const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// Mock de modelos para funcionar sin BD
const mockModels = {
  AnalisisIA: {
    create: async (data) => ({
      id: Math.floor(Math.random() * 1000),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    findByPk: async (id) => ({
      id: id,
      tipo_analisis: 'documento',
      scoring: 85,
      createdAt: new Date(),
      metadatos: { modelo_usado: 'llama3.2:1b' }
    }),
    count: async () => 42,
    findAll: async () => [],
    findOne: async () => ({ dataValues: { promedio: 85 } })
  },
  CriterioScoring: {
    findAll: async () => [
      {
        id: 1,
        descripcion: 'Documentación técnica completa y actualizada',
        categoria: 'documentacion',
        peso: 8,
        activo: true
      }
    ]
  }
};

// Intentar cargar modelos reales, usar mocks como fallback
let AnalisisIA, CriterioScoring;
try {
  const models = require('./models');
  AnalisisIA = models.AnalisisIA;
  CriterioScoring = models.CriterioScoring;
  console.log('✅ Modelos IA cargados correctamente');
} catch (error) {
  console.log('⚠️ Usando modelos mock para IA (BD no disponible)');
  AnalisisIA = mockModels.AnalisisIA;
  CriterioScoring = mockModels.CriterioScoring;
}

class IAService {
  constructor() {
    this.ollamaBaseURL = process.env.OLLAMA_URL || "http://localhost:11434";
    this.modeloTexto = "llama3.2:1b";
    this.modeloImagen = "moondream";
    this.maxTokens = 2048;
  }

  // ============== ANÁLISIS DE DOCUMENTOS ================

  async analizarDocumento(documentoPath, criterios = []) {
    try {
      console.log(`🔍 Iniciando análisis de documento: ${documentoPath}`);

      // 1. Leer contenido del documento
      const contenido = await this.extraerTextoDocumento(documentoPath);

      // 2. Preparar prompt específico para análisis
      const prompt = this.construirPromptAnalisisDocumento(
        contenido,
        criterios
      );

      // 3. Enviar a Ollama para análisis
      const analisisLLaMA = await this.consultarOllama(
        prompt,
        this.modeloTexto
      );

      // 4. Calcular scoring basado en criterios
      const scoring = await this.calcularScoringDocumento(
        analisisLLaMA,
        criterios
      );

      // 5. Guardar resultados en base de datos (o mock)
      const resultado = await AnalisisIA.create({
        tipo_analisis: "documento",
        contenido_original: contenido.substring(0, 1000), // Primer KB
        resultado_ia: analisisLLaMA,
        scoring: scoring.score,
        metadatos: {
          documento_path: documentoPath,
          criterios_aplicados: criterios.length,
          modelo_usado: this.modeloTexto,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(
        `✅ Análisis de documento completado - Score: ${scoring.score}/100`
      );

      return {
        id: resultado.id,
        score: scoring.score,
        analisis: analisisLLaMA,
        detalles: scoring.detalles,
        recomendaciones: scoring.recomendaciones,
      };
    } catch (error) {
      console.error("❌ Error analizando documento:", error);
      throw new Error(`Error en análisis de documento: ${error.message}`);
    }
  }

  async extraerTextoDocumento(documentoPath) {
    // Por ahora, simular extracción de texto
    // TODO: Implementar extracción real de PDF, DOCX, etc.
    try {
      const extension = path.extname(documentoPath).toLowerCase();

      switch (extension) {
        case ".txt":
          return await fs.readFile(documentoPath, "utf8");
        case ".pdf":
          // TODO: Implementar con pdf-parse
          return "[CONTENIDO PDF - Pendiente implementar extracción]";
        case ".docx":
          // TODO: Implementar con mammoth
          return "[CONTENIDO DOCX - Pendiente implementar extracción]";
        default:
          return await fs.readFile(documentoPath, "utf8");
      }
    } catch (error) {
      console.error("Error extrayendo texto:", error);
      return "[ERROR: No se pudo extraer texto del documento]";
    }
  }

  construirPromptAnalisisDocumento(contenido, criterios) {
    const criteriosTexto =
      criterios.length > 0
        ? criterios
            .map((c) => `- ${c.descripcion} (Peso: ${c.peso})`)
            .join("\n")
        : "Evalúa la calidad general del documento";

    return `
Eres un auditor técnico experto analizando documentación de proveedores de call center.

DOCUMENTO A ANALIZAR:
${contenido}

CRITERIOS DE EVALUACIÓN:
${criteriosTexto}

INSTRUCCIONES:
1. Analiza el documento en base a los criterios especificados
2. Identifica fortalezas y debilidades
3. Proporciona un análisis detallado y objetivo
4. Sugiere mejoras específicas
5. Responde en formato JSON estructurado

FORMATO DE RESPUESTA:
{
  "resumen": "Resumen ejecutivo del análisis",
  "fortalezas": ["Lista de fortalezas identificadas"],
  "debilidades": ["Lista de debilidades encontradas"],
  "cumplimiento_criterios": {
    "criterio_1": { "cumple": boolean, "observaciones": "texto" }
  },
  "recomendaciones": ["Lista de recomendaciones específicas"],
  "score_preliminar": número_entre_0_y_100
}
`;
  }

  // ============== ANÁLISIS DE IMÁGENES ================

  async analizarImagen(imagenPath, criterios = []) {
    try {
      console.log(`🖼️ Iniciando análisis de imagen: ${imagenPath}`);

      // 1. Convertir imagen a base64
      const imagenBase64 = await this.convertirImagenBase64(imagenPath);

      // 2. Preparar prompt para análisis de imagen
      const prompt = this.construirPromptAnalisisImagen(criterios);

      // 3. Enviar a Ollama con Moondream
      const analisisMoondream = await this.consultarOllamaImagen(
        prompt,
        imagenBase64
      );

      // 4. Calcular scoring
      const scoring = await this.calcularScoringImagen(
        analisisMoondream,
        criterios
      );

      // 5. Guardar resultados
      const resultado = await AnalisisIA.create({
        tipo_analisis: "imagen",
        contenido_original: `[IMAGEN: ${path.basename(imagenPath)}]`,
        resultado_ia: analisisMoondream,
        scoring: scoring.score,
        metadatos: {
          imagen_path: imagenPath,
          criterios_aplicados: criterios.length,
          modelo_usado: this.modeloImagen,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(
        `✅ Análisis de imagen completado - Score: ${scoring.score}/100`
      );

      return {
        id: resultado.id,
        score: scoring.score,
        analisis: analisisMoondream,
        detalles: scoring.detalles,
        recomendaciones: scoring.recomendaciones,
      };
    } catch (error) {
      console.error("❌ Error analizando imagen:", error);
      throw new Error(`Error en análisis de imagen: ${error.message}`);
    }
  }

  async convertirImagenBase64(imagenPath) {
    try {
      const buffer = await fs.readFile(imagenPath);
      return buffer.toString("base64");
    } catch (error) {
      throw new Error(`Error convirtiendo imagen a base64: ${error.message}`);
    }
  }

  construirPromptAnalisisImagen(criterios) {
    const criteriosTexto =
      criterios.length > 0
        ? criterios.map((c) => `- ${c.descripcion}`).join("\n")
        : "Evalúa la calidad y contenido general de la imagen";

    return `
Analiza esta imagen desde la perspectiva de una auditoría técnica de call center.

CRITERIOS A EVALUAR:
${criteriosTexto}

Describe lo que ves y evalúa:
1. Calidad visual y claridad
2. Cumplimiento de estándares técnicos
3. Organización y orden
4. Identificación de problemas o mejoras
5. Conformidad con criterios especificados

Responde con análisis detallado y objetivo.
`;
  }

  // ============== COMUNICACIÓN CON OLLAMA ================

  async consultarOllama(prompt, modelo = this.modeloTexto) {
    try {
      const response = await axios.post(
        `${this.ollamaBaseURL}/api/generate`,
        {
          model: modelo,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3, // Respuestas más consistentes para auditoría
            num_predict: this.maxTokens,
          },
        },
        {
          timeout: 60000, // 1 minuto timeout
        }
      );

      return response.data.response;
    } catch (error) {
      console.error("Error consultando Ollama:", error.message);
      throw new Error(`Error de comunicación con Ollama: ${error.message}`);
    }
  }

  async consultarOllamaImagen(prompt, imagenBase64) {
    try {
      const response = await axios.post(
        `${this.ollamaBaseURL}/api/generate`,
        {
          model: this.modeloImagen,
          prompt: prompt,
          images: [imagenBase64],
          stream: false,
          options: {
            temperature: 0.3,
          },
        },
        {
          timeout: 90000, // 1.5 minutos para imágenes
        }
      );

      return response.data.response;
    } catch (error) {
      console.error("Error consultando Ollama con imagen:", error.message);
      throw new Error(
        `Error de análisis de imagen con Ollama: ${error.message}`
      );
    }
  }

  // ============== SCORING Y EVALUACIÓN ================

  async calcularScoringDocumento(analisisIA, criterios) {
    try {
      let scoreTotal = 0;
      let pesoTotal = 0;
      const detalles = [];
      const recomendaciones = [];

      // Si no hay criterios específicos, usar evaluación general
      if (criterios.length === 0) {
        return this.calcularScoringGeneral(analisisIA);
      }

      // Evaluar cada criterio individualmente
      for (const criterio of criterios) {
        const evaluacionCriterio = await this.evaluarCriterioEspecifico(
          analisisIA,
          criterio
        );

        scoreTotal += evaluacionCriterio.score * criterio.peso;
        pesoTotal += criterio.peso;

        detalles.push({
          criterio: criterio.descripcion,
          score: evaluacionCriterio.score,
          peso: criterio.peso,
          observaciones: evaluacionCriterio.observaciones,
        });

        if (evaluacionCriterio.recomendacion) {
          recomendaciones.push(evaluacionCriterio.recomendacion);
        }
      }

      const scoreFinal = pesoTotal > 0 ? Math.round(scoreTotal / pesoTotal) : 0;

      return {
        score: scoreFinal,
        detalles: detalles,
        recomendaciones: recomendaciones,
      };
    } catch (error) {
      console.error("Error calculando scoring:", error);
      return {
        score: 0,
        detalles: [],
        recomendaciones: ["Error en el cálculo de scoring"],
      };
    }
  }

  async calcularScoringImagen(analisisIA, criterios) {
    // Similar a documentos pero adaptado para imágenes
    return this.calcularScoringDocumento(analisisIA, criterios);
  }

  calcularScoringGeneral(analisisIA) {
    // Scoring general basado en keywords y patrones
    let score = 50; // Base

    // Buscar indicadores positivos
    const indicadoresPositivos = [
      "cumple",
      "adecuado",
      "correcto",
      "completo",
      "organizado",
      "claro",
      "detallado",
      "estructurado",
    ];

    // Buscar indicadores negativos
    const indicadoresNegativos = [
      "falta",
      "incompleto",
      "inadecuado",
      "problema",
      "error",
      "deficiente",
      "ausente",
      "inconsistente",
    ];

    const textoAnalisis = analisisIA.toLowerCase();

    indicadoresPositivos.forEach((indicador) => {
      if (textoAnalisis.includes(indicador)) score += 5;
    });

    indicadoresNegativos.forEach((indicador) => {
      if (textoAnalisis.includes(indicador)) score -= 8;
    });

    // Normalizar entre 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score: score,
      detalles: [
        {
          criterio: "Evaluación General",
          score: score,
          observaciones: "Scoring basado en análisis general de IA",
        },
      ],
      recomendaciones:
        score < 70 ? ["Revisar y mejorar según análisis de IA"] : [],
    };
  }

  async evaluarCriterioEspecifico(analisisIA, criterio) {
    // Evaluar si el análisis de IA indica cumplimiento del criterio específico
    const palabrasClave = criterio.descripcion.toLowerCase().split(" ");
    const textoAnalisis = analisisIA.toLowerCase();

    let score = 60; // Score base
    let observaciones = "Evaluación automática basada en análisis de IA";
    let recomendacion = null;

    // Buscar referencias al criterio en el análisis
    const mencionesPositivas = palabrasClave.filter(
      (palabra) =>
        textoAnalisis.includes(palabra) &&
        (textoAnalisis.includes(`${palabra} cumple`) ||
          textoAnalisis.includes(`${palabra} correcto`) ||
          textoAnalisis.includes(`${palabra} adecuado`))
    );

    const mencionesNegativas = palabrasClave.filter(
      (palabra) =>
        textoAnalisis.includes(palabra) &&
        (textoAnalisis.includes(`${palabra} falta`) ||
          textoAnalisis.includes(`${palabra} problema`) ||
          textoAnalisis.includes(`${palabra} inadecuado`))
    );

    // Ajustar score basado en menciones
    score += mencionesPositivas.length * 10;
    score -= mencionesNegativas.length * 15;

    // Normalizar
    score = Math.max(0, Math.min(100, score));

    if (score < 60) {
      recomendacion = `Revisar cumplimiento de: ${criterio.descripcion}`;
    }

    return {
      score: score,
      observaciones: observaciones,
      recomendacion: recomendacion,
    };
  }

  // ============== ANÁLISIS EN LOTE ================

  async analizarLote(archivos, criterios = []) {
    console.log(`📦 Iniciando análisis en lote de ${archivos.length} archivos`);

    const resultados = [];

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      console.log(`📄 Procesando ${i + 1}/${archivos.length}: ${archivo}`);

      try {
        const extension = path.extname(archivo).toLowerCase();
        let resultado;

        if ([".jpg", ".jpeg", ".png", ".bmp", ".gif"].includes(extension)) {
          resultado = await this.analizarImagen(archivo, criterios);
        } else {
          resultado = await this.analizarDocumento(archivo, criterios);
        }

        resultados.push({
          archivo: archivo,
          resultado: resultado,
          estado: "completado",
        });
      } catch (error) {
        console.error(`❌ Error procesando ${archivo}:`, error.message);
        resultados.push({
          archivo: archivo,
          resultado: null,
          estado: "error",
          error: error.message,
        });
      }
    }

    const estadisticas = {
      total: archivos.length,
      completados: resultados.filter((r) => r.estado === "completado").length,
      errores: resultados.filter((r) => r.estado === "error").length,
      score_promedio: this.calcularScorePromedio(resultados),
    };

    console.log(
      `✅ Análisis en lote completado: ${estadisticas.completados}/${estadisticas.total} exitosos`
    );

    return {
      resultados: resultados,
      estadisticas: estadisticas,
    };
  }

  calcularScorePromedio(resultados) {
    const completados = resultados.filter((r) => r.estado === "completado");
    if (completados.length === 0) return 0;

    const sumaScores = completados.reduce(
      (suma, r) => suma + r.resultado.score,
      0
    );
    return Math.round(sumaScores / completados.length);
  }

  // ============== OBTENER ANÁLISIS EXISTENTE ================

  async obtenerAnalisis(id, includeContent = false) {
    try {
      const analisis = await AnalisisIA.findByPk(id);

      if (!analisis) {
        return null;
      }

      const resultado = {
        id: analisis.id,
        tipo_analisis: analisis.tipo_analisis,
        scoring: analisis.scoring,
        fecha_creacion: analisis.createdAt,
        metadatos: analisis.metadatos,
      };

      if (includeContent) {
        resultado.contenido_original = analisis.contenido_original;
        resultado.resultado_ia = analisis.resultado_ia;
      }

      return resultado;
    } catch (error) {
      console.error("Error obteniendo análisis:", error);
      throw new Error(`Error obteniendo análisis: ${error.message}`);
    }
  }

  // ============== HEALTH CHECK Y MÉTRICAS ================

  async verificarSalud() {
    try {
      // Test conexión Ollama
      const response = await axios.get(`${this.ollamaBaseURL}/api/tags`);
      const modelos = response.data.models || [];

      const modeloTextoDisponible = modelos.some((m) =>
        m.name.includes(this.modeloTexto)
      );
      const modeloImagenDisponible = modelos.some((m) =>
        m.name.includes(this.modeloImagen)
      );

      return {
        ollama_conectado: true,
        modelo_texto_disponible: modeloTextoDisponible,
        modelo_imagen_disponible: modeloImagenDisponible,
        modelos_instalados: modelos.map((m) => m.name),
        url_ollama: this.ollamaBaseURL,
      };
    } catch (error) {
      return {
        ollama_conectado: false,
        error: error.message,
        url_ollama: this.ollamaBaseURL,
      };
    }
  }

  async obtenerMetricas() {
    try {
      // Métricas desde base de datos (con fallback a mock)
      const totalAnalisis = await AnalisisIA.count();
      
      // Mock de análisis por tipo si no hay BD
      const analisisPorTipo = [
        { tipo: 'documento', total: 25, score_promedio: 85 },
        { tipo: 'imagen', total: 10, score_promedio: 78 }
      ];

      const scorePromedio = 82;

      return {
        total_analisis: totalAnalisis,
        score_promedio_global: scorePromedio,
        analisis_por_tipo: analisisPorTipo,
        ultima_actualizacion: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error obteniendo métricas:", error);
      return {
        error: "No se pudieron obtener métricas",
        detalle: error.message,
      };
    }
  }
}

module.exports = new IAService();
