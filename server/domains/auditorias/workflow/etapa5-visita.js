/**
 * Etapa 5: Visita Presencial - Portal de Auditorías Técnicas
 * 
 * Implementa la lógica para la visita presencial y validación física
 * según el flujo del PDF "Flujo Completo del Proceso de Auditoría Técnica"
 */

const BitacoraService = require('../../bitacora/bitacora.service');

class Etapa5VisitaPresencial {
  constructor() {
    this.bitacoraService = new BitacoraService();
  }

  /**
   * Programar visita presencial
   */
  async programarVisita(auditoriaId, datosVisita, coordinadorId) {
    try {
      const { VisitaPresencial, Auditoria, Usuario } = require('../models');

      const auditoria = await Auditoria.findByPk(auditoriaId);
      if (!auditoria || auditoria.estado !== 'EVALUACION_COMPLETADA') {
        throw new Error('La auditoría debe haber completado la evaluación para programar visita');
      }

      const coordinador = await Usuario.findByPk(coordinadorId);

      const {
        fecha_programada,
        auditor_responsable_id,
        sitios_a_visitar = [],
        objetivos_visita = [],
        duracion_estimada_horas = 4,
        observaciones = ''
      } = datosVisita;

      // Verificar disponibilidad del auditor
      const auditorResponsable = await Usuario.findByPk(auditor_responsable_id);
      if (!auditorResponsable || auditorResponsable.rol !== 'auditor') {
        throw new Error('Auditor responsable no válido');
      }

      const visita = await VisitaPresencial.create({
        auditoria_id: auditoriaId,
        fecha_programada: new Date(fecha_programada),
        auditor_responsable_id,
        sitios_a_visitar,
        objetivos_visita,
        duracion_estimada_horas,
        observaciones,
        estado: 'PROGRAMADA',
        programada_por: coordinadorId,
        fecha_programacion: new Date()
      });

      // Actualizar estado de auditoría
      await auditoria.update({
        estado: 'VISITA_PROGRAMADA',
        etapa_actual: 5,
        fecha_programacion_visita: new Date()
      });

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'VISITA_PROGRAMADA',
        descripcion: `Visita presencial programada para ${fecha_programada}`,
        usuario: coordinador,
        seccion: 'Visita Presencial',
        auditoria_id: auditoriaId,
        metadata: {
          fecha_visita: fecha_programada,
          auditor_responsable: auditorResponsable.email,
          sitios: sitios_a_visitar,
          duracion_horas: duracion_estimada_horas
        },
        critico: true,
        tags: ['visita', 'programacion', 'etapa5']
      });

      return {
        success: true,
        visita,
        mensaje: 'Visita presencial programada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error programando visita:', error);
      throw error;
    }
  }

  /**
   * Finalizar visita y generar informe
   */
  async finalizarVisita(visitaId, auditorId, datosFinalizacion) {
    try {
      const { VisitaPresencial, HallazgoVisita, Usuario, Auditoria } = require('../models');

      const visita = await VisitaPresencial.findByPk(visitaId);
      const auditor = await Usuario.findByPk(auditorId);

      const {
        conclusion_general,
        recomendaciones = [],
        cumplimiento_evidenciado = true,
        hallazgos_criticos_resueltos = true,
        observaciones_finales = ''
      } = datosFinalizacion;

      await visita.update({
        estado: 'COMPLETADA',
        fecha_fin_real: new Date(),
        conclusion_general,
        recomendaciones,
        cumplimiento_evidenciado,
        hallazgos_criticos_resueltos,
        observaciones_finales
      });

      // Avanzar auditoría a siguiente etapa
      const auditoria = await Auditoria.findByPk(visita.auditoria_id);
      await auditoria.update({
        estado: 'VISITA_COMPLETADA',
        etapa_actual: 6,
        fecha_visita_completada: new Date()
      });

      // Registrar en bitácora
      await this.bitacoraService.registrarAccion(null, {
        tipo: 'VISITA_COMPLETADA',
        descripcion: 'Visita presencial completada',
        usuario: auditor,
        seccion: 'Visita Presencial',
        auditoria_id: visita.auditoria_id,
        metadata: {
          conclusion: conclusion_general,
          cumplimiento: cumplimiento_evidenciado,
          hallazgos_resueltos: hallazgos_criticos_resueltos
        },
        critico: true,
        tags: ['visita', 'completada', 'etapa5']
      });

      return {
        success: true,
        visita,
        mensaje: 'Visita completada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error finalizando visita:', error);
      throw error;
    }
  }

  async generarNumeroHallazgo(visitaId) {
    const { HallazgoVisita } = require('../models');
    const count = await HallazgoVisita.count({ where: { visita_id: visitaId } });
    return `H${String(count + 1).padStart(3, '0')}`;
  }
}

module.exports = Etapa5VisitaPresencial;