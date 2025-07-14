/**
 * Controlador ETL - Portal de Auditorías Técnicas
 * Endpoints para procesamiento de parque informático
 */

const ETLService = require('./etl.service');
const { body, param, validationResult } = require('express-validator');

class ETLController {
  constructor() {
    this.etlService = new ETLService();
  }

  /**
   * Procesar archivo de parque informático
   */
  async procesarParqueInformatico(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { documento_id, auditoria_id } = req.body;
      const opciones = {
        strict_mode: req.body.strict_mode || false,
        auto_fix: req.body.auto_fix !== false, // true por defecto
        skip_validation: req.body.skip_validation || [],
        procesado_por: req.user?.id || null
      };

      console.log(`🔄 Iniciando procesamiento ETL - Documento: ${documento_id}, Auditoría: ${auditoria_id}`);

      const resultado = await this.etlService.procesarParqueInformatico(
        documento_id, 
        auditoria_id, 
        opciones
      );

      res.status(200).json({
        success: true,
        message: 'Procesamiento ETL completado exitosamente',
        data: resultado
      });

    } catch (error) {
      console.error('❌ Error en procesamiento ETL:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error procesando parque informático',
        message: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de una auditoría
   */
  async obtenerEstadisticas(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Parámetros inválidos',
          details: errors.array()
        });
      }

      const { auditoria_id } = req.params;

      const estadisticas = await this.etlService.obtenerEstadisticasAuditoria(auditoria_id);

      res.status(200).json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas',
        message: error.message
      });
    }
  }

  /**
   * Validar archivo sin procesar (dry-run)
   */
  async validarArchivo(req, res) {
    try {
      // TODO: Implementar validación sin procesamiento completo
      res.status(200).json({
        success: true,
        message: 'Validación dry-run - Funcionalidad en desarrollo',
        data: {
          archivo_valido: true,
          campos_detectados: [],
          posibles_problemas: []
        }
      });

    } catch (error) {
      console.error('❌ Error en validación:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error validando archivo',
        message: error.message
      });
    }
  }

  /**
   * Obtener configuración de campos ETL
   */
  async obtenerConfiguracionCampos(req, res) {
    try {
      const configuracion = {
        campos_requeridos: [
          'usuario_id', 'proveedor', 'sitio', 'atencion'
        ],
        campos_opcionales: [
          'hostname', 'cpu_brand', 'cpu_model', 'cpu_speed_ghz', 'cpu_cores',
          'ram_gb', 'ram_type', 'disk_type', 'disk_capacity_gb',
          'os_name', 'os_version', 'os_architecture',
          'browser_name', 'browser_version',
          'antivirus_brand', 'antivirus_version', 'antivirus_updated',
          'headset_brand', 'headset_model',
          'isp_name', 'connection_type', 'speed_download_mbps', 'speed_upload_mbps'
        ],
        tipos_atencion: ['INBOUND', 'OUTBOUND', 'MIXTO', 'CHAT', 'EMAIL', 'SOPORTE'],
        formatos_soportados: ['xlsx', 'xls', 'csv'],
        validaciones_activas: this.etlService.businessValidator.getRulesInfo()
      };

      res.status(200).json({
        success: true,
        data: configuracion
      });

    } catch (error) {
      console.error('❌ Error obteniendo configuración:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo configuración ETL',
        message: error.message
      });
    }
  }
}

// Instancia singleton del controlador
const etlController = new ETLController();

// Validadores para endpoints
const validarProcesamiento = [
  body('documento_id')
    .isUUID()
    .withMessage('documento_id debe ser un UUID válido'),
  body('auditoria_id')
    .isUUID()
    .withMessage('auditoria_id debe ser un UUID válido'),
  body('strict_mode')
    .optional()
    .isBoolean()
    .withMessage('strict_mode debe ser booleano'),
  body('auto_fix')
    .optional()
    .isBoolean()
    .withMessage('auto_fix debe ser booleano'),
  body('skip_validation')
    .optional()
    .isArray()
    .withMessage('skip_validation debe ser un array')
];

const validarAuditoriaId = [
  param('auditoria_id')
    .isUUID()
    .withMessage('auditoria_id debe ser un UUID válido')
];

// Exportar métodos del controlador con validadores
module.exports = {
  // Métodos del controlador
  procesarParqueInformatico: [
    validarProcesamiento,
    etlController.procesarParqueInformatico.bind(etlController)
  ],
  
  obtenerEstadisticas: [
    validarAuditoriaId,
    etlController.obtenerEstadisticas.bind(etlController)
  ],
  
  validarArchivo: etlController.validarArchivo.bind(etlController),
  
  obtenerConfiguracionCampos: etlController.obtenerConfiguracionCampos.bind(etlController),
  
  // Instancia del controlador para casos especiales
  controller: etlController
};
