const { Auditoria } = require('../models');

// Configuración de estados y transiciones del workflow
const WORKFLOW_CONFIG = {
  CONFIGURACION: {
    etapa: 1,
    descripcion: 'Configuración inicial del período y umbrales técnicos',
    siguiente: 'NOTIFICACION',
    requisitos: ['admin_configuracion_completa'],
    rol_requerido: 'ADMIN',
    automatica: false
  },
  NOTIFICACION: {
    etapa: 2,
    descripcion: 'Notificación automática a proveedores',
    siguiente: 'CARGA_PRESENCIAL',
    requisitos: ['emails_enviados', 'portal_habilitado'],
    automatica: true,
    tiempo_estimado: '1-2 minutos'
  },
  CARGA_PRESENCIAL: {
    etapa: 3,
    descripcion: 'Carga de documentos de atención presencial',
    siguiente: 'CARGA_PARQUE',
    requisitos: ['secciones_obligatorias_completas'],
    rol_requerido: 'PROVEEDOR',
    secciones_obligatorias: ['cuarto_tecnologia', 'energia', 'seguridad_informatica']
  },
  CARGA_PARQUE: {
    etapa: 4,
    descripcion: 'Carga y validación del parque informático',
    siguiente: 'VALIDACION_AUTOMATICA',
    requisitos: ['excel_parque_cargado', 'formato_validado'],
    rol_requerido: 'PROVEEDOR'
  },
  VALIDACION_AUTOMATICA: {
    etapa: 5,
    descripcion: 'Validación automática con ETL e IA',
    siguiente: 'REVISION_AUDITOR',
    requisitos: ['etl_completado', 'ia_scoring_completo'],
    automatica: true,
    tiempo_estimado: '5-10 minutos'
  },
  REVISION_AUDITOR: {
    etapa: 6,
    descripcion: 'Revisión y evaluación manual por auditor',
    siguiente: 'NOTIFICACION_RESULTADOS',
    requisitos: ['todas_secciones_evaluadas'],
    rol_requerido: 'AUDITOR'
  },
  NOTIFICACION_RESULTADOS: {
    etapa: 7,
    descripcion: 'Generación y envío de resultados',
    siguiente: 'COMPLETADA',
    requisitos: ['informe_generado', 'notificacion_enviada'],
    automatica: true,
    tiempo_estimado: '2-3 minutos'
  },
  COMPLETADA: {
    etapa: 8,
    descripcion: 'Auditoría finalizada y archivada',
    siguiente: null,
    requisitos: ['archivado_completo'],
    final: true
  }
};

class WorkflowService {

  /**
   * Validar si una auditoría puede avanzar a la siguiente etapa
   */
  async validarTransicion(auditoria, opciones = {}) {
    const estadoActual = auditoria.estado;
    const configEtapa = WORKFLOW_CONFIG[estadoActual];

    if (!configEtapa) {
      return { valido: false, razon: 'Estado de auditoría inválido' };
    }

    if (configEtapa.final) {
      return { valido: false, razon: 'La auditoría ya está completada' };
    }

    // Validar requisitos específicos por etapa
    const validacion = await this.validarRequisitosEtapa(auditoria, configEtapa, opciones);
    
    return validacion;
  }

  /**
   * Validar requisitos específicos de cada etapa
   */
  async validarRequisitosEtapa(auditoria, configEtapa, opciones) {
    const { estado } = auditoria;
    
    switch (estado) {
      case 'CONFIGURACION':
        return await this.validarConfiguracion(auditoria, opciones);
        
      case 'NOTIFICACION':
        return await this.validarNotificacion(auditoria, opciones);
        
      case 'CARGA_PRESENCIAL':
        return await this.validarCargaPresencial(auditoria, opciones);
        
      case 'CARGA_PARQUE':
        return await this.validarCargaParque(auditoria, opciones);
        
      case 'VALIDACION_AUTOMATICA':
        return await this.validarValidacionAutomatica(auditoria, opciones);
        
      case 'REVISION_AUDITOR':
        return await this.validarRevisionAuditor(auditoria, opciones);
        
      case 'NOTIFICACION_RESULTADOS':
        return await this.validarNotificacionResultados(auditoria, opciones);
        
      default:
        return { valido: true };
    }
  }

  /**
   * Ejecutar acciones automáticas al entrar en una nueva etapa
   */
  async ejecutarAccionesEtapa(auditoria, nuevaEtapa) {
    const nombreEtapa = this.obtenerNombreEtapa(nuevaEtapa);
    const config = WORKFLOW_CONFIG[nombreEtapa];
    
    if (!config || !config.automatica) {
      return { acciones_ejecutadas: [] };
    }

    const acciones = [];

    try {
      switch (nuevaEtapa) {
        case 2: // NOTIFICACION
          acciones.push(...await this.ejecutarNotificacionAutomatica(auditoria));
          break;

        case 5: // VALIDACION_AUTOMATICA
          acciones.push(...await this.ejecutarValidacionAutomatica(auditoria));
          break;

        case 7: // NOTIFICACION_RESULTADOS
          acciones.push(...await this.ejecutarNotificacionResultados(auditoria));
          break;

        case 8: // COMPLETADA
          acciones.push(...await this.ejecutarArchivado(auditoria));
          break;
      }

      return { acciones_ejecutadas: acciones };
      
    } catch (error) {
      console.error(`Error ejecutando acciones etapa ${nuevaEtapa}:`, error);
      throw error;
    }
  }

  /**
   * Verificar si una auditoría puede avanzar etapa
   */
  async puedeAvanzarEtapa(auditoria) {
    const validacion = await this.validarTransicion(auditoria);
    return validacion.valido;
  }

  // Validaciones específicas por etapa
  async validarConfiguracion(auditoria, opciones) {
    // Verificar que todos los campos requeridos están completos
    if (!auditoria.proveedor_id || !auditoria.auditor_principal_id || !auditoria.fecha_programada) {
      return { 
        valido: false, 
        razon: 'Faltan datos obligatorios: proveedor, auditor o fecha programada' 
      };
    }

    if (!auditoria.umbrales_tecnicos) {
      return { 
        valido: false, 
        razon: 'Los umbrales técnicos no han sido configurados' 
      };
    }

    return { valido: true, acciones_automaticas: ['configurar_workspace_chat'] };
  }

  async validarNotificacion(auditoria, opciones) {
    // La notificación es automática, siempre puede avanzar
    return { valido: true, acciones_automaticas: ['habilitar_portal_proveedor'] };
  }

  async validarCargaPresencial(auditoria, opciones) {
    const documentosService = require('./documentos.service');
    
    try {
      const validacion = await documentosService.validarDocumentosCompletos(auditoria.id);
      
      if (!validacion.completo) {
        return {
          valido: false,
          razon: `Documentos obligatorios faltantes: ${validacion.secciones_faltantes.join(', ')}`,
          acciones_requeridas: [
            'Cargar documentos de cuarto de tecnología',
            'Cargar documentos de energía', 
            'Cargar documentos de seguridad informática'
          ]
        };
      }

      return { valido: true };
      
    } catch (error) {
      return { valido: false, razon: 'Error validando documentos' };
    }
  }

  async validarCargaParque(auditoria, opciones) {
    const { Documento } = require('../models');
    
    // Verificar que el Excel de parque informático está cargado
    const excelParque = await Documento.findOne({
      where: {
        auditoria_id: auditoria.id,
        seccion: 'parque_hardware',
        estado: 'ACTIVO'
      }
    });

    if (!excelParque) {
      return {
        valido: false,
        razon: 'El archivo Excel del parque informático no ha sido cargado',
        acciones_requeridas: ['Cargar archivo Excel con formato estandarizado']
      };
    }

    // Verificar que el formato es válido
    if (!excelParque.validado) {
      return {
        valido: false,
        razon: 'El archivo Excel no ha pasado la validación de formato',
        acciones_requeridas: ['Verificar que el Excel tiene las columnas requeridas']
      };
    }

    return { valido: true, acciones_automaticas: ['ejecutar_etl', 'procesar_conteo_puestos'] };
  }

  async validarValidacionAutomatica(auditoria, opciones) {
    const { Validacion } = require('../models');
    
    // Verificar que existe validación del parque informático
    const validacionParque = await Validacion.findOne({
      where: {
        auditoria_id: auditoria.id,
        tipo_validacion: 'PARQUE_INFORMATICO'
      },
      order: [['fecha_ejecucion', 'DESC']]
    });

    if (!validacionParque) {
      return {
        valido: false,
        razon: 'La validación automática del parque informático no se ha ejecutado',
        acciones_requeridas: ['Ejecutar validación ETL del parque informático']
      };
    }

    return { valido: true, acciones_automaticas: ['notificar_auditor_revision'] };
  }

  async validarRevisionAuditor(auditoria, opciones) {
    const { Evaluacion } = require('../models');
    
    const progreso = await Evaluacion.obtenerProgresoAuditoria(auditoria.id);
    
    if (progreso.progreso_porcentaje < 100) {
      return {
        valido: false,
        razon: `Evaluación incompleta: ${progreso.secciones_evaluadas}/${progreso.total_secciones} secciones`,
        acciones_requeridas: progreso.secciones_pendientes.map(s => `Evaluar sección: ${s}`)
      };
    }

    // Verificar que no hay evaluaciones críticas sin resolver
    if (progreso.evaluaciones_criticas > 0 && !opciones.forzar_avance) {
      return {
        valido: false,
        razon: `Hay ${progreso.evaluaciones_criticas} evaluaciones críticas que requieren atención`,
        acciones_requeridas: ['Resolver evaluaciones críticas o marcar como excepción']
      };
    }

    return { valido: true, acciones_automaticas: ['generar_informe_preliminar'] };
  }

  async validarNotificacionResultados(auditoria, opciones) {
    // Verificar que el informe final existe
    // Por ahora asumimos que siempre es válido
    return { valido: true, acciones_automaticas: ['archivar_documentos'] };
  }

  // Acciones automáticas por etapa
  async ejecutarNotificacionAutomatica(auditoria) {
    const acciones = ['enviar_email_inicio_auditoria'];
    
    try {
      // Integración con módulo de notificaciones
      const notificationsService = require('../../notifications/notifications.service');
      
      await notificationsService.enviarNotificacionInicioAuditoria({
        auditoria_id: auditoria.id,
        proveedor_id: auditoria.proveedor_id,
        codigo: auditoria.codigo,
        fecha_limite: auditoria.fecha_limite
      });
      
      acciones.push('notificacion_enviada_exitosamente');
      
    } catch (error) {
      console.warn('Error enviando notificación:', error.message);
      acciones.push('error_enviando_notificacion');
    }
    
    return acciones;
  }

  async ejecutarValidacionAutomatica(auditoria) {
    const acciones = ['iniciar_validacion_etl'];
    
    try {
      // Integración con módulo ETL
      const etlService = require('../../etl/etl.service');
      
      const resultadoETL = await etlService.procesarParqueInformatico(auditoria.id);
      acciones.push('etl_completado');
      
      // Integración con módulo IA
      const iaService = require('../../ia/ia.service');
      
      const resultadoIA = await iaService.analizarDocumentosAuditoria(auditoria.id);
      acciones.push('ia_scoring_completado');
      
      // Crear registro de validación
      const { Validacion } = require('../models');
      await Validacion.crearValidacionParque(auditoria.id, {
        ...resultadoETL,
        scoring_ia: resultadoIA
      });
      
      acciones.push('validacion_registrada');
      
    } catch (error) {
      console.error('Error en validación automática:', error);
      acciones.push('error_validacion_automatica');
      throw error;
    }
    
    return acciones;
  }

  async ejecutarNotificacionResultados(auditoria) {
    const acciones = ['generar_informe_final'];
    
    try {
      // Generar informe final
      const informeService = require('./informe.service');
      const informe = await informeService.generarInformeFinal(auditoria.id);
      
      acciones.push('informe_generado');
      
      // Enviar notificación de resultados
      const notificationsService = require('../../notifications/notifications.service');
      
      await notificationsService.enviarNotificacionResultados({
        auditoria_id: auditoria.id,
        proveedor_id: auditoria.proveedor_id,
        informe_url: informe.url_descarga
      });
      
      acciones.push('resultados_notificados');
      
    } catch (error) {
      console.error('Error notificando resultados:', error);
      acciones.push('error_notificacion_resultados');
    }
    
    return acciones;
  }

  async ejecutarArchivado(auditoria) {
    const acciones = ['iniciar_archivado'];
    
    try {
      // Marcar auditoría como archivada
      await auditoria.update({
        archivada: true,
        fecha_finalizacion: new Date()
      });
      
      acciones.push('auditoria_archivada');
      
      // Actualizar dashboard
      const dashboardService = require('../../dashboards/dashboards.service');
      await dashboardService.actualizarMetricasAuditoria(auditoria.id);
      
      acciones.push('metricas_actualizadas');
      
    } catch (error) {
      console.error('Error archivando auditoría:', error);
      acciones.push('error_archivado');
    }
    
    return acciones;
  }

  // Métodos auxiliares
  obtenerNombreEtapa(numeroEtapa) {
    const nombres = {
      1: 'CONFIGURACION',
      2: 'NOTIFICACION',
      3: 'CARGA_PRESENCIAL',
      4: 'CARGA_PARQUE',
      5: 'VALIDACION_AUTOMATICA',
      6: 'REVISION_AUDITOR',
      7: 'NOTIFICACION_RESULTADOS',
      8: 'COMPLETADA'
    };
    return nombres[numeroEtapa];
  }

  obtenerConfiguracionWorkflow() {
    return WORKFLOW_CONFIG;
  }

  async obtenerEstadoWorkflow(auditoria_id) {
    const auditoria = await Auditoria.findByPk(auditoria_id);
    if (!auditoria) {
      throw new Error('Auditoría no encontrada');
    }

    const config = WORKFLOW_CONFIG[auditoria.estado];
    const validacion = await this.validarTransicion(auditoria);

    return {
      etapa_actual: {
        numero: auditoria.etapa_actual,
        nombre: auditoria.estado,
        descripcion: config?.descripcion || '',
        fecha_inicio: auditoria.fecha_inicio,
        tiempo_en_etapa: this.calcularTiempoEnEtapa(auditoria.fecha_ultima_actualizacion)
      },
      puede_avanzar: validacion.valido,
      razon_bloqueo: validacion.razon,
      acciones_requeridas: validacion.acciones_requeridas || [],
      progreso_porcentaje: Math.round((auditoria.etapa_actual / 8) * 100),
      siguiente_etapa: config?.siguiente || null
    };
  }

  calcularTiempoEnEtapa(fechaUltimaActualizacion) {
    if (!fechaUltimaActualizacion) return '0 días';
    
    const ahora = new Date();
    const ultima = new Date(fechaUltimaActualizacion);
    const diferencia = ahora - ultima;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (dias > 0) {
      return `${dias} día${dias > 1 ? 's' : ''} ${horas}h`;
    }
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  }
}

module.exports = new WorkflowService();