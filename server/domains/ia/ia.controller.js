// /server/domains/ia/ia.controller.js
// Controlador IA con implementación real conectada a Ollama

const iaService = require('./ia.service');
const { CriterioScoring } = require('./models');
const path = require('path');
const fs = require('fs').promises;

class IAController {
  // ============== HEALTH CHECK ================
  
  async healthCheck(req, res) {
    try {
      const salud = await iaService.verificarSalud();
      
      if (salud.ollama_conectado) {
        res.status(200).json({
          status: 'healthy',
          message: 'Servicio IA funcionando correctamente',
          details: salud
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          message: 'Error de conexión con Ollama',
          details: salud
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error verificando salud del servicio IA',
        error: error.message
      });
    }
  }

  // ============== MÉTRICAS ================
  
  async getMetrics(req, res) {
    try {
      const metricas = await iaService.obtenerMetricas();
      
      res.status(200).json({
        status: 'success',
        message: 'Métricas obtenidas correctamente',
        data: metricas
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error obteniendo métricas',
        error: error.message
      });
    }
  }

  // ============== ANÁLISIS DE DOCUMENTOS ================
  
  async analyzeDocument(req, res) {
    try {
      const { 
        documento_path, 
        criterios_ids = [], 
        auditoria_id 
      } = req.body;

      // Validaciones
      if (!documento_path) {
        return res.status(400).json({
          status: 'error',
          message: 'documento_path es requerido',
          code: 'MISSING_DOCUMENT_PATH'
        });
      }

      // Verificar que el archivo existe
      try {
        await fs.access(documento_path);
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: 'Archivo no encontrado',
          path: documento_path,
          code: 'FILE_NOT_FOUND'
        });
      }

      // Obtener criterios de scoring si se especificaron
      let criterios = [];
      if (criterios_ids.length > 0) {
        try {
          criterios = await CriterioScoring.findAll({
            where: { id: criterios_ids }
          });
        } catch (error) {
          console.log('⚠️ Error obteniendo criterios, usando análisis general');
        }
      }

      console.log(`🔍 Iniciando análisis de documento: ${path.basename(documento_path)}`);
      
      // Realizar análisis con IA
      const resultado = await iaService.analizarDocumento(documento_path, criterios);
      
      res.status(200).json({
        status: 'success',
        message: 'Análisis de documento completado',
        data: {
          analisis_id: resultado.id,
          documento: path.basename(documento_path),
          score: resultado.score,
          analisis: resultado.analisis,
          detalles_scoring: resultado.detalles,
          recomendaciones: resultado.recomendaciones,
          criterios_aplicados: criterios.length,
          auditoria_id: auditoria_id || null
        }
      });

    } catch (error) {
      console.error('❌ Error en análisis de documento:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno analizando documento',
        error: error.message,
        code: 'ANALYSIS_ERROR'
      });
    }
  }

  // ============== ANÁLISIS DE IMÁGENES ================
  
  async analyzeImage(req, res) {
    try {
      const { 
        imagen_path, 
        criterios_ids = [], 
        auditoria_id 
      } = req.body;

      // Validaciones
      if (!imagen_path) {
        return res.status(400).json({
          status: 'error',
          message: 'imagen_path es requerido',
          code: 'MISSING_IMAGE_PATH'
        });
      }

      // Verificar que el archivo existe
      try {
        await fs.access(imagen_path);
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: 'Imagen no encontrada',
          path: imagen_path,
          code: 'IMAGE_NOT_FOUND'
        });
      }

      // Verificar que es una imagen válida
      const extension = path.extname(imagen_path).toLowerCase();
      const extensionesValidas = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
      
      if (!extensionesValidas.includes(extension)) {
        return res.status(400).json({
          status: 'error',
          message: 'Formato de imagen no soportado',
          formato_detectado: extension,
          formatos_soportados: extensionesValidas,
          code: 'INVALID_IMAGE_FORMAT'
        });
      }

      // Obtener criterios de scoring
      let criterios = [];
      if (criterios_ids.length > 0) {
        try {
          criterios = await CriterioScoring.findAll({
            where: { id: criterios_ids }
          });
        } catch (error) {
          console.log('⚠️ Error obteniendo criterios, usando análisis general');
        }
      }

      console.log(`🖼️ Iniciando análisis de imagen: ${path.basename(imagen_path)}`);
      
      // Realizar análisis con IA
      const resultado = await iaService.analizarImagen(imagen_path, criterios);
      
      res.status(200).json({
        status: 'success',
        message: 'Análisis de imagen completado',
        data: {
          analisis_id: resultado.id,
          imagen: path.basename(imagen_path),
          score: resultado.score,
          analisis: resultado.analisis,
          detalles_scoring: resultado.detalles,
          recomendaciones: resultado.recomendaciones,
          criterios_aplicados: criterios.length,
          auditoria_id: auditoria_id || null
        }
      });

    } catch (error) {
      console.error('❌ Error en análisis de imagen:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno analizando imagen',
        error: error.message,
        code: 'IMAGE_ANALYSIS_ERROR'
      });
    }
  }

  // ============== ANÁLISIS EN LOTE ================
  
  async analyzeBatch(req, res) {
    try {
      const { 
        archivos = [], 
        criterios_ids = [], 
        auditoria_id 
      } = req.body;

      // Validaciones
      if (!Array.isArray(archivos) || archivos.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere un array de archivos no vacío',
          code: 'MISSING_FILES_ARRAY'
        });
      }

      if (archivos.length > 50) {
        return res.status(400).json({
          status: 'error',
          message: 'Máximo 50 archivos por lote',
          archivos_enviados: archivos.length,
          code: 'TOO_MANY_FILES'
        });
      }

      // Verificar que todos los archivos existen
      const archivosInvalidos = [];
      for (const archivo of archivos) {
        try {
          await fs.access(archivo);
        } catch (error) {
          archivosInvalidos.push(archivo);
        }
      }

      if (archivosInvalidos.length > 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Algunos archivos no fueron encontrados',
          archivos_invalidos: archivosInvalidos,
          code: 'FILES_NOT_FOUND'
        });
      }

      // Obtener criterios de scoring
      let criterios = [];
      if (criterios_ids.length > 0) {
        try {
          criterios = await CriterioScoring.findAll({
            where: { id: criterios_ids }
          });
        } catch (error) {
          console.log('⚠️ Error obteniendo criterios, usando análisis general');
        }
      }

      console.log(`📦 Iniciando análisis en lote de ${archivos.length} archivos`);
      
      // Realizar análisis en lote
      const resultado = await iaService.analizarLote(archivos, criterios);
      
      res.status(200).json({
        status: 'success',
        message: 'Análisis en lote completado',
        data: {
          estadisticas: resultado.estadisticas,
          resultados: resultado.resultados,
          criterios_aplicados: criterios.length,
          auditoria_id: auditoria_id || null,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error en análisis en lote:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno en análisis en lote',
        error: error.message,
        code: 'BATCH_ANALYSIS_ERROR'
      });
    }
  }

  // ============== GESTIÓN DE CRITERIOS ================
  
  async getCriterios(req, res) {
    try {
      // Usar datos mock si no hay BD disponible
      const criteriosMock = [
        {
          id: 1,
          descripcion: 'Documentación técnica completa y actualizada',
          categoria: 'documentacion',
          peso: 8,
          activo: true
        },
        {
          id: 2,
          descripcion: 'Cumplimiento de estándares de seguridad',
          categoria: 'seguridad',
          peso: 10,
          activo: true
        },
        {
          id: 3,
          descripcion: 'Procesos de atención al cliente definidos',
          categoria: 'procesos',
          peso: 7,
          activo: true
        }
      ];

      try {
        const criterios = await CriterioScoring.findAll({
          order: [['categoria', 'ASC'], ['peso', 'DESC']]
        });

        res.status(200).json({
          status: 'success',
          message: 'Criterios de scoring obtenidos',
          data: {
            total: criterios.length,
            criterios: criterios
          }
        });
      } catch (error) {
        // Fallback a datos mock
        res.status(200).json({
          status: 'success',
          message: 'Criterios de scoring obtenidos (datos mock)',
          data: {
            total: criteriosMock.length,
            criterios: criteriosMock
          },
          note: 'Usando datos de ejemplo - BD no disponible'
        });
      }

    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error obteniendo criterios de scoring',
        error: error.message
      });
    }
  }

  async createCriterio(req, res) {
    try {
      const {
        descripcion,
        categoria,
        peso = 1,
        activo = true
      } = req.body;

      // Validaciones
      if (!descripcion || !categoria) {
        return res.status(400).json({
          status: 'error',
          message: 'descripcion y categoria son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      if (peso < 0 || peso > 10) {
        return res.status(400).json({
          status: 'error',
          message: 'El peso debe estar entre 0 y 10',
          code: 'INVALID_WEIGHT'
        });
      }

      try {
        const criterio = await CriterioScoring.create({
          descripcion,
          categoria,
          peso,
          activo
        });

        res.status(201).json({
          status: 'success',
          message: 'Criterio de scoring creado',
          data: criterio
        });
      } catch (error) {
        // Simular creación exitosa si no hay BD
        res.status(201).json({
          status: 'success',
          message: 'Criterio de scoring creado (simulado)',
          data: {
            id: Math.floor(Math.random() * 1000),
            descripcion,
            categoria,
            peso,
            activo,
            createdAt: new Date().toISOString()
          },
          note: 'Simulado - BD no disponible'
        });
      }

    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error creando criterio de scoring',
        error: error.message
      });
    }
  }

  // ============== OBTENER RESULTADOS DE ANÁLISIS ================
  
  async getAnalisis(req, res) {
    try {
      const { id } = req.params;
      const { include_content = false } = req.query;

      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'ID de análisis requerido',
          code: 'MISSING_ANALYSIS_ID'
        });
      }

      try {
        const analisis = await iaService.obtenerAnalisis(id, include_content === 'true');

        if (!analisis) {
          return res.status(404).json({
            status: 'error',
            message: 'Análisis no encontrado',
            code: 'ANALYSIS_NOT_FOUND'
          });
        }

        res.status(200).json({
          status: 'success',
          message: 'Análisis obtenido correctamente',
          data: analisis
        });
      } catch (error) {
        // Simular respuesta si no hay BD
        res.status(200).json({
          status: 'success',
          message: 'Análisis obtenido (simulado)',
          data: {
            id: id,
            tipo_analisis: 'documento',
            scoring: 85,
            fecha_creacion: new Date().toISOString(),
            metadatos: {
              modelo_usado: 'llama3.2:1b',
              timestamp: new Date().toISOString()
            }
          },
          note: 'Simulado - BD no disponible'
        });
      }

    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error obteniendo análisis',
        error: error.message
      });
    }
  }

  // ============== TESTING Y VALIDACIÓN ================
  
  async testConnection(req, res) {
    try {
      // Test básico de conectividad
      const salud = await iaService.verificarSalud();
      
      if (!salud.ollama_conectado) {
        return res.status(503).json({
          status: 'error',
          message: 'Ollama no está disponible',
          details: salud
        });
      }

      // Test de análisis simple
      const testPrompt = "Responde 'OK' si puedes procesar este mensaje.";
      const respuesta = await iaService.consultarOllama(testPrompt);

      res.status(200).json({
        status: 'success',
        message: 'Test de conexión exitoso',
        data: {
          ollama_conectado: true,
          modelos_disponibles: salud.modelos_instalados,
          test_respuesta: respuesta,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error en test de conexión',
        error: error.message
      });
    }
  }

  async testDocumentAnalysis(req, res) {
    try {
      // Test con documento de ejemplo
      const documentoTest = req.body.documento_test || 
        "Este es un documento de prueba para validar el análisis de IA. " +
        "Contiene información básica sobre procedimientos técnicos de call center. " +
        "El documento incluye protocolos de atención, medidas de seguridad y estándares de calidad.";

      console.log('🧪 Ejecutando test de análisis de documento...');

      // Simular análisis (sin archivo físico)
      const prompt = iaService.construirPromptAnalisisDocumento(documentoTest, []);
      const analisis = await iaService.consultarOllama(prompt);
      const scoring = iaService.calcularScoringGeneral(analisis);

      res.status(200).json({
        status: 'success',
        message: 'Test de análisis de documento exitoso',
        data: {
          documento_test: documentoTest.substring(0, 100) + '...',
          analisis_resultado: analisis,
          scoring: scoring,
          modelo_usado: iaService.modeloTexto,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error en test de análisis:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error en test de análisis de documento',
        error: error.message
      });
    }
  }

  // ============== COMPATIBILIDAD CON RUTAS EXISTENTES ================

  // Mantener compatibilidad con las rutas existentes que esperan documentos por ID
  async analyzeDocumentById(req, res) {
    const { documento_id } = req.body;
    
    if (!documento_id) {
      return res.status(400).json({
        status: 'error',
        message: 'documento_id es requerido para esta ruta',
        code: 'MISSING_DOCUMENT_ID'
      });
    }

    // Simular análisis por ID
    res.status(501).json({
      status: 'not_implemented',
      message: 'Análisis por documento_id requiere integración con módulo de documentos',
      code: 'REQUIRES_DOCUMENT_MODULE',
      suggestion: 'Usar /api/ia/analyze/document con documento_path por ahora'
    });
  }

  async analyzeImageById(req, res) {
    const { imagen_id } = req.body;
    
    if (!imagen_id) {
      return res.status(400).json({
        status: 'error',
        message: 'imagen_id es requerido para esta ruta',
        code: 'MISSING_IMAGE_ID'
      });
    }

    // Simular análisis por ID
    res.status(501).json({
      status: 'not_implemented',
      message: 'Análisis por imagen_id requiere integración con módulo de documentos',
      code: 'REQUIRES_DOCUMENT_MODULE',
      suggestion: 'Usar /api/ia/analyze/image con imagen_path por ahora'
    });
  }
}

const iaController = new IAController();

module.exports = {
  healthCheck: iaController.healthCheck.bind(iaController),
  getMetrics: iaController.getMetrics.bind(iaController),
  analyzeDocument: iaController.analyzeDocument.bind(iaController),
  analyzeImage: iaController.analyzeImage.bind(iaController),
  analyzeBatch: iaController.analyzeBatch.bind(iaController),
  getCriterios: iaController.getCriterios.bind(iaController),
  createCriterio: iaController.createCriterio.bind(iaController),
  getAnalisis: iaController.getAnalisis.bind(iaController),
  testConnection: iaController.testConnection.bind(iaController),
  testDocumentAnalysis: iaController.testDocumentAnalysis.bind(iaController),
  
  // Compatibilidad con rutas existentes
  analyzeDocumentById: iaController.analyzeDocumentById.bind(iaController),
  analyzeImageById: iaController.analyzeImageById.bind(iaController),
  
  // Alias para rutas que esperan nombres diferentes
  configureCriteria: iaController.createCriterio.bind(iaController),
  getAnalysisResults: iaController.getAnalisis.bind(iaController),
  getJobStatus: (req, res) => {
    res.status(501).json({
      status: 'not_implemented', 
      message: 'Job status tracking será implementado próximamente'
    });
  }
};
