const { Auditoria, Documento, Bitacora, Validacion, Evaluacion } = require('../models');
const workflowService = require('./workflow.service');
const documentosService = require('./documentos.service');
const validacionService = require('./validacion.service');
const { sequelize } = require('../../../config/database');

class AuditoriasService {
  
  /**
   * Crear nueva auditoría
   */
  async crearNuevaAuditoria(datos, usuario) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Generar código único
      const codigo = await Auditoria.generarCodigo();
      
      // 2. Crear auditoría principal
      const auditoria = await Auditoria.create({
        codigo,
        proveedor_id: datos.proveedor_id,
        auditor_principal_id: datos.auditor_principal_id,
        periodo: this.generarPeriodo(),
        fecha_programada: datos.fecha_programada,
        fecha_limite: this.calcularFechaLimite(datos.fecha_programada),
        estado: 'CONFIGURACION',
        etapa_actual: 1,
        alcance: datos.alcance,
        observaciones: datos.observaciones,
        umbrales_tecnicos: this.obtenerUmbralesActuales(),
        creado_por: usuario.id,
        fecha_creacion: new Date()
      }, { transaction });

      // 3. Registrar en bitácora
      await this.registrarAccion(auditoria.id, 'AUDITORIA_CREADA', {
        usuario_id: usuario.id,
        descripcion: `Nueva auditoría ${codigo} creada`,
        datos_despues: {
          codigo: auditoria.codigo,
          proveedor_id: auditoria.proveedor_id,
          auditor_id: auditoria.auditor_principal_id
        },
        categoria: 'ADMINISTRATIVO',
        severidad: 'MEDIA'
      });

      // 4. Crear workspace de chat si el módulo está disponible
      try {
        const chatService = require('../../chat/chat.service');
        await chatService.crearWorkspaceAuditoria(auditoria.id, {
          nombre: `Auditoría ${codigo}`,
          descripcion: `Comunicación para auditoría ${codigo}`,
          participantes: [datos.proveedor_id, datos.auditor_principal_id]
        });
      } catch (error) {
        console.warn('Chat service no disponible:', error.message);
      }

      await transaction.commit();
      return await this.obtenerAuditoriaCompleta(auditoria.id);
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creando auditoría: ${error.message}`);
    }
  }

  /**
   * Obtener auditoría con toda la información relacionada
   */
  async obtenerAuditoriaCompleta(auditoria_id) {
    const auditoria = await Auditoria.findByPk(auditoria_id, {
      include: [
        {
          model: Documento,
          as: 'documentos',
          where: { estado: 'ACTIVO' },
          required: false
        },
        {
          model: Validacion,
          as: 'validaciones',
          order: [['fecha_ejecucion', 'DESC']],
          limit: 10,
          required: false
        },
        {
          model: Evaluacion,
          as: 'evaluaciones',
          where: { estado: ['COMPLETADA', 'REVISADA', 'APROBADA'] },
          required: false
        }
      ]
    });

    if (!auditoria) {
      throw new Error('Auditoría no encontrada');
    }

    // Enriquecer con información adicional
    const resumen = await this.generarResumenAuditoria(auditoria);
    const timeline = await this.obtenerTimelineAuditoria(auditoria_id);
    const progreso = await this.calcularProgresoWorkflow(auditoria);

    return {
      ...auditoria.toJSON(),
      resumen,
      timeline: timeline.slice(0, 20), // Últimos 20 eventos
      progreso,
      puede_avanzar_etapa: await workflowService.puedeAvanzarEtapa(auditoria)
    };
  }

  /**
   * Listar auditorías con filtros y paginación
   */
  async listarAuditorias(filtros = {}, paginacion = {}) {
    const { page = 1, limit = 20, orderBy = 'fecha_creacion', order = 'DESC' } = paginacion;
    const offset = (page - 1) * limit;

    // Construir filtros WHERE
    const where = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.proveedor_id) where.proveedor_id = filtros.proveedor_id;
    if (filtros.auditor_id) where.auditor_principal_id = filtros.auditor_id;
    if (filtros.periodo) where.periodo = filtros.periodo;
    if (filtros.activa !== undefined) where.activa = filtros.activa;
    if (filtros.fecha_desde) {
      where.fecha_creacion = {
        [sequelize.Sequelize.Op.gte]: filtros.fecha_desde
      };
    }

    const { count, rows } = await Auditoria.findAndCountAll({
      where,
      order: [[orderBy, order]],
      limit,
      offset,
      include: [
        {
          model: Documento,
          as: 'documentos',
          attributes: ['seccion'],
          where: { estado: 'ACTIVO' },
          required: false
        }
      ]
    });

    // Enriquecer cada auditoría con estadísticas básicas
    const auditoriasEnriquecidas = await Promise.all(
      rows.map(async (auditoria) => {
        const stats = await this.obtenerEstadisticasBasicas(auditoria.id);
        return {
          ...auditoria.toJSON(),
          estadisticas: stats
        };
      })
    );

    return {
      auditorias: auditoriasEnriquecidas,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      },
      filtros_aplicados: filtros
    };
  }

  /**
   * Avanzar etapa del workflow
   */
  async avanzarEtapa(auditoria_id, usuario, opciones = {}) {
    const auditoria = await Auditoria.findByPk(auditoria_id);
    if (!auditoria) {
      throw new Error('Auditoría no encontrada');
    }

    // Validar transición
    const validacion = await workflowService.validarTransicion(auditoria, opciones);
    if (!validacion.valido) {
      throw new Error(`No puede avanzar etapa: ${validacion.razon}`);
    }

    const etapaAnterior = auditoria.etapa_actual;
    const etapaNueva = etapaAnterior + 1;
    const estadoNuevo = this.obtenerEstadoPorEtapa(etapaNueva);

    // Ejecutar transición
    await auditoria.update({
      etapa_actual: etapaNueva,
      estado: estadoNuevo,
      fecha_ultima_actualizacion: new Date()
    });

    // Ejecutar acciones automáticas de la nueva etapa
    await workflowService.ejecutarAccionesEtapa(auditoria, etapaNueva);

    // Registrar transición en bitácora
    await this.registrarAccion(auditoria_id, 'ETAPA_AVANZADA', {
      usuario_id: usuario.id,
      descripcion: `Transición de etapa ${etapaAnterior} → ${etapaNueva} (${estadoNuevo})`,
      datos_antes: { etapa: etapaAnterior, estado: auditoria.estado },
      datos_despues: { etapa: etapaNueva, estado: estadoNuevo },
      categoria: 'OPERACIONAL',
      severidad: 'MEDIA'
    });

    return {
      auditoria_id,
      etapa_anterior: etapaAnterior,
      etapa_nueva: etapaNueva,
      estado_nuevo: estadoNuevo,
      acciones_ejecutadas: validacion.acciones_automaticas || []
    };
  }

  /**
   * Actualizar auditoría
   */
  async actualizarAuditoria(auditoria_id, datos, usuario) {
    const auditoria = await Auditoria.findByPk(auditoria_id);
    if (!auditoria) {
      throw new Error('Auditoría no encontrada');
    }

    const datosAnteriores = { ...auditoria.dataValues };
    
    // Campos permitidos para actualización
    const camposPermitidos = [
      'auditor_principal_id', 'fecha_programada', 'fecha_limite',
      'alcance', 'observaciones', 'umbrales_tecnicos'
    ];
    
    const datosActualizacion = {};
    camposPermitidos.forEach(campo => {
      if (datos[campo] !== undefined) {
        datosActualizacion[campo] = datos[campo];
      }
    });

    await auditoria.update(datosActualizacion);

    // Registrar cambios en bitácora
    await this.registrarAccion(auditoria_id, 'AUDITORIA_ACTUALIZADA', {
      usuario_id: usuario.id,
      descripcion: `Auditoría ${auditoria.codigo} actualizada`,
      datos_antes: datosAnteriores,
      datos_despues: datosActualizacion,
      categoria: 'ADMINISTRATIVO'
    });

    return await this.obtenerAuditoriaCompleta(auditoria_id);
  }

  /**
   * Obtener timeline de eventos de la auditoría
   */
  async obtenerTimelineAuditoria(auditoria_id, limite = 50) {
    const eventos = await Bitacora.findAll({
      where: { auditoria_id },
      order: [['fecha_hora', 'DESC']],
      limit: limite
    });

    return eventos.map(evento => ({
      id: evento.id,
      fecha: evento.fecha_hora,
      tipo: evento.tipo_accion,
      descripcion: evento.descripcion,
      usuario_id: evento.usuario_id,
      seccion: evento.seccion_afectada,
      categoria: evento.categoria,
      severidad: evento.severidad,
      metadatos: evento.metadatos
    }));
  }

  /**
   * Generar resumen ejecutivo de la auditoría
   */
  async generarResumenAuditoria(auditoria) {
    const [
      estadisticasDocumentos,
      estadisticasValidaciones,
      estadisticasEvaluaciones
    ] = await Promise.all([
      this.obtenerEstadisticasDocumentos(auditoria.id),
      this.obtenerEstadisticasValidaciones(auditoria.id),
      this.obtenerEstadisticasEvaluaciones(auditoria.id)
    ]);

    return {
      codigo: auditoria.codigo,
      estado: auditoria.estado,
      etapa_actual: auditoria.etapa_actual,
      progreso_porcentaje: Math.round((auditoria.etapa_actual / 8) * 100),
      documentos: estadisticasDocumentos,
      validaciones: estadisticasValidaciones,
      evaluaciones: estadisticasEvaluaciones,
      score_general: auditoria.score_general,
      fecha_inicio: auditoria.fecha_inicio,
      fecha_limite: auditoria.fecha_limite,
      dias_transcurridos: this.calcularDiasTranscurridos(auditoria.fecha_inicio),
      dias_restantes: this.calcularDiasRestantes(auditoria.fecha_limite)
    };
  }

  /**
   * Registrar acción en bitácora
   */
  async registrarAccion(auditoria_id, tipo_accion, detalles = {}) {
    try {
      await Bitacora.registrar({
        auditoria_id,
        tipo_accion,
        descripcion: detalles.descripcion,
        usuario_id: detalles.usuario_id,
        seccion: detalles.seccion,
        antes: detalles.datos_antes,
        despues: detalles.datos_despues,
        ip: detalles.ip,
        user_agent: detalles.user_agent,
        categoria: detalles.categoria || 'OPERACIONAL',
        severidad: detalles.severidad || 'BAJA',
        metadatos: detalles.metadatos
      });
    } catch (error) {
      console.error('Error registrando en bitácora:', error);
    }
  }

  // Métodos auxiliares
  generarPeriodo() {
    const año = new Date().getFullYear();
    const mes = new Date().getMonth() + 1;
    const semestre = mes <= 6 ? 'S1' : 'S2';
    return `${año}-${semestre}`;
  }

  calcularFechaLimite(fechaProgramada) {
    const fecha = new Date(fechaProgramada);
    fecha.setDate(fecha.getDate() + 30); // 30 días para completar
    return fecha;
  }

  obtenerUmbralesActuales() {
    return {
      procesador: {
        marcas_permitidas: ['Intel', 'AMD'],
        intel_minimo: 'Core i5-8500',
        amd_minimo: 'Ryzen 5 8500G',
        velocidad_minima_ghz: 3.0
      },
      memoria: {
        ram_minima_gb: 16
      },
      almacenamiento: {
        capacidad_minima_gb: 500,
        tipo_requerido: 'SSD'
      },
      sistema_operativo: {
        version_requerida: 'Windows 11'
      },
      conectividad_ho: {
        velocidad_descarga_minima_mbps: 15,
        velocidad_subida_minima_mbps: 6
      }
    };
  }

  obtenerEstadoPorEtapa(etapa) {
    const estados = {
      1: 'CONFIGURACION',
      2: 'NOTIFICACION',
      3: 'CARGA_PRESENCIAL',
      4: 'CARGA_PARQUE',
      5: 'VALIDACION_AUTOMATICA',
      6: 'REVISION_AUDITOR',
      7: 'NOTIFICACION_RESULTADOS',
      8: 'COMPLETADA'
    };
    return estados[etapa] || 'CONFIGURACION';
  }

  async calcularProgresoWorkflow(auditoria) {
    const progreso = auditoria.obtenerProgresoWorkflow();
    const validacion = await workflowService.validarTransicion(auditoria);
    
    return {
      ...progreso,
      puede_avanzar: validacion.valido,
      razon_bloqueo: validacion.valido ? null : validacion.razon,
      acciones_requeridas: validacion.acciones_requeridas || []
    };
  }

  async obtenerEstadisticasBasicas(auditoria_id) {
    const [documentos, validaciones, evaluaciones] = await Promise.all([
      Documento.count({ where: { auditoria_id, estado: 'ACTIVO' } }),
      Validacion.count({ where: { auditoria_id } }),
      Evaluacion.count({ where: { auditoria_id, estado: ['COMPLETADA', 'APROBADA'] } })
    ]);

    return {
      documentos_cargados: documentos,
      validaciones_ejecutadas: validaciones,
      evaluaciones_completadas: evaluaciones
    };
  }

  async obtenerEstadisticasDocumentos(auditoria_id) {
    const documentos = await Documento.findAll({
      where: { auditoria_id, estado: 'ACTIVO' },
      attributes: ['seccion', 'es_obligatorio']
    });

    const total = documentos.length;
    const obligatorios = documentos.filter(d => d.es_obligatorio).length;
    
    return {
      total_cargados: total,
      obligatorios_cargados: obligatorios,
      opcionales_cargados: total - obligatorios
    };
  }

  async obtenerEstadisticasValidaciones(auditoria_id) {
    const validaciones = await Validacion.findAll({
      where: { auditoria_id },
      attributes: ['resultado', 'score']
    });

    if (validaciones.length === 0) {
      return { total: 0, exitosas: 0, fallidas: 0, score_promedio: 0 };
    }

    const exitosas = validaciones.filter(v => v.resultado === 'EXITOSO').length;
    const fallidas = validaciones.filter(v => v.resultado === 'FALLIDO').length;
    const scores = validaciones.filter(v => v.score !== null).map(v => v.score);
    const scorePromedio = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    return {
      total: validaciones.length,
      exitosas,
      fallidas,
      score_promedio: Math.round(scorePromedio * 100) / 100
    };
  }

  async obtenerEstadisticasEvaluaciones(auditoria_id) {
    return await Evaluacion.generarResumenEjecutivo(auditoria_id);
  }

  calcularDiasTranscurridos(fechaInicio) {
    if (!fechaInicio) return 0;
    const ahora = new Date();
    const inicio = new Date(fechaInicio);
    const diferencia = ahora - inicio;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  calcularDiasRestantes(fechaLimite) {
    if (!fechaLimite) return null;
    const ahora = new Date();
    const limite = new Date(fechaLimite);
    const diferencia = limite - ahora;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
}

module.exports = new AuditoriasService();