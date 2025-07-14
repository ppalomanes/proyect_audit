/**
 * Controlador de Auditorías
 * Portal de Auditorías Técnicas
 */

const auditoriasService = require('./auditorias.service');
const { asyncHandler } = require('../../shared/middleware/errorHandler');

class AuditoriasController {

  /**
   * POST /api/auditorias
   * Crear nueva auditoría
   */
  crearAuditoria = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const datosAuditoria = req.body;

    // Validaciones básicas
    const camposRequeridos = ['titulo', 'proveedor_id', 'auditor_principal_id', 'fecha_programada'];
    const camposFaltantes = camposRequeridos.filter(campo => !datosAuditoria[campo]);

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`,
        data: null
      });
    }

    // Validar permisos para crear auditorías
    if (!['ADMIN', 'AUDITOR'].includes(usuario.rol)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tiene permisos para crear auditorías',
        data: null
      });
    }

    const resultado = await auditoriasService.crearAuditoria(datosAuditoria, usuario);

    if (resultado.success) {
      res.status(201).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      const statusCode = resultado.message.includes('no existe') ? 404 : 400;
      res.status(statusCode).json({
        status: 'fail',
        message: resultado.message,
        data: resultado.data
      });
    }
  });

  /**
   * GET /api/auditorias
   * Obtener lista de auditorías con filtros y paginación
   */
  obtenerAuditorias = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const {
      page = 1,
      limit = 10,
      estado,
      tipo_auditoria,
      proveedor_id,
      auditor_id,
      fecha_desde,
      fecha_hasta
    } = req.query;

    const filtros = {
      estado,
      tipo_auditoria,
      proveedor_id,
      auditor_id,
      fecha_desde,
      fecha_hasta
    };

    const paginacion = { page, limit };

    const resultado = await auditoriasService.obtenerAuditorias(filtros, usuario, paginacion);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * GET /api/auditorias/:id
   * Obtener auditoría específica por ID
   */
  obtenerAuditoriaPorId = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de auditoría es requerido',
        data: null
      });
    }

    const resultado = await auditoriasService.obtenerAuditoriaPorId(id, usuario);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      const statusCode = resultado.message.includes('no encontrada') ? 404 : 
                        resultado.message.includes('permisos') ? 403 : 500;
      res.status(statusCode).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * PUT /api/auditorias/:id
   * Actualizar auditoría existente
   */
  actualizarAuditoria = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const { id } = req.params;
    const datosActualizacion = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de auditoría es requerido',
        data: null
      });
    }

    // Validar permisos para modificar auditorías
    if (!['ADMIN', 'AUDITOR'].includes(usuario.rol)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tiene permisos para modificar auditorías',
        data: null
      });
    }

    const resultado = await auditoriasService.actualizarAuditoria(id, datosActualizacion, usuario);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      const statusCode = resultado.message.includes('no encontrada') ? 404 : 
                        resultado.message.includes('permisos') ? 403 : 400;
      res.status(statusCode).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * POST /api/auditorias/:id/avanzar-etapa
   * Avanzar auditoría a la siguiente etapa
   */
  avanzarEtapa = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const { id } = req.params;
    const datosEtapa = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de auditoría es requerido',
        data: null
      });
    }

    // Validar permisos para avanzar etapas
    if (!['ADMIN', 'AUDITOR'].includes(usuario.rol)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tiene permisos para avanzar etapas',
        data: null
      });
    }

    const resultado = await auditoriasService.avanzarEtapa(id, usuario, datosEtapa);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      const statusCode = resultado.message.includes('no encontrada') ? 404 :
                        resultado.message.includes('permisos') ? 403 :
                        resultado.message.includes('requisitos') ? 422 : 400;
      res.status(statusCode).json({
        status: 'fail',
        message: resultado.message,
        data: resultado.data
      });
    }
  });

  /**
   * GET /api/auditorias/:id/historial
   * Obtener historial de cambios de una auditoría
   */
  obtenerHistorial = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de auditoría es requerido',
        data: null
      });
    }

    const resultado = await auditoriasService.obtenerAuditoriaPorId(id, usuario);

    if (resultado.success) {
      const historial = resultado.data.auditoria.historial_cambios || [];
      
      res.status(200).json({
        status: 'success',
        message: 'Historial obtenido exitosamente',
        data: {
          auditoria_id: id,
          historial: historial.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        }
      });
    } else {
      const statusCode = resultado.message.includes('no encontrada') ? 404 : 
                        resultado.message.includes('permisos') ? 403 : 500;
      res.status(statusCode).json({
        status: 'fail',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * GET /api/auditorias/estadisticas
   * Obtener estadísticas de auditorías
   */
  obtenerEstadisticas = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const filtros = req.query;

    const resultado = await auditoriasService.obtenerEstadisticas(usuario, filtros);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: resultado.message,
        data: resultado.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: resultado.message,
        data: null
      });
    }
  });

  /**
   * DELETE /api/auditorias/:id
   * Eliminar auditoría (soft delete)
   */
  eliminarAuditoria = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de auditoría es requerido',
        data: null
      });
    }

    // Solo ADMIN puede eliminar auditorías
    if (usuario.rol !== 'ADMIN') {
      return res.status(403).json({
        status: 'fail',
        message: 'Solo administradores pueden eliminar auditorías',
        data: null
      });
    }

    try {
      const { Auditoria } = await require('../../models').getModels();
      
      const auditoria = await Auditoria.findByPk(id);
      if (!auditoria) {
        return res.status(404).json({
          status: 'fail',
          message: 'Auditoría no encontrada',
          data: null
        });
      }

      // Verificar que la auditoría no esté en proceso
      if (['ETAPA_2_CARGA_DOCUMENTOS', 'ETAPA_3_VALIDACION_DOCUMENTOS', 'ETAPA_4_ANALISIS_PARQUE', 'ETAPA_5_VISITA_PRESENCIAL'].includes(auditoria.estado)) {
        return res.status(422).json({
          status: 'fail',
          message: 'No se puede eliminar una auditoría en proceso',
          data: null
        });
      }

      await auditoria.destroy();

      res.status(200).json({
        status: 'success',
        message: 'Auditoría eliminada exitosamente',
        data: {
          id: auditoria.id,
          codigo_auditoria: auditoria.codigo_auditoria
        }
      });

    } catch (error) {
      console.error('Error eliminando auditoría:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor al eliminar auditoría',
        data: null
      });
    }
  });

  /**
   * GET /api/auditorias/buscar/:codigo
   * Buscar auditoría por código
   */
  buscarPorCodigo = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({
        status: 'fail',
        message: 'Código de auditoría es requerido',
        data: null
      });
    }

    try {
      const { Auditoria, Proveedor, Usuario } = await require('../../models').getModels();
      
      const auditoria = await Auditoria.findOne({
        where: { codigo_auditoria: codigo },
        include: [
          {
            model: Proveedor,
            as: 'Proveedor',
            attributes: ['id', 'razon_social', 'nombre_comercial']
          },
          {
            model: Usuario,
            as: 'AuditorPrincipal',
            attributes: ['id', 'nombres', 'apellidos', 'email']
          }
        ]
      });

      if (!auditoria) {
        return res.status(404).json({
          status: 'fail',
          message: 'Auditoría no encontrada con el código especificado',
          data: null
        });
      }

      // Verificar permisos de acceso
      const auditoriasService = require('./auditorias.service');
      const tieneAcceso = await auditoriasService.verificarAccesoAuditoria(auditoria, usuario);
      
      if (!tieneAcceso) {
        return res.status(403).json({
          status: 'fail',
          message: 'No tiene permisos para acceder a esta auditoría',
          data: null
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Auditoría encontrada exitosamente',
        data: { auditoria }
      });

    } catch (error) {
      console.error('Error buscando auditoría por código:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor al buscar auditoría',
        data: null
      });
    }
  });

  /**
   * GET /api/auditorias/mis-auditorias
   * Obtener auditorías específicas del usuario actual
   */
  misAuditorias = asyncHandler(async (req, res) => {
    const usuario = req.user;
    const { page = 1, limit = 10 } = req.query;

    let filtros = {};
    
    // Filtrar según el rol del usuario
    if (usuario.rol === 'AUDITOR') {
      filtros.auditor_id = usuario.id;
    } else if (usuario.rol === 'PROVEEDOR') {
      // Los proveedores verán las auditorías de su empresa
      // Esto ya se maneja en el servicio
    }

    const paginacion = { page, limit };

    const resultado = await auditoriasService.obtenerAuditorias(filtros, usuario, paginacion);

    if (resultado.success) {
      res.status(200).json({
        status: 'success',
        message: 'Mis auditorías obtenidas exitosamente',
        data: resultado.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: resultado.message,
        data: null
      });
    }
  });
}

module.exports = new AuditoriasController();
