/**
 * Rutas ETL - Portal de Auditorías Técnicas
 * Endpoints para procesamiento de parque informático
 */

const express = require('express');
const router = express.Router();

// Middleware de autenticación
const { authenticate } = require('../auth/middleware/authentication');
const { authorize } = require('../auth/middleware/authorization');

// Controlador ETL
const {
  procesarParqueInformatico,
  obtenerEstadisticas,
  validarArchivo,
  obtenerConfiguracionCampos
} = require('./etl.controller');

/**
 * @route POST /api/etl/procesar
 * @desc Procesar archivo de parque informático
 * @access Private (AUDITOR, ADMIN)
 */
router.post('/procesar', 
  authenticate,
  authorize(['AUDITOR', 'ADMIN', 'SUPERVISOR']),
  procesarParqueInformatico
);

/**
 * @route GET /api/etl/estadisticas/:auditoria_id
 * @desc Obtener estadísticas de procesamiento ETL por auditoría
 * @access Private (AUDITOR, ADMIN, PROVEEDOR)
 */
router.get('/estadisticas/:auditoria_id',
  authenticate,
  authorize(['AUDITOR', 'ADMIN', 'SUPERVISOR', 'PROVEEDOR']),
  obtenerEstadisticas
);

/**
 * @route POST /api/etl/validar
 * @desc Validar archivo sin procesar (dry-run)
 * @access Private (AUDITOR, ADMIN)
 */
router.post('/validar',
  authenticate,
  authorize(['AUDITOR', 'ADMIN', 'SUPERVISOR']),
  validarArchivo
);

/**
 * @route GET /api/etl/configuracion
 * @desc Obtener configuración de campos y validaciones ETL
 * @access Private (Todos los roles)
 */
router.get('/configuracion',
  authenticate,
  obtenerConfiguracionCampos
);

/**
 * @route GET /api/etl/health
 * @desc Health check del módulo ETL
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      module: 'ETL',
      version: '1.0.0',
      dependencies: {
        excel_parser: 'available',
        csv_parser: 'available',
        field_normalizer: 'available',
        business_validator: 'available',
        schema_validator: 'available'
      }
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
