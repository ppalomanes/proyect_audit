const { Auditoria, SeccionEvaluacion, VisitaPresencial, HallazgoVisita, InformeAuditoria } = require('./models');
const BitacoraService = require('../bitacora/bitacora.service');

/**
 * Controlador de Auditorías
 * Maneja el flujo completo de 8 etapas según documentación
 */

// ===== CONTROLADORES PRINCIPALES =====

/**
 * Obtener lista de auditorías con filtros
 */
const obtenerAuditorias = async (req, res) => {
  try {
    const { 
      periodo,
      estado_auditoria,
      proveedor_codigo,
      auditor_id,
      limit = 50,
      offset = 0
    } = req.query;

    const whereClause = {};
    
    if (periodo) whereClause.periodo = periodo;
    if (estado_auditoria) whereClause.estado_auditoria = estado_auditoria;
    if (proveedor_codigo) whereClause.proveedor_codigo = proveedor_codigo;
    if (auditor_id) whereClause.auditor_principal_id = auditor_id;

    const auditorias = await Auditoria.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: InformeAuditoria,
          as: 'informe',
          required: false
        }
      ]
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'consulta',
      descripcion: `Consulta de auditorías con filtros: ${JSON.stringify(req.query)}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: auditorias.rows,
      total: auditorias.count,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_pages: Math.ceil(auditorias.count / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo auditorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener auditoría específica por ID
 */
const obtenerAuditoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const auditoria = await Auditoria.findByPk(id, {
      include: [
        {
          model: SeccionEvaluacion,
          as: 'secciones'
        },
        {
          model: VisitaPresencial,
          as: 'visitas',
          include: [
            {
              model: HallazgoVisita,
              as: 'hallazgos'
            }
          ]
        },
        {
          model: InformeAuditoria,
          as: 'informe'
        }
      ]
    });

    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Registrar consulta en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'consulta_detalle',
      descripcion: `Consulta detalle de auditoría ID: ${id}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: { auditoria_id: id }
    });

    res.json({
      success: true,
      data: auditoria
    });

  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Crear nueva auditoría (Etapa 1: Notificación)
 */
const crearAuditoria = async (req, res) => {
  try {
    const {
      periodo,
      fecha_limite_carga,
      proveedor_codigo,
      proveedor_nombre,
      sitios_incluidos,
      auditor_principal_id,
      observaciones_iniciales
    } = req.body;

    // Validaciones básicas
    if (!periodo || !fecha_limite_carga || !proveedor_codigo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: periodo, fecha_limite_carga, proveedor_codigo'
      });
    }

    // Crear auditoría
    const nuevaAuditoria = await Auditoria.create({
      periodo,
      fecha_limite_carga: new Date(fecha_limite_carga),
      proveedor_codigo,
      proveedor_nombre,
      sitios_incluidos: sitios_incluidos || [],
      auditor_principal_id,
      observaciones_iniciales,
      estado_auditoria: 'notificacion_enviada',
      etapa_actual: 1,
      fecha_notificacion: new Date(),
      created_by: req.user?.id
    }, {
      user_id: req.user?.id
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'crear',
      descripcion: `Nueva auditoría creada para proveedor ${proveedor_codigo} - Período ${periodo}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: { 
        auditoria_id: nuevaAuditoria.id,
        proveedor_codigo,
        periodo 
      }
    });

    res.status(201).json({
      success: true,
      message: 'Auditoría creada exitosamente',
      data: nuevaAuditoria
    });

  } catch (error) {
    console.error('Error creando auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualizar auditoría
 */
const actualizarAuditoria = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const auditoria = await Auditoria.findByPk(id);
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Guardar estado anterior para bitácora
    const estadoAnterior = {
      estado_auditoria: auditoria.estado_auditoria,
      etapa_actual: auditoria.etapa_actual
    };

    await auditoria.update(datosActualizacion, {
      user_id: req.user?.id
    });

    // Registrar cambio en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'actualizar',
      descripción: `Auditoría ${id} actualizada`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_antes: estadoAnterior,
      datos_despues: {
        estado_auditoria: auditoria.estado_auditoria,
        etapa_actual: auditoria.etapa_actual
      }
    });

    res.json({
      success: true,
      message: 'Auditoría actualizada exitosamente',
      data: auditoria
    });

  } catch (error) {
    console.error('Error actualizando auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== CONTROLADORES DE FLUJO DE 8 ETAPAS =====

/**
 * Etapa 1: Ejecutar notificación a proveedores
 */
const ejecutarEtapa1Notificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo_notificacion = 'email', mensaje_personalizado } = req.body;

    const auditoria = await Auditoria.findByPk(id);
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Actualizar estado
    await auditoria.update({
      estado_auditoria: 'notificacion_enviada',
      etapa_actual: 1,
      fecha_notificacion: new Date(),
      metodo_notificacion
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa1_notificacion',
      descripcion: `Etapa 1 ejecutada - Notificación enviada a proveedor ${auditoria.proveedor_codigo}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        metodo_notificacion,
        fecha_notificacion: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Etapa 1 - Notificación ejecutada exitosamente',
      data: {
        auditoria_id: id,
        etapa_actual: 1,
        estado: 'notificacion_enviada',
        fecha_notificacion: auditoria.fecha_notificacion
      }
    });

  } catch (error) {
    console.error('Error en Etapa 1:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando Etapa 1',
      error: error.message
    });
  }
};

/**
 * Etapa 2: Iniciar carga de documentos
 */
const ejecutarEtapa2IniciarCarga = async (req, res) => {
  try {
    const { id } = req.params;

    const auditoria = await Auditoria.findByPk(id);
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Actualizar estado
    await auditoria.update({
      estado_auditoria: 'carga_habilitada',
      etapa_actual: 2,
      fecha_habilitacion_carga: new Date()
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa2_habilitar_carga',
      descripcion: `Etapa 2 ejecutada - Carga habilitada para auditoría ${id}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        fecha_habilitacion: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Etapa 2 - Carga de documentos habilitada',
      data: {
        auditoria_id: id,
        etapa_actual: 2,
        estado: 'carga_habilitada'
      }
    });

  } catch (error) {
    console.error('Error en Etapa 2:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando Etapa 2',
      error: error.message
    });
  }
};

/**
 * Etapa 4: Asignar auditores para evaluación
 */
const ejecutarEtapa4AsignacionAuditores = async (req, res) => {
  try {
    const { id } = req.params;
    const { auditor_principal_id, auditor_secundario_id, secciones_asignar } = req.body;

    const auditoria = await Auditoria.findByPk(id);
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Actualizar auditoría con auditores asignados
    await auditoria.update({
      auditor_principal_id,
      auditor_secundario_id,
      estado_auditoria: 'en_evaluacion',
      etapa_actual: 4,
      fecha_inicio_evaluacion: new Date()
    });

    // Crear secciones de evaluación si se especifican
    if (secciones_asignar && secciones_asignar.length > 0) {
      const seccionesACrear = secciones_asignar.map(seccion => ({
        auditoria_id: id,
        auditor_id: auditor_principal_id,
        seccion_nombre: seccion.nombre,
        seccion_display: seccion.display,
        es_obligatoria: seccion.obligatoria || false,
        created_by: req.user?.id
      }));

      await SeccionEvaluacion.bulkCreate(seccionesACrear);
    }

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa4_asignar_auditores',
      descripcion: `Etapa 4 ejecutada - Auditores asignados a auditoría ${id}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        auditor_principal_id,
        auditor_secundario_id,
        total_secciones: secciones_asignar?.length || 0
      }
    });

    res.json({
      success: true,
      message: 'Etapa 4 - Auditores asignados exitosamente',
      data: {
        auditoria_id: id,
        etapa_actual: 4,
        estado: 'en_evaluacion',
        auditores_asignados: {
          principal: auditor_principal_id,
          secundario: auditor_secundario_id
        }
      }
    });

  } catch (error) {
    console.error('Error en Etapa 4:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando Etapa 4',
      error: error.message
    });
  }
};

// ===== CONTROLADORES DE SECCIONES =====

/**
 * Obtener secciones de evaluación de una auditoría
 */
const obtenerSeccionesEvaluacion = async (req, res) => {
  try {
    const { id } = req.params;

    const secciones = await SeccionEvaluacion.findAll({
      where: { auditoria_id: id },
      order: [['seccion_nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: secciones
    });

  } catch (error) {
    console.error('Error obteniendo secciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualizar evaluación de una sección específica
 */
const actualizarSeccionEvaluacion = async (req, res) => {
  try {
    const { id, seccionId } = req.params;
    const datosActualizacion = req.body;

    const seccion = await SeccionEvaluacion.findOne({
      where: { 
        id: seccionId,
        auditoria_id: id 
      }
    });

    if (!seccion) {
      return res.status(404).json({
        success: false,
        message: 'Sección de evaluación no encontrada'
      });
    }

    await seccion.update(datosActualizacion, {
      user_id: req.user?.id
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'actualizar_seccion_evaluacion',
      descripcion: `Sección ${seccion.seccion_nombre} actualizada en auditoría ${id}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        seccion_id: seccionId,
        seccion_nombre: seccion.seccion_nombre
      }
    });

    res.json({
      success: true,
      message: 'Sección de evaluación actualizada',
      data: seccion
    });

  } catch (error) {
    console.error('Error actualizando sección:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ===== MIDDLEWARE DE VALIDACIÓN =====

/**
 * Middleware para validar que la auditoría existe
 */
const validarAuditoriaExiste = async (req, res, next, id) => {
  try {
    const auditoria = await Auditoria.findByPk(id);
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }
    
    req.auditoria = auditoria;
    next();
  } catch (error) {
    console.error('Error validando auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ===== CONTROLADORES PLACEHOLDER =====
// TODO: Implementar controladores faltantes

const ejecutarEtapa3ProcesamientoETL = async (req, res) => {
  try {
    const { id } = req.params;
    const { archivo_parque_informatico } = req.body;

    const auditoria = await Auditoria.findByPk(id);
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Integrar con servicio ETL existente
    const ETLService = require('../etl/etl.service');
    
    // Iniciar procesamiento ETL
    const resultadoETL = await ETLService.procesarParqueInformatico({
      auditoria_id: id,
      archivo_path: archivo_parque_informatico,
      usuario_id: req.user?.id
    });

    // Actualizar estado de auditoría
    await auditoria.update({
      estado_auditoria: 'etl_procesado',
      etapa_actual: 3,
      fecha_procesamiento_etl: new Date(),
      estadisticas_etl: resultadoETL.estadisticas
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa3_procesamiento_etl',
      descripcion: `Etapa 3 ejecutada - ETL procesado para auditoría ${id}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        registros_procesados: resultadoETL.estadisticas?.total_registros,
        registros_validos: resultadoETL.estadisticas?.registros_validos,
        errores_detectados: resultadoETL.estadisticas?.errores
      }
    });

    res.json({
      success: true,
      message: 'Etapa 3 - Procesamiento ETL completado',
      data: {
        auditoria_id: id,
        etapa_actual: 3,
        estado: 'etl_procesado',
        estadisticas: resultadoETL.estadisticas,
        job_id: resultadoETL.job_id
      }
    });

  } catch (error) {
    console.error('Error en Etapa 3 (ETL):', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando Etapa 3 (ETL)',
      error: error.message
    });
  }
};

const ejecutarEtapa4FinalizarEvaluacion = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Finalizar Evaluación - En desarrollo'
  });
};

const ejecutarEtapa5ProgramarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      fecha_programada, 
      hora_inicio, 
      hora_fin, 
      auditor_responsable_id,
      sitios_a_visitar,
      tipo_visita = 'presencial',
      observaciones_planificacion 
    } = req.body;

    const auditoria = await Auditoria.findByPk(id);
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Crear registro de visita presencial
    const nuevaVisita = await VisitaPresencial.create({
      auditoria_id: id,
      fecha_programada: new Date(fecha_programada),
      hora_inicio,
      hora_fin,
      auditor_responsable_id,
      sitios_a_visitar: sitios_a_visitar || [],
      tipo_visita,
      estado_visita: 'programada',
      observaciones_planificacion,
      created_by: req.user?.id
    });

    // Actualizar estado de auditoría
    await auditoria.update({
      estado_auditoria: 'visita_programada',
      etapa_actual: 5,
      fecha_programacion_visita: new Date()
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa5_programar_visita',
      descripcion: `Etapa 5 ejecutada - Visita programada para ${fecha_programada}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        visita_id: nuevaVisita.id,
        fecha_programada,
        auditor_responsable_id,
        sitios_incluidos: sitios_a_visitar?.length || 0
      }
    });

    res.json({
      success: true,
      message: 'Etapa 5 - Visita programada exitosamente',
      data: {
        auditoria_id: id,
        visita_id: nuevaVisita.id,
        etapa_actual: 5,
        estado: 'visita_programada',
        fecha_programada: nuevaVisita.fecha_programada,
        auditor_responsable: auditor_responsable_id
      }
    });

  } catch (error) {
    console.error('Error en Etapa 5 (Programar Visita):', error);
    res.status(500).json({
      success: false,
      message: 'Error programando visita',
      error: error.message
    });
  }
};

const ejecutarEtapa5FinalizarVisita = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Finalizar Visita - En desarrollo'
  });
};

const ejecutarEtapa6Consolidacion = async (req, res) => {
  try {
    const { id } = req.params;

    const auditoria = await Auditoria.findByPk(id, {
      include: [
        {
          model: SeccionEvaluacion,
          as: 'secciones'
        },
        {
          model: VisitaPresencial,
          as: 'visitas',
          include: [{
            model: HallazgoVisita,
            as: 'hallazgos'
          }]
        }
      ]
    });
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    // Consolidar información de todas las etapas
    const datosConsolidados = {
      resumen_evaluacion: {
        total_secciones: auditoria.secciones?.length || 0,
        secciones_cumple: auditoria.secciones?.filter(s => s.resultado_evaluacion === 'cumple').length || 0,
        secciones_no_cumple: auditoria.secciones?.filter(s => s.resultado_evaluacion === 'no_cumple').length || 0,
        secciones_observaciones: auditoria.secciones?.filter(s => s.resultado_evaluacion === 'cumple_con_observaciones').length || 0
      },
      resumen_visitas: {
        total_visitas: auditoria.visitas?.length || 0,
        visitas_completadas: auditoria.visitas?.filter(v => v.estado_visita === 'completada').length || 0,
        total_hallazgos: auditoria.visitas?.reduce((acc, v) => acc + (v.hallazgos?.length || 0), 0) || 0,
        hallazgos_criticos: auditoria.visitas?.reduce((acc, v) => acc + (v.hallazgos?.filter(h => h.severidad === 'critico').length || 0), 0) || 0
      },
      estadisticas_etl: auditoria.estadisticas_etl || {},
      fecha_consolidacion: new Date()
    };

    // Crear o actualizar informe de auditoría
    let informe = await InformeAuditoria.findOne({ where: { auditoria_id: id } });
    
    if (!informe) {
      informe = await InformeAuditoria.create({
        auditoria_id: id,
        datos_consolidados: datosConsolidados,
        estado_informe: 'consolidado',
        fecha_consolidacion: new Date(),
        elaborado_por: req.user?.id,
        created_by: req.user?.id
      });
    } else {
      await informe.update({
        datos_consolidados: datosConsolidados,
        estado_informe: 'consolidado',
        fecha_consolidacion: new Date()
      });
    }

    // Actualizar estado de auditoría
    await auditoria.update({
      estado_auditoria: 'consolidado',
      etapa_actual: 6,
      fecha_consolidacion: new Date()
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa6_consolidacion',
      descripcion: `Etapa 6 ejecutada - Datos consolidados para auditoría ${id}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        informe_id: informe.id,
        ...datosConsolidados.resumen_evaluacion,
        ...datosConsolidados.resumen_visitas
      }
    });

    res.json({
      success: true,
      message: 'Etapa 6 - Consolidación completada',
      data: {
        auditoria_id: id,
        informe_id: informe.id,
        etapa_actual: 6,
        estado: 'consolidado',
        datos_consolidados: datosConsolidados
      }
    });

  } catch (error) {
    console.error('Error en Etapa 6 (Consolidación):', error);
    res.status(500).json({
      success: false,
      message: 'Error en consolidación',
      error: error.message
    });
  }
};

const ejecutarEtapa7GenerarInforme = async (req, res) => {
  try {
    const { id } = req.params;
    const { incluir_recomendaciones = true, formato_salida = 'pdf' } = req.body;

    const auditoria = await Auditoria.findByPk(id, {
      include: [{
        model: InformeAuditoria,
        as: 'informe'
      }]
    });
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    if (!auditoria.informe) {
      return res.status(400).json({
        success: false,
        message: 'Debe completar la consolidación (Etapa 6) antes de generar el informe'
      });
    }

    // Actualizar informe con contenido final
    await auditoria.informe.update({
      contenido_informe: {
        ...auditoria.informe.datos_consolidados,
        incluir_recomendaciones,
        formato_salida,
        fecha_generacion: new Date()
      },
      estado_informe: 'generado',
      fecha_generacion: new Date()
    });

    // Actualizar estado de auditoría
    await auditoria.update({
      estado_auditoria: 'informe_generado',
      etapa_actual: 7,
      fecha_generacion_informe: new Date()
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa7_generar_informe',
      descripcion: `Etapa 7 ejecutada - Informe generado para auditoría ${id}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        informe_id: auditoria.informe.id,
        formato_salida,
        incluir_recomendaciones
      }
    });

    res.json({
      success: true,
      message: 'Etapa 7 - Informe generado exitosamente',
      data: {
        auditoria_id: id,
        informe_id: auditoria.informe.id,
        etapa_actual: 7,
        estado: 'informe_generado',
        fecha_generacion: auditoria.informe.fecha_generacion,
        formato: formato_salida
      }
    });

  } catch (error) {
    console.error('Error en Etapa 7 (Generar Informe):', error);
    res.status(500).json({
      success: false,
      message: 'Error generando informe',
      error: error.message
    });
  }
};

const ejecutarEtapa8Cierre = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      observaciones_cierre,
      archivo_final = true,
      notificar_proveedor = true,
      periodo_retencion_meses = 24
    } = req.body;

    const auditoria = await Auditoria.findByPk(id, {
      include: [{
        model: InformeAuditoria,
        as: 'informe'
      }]
    });
    
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        message: 'Auditoría no encontrada'
      });
    }

    if (auditoria.etapa_actual < 7) {
      return res.status(400).json({
        success: false,
        message: 'Debe completar la generación del informe (Etapa 7) antes del cierre'
      });
    }

    // Finalizar auditoría
    await auditoria.update({
      estado_auditoria: 'cerrada',
      etapa_actual: 8,
      fecha_cierre: new Date(),
      observaciones_cierre,
      archivado: archivo_final,
      fecha_vencimiento_archivo: archivo_final ? 
        new Date(Date.now() + (periodo_retencion_meses * 30 * 24 * 60 * 60 * 1000)) : 
        null,
      cerrada_por: req.user?.id
    });

    // Finalizar informe si existe
    if (auditoria.informe) {
      await auditoria.informe.update({
        estado_informe: 'finalizado',
        fecha_finalizacion: new Date()
      });
    }

    // Crear registro de finalización en sistema de versiones
    const VersionesService = require('../versiones/versiones.service');
    await VersionesService.crearSnapshotFinal({
      auditoria_id: id,
      tipo: 'cierre_auditoria',
      descripcion: `Cierre final de auditoría - ${auditoria.proveedor_codigo}`,
      usuario_id: req.user?.id
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'etapa8_cierre',
      descripcion: `Etapa 8 ejecutada - Auditoría ${id} cerrada definitivamente`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        proveedor_codigo: auditoria.proveedor_codigo,
        periodo: auditoria.periodo,
        archivo_final,
        periodo_retencion_meses,
        fecha_vencimiento: auditoria.fecha_vencimiento_archivo
      }
    });

    res.json({
      success: true,
      message: 'Etapa 8 - Auditoría cerrada exitosamente',
      data: {
        auditoria_id: id,
        etapa_actual: 8,
        estado: 'cerrada',
        fecha_cierre: auditoria.fecha_cierre,
        archivado: archivo_final,
        fecha_vencimiento_archivo: auditoria.fecha_vencimiento_archivo,
        ciclo_completado: true
      }
    });

  } catch (error) {
    console.error('Error en Etapa 8 (Cierre):', error);
    res.status(500).json({
      success: false,
      message: 'Error cerrando auditoría',
      error: error.message
    });
  }
};

const completarSeccionEvaluacion = async (req, res) => {
  try {
    const { id, seccionId } = req.params;
    const {
      resultado_evaluacion, // 'cumple', 'no_cumple', 'cumple_con_observaciones'
      comentarios_auditor,
      evidencias_adjuntas,
      requiere_accion_correctiva = false,
      fecha_limite_accion,
      puntuacion_seccion,
      observaciones_adicionales
    } = req.body;

    // Verificar que la sección pertenezca a la auditoría
    const seccion = await SeccionEvaluacion.findOne({
      where: {
        id: seccionId,
        auditoria_id: id
      }
    });

    if (!seccion) {
      return res.status(404).json({
        success: false,
        message: 'Sección de evaluación no encontrada'
      });
    }

    // Actualizar sección con evaluación completa
    await seccion.update({
      resultado_evaluacion,
      comentarios_auditor,
      evidencias_adjuntas: evidencias_adjuntas || [],
      estado_evaluacion: 'completada',
      requiere_accion_correctiva,
      fecha_limite_accion: fecha_limite_accion ? new Date(fecha_limite_accion) : null,
      puntuacion_seccion,
      observaciones_adicionales,
      fecha_evaluacion: new Date(),
      evaluada_por: req.user?.id
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'completar_seccion_evaluacion',
      descripcion: `Sección ${seccion.seccion_nombre} completada - ${resultado_evaluacion}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        seccion_id: seccionId,
        resultado_evaluacion
      }
    });

    res.json({
      success: true,
      message: 'Sección de evaluación completada',
      data: {
        seccion_id: seccionId,
        auditoria_id: id,
        resultado_evaluacion,
        estado: 'completada'
      }
    });

  } catch (error) {
    console.error('Error completando sección:', error);
    res.status(500).json({
      success: false,
      message: 'Error completando sección de evaluación',
      error: error.message
    });
  }
};

const obtenerVisitasPresenciales = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Visitas Presenciales - En desarrollo'
  });
};

const iniciarVisitaPresencial = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Iniciar Visita - En desarrollo'
  });
};

const finalizarVisitaPresencial = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Finalizar Visita - En desarrollo'
  });
};

const obtenerHallazgosVisita = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Hallazgos - En desarrollo'
  });
};

const crearHallazgoVisita = async (req, res) => {
  try {
    const { id, visitaId } = req.params;
    const {
      descripcion_hallazgo,
      severidad = 'medio',
      categoria_hallazgo,
      ubicacion_hallazgo,
      evidencia_fotografica,
      requiere_seguimiento = true,
      fecha_limite_correccion,
      recomendaciones_auditor
    } = req.body;

    // Verificar que la visita pertenezca a la auditoría
    const visita = await VisitaPresencial.findOne({
      where: {
        id: visitaId,
        auditoria_id: id
      }
    });

    if (!visita) {
      return res.status(404).json({
        success: false,
        message: 'Visita no encontrada o no pertenece a esta auditoría'
      });
    }

    // Crear nuevo hallazgo
    const nuevoHallazgo = await HallazgoVisita.create({
      visita_presencial_id: visitaId,
      descripcion_hallazgo,
      severidad,
      categoria_hallazgo,
      ubicacion_hallazgo,
      evidencia_fotografica: evidencia_fotografica || [],
      estado_hallazgo: 'identificado',
      requiere_seguimiento,
      fecha_identificacion: new Date(),
      fecha_limite_correccion: fecha_limite_correccion ? new Date(fecha_limite_correccion) : null,
      recomendaciones_auditor,
      identificado_por: req.user?.id,
      created_by: req.user?.id
    });

    // Registrar en bitácora
    await BitacoraService.registrar({
      usuario_id: req.user?.id,
      seccion: 'auditorias',
      accion: 'crear_hallazgo_visita',
      descripcion: `Nuevo hallazgo creado en visita ${visitaId} - ${categoria_hallazgo}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      datos_adicionales: {
        auditoria_id: id,
        visita_id: visitaId,
        hallazgo_id: nuevoHallazgo.id,
        severidad,
        categoria_hallazgo,
        requiere_seguimiento
      }
    });

    res.status(201).json({
      success: true,
      message: 'Hallazgo creado exitosamente',
      data: {
        hallazgo_id: nuevoHallazgo.id,
        visita_id: visitaId,
        auditoria_id: id,
        severidad,
        estado: 'identificado',
        fecha_identificacion: nuevoHallazgo.fecha_identificacion,
        requiere_seguimiento
      }
    });

  } catch (error) {
    console.error('Error creando hallazgo:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando hallazgo',
      error: error.message
    });
  }
};

const actualizarHallazgoVisita = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Actualizar Hallazgo - En desarrollo'
  });
};

const comunicarHallazgoAProveedor = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Comunicar Hallazgo - En desarrollo'
  });
};

const verificarCorreccionHallazgo = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Verificar Corrección - En desarrollo'
  });
};

const obtenerInformeFinal = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Informe Final - En desarrollo'
  });
};

const aprobarInformeFinal = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Aprobar Informe - En desarrollo'
  });
};

const entregarInformeAProveedor = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Entregar Informe - En desarrollo'
  });
};

const registrarRespuestaProveedorInforme = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Respuesta Proveedor - En desarrollo'
  });
};

const descargarInformePDF = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Descargar PDF - En desarrollo'
  });
};

const obtenerComunicacionesAuditoria = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Comunicaciones - En desarrollo'
  });
};

const enviarComunicacionAuditoria = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Enviar Comunicación - En desarrollo'
  });
};

const obtenerMetricasDashboard = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Métricas Dashboard - En desarrollo'
  });
};

const generarReportePorPeriodo = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Reporte Período - En desarrollo'
  });
};

const generarReportePorProveedor = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Reporte Proveedor - En desarrollo'
  });
};

const obtenerUmbralesTecnicos = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Umbrales Técnicos - En desarrollo'
  });
};

const actualizarUmbralesTecnicos = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Actualizar Umbrales - En desarrollo'
  });
};

const obtenerConfiguracionPliego = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Configuración Pliego - En desarrollo'
  });
};

const reabrirAuditoria = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Reabrir Auditoría - En desarrollo'
  });
};

const marcarExcepcionAuditoria = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Marcar Excepción - En desarrollo'
  });
};

const obtenerHistorialAuditoria = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Historial Auditoría - En desarrollo'
  });
};

module.exports = {
  // Controladores principales
  obtenerAuditorias,
  obtenerAuditoriaPorId,
  crearAuditoria,
  actualizarAuditoria,
  
  // Controladores de flujo de 8 etapas
  ejecutarEtapa1Notificacion,
  ejecutarEtapa2IniciarCarga,
  ejecutarEtapa3ProcesamientoETL,
  ejecutarEtapa4AsignacionAuditores,
  ejecutarEtapa4FinalizarEvaluacion,
  ejecutarEtapa5ProgramarVisita,
  ejecutarEtapa5FinalizarVisita,
  ejecutarEtapa6Consolidacion,
  ejecutarEtapa7GenerarInforme,
  ejecutarEtapa8Cierre,
  
  // Controladores de secciones
  obtenerSeccionesEvaluacion,
  actualizarSeccionEvaluacion,
  completarSeccionEvaluacion,
  
  // Controladores de visitas
  obtenerVisitasPresenciales,
  iniciarVisitaPresencial,
  finalizarVisitaPresencial,
  
  // Controladores de hallazgos
  obtenerHallazgosVisita,
  crearHallazgoVisita,
  actualizarHallazgoVisita,
  comunicarHallazgoAProveedor,
  verificarCorreccionHallazgo,
  
  // Controladores de informes
  obtenerInformeFinal,
  aprobarInformeFinal,
  entregarInformeAProveedor,
  registrarRespuestaProveedorInforme,
  descargarInformePDF,
  
  // Controladores de comunicación
  obtenerComunicacionesAuditoria,
  enviarComunicacionAuditoria,
  
  // Controladores de dashboard
  obtenerMetricasDashboard,
  generarReportePorPeriodo,
  generarReportePorProveedor,
  
  // Controladores de configuración
  obtenerUmbralesTecnicos,
  actualizarUmbralesTecnicos,
  obtenerConfiguracionPliego,
  
  // Controladores de excepciones
  reabrirAuditoria,
  marcarExcepcionAuditoria,
  obtenerHistorialAuditoria,
  
  // Middleware
  validarAuditoriaExiste
};
