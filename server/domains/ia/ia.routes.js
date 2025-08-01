// server/domains/ia/ia.routes.js
const express = require('express');
const router = express.Router();

// ===== RUTAS IA =====

// GET /api/ia/health - Estado del sistema IA
router.get('/health', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        estado: 'OPERATIVO',
        ollama_disponible: true,
        modelos_cargados: {
          'llama3.2:1b': 'ACTIVO',
          'moondream': 'ACTIVO'
        },
        analisis_completados_hoy: 12,
        tiempo_promedio_analisis: '45s'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verificando estado IA',
      error: error.message
    });
  }
});

// POST /api/ia/analyze-document - Analizar documento
router.post('/analyze-document', (req, res) => {
  try {
    // Simular análisis de documento
    const resultadoAnalisis = {
      job_id: `ia_doc_${Date.now()}`,
      estado: 'COMPLETADO',
      score_cumplimiento: 87.5,
      elementos_detectados: {
        texto_total: 2450,
        secciones_identificadas: 8,
        criterios_evaluados: 15
      },
      resultados: {
        cumple_criterios: 13,
        no_cumple_criterios: 2,
        observaciones: [
          'Documento contiene información técnica completa',
          'Se detectaron algunas inconsistencias menores en fechas'
        ]
      }
    };
    
    res.json({
      success: true,
      data: resultadoAnalisis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analizando documento',
      error: error.message
    });
  }
});

// POST /api/ia/analyze-image - Analizar imagen
router.post('/analyze-image', (req, res) => {
  try {
    // Simular análisis de imagen
    const resultadoAnalisisImagen = {
      job_id: `ia_img_${Date.now()}`,
      estado: 'COMPLETADO',
      elementos_detectados: {
        equipos_identificados: 12,
        cables_visibles: 'ORGANIZADOS',
        iluminacion: 'ADECUADA',
        limpieza: 'BUENA'
      },
      score_visual: 92.0,
      observaciones: [
        'Datacenter bien organizado',
        'Equipos correctamente etiquetados',
        'Cableado estructurado visible'
      ]
    };
    
    res.json({
      success: true,
      data: resultadoAnalisisImagen
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analizando imagen',
      error: error.message
    });
  }
});

module.exports = router;
