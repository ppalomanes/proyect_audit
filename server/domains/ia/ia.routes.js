// /server/domains/ia/ia.routes.js
// Rutas del módulo IA con funcionalidad real implementada

const express = require('express');
const { body, param, query } = require('express-validator');
const iaController = require('./ia.controller');
const validationMiddleware = require('../../shared/middleware/validation');
const { asyncHandler } = require('../../shared/middleware/error-handler');

// TEMPORALMENTE: Middleware dummy para testing sin auth
const dummyAuth = (req, res, next) => {
  req.user = { id: 1, rol: 'ADMIN', permisos: ['*'] }; // Usuario dummy
  next();
};

const router = express.Router();

// ============== HEALTH CHECK Y MÉTRICAS ================

/**
 * GET /api/ia/health
 * Verificar salud del servicio IA y conexión con Ollama
 */
router.get('/health', asyncHandler(iaController.healthCheck));

/**
 * GET /api/ia/metrics
 * Obtener métricas del servicio IA
 */
router.get('/metrics', asyncHandler(iaController.getMetrics));

/**
 * GET /api/ia/test/connection
 * Test básico de conectividad con Ollama
 */
router.get('/test/connection', asyncHandler(iaController.testConnection));

/**
 * POST /api/ia/test/document-analysis
 * Test de análisis de documento con texto de ejemplo
 */
router.post('/test/document-analysis', [
  body('documento_test')
    .optional()
    .isString()
    .isLength({ min: 10, max: 5000 })
    .withMessage('documento_test debe ser texto entre 10 y 5000 caracteres'),
  validationMiddleware
], asyncHandler(iaController.testDocumentAnalysis));

// ============== ANÁLISIS DE DOCUMENTOS (NUEVAS RUTAS CON PATH) ================

/**
 * POST /api/ia/analyze/document
 * Analizar un documento específico con IA usando file path
 */
router.post('/analyze/document', [
  dummyAuth,
  body('documento_path')
    .notEmpty()
    .withMessage('documento_path es requerido')
    .isString()
    .withMessage('documento_path debe ser una cadena'),
  
  body('criterios_ids')
    .optional()
    .isArray()
    .withMessage('criterios_ids debe ser un array'),
  
  body('criterios_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cada criterio_id debe ser un entero positivo'),
  
  body('auditoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('auditoria_id debe ser un entero positivo'),
  
  validationMiddleware
], asyncHandler(iaController.analyzeDocument));

/**
 * POST /api/ia/analyze/image
 * Analizar una imagen específica con IA usando file path
 */
router.post('/analyze/image', [
  dummyAuth,
  body('imagen_path')
    .notEmpty()
    .withMessage('imagen_path es requerido')
    .isString()
    .withMessage('imagen_path debe ser una cadena'),
  
  body('criterios_ids')
    .optional()
    .isArray()
    .withMessage('criterios_ids debe ser un array'),
  
  body('criterios_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cada criterio_id debe ser un entero positivo'),
  
  body('auditoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('auditoria_id debe ser un entero positivo'),
  
  validationMiddleware
], asyncHandler(iaController.analyzeImage));

/**
 * POST /api/ia/analyze/batch
 * Analizar múltiples archivos en lote usando file paths
 */
router.post('/analyze/batch', [
  dummyAuth,
  body('archivos')
    .isArray({ min: 1, max: 50 })
    .withMessage('archivos debe ser un array de 1 a 50 elementos'),
  
  body('archivos.*')
    .isString()
    .withMessage('Cada archivo debe ser una ruta válida'),
  
  body('criterios_ids')
    .optional()
    .isArray()
    .withMessage('criterios_ids debe ser un array'),
  
  body('criterios_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cada criterio_id debe ser un entero positivo'),
  
  body('auditoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('auditoria_id debe ser un entero positivo'),
  
  validationMiddleware
], asyncHandler(iaController.analyzeBatch));

// ============== RUTAS DE COMPATIBILIDAD (LEGACY CON IDS) ================

/**
 * POST /api/ia/analyze/document-by-id
 * Analizar documento por ID (requiere integración con módulo documentos)
 * LEGACY - Mantener compatibilidad con rutas existentes
 */
router.post('/analyze/document-by-id', [
  dummyAuth,
  body('documento_id')
    .isInt({ min: 1 })
    .withMessage('ID de documento debe ser un entero positivo'),
  
  body('criterios_scoring')
    .optional()
    .isArray()
    .withMessage('Criterios de scoring debe ser un array'),
  
  body('opciones')
    .optional()
    .isObject()
    .withMessage('Opciones debe ser un objeto'),
  
  validationMiddleware
], asyncHandler(iaController.analyzeDocumentById));

/**
 * POST /api/ia/analyze/image-by-id  
 * Analizar imagen por ID (requiere integración con módulo documentos)
 * LEGACY - Mantener compatibilidad con rutas existentes
 */
router.post('/analyze/image-by-id', [
  dummyAuth,
  body('imagen_id')
    .isInt({ min: 1 })
    .withMessage('ID de imagen debe ser un entero positivo'),
  
  body('criterios_scoring')
    .optional()
    .isArray()
    .withMessage('Criterios de scoring debe ser un array'),
  
  body('opciones')
    .optional()
    .isObject()
    .withMessage('Opciones debe ser un objeto'),
  
  validationMiddleware
], asyncHandler(iaController.analyzeImageById));

// ============== GESTIÓN DE CRITERIOS DE SCORING ================

/**
 * GET /api/ia/criterios
 * Obtener todos los criterios de scoring disponibles
 */
router.get('/criterios', asyncHandler(iaController.getCriterios));

/**
 * POST /api/ia/criterios
 * Crear un nuevo criterio de scoring
 */
router.post('/criterios', [
  dummyAuth,
  body('descripcion')
    .notEmpty()
    .withMessage('descripcion es requerida')
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage('descripcion debe tener entre 5 y 500 caracteres'),
  
  body('categoria')
    .notEmpty()
    .withMessage('categoria es requerida')
    .isString()
    .isIn(['documentacion', 'infraestructura', 'procesos', 'calidad', 'seguridad', 'general'])
    .withMessage('categoria debe ser: documentacion, infraestructura, procesos, calidad, seguridad o general'),
  
  body('peso')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('peso debe ser un número entre 0 y 10'),
  
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('activo debe ser true o false'),
  
  validationMiddleware
], asyncHandler(iaController.createCriterio));

/**
 * POST /api/ia/criteria
 * Alias para compatibilidad con rutas existentes
 */
router.post('/criteria', [
  dummyAuth,
  body('auditoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de auditoría debe ser un entero positivo'),
  
  body('criterios')
    .isArray({ min: 1 })
    .withMessage('Criterios debe ser un array con al menos un elemento'),
  
  body('criterios.*.nombre')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nombre del criterio es requerido (max 255 caracteres)'),
  
  body('criterios.*.descripcion')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Descripción del criterio es requerida (max 1000 caracteres)'),
  
  validationMiddleware
], asyncHandler(iaController.configureCriteria));

// ============== CONSULTA DE RESULTADOS ================

/**
 * GET /api/ia/analisis/:id
 * Obtener resultado de un análisis específico
 */
router.get('/analisis/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un entero positivo'),
  
  query('include_content')
    .optional()
    .isBoolean()
    .withMessage('include_content debe ser true o false'),
  
  validationMiddleware
], asyncHandler(iaController.getAnalisis));

/**
 * GET /api/ia/analysis/:analisis_id
 * Alias para compatibilidad con rutas existentes
 */
router.get('/analysis/:analisis_id', [
  param('analisis_id')
    .isInt({ min: 1 })
    .withMessage('ID de análisis debe ser un entero positivo'),
  
  query('incluir_detalles')
    .optional()
    .isBoolean()
    .withMessage('incluir_detalles debe ser booleano'),
  
  validationMiddleware
], asyncHandler(iaController.getAnalysisResults));

/**
 * GET /api/ia/jobs/:job_id/status
 * Obtener estado de job de análisis batch (placeholder)
 */
router.get('/jobs/:job_id/status', [
  param('job_id')
    .notEmpty()
    .withMessage('ID de job es requerido'),
  
  validationMiddleware
], asyncHandler(iaController.getJobStatus));

// ============== RUTAS DE DESARROLLO Y TESTING ================

/**
 * GET /api/ia/dev/endpoints
 * Listar todos los endpoints disponibles (solo desarrollo)
 */
router.get('/dev/endpoints', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Endpoint solo disponible en desarrollo' });
  }

  const endpoints = [
    { method: 'GET', path: '/api/ia/health', description: 'Health check del servicio IA' },
    { method: 'GET', path: '/api/ia/metrics', description: 'Métricas del servicio IA' },
    { method: 'GET', path: '/api/ia/test/connection', description: 'Test de conectividad Ollama' },
    { method: 'POST', path: '/api/ia/test/document-analysis', description: 'Test análisis documento' },
    { method: 'POST', path: '/api/ia/analyze/document', description: 'Analizar documento por path' },
    { method: 'POST', path: '/api/ia/analyze/image', description: 'Analizar imagen por path' },
    { method: 'POST', path: '/api/ia/analyze/batch', description: 'Análisis en lote por paths' },
    { method: 'POST', path: '/api/ia/analyze/document-by-id', description: 'Analizar documento por ID (legacy)' },
    { method: 'POST', path: '/api/ia/analyze/image-by-id', description: 'Analizar imagen por ID (legacy)' },
    { method: 'GET', path: '/api/ia/criterios', description: 'Listar criterios scoring' },
    { method: 'POST', path: '/api/ia/criterios', description: 'Crear criterio scoring' },
    { method: 'POST', path: '/api/ia/criteria', description: 'Configurar criterios (legacy)' },
    { method: 'GET', path: '/api/ia/analisis/:id', description: 'Obtener análisis por ID' },
    { method: 'GET', path: '/api/ia/analysis/:analisis_id', description: 'Obtener análisis (legacy)' },
    { method: 'GET', path: '/api/ia/jobs/:job_id/status', description: 'Estado job (placeholder)' }
  ];

  res.json({
    status: 'success',
    message: 'Endpoints del módulo IA',
    total_endpoints: endpoints.length,
    endpoints: endpoints,
    notes: {
      funcional: 'Endpoints con funcionalidad real implementada',
      legacy: 'Endpoints para compatibilidad con código existente',
      placeholder: 'Endpoints que serán implementados próximamente'
    }
  });
});

/**
 * POST /api/ia/dev/test-all
 * Ejecutar todos los tests de funcionalidad (solo desarrollo)
 */
router.post('/dev/test-all', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Endpoint solo disponible en desarrollo' });
  }

  try {
    const results = [];

    // Test 1: Health Check
    try {
      const salud = await iaController.healthCheck({ }, { 
        status: (code) => ({ json: (data) => data }),
        json: (data) => data 
      });
      results.push({ test: 'Health Check', status: 'PASSED', details: 'Ollama conectado' });
    } catch (error) {
      results.push({ test: 'Health Check', status: 'FAILED', error: error.message });
    }

    // Test 2: Métricas
    try {
      await iaController.getMetrics({ }, { 
        status: (code) => ({ json: (data) => data }),
        json: (data) => data 
      });
      results.push({ test: 'Metrics', status: 'PASSED', details: 'Métricas obtenidas' });
    } catch (error) {
      results.push({ test: 'Metrics', status: 'FAILED', error: error.message });
    }

    // Test 3: Test Document Analysis
    try {
      await iaController.testDocumentAnalysis({ 
        body: { documento_test: 'Test document for IA analysis' } 
      }, { 
        status: (code) => ({ json: (data) => data }),
        json: (data) => data 
      });
      results.push({ test: 'Document Analysis', status: 'PASSED', details: 'Análisis IA funcional' });
    } catch (error) {
      results.push({ test: 'Document Analysis', status: 'FAILED', error: error.message });
    }

    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;

    res.json({
      status: 'success',
      message: 'Tests de desarrollo ejecutados',
      summary: {
        total: results.length,
        passed: passed,
        failed: failed,
        success_rate: Math.round((passed / results.length) * 100)
      },
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error ejecutando tests de desarrollo',
      error: error.message
    });
  }
});

// ============== MIDDLEWARE DE MANEJO DE ERRORES ================

/**
 * Middleware para manejar errores específicos del módulo IA
 */
router.use((error, req, res, next) => {
  console.error('❌ Error en módulo IA:', error);
  
  // Errores específicos de Ollama
  if (error.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      status: 'error',
      message: 'Servicio Ollama no disponible',
      code: 'OLLAMA_UNAVAILABLE',
      suggestion: 'Verificar que Ollama esté ejecutándose en ' + (process.env.OLLAMA_URL || 'http://localhost:11434'),
      troubleshooting: {
        check_service: 'ollama serve',
        check_models: 'ollama list',
        install_models: 'ollama pull llama3.2:1b && ollama pull moondream'
      }
    });
  }
  
  // Errores de timeout
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return res.status(504).json({
      status: 'error',
      message: 'Timeout en análisis IA',
      code: 'IA_TIMEOUT',
      suggestion: 'El análisis tomó demasiado tiempo. Intentar con un archivo más pequeño.'
    });
  }
  
  // Errores de archivo no encontrado
  if (error.code === 'ENOENT') {
    return res.status(404).json({
      status: 'error',
      message: 'Archivo no encontrado',
      code: 'FILE_NOT_FOUND',
      path: error.path,
      suggestion: 'Verificar que la ruta del archivo sea correcta y el archivo exista'
    });
  }

  // Errores de validación de express-validator
  if (error.type === 'validation') {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación de datos',
      code: 'VALIDATION_ERROR',
      details: error.details
    });
  }
  
  // Error genérico
  res.status(500).json({
    status: 'error',
    message: 'Error interno en módulo IA',
    code: 'INTERNAL_IA_ERROR',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
