/**
 * Etapa 4: Evaluación por Auditores - Portal de Auditorías Técnicas
 * 
 * Implementa la lógica para la evaluación completa por parte de los auditores
 * según el flujo del PDF "Flujo Completo del Proceso de Auditoría Técnica"
 */

const BitacoraService = require('../../bitacora/bitacora.service');
const VersionesService = require('../../versiones/services/versiones.service');

class Etapa4Evaluacion {
  constructor() {
    this.bitacoraService = new BitacoraService();
    this.versionesService = new VersionesService();
  }

  /**
   * Asignar auditores a auditoría
   */
  async asignarAuditores(auditoriaId, auditoresIds, coordinadorId) {
    try {
      const { Auditoria, Usuario, AuditorAsignacion } = require('../models');

      const auditoria = await Auditoria.findByPk(auditoriaId);
      if (!auditoria) {
        throw new Error('Auditoría no encontrada');
      }

      if (auditoria.estado !== 'PENDIENTE_EVALUACION') {
        throw new Error('La auditoría debe estar en estado PENDIENTE_EVALUACION para asignar auditores');
      }

      // Obtener datos del coordinador
      const coordinador = await Usuario.findByPk(coordinadorId);

      // Crear asignaciones para cada auditor
      const asignaciones = [];
      for (const auditorId of auditoresIds) {
        const auditor = await Usuario.findByPk(auditorId);
        if (!auditor || auditor.rol !== 'auditor') {
          throw new Error(`Usuario ${auditorId} no es un auditor válido`);
        }

        const asignacion = await AuditorAsignacion.create({
          auditoria_id: auditoriaId,
          auditor_id: auditorId,
          asignado_por: coordinadorId,
          fecha_asignacion: new Date(),
          estado: 'ASIGNADO'
        });

        asignaciones.push(asignacion);

        // Registrar en bitácora
        await this.bitacoraService.registrarAccion(null, {
          tipo: 'AUDITORIA_ASIGNACION',
          descripcion: `Auditor ${auditor.email} asignado a auditoría ${auditoriaId}`,
          usuario: coordinador,
          seccion: 'Evaluación por Auditores',
          auditoria_id: auditoriaId,
          metadata: {
            auditor_asignado: auditor.email,
            coordinador: coordinador.email
          },
          critico: true,
          tags: ['auditoria', 'asignacion', 'etapa4']
        });
      }

      // Actualizar estado de la auditoría
      await auditoria.update({
        estado: 'EN_EVALUACION',
        etapa_actual: 4,
        fecha_inicio_evaluacion: new Date()
      });

      // Registrar cambio de etapa en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'AUDITORIA_CAMBIO_ETAPA',
        descripcion: `Auditoría avanza a ETAPA 4: Evaluación por Auditores`,
        usuario: coordinador,
        seccion: 'Flujo de Auditoría',
        auditoria_id: auditoriaId,
        datos_anteriores: { etapa: 3, estado: 'PENDIENTE_EVALUACION' },
        datos_nuevos: { etapa: 4, estado: 'EN_EVALUACION' },
        critico: true,
        tags: ['auditoria', 'etapa4', 'evaluacion']
      });

      return {
        success: true,
        asignaciones,
        mensaje: `${asignaciones.length} auditores asignados exitosamente`
      };

    } catch (error) {
      console.error('❌ Error asignando auditores:', error);
      throw error;
    }
  }

  /**
   * Evaluar sección específica de la auditoría
   */
  async evaluarSeccion(auditoriaId, auditorId, seccion, evaluacion) {
    try {
      const { SeccionEvaluacion, Usuario, Auditoria } = require('../models');

      const auditor = await Usuario.findByPk(auditorId);
      const auditoria = await Auditoria.findByPk(auditoriaId);

      if (!auditoria || auditoria.estado !== 'EN_EVALUACION') {
        throw new Error('Auditoría no está en estado de evaluación');
      }

      // Verificar que el auditor está asignado
      const { AuditorAsignacion } = require('../models');
      const asignacion = await AuditorAsignacion.findOne({
        where: { auditoria_id: auditoriaId, auditor_id: auditorId, estado: 'ASIGNADO' }
      });

      if (!asignacion) {
        throw new Error('Auditor no está asignado a esta auditoría');
      }

      const {
        calificacion, // 'CUMPLE', 'NO_CUMPLE', 'CUMPLE_CON_OBSERVACIONES'
        comentarios,
        observaciones = [],
        documentos_revisados = [],
        requiere_aclaracion = false
      } = evaluacion;

      // Crear o actualizar evaluación de sección
      const [seccionEval, created] = await SeccionEvaluacion.findOrCreate({
        where: { auditoria_id: auditoriaId, seccion: seccion, auditor_id: auditorId },
        defaults: {
          calificacion,
          comentarios,
          observaciones,
          documentos_revisados,
          requiere_aclaracion,
          fecha_evaluacion: new Date(),
          version_evaluacion: 1
        }
      });

      if (!created) {
        // Actualizar evaluación existente
        await seccionEval.update({
          calificacion,
          comentarios,
          observaciones,
          documentos_revisados,
          requiere_aclaracion,
          fecha_ultima_modificacion: new Date(),
          version_evaluacion: seccionEval.version_evaluacion + 1
        });
      }

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'EVALUACION_REALIZADA',
        descripcion: `Sección ${seccion} evaluada: ${calificacion}`,
        usuario: auditor,
        seccion: `Evaluación - ${seccion}`,
        auditoria_id: auditoriaId,
        metadata: {
          seccion_evaluada: seccion,
          calificacion: calificacion,
          requiere_aclaracion: requiere_aclaracion,
          documentos_revisados: documentos_revisados.length
        },
        critico: true,
        tags: ['evaluacion', 'seccion', calificacion.toLowerCase()]
      });

      // Si requiere aclaración, crear solicitud
      if (requiere_aclaracion) {
        await this.crearSolicitudAclaracion(auditoriaId, auditorId, seccion, comentarios);
      }

      return {
        success: true,
        evaluacion: seccionEval,
        mensaje: `Sección ${seccion} evaluada exitosamente`
      };

    } catch (error) {
      console.error('❌ Error evaluando sección:', error);
      throw error;
    }
  }

  /**
   * Crear solicitud de aclaración
   */
  async crearSolicitudAclaracion(auditoriaId, auditorId, seccion, motivo) {
    try {
      const { SolicitudAclaracion, Usuario } = require('../models');

      const auditor = await Usuario.findByPk(auditorId);

      const solicitud = await SolicitudAclaracion.create({
        auditoria_id: auditoriaId,
        auditor_id: auditorId,
        seccion: seccion,
        motivo: motivo,
        estado: 'PENDIENTE',
        fecha_solicitud: new Date()
      });

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'SOLICITUD_ACLARACION',
        descripcion: `Solicitud de aclaración para sección ${seccion}`,
        usuario: auditor,
        seccion: 'Solicitudes de Aclaración',
        auditoria_id: auditoriaId,
        metadata: {
          seccion: seccion,
          motivo: motivo
        },
        critico: false,
        tags: ['aclaracion', 'solicitud', seccion]
      });

      return solicitud;

    } catch (error) {
      console.error('❌ Error creando solicitud de aclaración:', error);
      throw error;
    }
  }

  /**
   * Finalizar evaluación de auditor
   */
  async finalizarEvaluacion(auditoriaId, auditorId) {
    try {
      const { SeccionEvaluacion, AuditorAsignacion, Usuario } = require('../models');

      const auditor = await Usuario.findByPk(auditorId);

      // Verificar que todas las secciones obligatorias están evaluadas
      const seccionesObligatorias = [
        'topologia', 'cuarto_tecnologia', 'conectividad', 'energia',
        'temperatura', 'servidores', 'internet', 'seguridad_informatica',
        'personal_capacitado', 'escalamiento', 'informacion_entorno',
        'parque_informatico'
      ];

      const evaluacionesRealizadas = await SeccionEvaluacion.findAll({
        where: { auditoria_id: auditoriaId, auditor_id: auditorId }
      });

      const seccionesEvaluadas = evaluacionesRealizadas.map(e => e.seccion);
      const seccionesFaltantes = seccionesObligatorias.filter(s => 
        !seccionesEvaluadas.includes(s)
      );

      if (seccionesFaltantes.length > 0) {
        throw new Error(`Faltan secciones por evaluar: ${seccionesFaltantes.join(', ')}`);
      }

      // Marcar asignación como completada
      await AuditorAsignacion.update(
        { 
          estado: 'COMPLETADO',
          fecha_finalizacion: new Date()
        },
        { 
          where: { auditoria_id: auditoriaId, auditor_id: auditorId }
        }
      );

      // Calcular resumen de evaluación
      const resumen = {
        total_secciones: evaluacionesRealizadas.length,
        cumple: evaluacionesRealizadas.filter(e => e.calificacion === 'CUMPLE').length,
        no_cumple: evaluacionesRealizadas.filter(e => e.calificacion === 'NO_CUMPLE').length,
        con_observaciones: evaluacionesRealizadas.filter(e => e.calificacion === 'CUMPLE_CON_OBSERVACIONES').length,
        requieren_aclaracion: evaluacionesRealizadas.filter(e => e.requiere_aclaracion).length
      };

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'EVALUACION_FINALIZADA',
        descripcion: `Evaluación finalizada por auditor ${auditor.email}`,
        usuario: auditor,
        seccion: 'Finalización Evaluación',
        auditoria_id: auditoriaId,
        metadata: {
          resumen_evaluacion: resumen,
          auditor: auditor.email
        },
        critico: true,
        tags: ['evaluacion', 'finalizacion', 'auditor']
      });

      // Verificar si todos los auditores han terminado
      await this.verificarCompletitudEvaluacion(auditoriaId);

      return {
        success: true,
        resumen,
        mensaje: 'Evaluación finalizada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error finalizando evaluación:', error);
      throw error;
    }
  }

  /**
   * Verificar si la evaluación está completa por todos los auditores
   */
  async verificarCompletitudEvaluacion(auditoriaId) {
    try {
      const { AuditorAsignacion, Auditoria } = require('../models');

      const asignaciones = await AuditorAsignacion.findAll({
        where: { auditoria_id: auditoriaId }
      });

      const todasCompletas = asignaciones.every(a => a.estado === 'COMPLETADO');

      if (todasCompletas && asignaciones.length > 0) {
        // Avanzar a siguiente etapa
        const auditoria = await Auditoria.findByPk(auditoriaId);
        await auditoria.update({
          estado: 'EVALUACION_COMPLETADA',
          etapa_actual: 5,
          fecha_fin_evaluacion: new Date()
        });

        // Registrar avance de etapa
        await this.bitacoraService.registrarAccion(null, {
          tipo: 'AUDITORIA_ETAPA_COMPLETADA',
          descripcion: 'ETAPA 4 completada: Evaluación por Auditores finalizada',
          seccion: 'Flujo de Auditoría',
          auditoria_id: auditoriaId,
          metadata: {
            etapa_completada: 4,
            total_auditores: asignaciones.length,
            fecha_finalizacion: new Date()
          },
          critico: true,
          tags: ['auditoria', 'etapa4', 'completada']
        });

        console.log(`✅ ETAPA 4 completada para auditoría ${auditoriaId}`);
      }

    } catch (error) {
      console.error('❌ Error verificando completitud:', error);
    }
  }

  /**
   * Generar informe de evaluación
   */
  async generarInformeEvaluacion(auditoriaId) {
    try {
      const { 
        Auditoria, 
        SeccionEvaluacion, 
        AuditorAsignacion,
        Usuario,
        SolicitudAclaracion
      } = require('../models');

      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: [
          { model: Usuario, as: 'Proveedor' }
        ]
      });

      const evaluaciones = await SeccionEvaluacion.findAll({
        where: { auditoria_id: auditoriaId },
        include: [
          { model: Usuario, as: 'Auditor' }
        ]
      });

      const asignaciones = await AuditorAsignacion.findAll({
        where: { auditoria_id: auditoriaId },
        include: [
          { model: Usuario, as: 'Auditor' }
        ]
      });

      const solicitudesAclaracion = await SolicitudAclaracion.findAll({
        where: { auditoria_id: auditoriaId }
      });

      const informe = {
        auditoria: {
          id: auditoria.id,
          proveedor: auditoria.Proveedor?.nombre,
          periodo: auditoria.periodo,
          fecha_inicio: auditoria.fecha_inicio_evaluacion,
          fecha_fin: auditoria.fecha_fin_evaluacion,
          estado: auditoria.estado
        },
        auditores_asignados: asignaciones.map(a => ({
          auditor: a.Auditor?.email,
          fecha_asignacion: a.fecha_asignacion,
          fecha_finalizacion: a.fecha_finalizacion,
          estado: a.estado
        })),
        resumen_evaluaciones: {
          total_secciones: evaluaciones.length,
          cumple: evaluaciones.filter(e => e.calificacion === 'CUMPLE').length,
          no_cumple: evaluaciones.filter(e => e.calificacion === 'NO_CUMPLE').length,
          con_observaciones: evaluaciones.filter(e => e.calificacion === 'CUMPLE_CON_OBSERVACIONES').length
        },
        evaluaciones_detalle: evaluaciones.map(e => ({
          seccion: e.seccion,
          auditor: e.Auditor?.email,
          calificacion: e.calificacion,
          comentarios: e.comentarios,
          observaciones: e.observaciones,
          fecha_evaluacion: e.fecha_evaluacion,
          requiere_aclaracion: e.requiere_aclaracion
        })),
        solicitudes_aclaracion: solicitudesAclaracion.map(s => ({
          seccion: s.seccion,
          motivo: s.motivo,
          estado: s.estado,
          fecha_solicitud: s.fecha_solicitud
        })),
        conclusiones: this.generarConclusiones(evaluaciones),
        recomendaciones: this.generarRecomendaciones(evaluaciones)
      };

      return {
        success: true,
        informe
      };

    } catch (error) {
      console.error('❌ Error generando informe:', error);
      throw error;
    }
  }

  /**
   * Generar conclusiones automáticas basadas en evaluaciones
   */
  generarConclusiones(evaluaciones) {
    const totalSecciones = evaluaciones.length;
    const cumple = evaluaciones.filter(e => e.calificacion === 'CUMPLE').length;
    const noCumple = evaluaciones.filter(e => e.calificacion === 'NO_CUMPLE').length;
    const conObservaciones = evaluaciones.filter(e => e.calificacion === 'CUMPLE_CON_OBSERVACIONES').length;

    const porcentajeCumplimiento = Math.round((cumple / totalSecciones) * 100);
    const porcentajeObservaciones = Math.round((conObservaciones / totalSecciones) * 100);
    const porcentajeIncumplimiento = Math.round((noCumple / totalSecciones) * 100);

    let conclusion = '';
    if (porcentajeCumplimiento >= 90) {
      conclusion = 'EXCELENTE - Cumplimiento muy alto de los requisitos técnicos';
    } else if (porcentajeCumplimiento >= 75) {
      conclusion = 'BUENO - Cumplimiento adecuado con áreas de mejora menores';
    } else if (porcentajeCumplimiento >= 60) {
      conclusion = 'REGULAR - Cumplimiento parcial, requiere mejoras significativas';
    } else {
      conclusion = 'DEFICIENTE - Cumplimiento insuficiente, requiere correcciones urgentes';
    }

    return {
      conclusion_general: conclusion,
      porcentaje_cumplimiento: porcentajeCumplimiento,
      porcentaje_observaciones: porcentajeObservaciones,
      porcentaje_incumplimiento: porcentajeIncumplimiento,
      secciones_criticas: evaluaciones
        .filter(e => e.calificacion === 'NO_CUMPLE')
        .map(e => e.seccion)
    };
  }

  /**
   * Generar recomendaciones automáticas
   */
  generarRecomendaciones(evaluaciones) {
    const recomendaciones = [];

    // Recomendaciones por secciones con problemas
    const seccionesProblematicas = evaluaciones.filter(e => 
      e.calificacion === 'NO_CUMPLE' || e.calificacion === 'CUMPLE_CON_OBSERVACIONES'
    );

    for (const evaluacion of seccionesProblematicas) {
      recomendaciones.push({
        seccion: evaluacion.seccion,
        prioridad: evaluacion.calificacion === 'NO_CUMPLE' ? 'ALTA' : 'MEDIA',
        recomendacion: `Revisar y corregir los aspectos observados en ${evaluacion.seccion}`,
        observaciones: evaluacion.observaciones
      });
    }

    return recomendaciones;
  }
}

module.exports = Etapa4Evaluacion;