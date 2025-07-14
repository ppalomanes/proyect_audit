/**
 * Servicio de Auditorías
 * Portal de Auditorías Técnicas
 */

const { getModels } = require('../../models');
const { Op } = require('sequelize');

class AuditoriasService {

  /**
   * Crear nueva auditoría
   */
  async crearAuditoria(datosAuditoria, usuarioCreador) {
    try {
      const { Auditoria, Proveedor, Usuario } = await getModels();

      // Validar que el proveedor existe
      const proveedor = await Proveedor.findByPk(datosAuditoria.proveedor_id);
      if (!proveedor) {
        return {
          success: false,
          message: 'El proveedor especificado no existe',
          data: null
        };
      }

      // Validar que el auditor principal existe y tiene rol AUDITOR
      const auditorPrincipal = await Usuario.findByPk(datosAuditoria.auditor_principal_id);
      if (!auditorPrincipal) {
        return {
          success: false,
          message: 'El auditor principal especificado no existe',
          data: null
        };
      }

      if (!['AUDITOR', 'ADMIN'].includes(auditorPrincipal.rol)) {
        return {
          success: false,
          message: 'El usuario especificado no tiene permisos de auditor',
          data: null
        };
      }

      // Validar auditor secundario si se especifica
      if (datosAuditoria.auditor_secundario_id) {
        const auditorSecundario = await Usuario.findByPk(datosAuditoria.auditor_secundario_id);
        if (!auditorSecundario || !['AUDITOR', 'ADMIN'].includes(auditorSecundario.rol)) {
          return {
            success: false,
            message: 'El auditor secundario especificado no es válido',
            data: null
          };
        }
      }

      // Generar código único de auditoría
      const codigoAuditoria = await this.generarCodigoUnico();

      // Preparar datos para crear la auditoría
      const nuevaAuditoria = await Auditoria.create({
        titulo: datosAuditoria.titulo,
        descripcion: datosAuditoria.descripcion,
        codigo_auditoria: codigoAuditoria,
        tipo_auditoria: datosAuditoria.tipo_auditoria || 'INICIAL',
        modalidad: datosAuditoria.modalidad || 'HIBRIDA',
        proveedor_id: datosAuditoria.proveedor_id,
        auditor_principal_id: datosAuditoria.auditor_principal_id,
        auditor_secundario_id: datosAuditoria.auditor_secundario_id || null,
        fecha_programada: datosAuditoria.fecha_programada,
        fecha_fin_programada: datosAuditoria.fecha_fin_programada,
        version_pliego: datosAuditoria.version_pliego || '2025-v1',
        duracion_estimada_dias: datosAuditoria.duracion_estimada_dias || 30,
        direccion_visita: datosAuditoria.direccion_visita,
        creado_por: usuarioCreador.id,
        estado: 'PROGRAMADA',
        etapa_actual: 0,
        progreso_porcentaje: 0
      });

      // Cargar relaciones para respuesta completa
      const auditoriaCompleta = await Auditoria.findByPk(nuevaAuditoria.id, {
        include: [
          {
            model: Proveedor,
            as: 'Proveedor',
            attributes: ['id', 'razon_social', 'nombre_comercial', 'nit']
          },
          {
            model: Usuario,
            as: 'AuditorPrincipal',
            attributes: ['id', 'nombres', 'apellidos', 'email']
          },
          {
            model: Usuario,
            as: 'AuditorSecundario',
            attributes: ['id', 'nombres', 'apellidos', 'email'],
            required: false
          }
        ]
      });

      // Registrar en historial
      await this.registrarCambioHistorial(nuevaAuditoria.id, 'AUDITORIA_CREADA', {
        mensaje: 'Auditoría creada exitosamente',
        usuario_id: usuarioCreador.id,
        datos_previos: null,
        datos_nuevos: {
          titulo: nuevaAuditoria.titulo,
          proveedor: proveedor.razon_social,
          auditor_principal: auditorPrincipal.nombres + ' ' + auditorPrincipal.apellidos
        }
      });

      return {
        success: true,
        message: 'Auditoría creada exitosamente',
        data: {
          auditoria: auditoriaCompleta,
          codigo_auditoria: codigoAuditoria
        }
      };

    } catch (error) {
      console.error('Error creando auditoría:', error);
      return {
        success: false,
        message: 'Error interno del servidor al crear auditoría',
        data: null
      };
    }
  }

  /**
   * Obtener lista de auditorías con filtros y paginación
   */
  async obtenerAuditorias(filtros = {}, usuario, paginacion = {}) {
    try {
      const { Auditoria, Proveedor, Usuario } = await getModels();

      const { 
        page = 1, 
        limit = 10, 
        estado, 
        tipo_auditoria, 
        proveedor_id, 
        auditor_id,
        fecha_desde,
        fecha_hasta 
      } = { ...filtros, ...paginacion };

      // Construcción de filtros WHERE
      const whereConditions = {};
      
      if (estado) {
        whereConditions.estado = estado;
      }
      
      if (tipo_auditoria) {
        whereConditions.tipo_auditoria = tipo_auditoria;
      }
      
      if (proveedor_id) {
        whereConditions.proveedor_id = proveedor_id;
      }
      
      if (auditor_id) {
        whereConditions[Op.or] = [
          { auditor_principal_id: auditor_id },
          { auditor_secundario_id: auditor_id }
        ];
      }
      
      if (fecha_desde || fecha_hasta) {
        whereConditions.fecha_programada = {};
        if (fecha_desde) {
          whereConditions.fecha_programada[Op.gte] = new Date(fecha_desde);
        }
        if (fecha_hasta) {
          whereConditions.fecha_hasta[Op.lte] = new Date(fecha_hasta);
        }
      }

      // Aplicar filtros de rol - Los proveedores solo ven sus auditorías
      if (usuario.rol === 'PROVEEDOR') {
        const emailDomain = usuario.email.split('@')[1];
        const proveedorRelacionado = await Proveedor.findOne({
          where: {
            email_principal: {
              [Op.like]: `%@${emailDomain}`
            }
          }
        });
        
        if (proveedorRelacionado) {
          whereConditions.proveedor_id = proveedorRelacionado.id;
        } else {
          whereConditions.id = null;
        }
      }

      // Calcular offset para paginación
      const offset = (page - 1) * limit;

      // Ejecutar consulta
      const { count, rows } = await Auditoria.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Proveedor,
            as: 'Proveedor',
            attributes: ['id', 'razon_social', 'nombre_comercial', 'nit', 'ciudad']
          },
          {
            model: Usuario,
            as: 'AuditorPrincipal',
            attributes: ['id', 'nombres', 'apellidos', 'email']
          },
          {
            model: Usuario,
            as: 'AuditorSecundario',
            attributes: ['id', 'nombres', 'apellidos', 'email'],
            required: false
          }
        ],
        order: [['creado_en', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      // Calcular metadatos de paginación
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        message: 'Auditorías obtenidas exitosamente',
        data: {
          auditorias: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit),
            has_next_page: hasNextPage,
            has_prev_page: hasPrevPage
          },
          filters_applied: filtros
        }
      };

    } catch (error) {
      console.error('Error obteniendo auditorías:', error);
      return {
        success: false,
        message: 'Error interno del servidor al obtener auditorías',
        data: null
      };
    }
  }

  /**
   * Obtener auditoría por ID
   */
  async obtenerAuditoriaPorId(auditoriaId, usuario) {
    try {
      const { Auditoria, Proveedor, Usuario, Documento } = await getModels();

      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: [
          {
            model: Proveedor,
            as: 'Proveedor'
          },
          {
            model: Usuario,
            as: 'AuditorPrincipal',
            attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono']
          },
          {
            model: Usuario,
            as: 'AuditorSecundario',
            attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'],
            required: false
          },
          {
            model: Documento,
            as: 'Documentos',
            attributes: ['id', 'nombre_archivo', 'tipo_documento', 'estado_validacion', 'creado_en'],
            order: [['creado_en', 'DESC']]
          }
        ]
      });

      if (!auditoria) {
        return {
          success: false,
          message: 'Auditoría no encontrada',
          data: null
        };
      }

      // Verificar permisos de acceso
      const tieneAcceso = await this.verificarAccesoAuditoria(auditoria, usuario);
      if (!tieneAcceso) {
        return {
          success: false,
          message: 'No tiene permisos para acceder a esta auditoría',
          data: null
        };
      }

      // Calcular información adicional
      const informacionAdicional = {
        dias_restantes: auditoria.calcularDiasRestantes(),
        esta_vencida: auditoria.estaVencida(),
        puede_avanzar_etapa: auditoria.puedeAvanzarEtapa(),
        documentos_count: auditoria.Documentos?.length || 0,
        progreso_etapas: this.calcularProgresoEtapas(auditoria)
      };

      return {
        success: true,
        message: 'Auditoría obtenida exitosamente',
        data: {
          auditoria,
          informacion_adicional: informacionAdicional
        }
      };

    } catch (error) {
      console.error('Error obteniendo auditoría:', error);
      return {
        success: false,
        message: 'Error interno del servidor al obtener auditoría',
        data: null
      };
    }
  }

  /**
   * Avanzar etapa de auditoría
   */
  async avanzarEtapa(auditoriaId, usuario, datosEtapa = {}) {
    try {
      const { Auditoria } = await getModels();

      const auditoria = await Auditoria.findByPk(auditoriaId);
      if (!auditoria) {
        return {
          success: false,
          message: 'Auditoría no encontrada',
          data: null
        };
      }

      // Verificar permisos para avanzar etapa
      const puedeAvanzar = await this.verificarPermisosAvanzarEtapa(auditoria, usuario);
      if (!puedeAvanzar) {
        return {
          success: false,
          message: 'No tiene permisos para avanzar esta etapa',
          data: null
        };
      }

      // Verificar que se puede avanzar la etapa
      if (!auditoria.puedeAvanzarEtapa()) {
        return {
          success: false,
          message: 'No se puede avanzar la etapa en el estado actual',
          data: null
        };
      }

      // Validar requisitos de la etapa actual
      const validacionEtapa = await this.validarRequisitosEtapa(auditoria, auditoria.etapa_actual + 1);
      if (!validacionEtapa.esValido) {
        return {
          success: false,
          message: `No se cumplen los requisitos para avanzar: ${validacionEtapa.mensaje}`,
          data: validacionEtapa.detalles
        };
      }

      const etapaPreviaNumero = auditoria.etapa_actual;
      const etapaPreviaEstado = auditoria.estado;

      // Avanzar etapa
      await auditoria.avanzarEtapa();

      // Ejecutar lógica específica de la nueva etapa
      await this.ejecutarLogicaEtapa(auditoria, datosEtapa, usuario);

      // Registrar cambio en historial
      await this.registrarCambioHistorial(auditoria.id, 'ETAPA_AVANZADA', {
        mensaje: `Avanzó de etapa ${etapaPreviaNumero} a etapa ${auditoria.etapa_actual}`,
        usuario_id: usuario.id,
        datos_previos: {
          etapa: etapaPreviaNumero,
          estado: etapaPreviaEstado
        },
        datos_nuevos: {
          etapa: auditoria.etapa_actual,
          estado: auditoria.estado
        }
      });

      return {
        success: true,
        message: `Auditoría avanzada exitosamente a etapa ${auditoria.etapa_actual}`,
        data: {
          etapa_actual: auditoria.etapa_actual,
          estado_actual: auditoria.estado,
          progreso_porcentaje: auditoria.progreso_porcentaje
        }
      };

    } catch (error) {
      console.error('Error avanzando etapa:', error);
      return {
        success: false,
        message: 'Error interno del servidor al avanzar etapa',
        data: null
      };
    }
  }

  /**
   * Obtener estadísticas de auditorías
   */
  async obtenerEstadisticas(usuario, filtros = {}) {
    try {
      const { Auditoria, sequelize } = await getModels();

      // Aplicar filtros de usuario
      const whereConditions = this.aplicarFiltrosUsuario({}, usuario);

      // Estadísticas generales
      const totalAuditorias = await Auditoria.count({ where: whereConditions });
      
      const auditoriasPorEstado = await Auditoria.findAll({
        where: whereConditions,
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['estado'],
        raw: true
      });

      const auditoriasPorEtapa = await Auditoria.findAll({
        where: whereConditions,
        attributes: [
          'etapa_actual',
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['etapa_actual'],
        raw: true
      });

      // Auditorías próximas a vencer (próximos 7 días)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 7);
      
      const auditoriasPorVencer = await Auditoria.count({
        where: {
          ...whereConditions,
          fecha_fin_programada: {
            [Op.between]: [new Date(), fechaLimite]
          },
          estado: {
            [Op.notIn]: ['COMPLETADA', 'CANCELADA']
          }
        }
      });

      // Auditorías vencidas
      const auditoriasVencidas = await Auditoria.count({
        where: {
          ...whereConditions,
          fecha_fin_programada: {
            [Op.lt]: new Date()
          },
          estado: {
            [Op.notIn]: ['COMPLETADA', 'CANCELADA']
          }
        }
      });

      return {
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          resumen: {
            total_auditorias: totalAuditorias,
            por_vencer: auditoriasPorVencer,
            vencidas: auditoriasVencidas
          },
          distribucion: {
            por_estado: auditoriasPorEstado,
            por_etapa: auditoriasPorEtapa
          }
        }
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        message: 'Error interno del servidor al obtener estadísticas',
        data: null
      };
    }
  }

  // =================== MÉTODOS AUXILIARES ===================

  /**
   * Generar código único de auditoría
   */
  async generarCodigoUnico() {
    const { Auditoria } = await getModels();
    
    let codigoUnico;
    let existe = true;
    
    while (existe) {
      const año = new Date().getFullYear();
      const mes = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      codigoUnico = `AUD-${año}${mes}-${random}`;
      
      const auditoriaExistente = await Auditoria.findOne({
        where: { codigo_auditoria: codigoUnico }
      });
      
      existe = !!auditoriaExistente;
    }
    
    return codigoUnico;
  }

  /**
   * Verificar acceso a auditoría según rol de usuario
   */
  async verificarAccesoAuditoria(auditoria, usuario) {
    // ADMIN tiene acceso a todo
    if (usuario.rol === 'ADMIN') {
      return true;
    }

    // AUDITOR puede ver auditorías donde sea principal o secundario
    if (usuario.rol === 'AUDITOR') {
      return auditoria.auditor_principal_id === usuario.id || 
             auditoria.auditor_secundario_id === usuario.id;
    }

    // PROVEEDOR solo puede ver sus propias auditorías
    if (usuario.rol === 'PROVEEDOR') {
      // TODO: Implementar lógica más robusta de relación usuario-proveedor
      return true; // Por ahora permitir acceso, se filtra en obtenerAuditorias
    }

    return false;
  }

  /**
   * Verificar permisos para avanzar etapa
   */
  async verificarPermisosAvanzarEtapa(auditoria, usuario) {
    // Solo ADMIN y AUDITOREs asignados pueden avanzar etapas
    if (usuario.rol === 'ADMIN') {
      return true;
    }

    if (usuario.rol === 'AUDITOR') {
      return auditoria.auditor_principal_id === usuario.id || 
             auditoria.auditor_secundario_id === usuario.id;
    }

    return false;
  }

  /**
   * Validar requisitos para avanzar a una etapa específica
   */
  async validarRequisitosEtapa(auditoria, proximaEtapa) {
    // Importar módulos de workflow para validaciones
    const Etapa1Notificacion = require('./workflow/etapa1-notificacion');
    const Etapa2CargaDocumentos = require('./workflow/etapa2-carga');
    const Etapa3ValidacionDocumentos = require('./workflow/etapa3-validacion');
    
    const { Documento } = await getModels();

    switch (proximaEtapa) {
      case 1: // ETAPA_1_NOTIFICACION
        return await Etapa1Notificacion.validarRequisitos(auditoria);

      case 2: // ETAPA_2_CARGA_DOCUMENTOS
        return { esValido: true, mensaje: 'Notificación enviada, listo para carga de documentos' };

      case 3: // ETAPA_3_VALIDACION_DOCUMENTOS
        return await Etapa2CargaDocumentos.validarRequisitos(auditoria);

      case 4: // ETAPA_4_ANALISIS_PARQUE
        return await Etapa3ValidacionDocumentos.validarRequisitos(auditoria);

      case 5: // ETAPA_5_VISITA_PRESENCIAL
        return { esValido: true, mensaje: 'Análisis de parque informático completado' };

      case 6: // ETAPA_6_INFORME_PRELIMINAR
        // Verificar que la fecha de visita está programada o completada
        if (!auditoria.fecha_visita_programada) {
          return {
            esValido: false,
            mensaje: 'Fecha de visita presencial no programada',
            detalles: { fecha_visita_requerida: true }
          };
        }
        
        return { esValido: true, mensaje: 'Visita presencial completada' };

      case 7: // ETAPA_7_REVISION_OBSERVACIONES
        return { esValido: true, mensaje: 'Informe preliminar disponible' };

      case 8: // ETAPA_8_INFORME_FINAL
        return { esValido: true, mensaje: 'Revisión de observaciones completada' };

      default:
        return { esValido: false, mensaje: 'Etapa no válida' };
    }
  }

  /**
   * Ejecutar lógica específica de cada etapa
   */
  async ejecutarLogicaEtapa(auditoria, datosEtapa, usuario) {
    // Importar módulos de workflow
    const Etapa1Notificacion = require('./workflow/etapa1-notificacion');
    const Etapa2CargaDocumentos = require('./workflow/etapa2-carga');
    const Etapa3ValidacionDocumentos = require('./workflow/etapa3-validacion');

    switch (auditoria.etapa_actual) {
      case 1: // ETAPA_1_NOTIFICACION
        const resultadoEtapa1 = await Etapa1Notificacion.ejecutar(auditoria, datosEtapa, usuario);
        console.log(`📧 Etapa 1 completada:`, resultadoEtapa1.message);
        break;

      case 2: // ETAPA_2_CARGA_DOCUMENTOS
        const resultadoEtapa2 = await Etapa2CargaDocumentos.ejecutar(auditoria, datosEtapa, usuario);
        console.log(`📁 Etapa 2 completada:`, resultadoEtapa2.message);
        
        if (datosEtapa.fecha_limite_carga) {
          auditoria.fecha_fin_programada = new Date(datosEtapa.fecha_limite_carga);
          await auditoria.save();
        }
        break;

      case 3: // ETAPA_3_VALIDACION_DOCUMENTOS
        const resultadoEtapa3 = await Etapa3ValidacionDocumentos.ejecutar(auditoria, datosEtapa, usuario);
        console.log(`✅ Etapa 3 completada:`, resultadoEtapa3.message);
        break;

      case 4: // ETAPA_4_ANALISIS_PARQUE
        // TODO: Integrar con módulo ETL
        console.log(`🔄 Etapa 4 - Iniciando análisis de parque informático`);
        // await etlService.procesarParqueInformatico(auditoria.id);
        break;

      case 5: // ETAPA_5_VISITA_PRESENCIAL
        if (datosEtapa.fecha_visita) {
          auditoria.fecha_visita_programada = new Date(datosEtapa.fecha_visita);
          await auditoria.save();
        }
        console.log(`🏢 Etapa 5 - Visita presencial programada`);
        break;

      case 6: // ETAPA_6_INFORME_PRELIMINAR
        // TODO: Generar informe preliminar automático
        console.log(`📊 Etapa 6 - Generando informe preliminar`);
        break;

      case 7: // ETAPA_7_REVISION_OBSERVACIONES
        // TODO: Habilitar observaciones del proveedor
        console.log(`💬 Etapa 7 - Habilitando revisión de observaciones`);
        break;

      case 8: // ETAPA_8_INFORME_FINAL
        // TODO: Generar informe final y certificado
        auditoria.fecha_fin_real = new Date();
        await auditoria.save();
        console.log(`🎯 Etapa 8 - Auditoría completada`);
        break;

      default:
        console.log(`⚠️ Etapa ${auditoria.etapa_actual} no tiene lógica específica definida`);
    }
  }

  /**
   * Calcular progreso de etapas
   */
  calcularProgresoEtapas(auditoria) {
    const etapas = [
      { numero: 1, nombre: 'Notificación', completada: auditoria.etapa_actual >= 1 },
      { numero: 2, nombre: 'Carga Documentos', completada: auditoria.etapa_actual >= 2 },
      { numero: 3, nombre: 'Validación', completada: auditoria.etapa_actual >= 3 },
      { numero: 4, nombre: 'Análisis Parque', completada: auditoria.etapa_actual >= 4 },
      { numero: 5, nombre: 'Visita Presencial', completada: auditoria.etapa_actual >= 5 },
      { numero: 6, nombre: 'Informe Preliminar', completada: auditoria.etapa_actual >= 6 },
      { numero: 7, nombre: 'Revisión Observaciones', completada: auditoria.etapa_actual >= 7 },
      { numero: 8, nombre: 'Informe Final', completada: auditoria.etapa_actual >= 8 }
    ];

    return {
      etapas,
      completadas: etapas.filter(e => e.completada).length,
      total: etapas.length,
      porcentaje: auditoria.progreso_porcentaje
    };
  }

  /**
   * Registrar cambio en historial de auditoría
   */
  async registrarCambioHistorial(auditoriaId, tipoEvento, detalles) {
    try {
      const { Auditoria } = await getModels();
      
      const auditoria = await Auditoria.findByPk(auditoriaId);
      if (!auditoria) return;

      const historialActual = auditoria.historial_cambios || [];
      
      const nuevoEvento = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        tipo_evento: tipoEvento,
        ...detalles
      };

      historialActual.push(nuevoEvento);
      
      auditoria.historial_cambios = historialActual;
      await auditoria.save();

    } catch (error) {
      console.error('Error registrando cambio en historial:', error);
    }
  }

  /**
   * Aplicar filtros según rol de usuario
   */
  aplicarFiltrosUsuario(whereConditions, usuario) {
    if (usuario.rol === 'PROVEEDOR') {
      // Los proveedores solo ven sus auditorías
      // TODO: Implementar lógica más robusta
      whereConditions.proveedor_id = { [Op.ne]: null };
    }
    
    return whereConditions;
  }
}

module.exports = new AuditoriasService();
