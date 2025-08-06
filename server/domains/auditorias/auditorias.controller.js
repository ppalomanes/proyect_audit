// auditorias.controller.js - Controlador para endpoints del workflow de auditorías
const auditoriasService = require('./auditorias.service');
const Auditoria = require('./models/Auditoria.model');
const Documento = require('./models/Documento.model');
const Etapa = require('./models/Etapa.model');
const { Op } = require('sequelize');

class AuditoriasController {
  /**
   * POST /api/auditorias
   * Crear nueva auditoría (ETAPA 1)
   */
  async crear(req, res) {
    try {
      const {
        periodo,
        proveedor_id,
        sitio_id,
        fecha_limite_carga,
        requiere_visita,
        es_urgente
      } = req.body;
      
      const resultado = await auditoriasService.crearAuditoria({
        periodo,
        proveedor_id,
        sitio_id,
        fecha_limite_carga,
        requiere_visita,
        es_urgente,
        usuario_id: req.user.id
      });
      
      res.status(201).json({
        success: true,
        message: 'Auditoría creada exitosamente',
        data: resultado.auditoria
      });
    } catch (error) {
      console.error('Error creando auditoría:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * GET /api/auditorias
   * Listar auditorías con filtros
   */
  async listar(req, res) {
    try {
      const {
        periodo,
        estado,
        proveedor_id,
        sitio_id,
        auditor_id,
        page = 1,
        limit = 10,
        sort = 'fecha_inicio',
        order = 'DESC'
      } = req.query;
      
      const where = {};
      if (periodo) where.periodo = periodo;
      if (estado) where.estado = estado;
      if (proveedor_id) where.proveedor_id = proveedor_id;
      if (sitio_id) where.sitio_id = sitio_id;
      if (auditor_id) where.auditor_asignado_id = auditor_id;
      
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Auditoria.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [[sort, order]],
        include: [
          {
            model: Etapa,
            as: 'etapas',
            attributes: ['numero_etapa', 'nombre_etapa', 'estado']
          }
        ]
      });
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error listando auditorías:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * GET /api/auditorias/:id
   * Obtener detalle de auditoría
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      
      const auditoria = await Auditoria.findByPk(id, {
        include: [
          {
            model: Etapa,
            as: 'etapas',
            order: [['numero_etapa', 'ASC']]
          },
          {
            model: Documento,
            as: 'documentos',
            where: { es_version_actual: true },
            required: false
          }
        ]
      });
      
      if (!auditoria) {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: auditoria
      });
    } catch (error) {
      console.error('Error obteniendo auditoría:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * POST /api/auditorias/:id/documentos
   * Cargar documento (ETAPA 2)
   */
  async cargarDocumento(req, res) {
    try {
      const { id } = req.params;
      const { tipo, nombre, observaciones, fecha_revision } = req.body;
      const archivo = req.file;
      
      if (!archivo) {
        return res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo'
        });
      }
      
      const resultado = await auditoriasService.cargarDocumento(id, {
        tipo,
        nombre,
        observaciones,
        fecha_revision,
        usuario_id: req.user.id
      }, archivo);
      
      res.json({
        success: true,
        message: 'Documento cargado exitosamente',
        data: resultado.documento
      });
    } catch (error) {
      console.error('Error cargando documento:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * POST /api/auditorias/:id/finalizar-carga
   * Finalizar carga de documentos y pasar a validación (ETAPA 2 → 3)
   */
  async finalizarCarga(req, res) {
    try {
      const { id } = req.params;
      
      const resultado = await auditoriasService.finalizarCarga(id, req.user.id);
      
      if (!resultado.success) {
        return res.status(400).json({
          success: false,
          message: resultado.message,
          faltantes: resultado.faltantes
        });
      }
      
      res.json({
        success: true,
        message: resultado.message
      });
    } catch (error) {
      console.error('Error finalizando carga:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * POST /api/auditorias/:id/evaluar-seccion
   * Evaluar sección específica (ETAPA 4)
   */
  async evaluarSeccion(req, res) {
    try {
      const { id } = req.params;
      const { seccion, cumple, observaciones, razon } = req.body;
      
      const resultado = await auditoriasService.evaluarSeccion(
        id,
        seccion,
        { cumple, observaciones, razon },
        req.user.id
      );
      
      res.json({
        success: true,
        message: resultado.message,
        pendientes: resultado.pendientes
      });
    } catch (error) {
      console.error('Error evaluando sección:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * POST /api/auditorias/:id/programar-visita
   * Programar visita presencial (ETAPA 5)
   */
  async programarVisita(req, res) {
    try {
      const { id } = req.params;
      const { fecha_visita, observaciones } = req.body;
      
      const auditoria = await Auditoria.findByPk(id);
      
      if (!auditoria) {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }
      
      await auditoria.update({
        fecha_visita,
        estado: 'VISITA_PROGRAMADA',
        etapa_actual: 5
      });
      
      res.json({
        success: true,
        message: 'Visita programada exitosamente',
        data: { fecha_visita }
      });
    } catch (error) {
      console.error('Error programando visita:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * POST /api/auditorias/:id/completar-visita
   * Registrar visita completada (ETAPA 6)
   */
  async completarVisita(req, res) {
    try {
      const { id } = req.params;
      const { observaciones, hallazgos } = req.body;
      const archivos = req.files; // Acta y fotografías
      
      const auditoria = await Auditoria.findByPk(id);
      
      await auditoria.update({
        estado: 'VISITA_REALIZADA',
        etapa_actual: 6,
        observaciones_auditor: observaciones
      });
      
      // Cargar acta y fotografías como documentos
      if (archivos && archivos.length > 0) {
        for (const archivo of archivos) {
          await auditoriasService.cargarDocumento(id, {
            tipo: archivo.fieldname === 'acta' ? 'ACTA_VISITA' : 'FOTOGRAFIAS_VISITA',
            nombre: archivo.originalname,
            usuario_id: req.user.id
          }, archivo);
        }
      }
      
      res.json({
        success: true,
        message: 'Visita registrada exitosamente'
      });
    } catch (error) {
      console.error('Error completando visita:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * POST /api/auditorias/:id/generar-informe
   * Generar informe final (ETAPA 7)
   */
  async generarInforme(req, res) {
    try {
      const { id } = req.params;
      
      const resultado = await auditoriasService.generarInforme(id);
      
      res.json({
        success: true,
        message: 'Informe generado exitosamente',
        data: {
          ruta: resultado.ruta,
          resumen: resultado.informe.resumen_ejecutivo
        }
      });
    } catch (error) {
      console.error('Error generando informe:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * POST /api/auditorias/:id/cerrar
   * Cerrar auditoría (ETAPA 8)
   */
  async cerrarAuditoria(req, res) {
    try {
      const { id } = req.params;
      
      const resultado = await auditoriasService.notificarResultados(id);
      
      res.json({
        success: true,
        message: resultado.message
      });
    } catch (error) {
      console.error('Error cerrando auditoría:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * GET /api/auditorias/:id/progreso
   * Obtener progreso de auditoría
   */
  async obtenerProgreso(req, res) {
    try {
      const { id } = req.params;
      
      const auditoria = await Auditoria.findByPk(id, {
        attributes: ['id', 'codigo', 'estado', 'etapa_actual', 'score_automatico', 'score_auditor', 'score_final'],
        include: [{
          model: Etapa,
          as: 'etapas',
          attributes: ['numero_etapa', 'nombre_etapa', 'estado', 'cumplimiento']
        }]
      });
      
      if (!auditoria) {
        return res.status(404).json({
          success: false,
          message: 'Auditoría no encontrada'
        });
      }
      
      // Calcular progreso total
      const etapasCompletadas = auditoria.etapas.filter(e => e.estado === 'COMPLETADA').length;
      const progresoTotal = (etapasCompletadas / 8) * 100;
      
      res.json({
        success: true,
        data: {
          codigo: auditoria.codigo,
          estado_actual: auditoria.estado,
          etapa_actual: auditoria.etapa_actual,
          progreso_total: progresoTotal,
          etapas: auditoria.etapas,
          scores: {
            automatico: auditoria.score_automatico,
            auditor: auditoria.score_auditor,
            final: auditoria.score_final
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * GET /api/auditorias/:id/documentos
   * Listar documentos de una auditoría
   */
  async listarDocumentos(req, res) {
    try {
      const { id } = req.params;
      const { incluir_versiones = false } = req.query;
      
      const where = { auditoria_id: id };
      if (!incluir_versiones) {
        where.es_version_actual = true;
      }
      
      const documentos = await Documento.findAll({
        where,
        order: [['tipo_documento', 'ASC'], ['version', 'DESC']]
      });
      
      res.json({
        success: true,
        data: documentos
      });
    } catch (error) {
      console.error('Error listando documentos:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * GET /api/auditorias/estadisticas
   * Obtener estadísticas generales
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { periodo, proveedor_id } = req.query;
      
      const where = {};
      if (periodo) where.periodo = periodo;
      if (proveedor_id) where.proveedor_id = proveedor_id;
      
      // Estadísticas por estado
      const porEstado = await Auditoria.findAll({
        where,
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['estado']
      });
      
      // Score promedio
      const scorePromedio = await Auditoria.findOne({
        where,
        attributes: [
          [sequelize.fn('AVG', sequelize.col('score_final')), 'promedio']
        ]
      });
      
      // Auditorías urgentes
      const urgentes = await Auditoria.count({
        where: { ...where, es_urgente: true, estado: { [Op.ne]: 'CERRADA' } }
      });
      
      // Auditorías con retraso
      const conRetraso = await Auditoria.count({
        where: {
          ...where,
          fecha_limite_carga: { [Op.lt]: new Date() },
          estado: 'CARGANDO'
        }
      });
      
      res.json({
        success: true,
        data: {
          por_estado: porEstado,
          score_promedio: scorePromedio?.promedio || 0,
          urgentes,
          con_retraso: conRetraso
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuditoriasController();
