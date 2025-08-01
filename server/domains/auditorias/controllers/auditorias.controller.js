const auditoriasService = require('../services/auditorias.service');
const documentosService = require('../services/documentos.service');
const workflowService = require('../services/workflow.service');
const { validationResult } = require('express-validator');

class AuditoriasController {

  /**
   * Crear nueva auditoría
   * POST /api/auditorias
   */
  async crear(req, res) {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const datos = req.body;
      const usuario = req.user;

      const auditoria = await auditoriasService.crearNuevaAuditoria(datos, usuario);

      res.status(201).json({
        success: true,
        message: 'Auditoría creada exitosamente',
        data: {
          auditoria_id: auditoria.id,
          codigo: auditoria.codigo,
          estado: auditoria.estado,
          etapa_actual: auditoria.etapa_actual,
          fecha_creacion: auditoria.fecha_creacion,
          fecha_limite: auditoria.fecha_limite,
          progreso: auditoria.progreso
        }
      });

    } catch (error) {
      console.error('Error creando auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Listar auditorías con filtros
   * GET /api/auditorias
   */
  async listar(req, res) {
    try {
      const filtros = {
        estado: req.query.estado,
        proveedor_id: req.query.proveedor_id ? parseInt(req.query.proveedor_id) : undefined,
        auditor_id: req.query.auditor_id ? parseInt(req.query.auditor_id) : undefined,
        periodo: req.query.periodo,
        activa: req.query.activa !== undefined ? req.query.activa === 'true' : undefined,
        fecha_desde: req.query.fecha_desde ? new Date(req.query.fecha_desde) : undefined
      };

      const paginacion = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        orderBy: req.query.orderBy || 'fecha_creacion',
        order: req.query.order || 'DESC'
      };

      const resultado = await auditoriasService.listarAuditorias(filtros, paginacion);

      res.json({
        success: true,
        message: 'Auditorías obtenidas exitosamente',
        data: resultado.auditorias,
        pagination: resultado.pagination,
        filtros: resultado.filtros_aplicados
      });

    } catch (error) {
      console.error('Error listando auditorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo auditorías',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener auditoría específica
   * GET /api/auditorias/:id
   */
  async obtenerPorId(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);
      const incluir_timeline = req.query.incluir_timeline === 'true';

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const auditoria = await auditoriasService.obtenerAuditoriaCompleta(auditoria_id);

      // Si no se solicita timeline, no incluirlo para mejorar performance
      if (!incluir_timeline) {
        delete auditoria.timeline;
      }

      res.json({
        success: true,
        message: 'Auditoría obtenida exitosamente',
        data: auditoria
      });

    } catch (error) {
      if (error.message === 'Auditoría no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }

      console.error('Error obteniendo auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo auditoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualizar auditoría
   * PUT /api/auditorias/:id
   */
  async actualizar(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);
      const datos = req.body;
      const usuario = req.user;

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const auditoria = await auditoriasService.actualizarAuditoria(auditoria_id, datos, usuario);

      res.json({
        success: true,
        message: 'Auditoría actualizada exitosamente',
        data: auditoria
      });

    } catch (error) {
      if (error.message === 'Auditoría no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }

      console.error('Error actualizando auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando auditoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Avanzar etapa de workflow
   * POST /api/auditorias/:id/avanzar-etapa
   */
  async avanzarEtapa(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);
      const opciones = req.body;
      const usuario = req.user;

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const resultado = await auditoriasService.avanzarEtapa(auditoria_id, usuario, opciones);

      res.json({
        success: true,
        message: `Etapa avanzada exitosamente: ${resultado.etapa_anterior} → ${resultado.etapa_nueva}`,
        data: resultado
      });

    } catch (error) {
      if (error.message.includes('No puede avanzar etapa')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'Auditoría no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }

      console.error('Error avanzando etapa:', error);
      res.status(500).json({
        success: false,
        message: 'Error avanzando etapa de workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estado del workflow
   * GET /api/auditorias/:id/workflow
   */
  async obtenerWorkflow(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const estadoWorkflow = await workflowService.obtenerEstadoWorkflow(auditoria_id);

      res.json({
        success: true,
        message: 'Estado de workflow obtenido exitosamente',
        data: estadoWorkflow
      });

    } catch (error) {
      if (error.message === 'Auditoría no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }

      console.error('Error obteniendo workflow:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado de workflow',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener timeline de eventos
   * GET /api/auditorias/:id/timeline
   */
  async obtenerTimeline(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);
      const limite = parseInt(req.query.limite) || 50;

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const timeline = await auditoriasService.obtenerTimelineAuditoria(auditoria_id, limite);

      res.json({
        success: true,
        message: 'Timeline obtenido exitosamente',
        data: {
          eventos: timeline,
          total_eventos: timeline.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo timeline:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo timeline de auditoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener documentos de auditoría
   * GET /api/auditorias/:id/documentos
   */
  async obtenerDocumentos(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);
      const filtros = {
        seccion: req.query.seccion,
        estado: req.query.estado,
        solo_actuales: req.query.solo_actuales === 'true'
      };

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const documentos = await documentosService.obtenerDocumentosAuditoria(auditoria_id, filtros);

      res.json({
        success: true,
        message: 'Documentos obtenidos exitosamente',
        data: {
          secciones: documentos,
          total_secciones: documentos.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo documentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo documentos de auditoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cargar documento
   * POST /api/auditorias/:id/documentos/:seccion
   */
  async cargarDocumento(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);
      const seccion = req.params.seccion;
      const usuario = req.user;

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha proporcionado ningún archivo'
        });
      }

      const metadatos = {
        fecha_revision: req.body.fecha_revision ? new Date(req.body.fecha_revision) : null,
        observaciones: req.body.observaciones,
        version_mayor: req.body.version_mayor === 'true',
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      const documento = await documentosService.cargarDocumento(
        auditoria_id, 
        seccion, 
        req.file, 
        metadatos, 
        usuario
      );

      res.status(201).json({
        success: true,
        message: 'Documento cargado exitosamente',
        data: documento
      });

    } catch (error) {
      console.error('Error cargando documento:', error);
      
      if (error.message.includes('Archivo inválido') || 
          error.message.includes('Formato no permitido') ||
          error.message.includes('ya fue cargado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error cargando documento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Validar documentos completos
   * GET /api/auditorias/:id/validar-documentos
   */
  async validarDocumentosCompletos(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const validacion = await documentosService.validarDocumentosCompletos(auditoria_id);

      res.json({
        success: true,
        message: 'Validación de documentos completada',
        data: validacion
      });

    } catch (error) {
      console.error('Error validando documentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error validando documentos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener resumen de auditoría
   * GET /api/auditorias/:id/resumen
   */
  async obtenerResumen(req, res) {
    try {
      const auditoria_id = parseInt(req.params.id);

      if (isNaN(auditoria_id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría inválido'
        });
      }

      const auditoria = await auditoriasService.obtenerAuditoriaCompleta(auditoria_id);

      res.json({
        success: true,
        message: 'Resumen obtenido exitosamente',
        data: {
          resumen: auditoria.resumen,
          progreso: auditoria.progreso,
          estadisticas: auditoria.estadisticas
        }
      });

    } catch (error) {
      if (error.message === 'Auditoría no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }

      console.error('Error obteniendo resumen:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo resumen de auditoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener configuración de secciones de documentos
   * GET /api/auditorias/configuracion/secciones
   */
  async obtenerConfiguracionSecciones(req, res) {
    try {
      const configuracion = documentosService.obtenerConfiguracionSecciones();

      res.json({
        success: true,
        message: 'Configuración de secciones obtenida exitosamente',
        data: configuracion
      });

    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo configuración de secciones',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas generales de auditorías
   * GET /api/auditorias/estadisticas
   */
  async obtenerEstadisticas(req, res) {
    try {
      const filtros = {
        periodo: req.query.periodo,
        fecha_desde: req.query.fecha_desde ? new Date(req.query.fecha_desde) : null,
        fecha_hasta: req.query.fecha_hasta ? new Date(req.query.fecha_hasta) : null
      };

      // Por ahora retornamos estadísticas básicas
      // En una implementación completa se consultaría la base de datos
      const estadisticas = {
        total_auditorias: 0,
        auditorias_activas: 0,
        auditorias_completadas: 0,
        promedio_tiempo_completado: 0,
        auditorias_por_estado: {},
        auditorias_por_etapa: {}
      };

      res.json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: estadisticas,
        filtros_aplicados: filtros
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AuditoriasController();