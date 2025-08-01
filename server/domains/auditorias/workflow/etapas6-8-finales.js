/**
 * Etapas 6-8: Finalización del Proceso de Auditoría
 * Portal de Auditorías Técnicas
 * 
 * Implementa las etapas finales del flujo de auditoría:
 * - Etapa 6: Consolidación de Resultados
 * - Etapa 7: Generación de Informe Final
 * - Etapa 8: Notificación y Cierre
 */

const BitacoraService = require('../../bitacora/bitacora.service');
const VersionesService = require('../../versiones/services/versiones.service');

class EtapasFinales {
  constructor() {
    this.bitacoraService = new BitacoraService();
    this.versionesService = new VersionesService();
  }

  /**
   * ETAPA 6: Consolidar resultados de evaluación y visita
   */
  async consolidarResultados(auditoriaId, coordinadorId) {
    try {
      const { 
        Auditoria, 
        SeccionEvaluacion, 
        VisitaPresencial, 
        HallazgoVisita,
        Usuario 
      } = require('../models');

      const auditoria = await Auditoria.findByPk(auditoriaId);
      if (!auditoria || auditoria.estado !== 'VISITA_COMPLETADA') {
        throw new Error('La auditoría debe haber completado la visita presencial');
      }

      const coordinador = await Usuario.findByPk(coordinadorId);

      // Obtener todos los datos de la auditoría
      const [evaluaciones, visita, hallazgos] = await Promise.all([
        SeccionEvaluacion.findAll({ where: { auditoria_id: auditoriaId } }),
        VisitaPresencial.findOne({ where: { auditoria_id: auditoriaId } }),
        HallazgoVisita.findAll({ 
          where: { visita_id: (await VisitaPresencial.findOne({ where: { auditoria_id: auditoriaId } }))?.id }
        })
      ]);

      // Consolidar resultados
      const consolidacion = {
        resumen_evaluacion: {
          total_secciones: evaluaciones.length,
          cumple: evaluaciones.filter(e => e.calificacion === 'CUMPLE').length,
          no_cumple: evaluaciones.filter(e => e.calificacion === 'NO_CUMPLE').length,
          con_observaciones: evaluaciones.filter(e => e.calificacion === 'CUMPLE_CON_OBSERVACIONES').length
        },
        resumen_visita: {
          conclusion_general: visita?.conclusion_general,
          cumplimiento_evidenciado: visita?.cumplimiento_evidenciado,
          total_hallazgos: hallazgos.length,
          hallazgos_criticos: hallazgos.filter(h => h.severidad === 'CRITICA').length
        },
        calificacion_final: this.calcularCalificacionFinal(evaluaciones, visita, hallazgos),
        recomendaciones_consolidadas: this.consolidarRecomendaciones(evaluaciones, visita, hallazgos),
        fecha_consolidacion: new Date()
      };

      await auditoria.update({
        estado: 'RESULTADOS_CONSOLIDADOS',
        etapa_actual: 6,
        resultados_consolidados: consolidacion,
        fecha_consolidacion: new Date()
      });

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'RESULTADOS_CONSOLIDADOS',
        descripcion: `Resultados consolidados - Calificación: ${consolidacion.calificacion_final}`,
        usuario: coordinador,
        seccion: 'Consolidación de Resultados',
        auditoria_id: auditoriaId,
        metadata: {
          calificacion_final: consolidacion.calificacion_final,
          porcentaje_cumplimiento: Math.round((consolidacion.resumen_evaluacion.cumple / consolidacion.resumen_evaluacion.total_secciones) * 100)
        },
        critico: true,
        tags: ['consolidacion', 'etapa6', 'resultados']
      });

      return {
        success: true,
        consolidacion,
        mensaje: 'Resultados consolidados exitosamente'
      };

    } catch (error) {
      console.error('❌ Error consolidando resultados:', error);
      throw error;
    }
  }

  /**
   * ETAPA 7: Generar informe final completo
   */
  async generarInformeFinal(auditoriaId, coordinadorId, configuracionInforme = {}) {
    try {
      const { Auditoria, Usuario } = require('../models');

      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: [{ model: Usuario, as: 'Proveedor' }]
      });

      if (!auditoria || auditoria.estado !== 'RESULTADOS_CONSOLIDADOS') {
        throw new Error('Los resultados deben estar consolidados para generar el informe');
      }

      const coordinador = await Usuario.findByPk(coordinadorId);

      const {
        incluir_evidencias = true,
        incluir_recomendaciones = true,
        formato = 'PDF',
        plantilla = 'ESTANDAR'
      } = configuracionInforme;

      // Generar contenido del informe
      const informeCompleto = await this.construirInformeCompleto(auditoriaId, {
        incluir_evidencias,
        incluir_recomendaciones,
        formato,
        plantilla
      });

      // Crear versión del informe
      const informeBuffer = await this.generarPDFInforme(informeCompleto);
      const versionInforme = await this.versionesService.crearVersion(
        null, // documento_id se asignará dinámicamente
        {
          buffer: informeBuffer,
          originalname: `Informe_Auditoria_${auditoriaId}_${new Date().toISOString().split('T')[0]}.pdf`,
          mimetype: 'application/pdf',
          size: informeBuffer.length
        },
        coordinador,
        {
          comentarios: 'Informe final de auditoría generado automáticamente',
          tipoIncremento: 'mayor',
          auditoriaId: auditoriaId,
          etapaAuditoria: 'ETAPA_7_INFORME_FINAL'
        }
      );

      await auditoria.update({
        estado: 'INFORME_GENERADO',
        etapa_actual: 7,
        informe_final_id: versionInforme.version.id,
        fecha_generacion_informe: new Date()
      });

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'INFORME_GENERADO',
        descripcion: 'Informe final de auditoría generado',
        usuario: coordinador,
        seccion: 'Generación de Informe',
        auditoria_id: auditoriaId,
        metadata: {
          informe_id: versionInforme.version.id,
          formato: formato,
          plantilla: plantilla,
          tamaño_archivo: informeBuffer.length
        },
        critico: true,
        tags: ['informe', 'etapa7', 'generacion']
      });

      return {
        success: true,
        informe: versionInforme,
        mensaje: 'Informe final generado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error generando informe final:', error);
      throw error;
    }
  }

  /**
   * ETAPA 8: Notificar resultados y cerrar proceso
   */
  async notificarYCerrar(auditoriaId, coordinadorId, configuracionNotificacion = {}) {
    try {
      const { Auditoria, Usuario } = require('../models');

      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: [{ model: Usuario, as: 'Proveedor' }]
      });

      if (!auditoria || auditoria.estado !== 'INFORME_GENERADO') {
        throw new Error('El informe debe estar generado para notificar resultados');
      }

      const coordinador = await Usuario.findByPk(coordinadorId);

      const {
        enviar_email = true,
        incluir_informe_adjunto = true,
        mensaje_personalizado = '',
        fecha_limite_respuesta = null
      } = configuracionNotificacion;

      // Enviar notificaciones
      if (enviar_email) {
        await this.enviarNotificacionEmail(auditoria, {
          incluir_informe_adjunto,
          mensaje_personalizado,
          fecha_limite_respuesta
        });
      }

      // Actualizar dashboard y métricas
      await this.actualizarDashboard(auditoriaId);

      // Cerrar proceso de auditoría
      await auditoria.update({
        estado: 'COMPLETADA',
        etapa_actual: 8,
        fecha_notificacion: new Date(),
        fecha_cierre: new Date(),
        proceso_completado: true
      });

      // Registrar cierre en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'AUDITORIA_COMPLETADA',
        descripcion: 'Proceso de auditoría completado exitosamente',
        usuario: coordinador,
        seccion: 'Cierre de Auditoría',
        auditoria_id: auditoriaId,
        metadata: {
          calificacion_final: auditoria.resultados_consolidados?.calificacion_final,
          duracion_total_dias: Math.ceil((new Date() - auditoria.fecha_inicio) / (1000 * 60 * 60 * 24)),
          etapas_completadas: 8
        },
        critico: true,
        tags: ['auditoria', 'etapa8', 'completada', 'cierre']
      });

      return {
        success: true,
        auditoria,
        mensaje: 'Auditoría completada y notificaciones enviadas'
      };

    } catch (error) {
      console.error('❌ Error notificando y cerrando auditoría:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  calcularCalificacionFinal(evaluaciones, visita, hallazgos) {
    const porcentajeCumplimiento = (evaluaciones.filter(e => e.calificacion === 'CUMPLE').length / evaluaciones.length) * 100;
    const hallazgosCriticos = hallazgos.filter(h => h.severidad === 'CRITICA').length;
    
    if (porcentajeCumplimiento >= 95 && hallazgosCriticos === 0) return 'EXCELENTE';
    if (porcentajeCumplimiento >= 85 && hallazgosCriticos <= 1) return 'BUENO';
    if (porcentajeCumplimiento >= 70 && hallazgosCriticos <= 2) return 'REGULAR';
    return 'DEFICIENTE';
  }

  consolidarRecomendaciones(evaluaciones, visita, hallazgos) {
    const recomendaciones = [];
    
    // Recomendaciones de evaluaciones
    evaluaciones.forEach(e => {
      if (e.calificacion !== 'CUMPLE' && e.observaciones) {
        recomendaciones.push({
          origen: 'EVALUACION',
          seccion: e.seccion,
          descripcion: e.observaciones,
          prioridad: e.calificacion === 'NO_CUMPLE' ? 'ALTA' : 'MEDIA'
        });
      }
    });

    // Recomendaciones de visita
    if (visita?.recomendaciones) {
      visita.recomendaciones.forEach(r => {
        recomendaciones.push({
          origen: 'VISITA',
          descripcion: r,
          prioridad: 'ALTA'
        });
      });
    }

    return recomendaciones;
  }

  async construirInformeCompleto(auditoriaId, opciones) {
    // Implementación de construcción de informe completo
    // Esta función construiría el informe con todas las secciones
    return {
      metadata: { auditoria_id: auditoriaId },
      contenido: 'Informe completo generado',
      // ... resto del contenido del informe
    };
  }

  async generarPDFInforme(informeCompleto) {
    // Implementación de generación de PDF
    // Por ahora retorna un buffer simulado
    return Buffer.from(JSON.stringify(informeCompleto));
  }

  async enviarNotificacionEmail(auditoria, opciones) {
    // Implementación de envío de emails
    console.log(`📧 Enviando notificación de auditoría ${auditoria.id} completada`);
  }

  async actualizarDashboard(auditoriaId) {
    // Implementación de actualización de dashboard
    console.log(`📊 Actualizando métricas del dashboard para auditoría ${auditoriaId}`);
  }
}

module.exports = EtapasFinales;