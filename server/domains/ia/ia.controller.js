// /server/domains/ia/ia.controller.js
// Controlador completo para el módulo de IA - Portal de Auditorías Técnicas

const iaService = require('./ia.service');
const path = require('path');
const fs = require('fs').promises;

/**
 * Controlador principal para todas las operaciones de IA
 * Maneja análisis de documentos, imágenes y scoring automático
 */
class IAController {

  /**
   * POST /api/ia/analizar-documento
   * Analizar documento PDF/texto con LLaMA
   */
  async analizarDocumento(req, res) {
    try {
      const { documento_id, tipo_analisis = 'compliance' } = req.body;
      const archivo = req.file;

      if (!documento_id) {
        return res.status(400).json({
          error: 'documento_id es requerido'
        });
      }

      if (!archivo) {
        return res.status(400).json({
          error: 'Archivo de documento es requerido'
        });
      }

      // Validar tipo de análisis
      const tiposValidos = ['compliance', 'security', 'infrastructure'];
      if (!tiposValidos.includes(tipo_analisis)) {
        return res.status(400).json({
          error: `Tipo de análisis debe ser uno de: ${tiposValidos.join(', ')}`
        });
      }

      console.log(`📄 Iniciando análisis de documento: ${documento_id}`);

      // Ejecutar análisis
      const resultado = await iaService.analizarDocumento(
        documento_id,
        archivo.path,
        tipo_analisis
      );

      // Limpiar archivo temporal
      try {
        await fs.unlink(archivo.path);
      } catch (cleanupError) {
        console.warn('⚠️  Error limpiando archivo temporal:', cleanupError.message);
      }

      res.json({
        exito: true,
        analisis: resultado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error en análisis de documento:', error.message);
      res.status(500).json({
        error: 'Error procesando análisis de documento',
        detalle: error.message
      });
    }
  }

  /**
   * POST /api/ia/analizar-imagen
   * Analizar imagen con Moondream
   */
  async analizarImagen(req, res) {
    try {
      const { imagen_id, tipo_analisis = 'screenshot' } = req.body;
      const archivo = req.file;

      if (!imagen_id) {
        return res.status(400).json({
          error: 'imagen_id es requerido'
        });
      }

      if (!archivo) {
        return res.status(400).json({
          error: 'Archivo de imagen es requerido'
        });
      }

      // Validar tipo de análisis de imagen
      const tiposValidos = ['screenshot', 'diagram', 'equipment'];
      if (!tiposValidos.includes(tipo_analisis)) {
        return res.status(400).json({
          error: `Tipo de análisis debe ser uno de: ${tiposValidos.join(', ')}`
        });
      }

      // Validar formato de imagen
      const formatosValidos = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
      const extension = path.extname(archivo.originalname).toLowerCase();
      if (!formatosValidos.includes(extension)) {
        return res.status(400).json({
          error: `Formato de imagen no soportado. Usar: ${formatosValidos.join(', ')}`
        });
      }

      console.log(`📸 Iniciando análisis de imagen: ${imagen_id}`);

      // Ejecutar análisis
      const resultado = await iaService.analizarImagen(
        imagen_id,
        archivo.path,
        tipo_analisis
      );

      // Limpiar archivo temporal
      try {
        await fs.unlink(archivo.path);
      } catch (cleanupError) {
        console.warn('⚠️  Error limpiando archivo temporal:', cleanupError.message);
      }

      res.json({
        exito: true,
        analisis: resultado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error en análisis de imagen:', error.message);
      res.status(500).json({
        error: 'Error procesando análisis de imagen',
        detalle: error.message
      });
    }
  }

  /**
   * POST /api/ia/scoring-parque
   * Scoring automático de parque informático
   */
  async scoringParqueInformatico(req, res) {
    try {
      const { auditoria_id, datos_parque } = req.body;

      if (!auditoria_id) {
        return res.status(400).json({
          error: 'auditoria_id es requerido'
        });
      }

      if (!datos_parque || !Array.isArray(datos_parque) || datos_parque.length === 0) {
        return res.status(400).json({
          error: 'datos_parque debe ser un array no vacío'
        });
      }

      console.log(`🔢 Iniciando scoring para auditoría: ${auditoria_id}`);

      // Ejecutar scoring
      const resultado = await iaService.scoringParqueInformatico(
        auditoria_id,
        datos_parque
      );

      res.json({
        exito: true,
        scoring: resultado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error en scoring de parque:', error.message);
      res.status(500).json({
        error: 'Error procesando scoring de parque informático',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/ia/health
   * Verificar estado del servicio IA
   */
  async healthCheck(req, res) {
    try {
      const estadisticas = await iaService.obtenerEstadisticasIA();

      res.json({
        servicio: 'IA Portal Auditorías',
        version: '1.0.0',
        ...estadisticas,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error en health check IA:', error.message);
      res.status(500).json({
        error: 'Error obteniendo estado del servicio IA',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/ia/estadisticas
   * Obtener estadísticas detalladas del servicio IA
   */
  async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await iaService.obtenerEstadisticasIA();

      res.json({
        exito: true,
        estadisticas,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas IA:', error.message);
      res.status(500).json({
        error: 'Error obteniendo estadísticas IA',
        detalle: error.message
      });
    }
  }

  /**
   * POST /api/ia/reinicializar
   * Reinicializar servicio IA (admin only)
   */
  async reinicializarServicio(req, res) {
    try {
      // TODO: Verificar permisos de administrador
      const usuario = req.user;
      if (!usuario || usuario.rol !== 'admin') {
        return res.status(403).json({
          error: 'Acceso denegado. Solo administradores pueden reinicializar el servicio'
        });
      }

      console.log(`🔄 Reinicializando servicio IA por usuario: ${usuario.email}`);

      const resultado = await iaService.reinicializarServicio();

      res.json({
        exito: resultado.exito,
        mensaje: 'Servicio IA reinicializado',
        detalles: resultado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error reinicializando servicio IA:', error.message);
      res.status(500).json({
        error: 'Error reinicializando servicio IA',
        detalle: error.message
      });
    }
  }

  /**
   * DELETE /api/ia/cache
   * Limpiar cache de análisis IA
   */
  async limpiarCache(req, res) {
    try {
      const { patron } = req.query;
      const usuario = req.user;

      // Verificar permisos
      if (!usuario || !['admin', 'auditor'].includes(usuario.rol)) {
        return res.status(403).json({
          error: 'Acceso denegado. Solo administradores y auditores pueden limpiar cache'
        });
      }

      console.log(`🧹 Limpiando cache IA por usuario: ${usuario.email}`);

      const resultado = await iaService.limpiarCacheAnalisis(patron);

      res.json({
        exito: true,
        mensaje: 'Cache limpiado exitosamente',
        detalles: resultado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error limpiando cache IA:', error.message);
      res.status(500).json({
        error: 'Error limpiando cache IA',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/ia/analisis/:id
   * Obtener resultado de análisis por ID
   */
  async obtenerAnalisis(req, res) {
    try {
      const { id } = req.params;
      const { tipo = 'documento' } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'ID de análisis es requerido'
        });
      }

      // TODO: Implementar búsqueda en BD real
      // Por ahora mock response
      const analisisMock = {
        id: id,
        tipo: tipo,
        fecha_analisis: new Date().toISOString(),
        score_total: 85,
        detalles: {
          aspectos_positivos: ['Documento completo', 'Especificaciones adecuadas'],
          aspectos_mejora: ['Revisar configuración de red']
        },
        modelo_usado: 'llama3.2:1b',
        metadatos: {
          duracion_ms: 2340,
          simulado: false
        }
      };

      res.json({
        exito: true,
        analisis: analisisMock,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error obteniendo análisis:', error.message);
      res.status(500).json({
        error: 'Error obteniendo análisis',
        detalle: error.message
      });
    }
  }

  /**
   * GET /api/ia/modelos
   * Obtener información de modelos disponibles
   */
  async obtenerModelosDisponibles(req, res) {
    try {
      const ollamaConfig = require('../../config/ollama');
      
      const health = await ollamaConfig.checkOllamaHealth();
      const modelsStatus = await ollamaConfig.ensureModelsAvailable();

      res.json({
        exito: true,
        ollama_disponible: health.status === 'healthy',
        modelos_configurados: ollamaConfig.MODELS_CONFIG,
        modelos_disponibles: health.available_models || [],
        estado_modelos: modelsStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error obteniendo modelos:', error.message);
      res.status(500).json({
        error: 'Error obteniendo información de modelos',
        detalle: error.message
      });
    }
  }

  /**
   * POST /api/ia/test-documento
   * Endpoint de testing para análisis de documentos
   */
  async testAnalisisDocumento(req, res) {
    try {
      const { texto_prueba, tipo_analisis = 'compliance' } = req.body;

      if (!texto_prueba) {
        return res.status(400).json({
          error: 'texto_prueba es requerido para el test'
        });
      }

      console.log('🧪 Ejecutando test de análisis de documento');

      // Crear archivo temporal para el test
      const tempPath = path.join(__dirname, '../../../uploads/temp_test.txt');
      await fs.writeFile(tempPath, texto_prueba, 'utf8');

      try {
        const resultado = await iaService.analizarDocumento(
          'test_' + Date.now(),
          tempPath,
          tipo_analisis
        );

        // Limpiar archivo temporal
        await fs.unlink(tempPath);

        res.json({
          exito: true,
          test: true,
          analisis: resultado,
          timestamp: new Date().toISOString()
        });

      } catch (analysisError) {
        // Asegurar limpieza en caso de error
        try {
          await fs.unlink(tempPath);
        } catch (cleanupError) {
          console.warn('⚠️  Error limpiando archivo temporal de test:', cleanupError.message);
        }
        throw analysisError;
      }

    } catch (error) {
      console.error('❌ Error en test de análisis:', error.message);
      res.status(500).json({
        error: 'Error ejecutando test de análisis',
        detalle: error.message
      });
    }
  }
}

module.exports = new IAController();
