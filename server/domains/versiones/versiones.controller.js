/**
 * Controlador de Versiones - Portal de Auditorías Técnicas
 * 
 * Maneja todas las operaciones HTTP para el sistema de control de versiones
 */

const { body, param, query, validationResult } = require('express-validator');
const VersionesService = require('./services/versiones.service');

class VersionesController {
  constructor() {
    this.versionesService = new VersionesService();
  }

  /**
   * Crear nueva versión de documento
   * POST /api/versiones/:documento_id
   */
  async crearVersion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { documento_id } = req.params;
      const { comentarios, tipo_incremento, requiere_aprobacion, auditoria_id, etapa_auditoria } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Archivo requerido para crear nueva versión'
        });
      }

      const resultado = await this.versionesService.crearVersion(
        parseInt(documento_id),
        req.file,
        req.user,
        {
          comentarios,
          tipoIncremento: tipo_incremento || 'menor',
          requiereAprobacion: requiere_aprobacion || false,
          auditoriaId: auditoria_id ? parseInt(auditoria_id) : null,
          etapaAuditoria: etapa_auditoria,
          clienteInfo: {
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        }
      );

      res.status(201).json(resultado);

    } catch (error) {
      console.error('❌ Error en crearVersion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener historial de versiones de un documento
   * GET /api/versiones/:documento_id/historial
   */
  async obtenerHistorial(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: errors.array()
        });
      }

      const { documento_id } = req.params;
      const { incluir_obsoletas, limite, incluir_metadatos } = req.query;

      const resultado = await this.versionesService.obtenerHistorial(
        parseInt(documento_id),
        {
          incluirObsoletas: incluir_obsoletas !== 'false',
          limite: limite ? parseInt(limite) : 50,
          incluirMetadatos: incluir_metadatos === 'true'
        }
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en obtenerHistorial:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo historial de versiones',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Comparar dos versiones
   * GET /api/versiones/comparar/:version_id_1/:version_id_2
   */
  async compararVersiones(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'IDs de versión inválidos',
          errors: errors.array()
        });
      }

      const { version_id_1, version_id_2 } = req.params;

      const resultado = await this.versionesService.compararVersiones(
        parseInt(version_id_1),
        parseInt(version_id_2),
        req.user
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en compararVersiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error comparando versiones',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Descargar versión específica
   * GET /api/versiones/:version_id/descargar
   */
  async descargarVersion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ID de versión inválido',
          errors: errors.array()
        });
      }

      const { version_id } = req.params;

      const resultado = await this.versionesService.descargarVersion(
        parseInt(version_id),
        req.user
      );

      if (resultado.success) {
        res.download(
          resultado.archivo.ruta,
          resultado.archivo.nombre,
          (err) => {
            if (err) {
              console.error('❌ Error enviando archivo:', err);
              res.status(500).json({
                success: false,
                message: 'Error enviando archivo'
              });
            }
          }
        );
      }

    } catch (error) {
      console.error('❌ Error en descargarVersion:', error);
      res.status(500).json({
        success: false,
        message: 'Error descargando versión',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Restaurar versión anterior
   * POST /api/versiones/:version_id/restaurar
   */
  async restaurarVersion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { version_id } = req.params;
      const { comentarios } = req.body;

      const resultado = await this.versionesService.restaurarVersion(
        parseInt(version_id),
        req.user,
        comentarios
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en restaurarVersion:', error);
      res.status(500).json({
        success: false,
        message: 'Error restaurando versión',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Aprobar versión
   * PUT /api/versiones/:version_id/aprobar
   */
  async aprobarVersion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { version_id } = req.params;
      const { comentarios } = req.body;

      const resultado = await this.versionesService.aprobarVersion(
        parseInt(version_id),
        req.user,
        comentarios
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en aprobarVersion:', error);
      res.status(500).json({
        success: false,
        message: 'Error aprobando versión',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar versión
   * DELETE /api/versiones/:version_id
   */
  async eliminarVersion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ID de versión inválido',
          errors: errors.array()
        });
      }

      const { version_id } = req.params;

      const resultado = await this.versionesService.eliminarVersion(
        parseInt(version_id),
        req.user
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en eliminarVersion:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando versión',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de versiones
   * GET /api/versiones/estadisticas
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { documento_id, fecha_desde, fecha_hasta } = req.query;

      const resultado = await this.versionesService.obtenerEstadisticas(
        documento_id ? parseInt(documento_id) : null,
        fecha_desde,
        fecha_hasta
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en obtenerEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Limpiar versiones antiguas
   * DELETE /api/versiones/limpiar
   */
  async limpiarVersiones(req, res) {
    try {
      const { documento_id, mantener_ultimas, dias_antiguedad } = req.query;

      const resultado = await this.versionesService.limpiarVersionesAntiguas(
        documento_id ? parseInt(documento_id) : null,
        mantener_ultimas ? parseInt(mantener_ultimas) : 10,
        dias_antiguedad ? parseInt(dias_antiguedad) : 30
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en limpiarVersiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error limpiando versiones',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Validar integridad de archivos
   * GET /api/versiones/validar-integridad
   */
  async validarIntegridad(req, res) {
    try {
      const { documento_id } = req.query;

      const resultado = await this.versionesService.validarIntegridad(
        documento_id ? parseInt(documento_id) : null
      );

      res.json(resultado);

    } catch (error) {
      console.error('❌ Error en validarIntegridad:', error);
      res.status(500).json({
        success: false,
        message: 'Error validando integridad',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Health check del módulo
   * GET /api/versiones/health
   */
  async healthCheck(req, res) {
    try {
      const resultado = await this.versionesService.healthCheck();
      
      const statusCode = resultado.success ? 200 : 503;
      res.status(statusCode).json(resultado);

    } catch (error) {
      console.error('❌ Error en healthCheck:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Información del módulo
   * GET /api/versiones/info
   */
  async getInfo(req, res) {
    res.json({
      success: true,
      modulo: 'Control de Versiones',
      version: '1.0.0',
      descripcion: 'Sistema de control de versiones de documentos con gestión completa de metadatos',
      funcionalidades: [
        'Versionado automático de documentos',
        'Historial completo de cambios',
        'Comparación entre versiones',
        'Restauración de versiones anteriores',
        'Aprobación de versiones',
        'Validación de integridad',
        'Limpieza automática de versiones antiguas',
        'Integración con sistema de bitácora'
      ],
      endpoints: {
        crear: 'POST /api/versiones/:documento_id',
        historial: 'GET /api/versiones/:documento_id/historial',
        comparar: 'GET /api/versiones/comparar/:id1/:id2',
        descargar: 'GET /api/versiones/:version_id/descargar',
        restaurar: 'POST /api/versiones/:version_id/restaurar',
        aprobar: 'PUT /api/versiones/:version_id/aprobar',
        eliminar: 'DELETE /api/versiones/:version_id',
        estadisticas: 'GET /api/versiones/estadisticas',
        limpiar: 'DELETE /api/versiones/limpiar',
        validar: 'GET /api/versiones/validar-integridad',
        health: 'GET /api/versiones/health'
      }
    });
  }
}

// === VALIDADORES ===

const validadores = {
  // Validar creación de versión
  crearVersion: [
    param('documento_id').isInt({ min: 1 }).withMessage('ID de documento debe ser un entero positivo'),
    body('comentarios').optional().isString().isLength({ max: 1000 }).withMessage('Comentarios máximo 1000 caracteres'),
    body('tipo_incremento').optional().isIn(['mayor', 'menor', 'patch']).withMessage('Tipo de incremento inválido'),
    body('requiere_aprobacion').optional().isBoolean().withMessage('Requiere aprobación debe ser booleano'),
    body('auditoria_id').optional().isInt({ min: 1 }).withMessage('ID de auditoría debe ser entero positivo'),
    body('etapa_auditoria').optional().isString().isLength({ max: 50 }).withMessage('Etapa de auditoría máximo 50 caracteres')
  ],

  // Validar parámetros de historial
  obtenerHistorial: [
    param('documento_id').isInt({ min: 1 }).withMessage('ID de documento debe ser un entero positivo'),
    query('limite').optional().isInt({ min: 1, max: 1000 }).withMessage('Límite debe estar entre 1 y 1000'),
    query('incluir_obsoletas').optional().isBoolean().withMessage('Incluir obsoletas debe ser booleano'),
    query('incluir_metadatos').optional().isBoolean().withMessage('Incluir metadatos debe ser booleano')
  ],

  // Validar comparación de versiones
  compararVersiones: [
    param('version_id_1').isInt({ min: 1 }).withMessage('ID de versión 1 debe ser entero positivo'),
    param('version_id_2').isInt({ min: 1 }).withMessage('ID de versión 2 debe ser entero positivo')
  ],

  // Validar ID de versión
  versionId: [
    param('version_id').isInt({ min: 1 }).withMessage('ID de versión debe ser un entero positivo')
  ],

  // Validar restauración
  restaurarVersion: [
    param('version_id').isInt({ min: 1 }).withMessage('ID de versión debe ser un entero positivo'),
    body('comentarios').optional().isString().isLength({ max: 500 }).withMessage('Comentarios máximo 500 caracteres')
  ],

  // Validar aprobación
  aprobarVersion: [
    param('version_id').isInt({ min: 1 }).withMessage('ID de versión debe ser un entero positivo'),
    body('comentarios').optional().isString().isLength({ max: 500 }).withMessage('Comentarios máximo 500 caracteres')
  ]
};

module.exports = { VersionesController, validadores };