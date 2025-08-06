// /server/domains/ia/ia.routes.js
// Rutas completas para el módulo de IA - Portal de Auditorías Técnicas

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const iaController = require('./ia.controller');

const router = express.Router();

// Configuración de multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB límite
  },
  fileFilter: (req, file, cb) => {
    // Filtros para documentos e imágenes
    const allowedDocs = ['.pdf', '.txt'];
    const allowedImages = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
    const allAllowed = [...allowedDocs, ...allowedImages];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allAllowed.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato de archivo no soportado: ${fileExt}. Permitidos: ${allAllowed.join(', ')}`));
    }
  }
});

// ================================
// RUTAS DE ANÁLISIS PRINCIPAL
// ================================

/**
 * POST /api/ia/analizar-documento
 * Analizar documento PDF/texto con LLaMA
 * Requiere: archivo, documento_id, tipo_analisis (opcional)
 */
router.post(
  '/analizar-documento',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  upload.single('documento'),
  iaController.analizarDocumento
);

/**
 * POST /api/ia/analizar-imagen  
 * Analizar imagen con Moondream
 * Requiere: archivo, imagen_id, tipo_analisis (opcional)
 */
router.post(
  '/analizar-imagen',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  upload.single('imagen'),
  iaController.analizarImagen
);

/**
 * POST /api/ia/scoring-parque
 * Scoring automático de parque informático
 * Requiere: auditoria_id, datos_parque[]
 */
router.post(
  '/scoring-parque',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  iaController.scoringParqueInformatico
);

// ================================
// RUTAS DE GESTIÓN Y MONITOREO
// ================================

/**
 * GET /api/ia/health
 * Health check del servicio IA
 * Público para monitoreo
 */
router.get('/health', iaController.healthCheck);

/**
 * GET /api/ia/estadisticas
 * Estadísticas detalladas del servicio IA
 * Solo auditores y admins
 */
router.get(
  '/estadisticas',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  iaController.obtenerEstadisticas
);

/**
 * GET /api/ia/modelos
 * Información de modelos Ollama disponibles
 * Solo auditores y admins
 */
router.get(
  '/modelos',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  iaController.obtenerModelosDisponibles
);

/**
 * GET /api/ia/analisis/:id
 * Obtener resultado de análisis por ID
 * Requiere autenticación
 */
router.get(
  '/analisis/:id',
  authenticateToken,
  iaController.obtenerAnalisis
);

// ================================
// RUTAS ADMINISTRATIVAS
// ================================

/**
 * POST /api/ia/reinicializar
 * Reinicializar servicio IA
 * Solo administradores
 */
router.post(
  '/reinicializar',
  authenticateToken,
  requireRole(['admin']),
  iaController.reinicializarServicio
);

/**
 * DELETE /api/ia/cache
 * Limpiar cache de análisis IA
 * Solo auditores y administradores
 */
router.delete(
  '/cache',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  iaController.limpiarCache
);

// ================================
// RUTAS DE TESTING Y DESARROLLO
// ================================

/**
 * POST /api/ia/test-documento
 * Test de análisis de documento con texto
 * Solo en desarrollo/testing
 */
if (process.env.NODE_ENV === 'development') {
  router.post(
    '/test-documento',
    authenticateToken,
    requireRole(['auditor', 'admin']),
    iaController.testAnalisisDocumento
  );
}

// ================================
// RUTAS PARA INTEGRACIÓN CON ETL
// ================================

/**
 * POST /api/ia/procesar-auditoria
 * Procesar auditoría completa con IA
 * Integración con módulo ETL
 */
router.post(
  '/procesar-auditoria',
  authenticateToken,
  requireRole(['auditor', 'admin']),
  async (req, res) => {
    try {
      const { auditoria_id, documentos, parque_informatico } = req.body;
      
      if (!auditoria_id) {
        return res.status(400).json({
          error: 'auditoria_id es requerido'
        });
      }

      console.log(`🔄 Procesando auditoría completa con IA: ${auditoria_id}`);
      
      const resultados = {
        auditoria_id,
        fecha_procesamiento: new Date().toISOString(),
        analisis_documentos: [],
        scoring_parque: null,
        score_total_auditoria: 0
      };

      // Procesar documentos si están presentes
      if (documentos && documentos.length > 0) {
        console.log(`📄 Procesando ${documentos.length} documentos...`);
        
        for (const doc of documentos) {
          try {
            const analisis = await iaController.analizarDocumento({
              body: {
                documento_id: doc.id,
                tipo_analisis: doc.tipo_analisis || 'compliance'
              },
              file: { path: doc.ruta_archivo }
            }, { json: (data) => data });
            
            resultados.analisis_documentos.push(analisis.analisis);
          } catch (docError) {
            console.error(`❌ Error procesando documento ${doc.id}:`, docError.message);
            resultados.analisis_documentos.push({
              documento_id: doc.id,
              error: docError.message,
              score_total: 0
            });
          }
        }
      }

      // Procesar parque informático si está presente
      if (parque_informatico && parque_informatico.length > 0) {
        console.log(`🔢 Procesando parque informático de ${parque_informatico.length} equipos...`);
        
        try {
          const scoring = await iaController.scoringParqueInformatico({
            body: {
              auditoria_id,
              datos_parque: parque_informatico
            }
          }, { json: (data) => data });
          
          resultados.scoring_parque = scoring.scoring;
        } catch (scoringError) {
          console.error('❌ Error en scoring de parque:', scoringError.message);
          resultados.scoring_parque = {
            error: scoringError.message,
            score_total: 0
          };
        }
      }

      // Calcular score total de auditoría
      const scoresDocumentos = resultados.analisis_documentos
        .filter(a => a.score_total)
        .map(a => a.score_total);
      
      const scoreParque = resultados.scoring_parque?.score_total || 0;
      
      if (scoresDocumentos.length > 0 && scoreParque > 0) {
        const promedioDocumentos = scoresDocumentos.reduce((sum, score) => sum + score, 0) / scoresDocumentos.length;
        resultados.score_total_auditoria = Math.round((promedioDocumentos * 0.6) + (scoreParque * 0.4));
      } else if (scoresDocumentos.length > 0) {
        resultados.score_total_auditoria = Math.round(scoresDocumentos.reduce((sum, score) => sum + score, 0) / scoresDocumentos.length);
      } else if (scoreParque > 0) {
        resultados.score_total_auditoria = scoreParque;
      }

      console.log(`✅ Procesamiento completo de auditoría ${auditoria_id} - Score: ${resultados.score_total_auditoria}`);

      res.json({
        exito: true,
        mensaje: 'Auditoría procesada completamente con IA',
        resultados,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error procesando auditoría completa:', error.message);
      res.status(500).json({
        error: 'Error procesando auditoría completa con IA',
        detalle: error.message
      });
    }
  }
);

// ================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ================================

// Manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande. Máximo 50MB permitido'
      });
    }
    return res.status(400).json({
      error: 'Error de upload de archivo',
      detalle: error.message
    });
  }
  
  if (error.message.includes('Formato de archivo no soportado')) {
    return res.status(400).json({
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router;
