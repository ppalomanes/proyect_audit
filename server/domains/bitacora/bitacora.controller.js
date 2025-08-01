/**
 * Controlador de Bitácora - Portal de Auditorías Técnicas
 * 
 * Maneja las consultas, filtros y exportaciones de la bitácora del sistema
 */

const BitacoraService = require('./bitacora.service');
const { body, query, validationResult } = require('express-validator');

class BitacoraController {
  constructor() {
    this.bitacoraService = new BitacoraService();
  }

  /**
   * Obtener entradas de bitácora con filtros avanzados
   * GET /api/bitacora
   */
  async obtenerEntradas(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const filtros = {
        usuario_id: req.query.usuario_id,
        accion_tipo: req.query.accion_tipo,
        auditoria_id: req.query.auditoria_id,
        documento_id: req.query.documento_id,
        resultado: req.query.resultado,
        es_critico: req.query.es_critico === 'true' ? true : 
                   req.query.es_critico === 'false' ? false : undefined,
        fecha_desde: req.query.fecha_desde,
        fecha_hasta: req.query.fecha_hasta
      };

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (filtros[key] === undefined || filtros[key] === '') {
          delete filtros[key];
        }
      });

      const paginacion = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 50, 200) // Máximo 200
      };

      const resultado = await this.bitacoraService.buscarEntradas(filtros, paginacion);

      res.json({
        success: true,
        data: resultado.entradas,
        paginacion: resultado.paginacion,
        filtros_aplicados: filtros
      });

    } catch (error) {
      console.error('❌ Error obteniendo entradas de bitácora:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener bitácora específica de una auditoría
   * GET /api/bitacora/auditoria/:auditoria_id
   */
  async obtenerBitacoraAuditoria(req, res) {
    try {
      const { auditoria_id } = req.params;
      const incluirDetalles = req.query.detalles === 'true';

      const entradas = await this.bitacoraService.obtenerBitacoraAuditoria(
        auditoria_id, 
        incluirDetalles
      );

      res.json({
        success: true,
        data: {
          auditoria_id: auditoria_id,
          total_entradas: entradas.length,
          entradas: entradas
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo bitácora de auditoría:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error obteniendo bitácora de auditoría'
      });
    }
  }

  /**
   * Obtener estadísticas de la bitácora
   * GET /api/bitacora/estadisticas
   */
  async obtenerEstadisticas(req, res) {
    try {
      const filtros = {};
      
      if (req.query.fecha_desde) filtros.fecha_desde = req.query.fecha_desde;
      if (req.query.fecha_hasta) filtros.fecha_hasta = req.query.fecha_hasta;

      const estadisticas = await this.bitacoraService.obtenerEstadisticas(filtros);

      res.json({
        success: true,
        data: {
          periodo: {
            desde: filtros.fecha_desde || 'inicio',
            hasta: filtros.fecha_hasta || 'ahora'
          },
          estadisticas: estadisticas
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error obteniendo estadísticas'
      });
    }
  }

  /**
   * Exportar bitácora para compliance
   * GET /api/bitacora/export
   */
  async exportarBitacora(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const filtros = {
        usuario_id: req.query.usuario_id,
        accion_tipo: req.query.accion_tipo,
        auditoria_id: req.query.auditoria_id,
        es_critico: req.query.es_critico === 'true' ? true : 
                   req.query.es_critico === 'false' ? false : undefined,
        fecha_desde: req.query.fecha_desde,
        fecha_hasta: req.query.fecha_hasta
      };

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (filtros[key] === undefined || filtros[key] === '') {
          delete filtros[key];
        }
      });

      const formato = req.query.formato || 'json';

      const exportacion = await this.bitacoraService.exportarBitacora(filtros, formato);

      // Configurar headers para descarga
      res.setHeader('Content-Type', exportacion.formato);
      res.setHeader('Content-Disposition', `attachment; filename="${exportacion.nombre_archivo}"`);
      
      res.send(exportacion.contenido);

    } catch (error) {
      console.error('❌ Error exportando bitácora:', error);
      res.status(500).json({
        success: false,
        error: 'EXPORT_ERROR',
        message: 'Error generando exportación'
      });
    }
  }

  /**
   * Limpiar entradas antiguas
   * DELETE /api/bitacora/cleanup
   */
  async limpiarEntradas(req, res) {
    try {
      // Solo administradores pueden limpiar
      if (!req.user || req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Solo administradores pueden limpiar la bitácora'
        });
      }

      const diasAntiguedad = parseInt(req.query.dias) || 90;
      
      if (diasAntiguedad < 30) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DAYS',
          message: 'No se pueden eliminar entradas con menos de 30 días de antigüedad'
        });
      }

      const eliminadas = await this.bitacoraService.limpiarEntradas(diasAntiguedad);

      // Registrar la acción de limpieza
      await this.bitacoraService.registrarAccion(req, {
        tipo: 'CONFIGURACION_CAMBIO',
        descripcion: `Limpieza de bitácora: ${eliminadas} entradas eliminadas (> ${diasAntiguedad} días)`,
        seccion: 'Administración',
        metadata: {
          entradas_eliminadas: eliminadas,
          dias_antiguedad: diasAntiguedad
        },
        critico: true,
        tags: ['limpieza', 'mantenimiento', 'admin']
      });

      res.json({
        success: true,
        data: {
          entradas_eliminadas: eliminadas,
          dias_antiguedad: diasAntiguedad,
          mensaje: `Se eliminaron ${eliminadas} entradas con más de ${diasAntiguedad} días`
        }
      });

    } catch (error) {
      console.error('❌ Error limpiando bitácora:', error);
      res.status(500).json({
        success: false,
        error: 'CLEANUP_ERROR',
        message: 'Error durante la limpieza'
      });
    }
  }

  /**
   * Obtener tipos de acciones disponibles
   * GET /api/bitacora/tipos-acciones
   */
  async obtenerTiposAcciones(req, res) {
    try {
      const tiposAcciones = [
        'LOGIN', 'LOGOUT',
        'DOCUMENTO_CARGA', 'DOCUMENTO_MODIFICACION', 'DOCUMENTO_ELIMINACION',
        'AUDITORIA_CREACION', 'AUDITORIA_MODIFICACION', 'AUDITORIA_FINALIZACION',
        'EVALUACION_REALIZADA', 'EVALUACION_MODIFICADA',
        'NOTIFICACION_ENVIADA', 'NOTIFICACION_LEIDA',
        'DASHBOARD_ACCESO', 'REPORTE_GENERACION',
        'ETL_PROCESAMIENTO', 'ETL_VALIDACION',
        'CHAT_MENSAJE', 'CHAT_ARCHIVO',
        'CONFIGURACION_CAMBIO', 'USUARIO_CREACION', 'USUARIO_MODIFICACION',
        'OTRO'
      ];

      res.json({
        success: true,
        data: {
          tipos_acciones: tiposAcciones.map(tipo => ({
            value: tipo,
            label: this.formatearTipoAccion(tipo),
            critico: this.bitacoraService.esAccionCritica(tipo)
          }))
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo tipos de acciones:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error obteniendo tipos de acciones'
      });
    }
  }

  /**
   * Health check del módulo bitácora
   * GET /api/bitacora/health
   */
  async healthCheck(req, res) {
    try {
      // Verificar que el servicio funcione
      const estadisticas = await this.bitacoraService.obtenerEstadisticas({
        fecha_desde: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
      });

      res.json({
        success: true,
        data: {
          status: 'healthy',
          module: 'Bitácora',
          version: '1.0.0',
          ultima_verificacion: new Date().toISOString(),
          entradas_24h: estadisticas.total_entradas || 0,
          servicio_activo: true
        }
      });

    } catch (error) {
      console.error('❌ Error en health check de bitácora:', error);
      res.status(500).json({
        success: false,
        data: {
          status: 'unhealthy',
          module: 'Bitácora',
          error: error.message,
          ultima_verificacion: new Date().toISOString()
        }
      });
    }
  }

  // === MÉTODOS AUXILIARES ===

  /**
   * Formatear tipo de acción para mostrar
   */
  formatearTipoAccion(tipo) {
    const formatos = {
      'LOGIN': 'Inicio de Sesión',
      'LOGOUT': 'Cierre de Sesión',
      'DOCUMENTO_CARGA': 'Carga de Documento',
      'DOCUMENTO_MODIFICACION': 'Modificación de Documento',
      'DOCUMENTO_ELIMINACION': 'Eliminación de Documento',
      'AUDITORIA_CREACION': 'Creación de Auditoría',
      'AUDITORIA_MODIFICACION': 'Modificación de Auditoría',
      'AUDITORIA_FINALIZACION': 'Finalización de Auditoría',
      'EVALUACION_REALIZADA': 'Evaluación Realizada',
      'EVALUACION_MODIFICADA': 'Evaluación Modificada',
      'NOTIFICACION_ENVIADA': 'Notificación Enviada',
      'NOTIFICACION_LEIDA': 'Notificación Leída',
      'DASHBOARD_ACCESO': 'Acceso a Dashboard',
      'REPORTE_GENERACION': 'Generación de Reporte',
      'ETL_PROCESAMIENTO': 'Procesamiento ETL',
      'ETL_VALIDACION': 'Validación ETL',
      'CHAT_MENSAJE': 'Mensaje de Chat',
      'CHAT_ARCHIVO': 'Archivo de Chat',
      'CONFIGURACION_CAMBIO': 'Cambio de Configuración',
      'USUARIO_CREACION': 'Creación de Usuario',
      'USUARIO_MODIFICACION': 'Modificación de Usuario',
      'OTRO': 'Otra Acción'
    };

    return formatos[tipo] || tipo;
  }
}

// === VALIDADORES ===

/**
 * Validadores para endpoints de bitácora
 */
const validadores = {
  obtenerEntradas: [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Límite debe estar entre 1 y 200'),
    query('usuario_id').optional().isInt().withMessage('ID de usuario debe ser un número'),
    query('auditoria_id').optional().isInt().withMessage('ID de auditoría debe ser un número'),
    query('documento_id').optional().isInt().withMessage('ID de documento debe ser un número'),
    query('fecha_desde').optional().isISO8601().withMessage('Fecha desde debe ser válida (ISO 8601)'),
    query('fecha_hasta').optional().isISO8601().withMessage('Fecha hasta debe ser válida (ISO 8601)'),
    query('es_critico').optional().isBoolean().withMessage('es_critico debe ser true o false'),
    query('resultado').optional().isIn(['EXITOSO', 'ERROR', 'ADVERTENCIA']).withMessage('Resultado debe ser EXITOSO, ERROR o ADVERTENCIA')
  ],

  exportarBitacora: [
    query('formato').optional().isIn(['json', 'csv']).withMessage('Formato debe ser json o csv'),
    query('fecha_desde').optional().isISO8601().withMessage('Fecha desde debe ser válida'),
    query('fecha_hasta').optional().isISO8601().withMessage('Fecha hasta debe ser válida')
  ],

  limpiarEntradas: [
    query('dias').optional().isInt({ min: 30 }).withMessage('Días debe ser mínimo 30')
  ]
};

module.exports = {
  BitacoraController,
  validadores
};