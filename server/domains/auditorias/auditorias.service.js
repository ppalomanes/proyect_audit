// auditorias.service.js - Servicio principal para el workflow de auditorías de 8 etapas
const Auditoria = require('./models/Auditoria.model');
const Etapa = require('./models/Etapa.model');
const Documento = require('./models/Documento.model');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const notificationService = require('../notifications/notifications.service');
const etlService = require('../etl/etl.service');
const iaService = require('../ia/ia.service');

class AuditoriasService {
  /**
   * ETAPA 1: Crear nueva auditoría y notificar al proveedor
   */
  async crearAuditoria(datos) {
    const transaction = await sequelize.transaction();
    
    try {
      // Crear auditoría principal
      const auditoria = await Auditoria.create({
        periodo: datos.periodo,
        proveedor_id: datos.proveedor_id,
        sitio_id: datos.sitio_id,
        fecha_limite_carga: datos.fecha_limite_carga,
        creado_por_id: datos.usuario_id,
        estado: 'INICIADA',
        etapa_actual: 1
      }, { transaction });
      
      // Crear las 8 etapas estándar
      const etapasPromises = Etapa.ETAPAS_ESTANDAR.map(etapaConfig => {
        return Etapa.create({
          auditoria_id: auditoria.id,
          numero_etapa: etapaConfig.numero,
          nombre_etapa: etapaConfig.nombre,
          estado: etapaConfig.numero === 1 ? 'EN_PROCESO' : 'PENDIENTE',
          fecha_inicio: etapaConfig.numero === 1 ? new Date() : null,
          documentos_requeridos: etapaConfig.documentos_requeridos
        }, { transaction });
      });
      
      await Promise.all(etapasPromises);
      
      // Notificar al proveedor (ETAPA 1)
      await this.notificarInicioAuditoria(auditoria.id, { transaction });
      
      // Marcar Etapa 1 como completada y activar Etapa 2
      await this.completarEtapa(auditoria.id, 1, { transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        auditoria,
        message: 'Auditoría creada y proveedor notificado'
      };
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creando auditoría: ${error.message}`);
    }
  }
  
  /**
   * ETAPA 2: Carga de documentación por el proveedor
   */
  async cargarDocumento(auditoriaId, documentoData, archivo) {
    const transaction = await sequelize.transaction();
    
    try {
      const auditoria = await Auditoria.findByPk(auditoriaId);
      
      if (!auditoria) {
        throw new Error('Auditoría no encontrada');
      }
      
      if (auditoria.estado !== 'CARGANDO') {
        throw new Error('La auditoría no está en etapa de carga');
      }
      
      // Guardar archivo físico
      const rutaArchivo = await this.guardarArchivo(archivo, auditoriaId);
      
      // Crear registro de documento
      const documento = await Documento.create({
        auditoria_id: auditoriaId,
        tipo_documento: documentoData.tipo,
        nombre_documento: documentoData.nombre,
        nombre_archivo: archivo.originalname,
        ruta_archivo: rutaArchivo,
        tipo_mime: archivo.mimetype,
        tamaño_bytes: archivo.size,
        extension: archivo.originalname.split('.').pop(),
        cargado_por_id: documentoData.usuario_id,
        es_obligatorio: this.esDocumentoObligatorio(documentoData.tipo),
        observaciones_proveedor: documentoData.observaciones,
        estado: 'CARGADO'
      }, { transaction });
      
      // Actualizar contador de documentos
      await auditoria.increment('documentos_cargados', { transaction });
      
      // Si es parque informático, procesar con ETL (ETAPA 3 parcial)
      if (documentoData.tipo === 'PARQUE_INFORMATICO') {
        await this.procesarParqueInformatico(documento.id, { transaction });
      }
      
      await transaction.commit();
      
      return {
        success: true,
        documento,
        message: 'Documento cargado exitosamente'
      };
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error cargando documento: ${error.message}`);
    }
  }
  
  /**
   * Finalizar carga de documentos y pasar a validación
   */
  async finalizarCarga(auditoriaId, usuarioId) {
    const transaction = await sequelize.transaction();
    
    try {
      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: [{ model: Documento, as: 'documentos' }]
      });
      
      // Verificar documentos obligatorios
      const documentosObligatorios = await this.verificarDocumentosObligatorios(auditoria);
      
      if (!documentosObligatorios.completo) {
        return {
          success: false,
          faltantes: documentosObligatorios.faltantes,
          message: 'Faltan documentos obligatorios'
        };
      }
      
      // Actualizar estado y fechas
      await auditoria.update({
        estado: 'VALIDANDO',
        etapa_actual: 3,
        fecha_carga_completada: new Date()
      }, { transaction });
      
      // Completar Etapa 2
      await this.completarEtapa(auditoriaId, 2, { transaction });
      
      // Iniciar ETAPA 3: Validación automática
      await this.iniciarValidacionAutomatica(auditoriaId, { transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        message: 'Carga finalizada, iniciando validación automática'
      };
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error finalizando carga: ${error.message}`);
    }
  }
  
  /**
   * ETAPA 3: Validación automática con ETL e IA
   */
  async iniciarValidacionAutomatica(auditoriaId, options = {}) {
    const { transaction } = options;
    
    try {
      const etapa3 = await Etapa.findOne({
        where: { auditoria_id: auditoriaId, numero_etapa: 3 }
      });
      
      await etapa3.update({
        estado: 'EN_PROCESO',
        fecha_inicio: new Date()
      }, { transaction });
      
      // Obtener todos los documentos
      const documentos = await Documento.findAll({
        where: { 
          auditoria_id: auditoriaId,
          es_version_actual: true
        }
      });
      
      let scoreTotal = 0;
      let documentosValidados = 0;
      
      for (const documento of documentos) {
        let scoreDocumento = 100; // Score base
        
        // Validación ETL para parque informático
        if (documento.tipo_documento === 'PARQUE_INFORMATICO') {
          const resultadoETL = await etlService.validarParqueInformatico(documento.ruta_archivo);
          documento.procesado_etl = true;
          documento.resultado_etl = resultadoETL;
          scoreDocumento = resultadoETL.score || 0;
        }
        
        // Análisis IA para documentos PDF/imágenes
        if (['application/pdf', 'image/jpeg', 'image/png'].includes(documento.tipo_mime)) {
          const resultadoIA = await iaService.analizarDocumento(documento.ruta_archivo, documento.tipo_mime);
          documento.procesado_ia = true;
          documento.resultado_ia = resultadoIA;
          scoreDocumento = (scoreDocumento + (resultadoIA.score || 0)) / 2;
        }
        
        // Actualizar documento con scores
        await documento.update({
          score_validacion: scoreDocumento,
          estado: scoreDocumento >= 70 ? 'APROBADO' : 'REQUIERE_REVISION',
          fecha_ultima_revision: new Date()
        }, { transaction });
        
        scoreTotal += scoreDocumento;
        documentosValidados++;
      }
      
      // Calcular score promedio
      const scoreAutomatico = documentosValidados > 0 ? scoreTotal / documentosValidados : 0;
      
      // Actualizar auditoría con score automático
      const auditoria = await Auditoria.findByPk(auditoriaId);
      await auditoria.update({
        score_automatico: scoreAutomatico,
        estado: 'EN_REVISION',
        etapa_actual: 4,
        fecha_validacion_completada: new Date()
      }, { transaction });
      
      // Completar Etapa 3
      await etapa3.update({
        estado: 'COMPLETADA',
        fecha_fin: new Date(),
        cumplimiento: 100,
        detalles: {
          documentos_validados: documentosValidados,
          score_promedio: scoreAutomatico
        }
      }, { transaction });
      
      // Notificar al auditor para revisión (ETAPA 4)
      await notificationService.notificarAuditorParaRevision(auditoriaId);
      
      return {
        success: true,
        score: scoreAutomatico,
        documentos_validados: documentosValidados
      };
      
    } catch (error) {
      throw new Error(`Error en validación automática: ${error.message}`);
    }
  }
  
  /**
   * ETAPA 4: Revisión por auditor
   */
  async evaluarSeccion(auditoriaId, seccion, evaluacion, auditorId) {
    const transaction = await sequelize.transaction();
    
    try {
      const documento = await Documento.findOne({
        where: {
          auditoria_id: auditoriaId,
          tipo_documento: seccion,
          es_version_actual: true
        }
      });
      
      if (!documento) {
        throw new Error('Documento no encontrado');
      }
      
      // Actualizar evaluación del documento
      await documento.update({
        estado: evaluacion.cumple ? 'APROBADO' : 'RECHAZADO',
        revisado_por_id: auditorId,
        aprobado_por_id: evaluacion.cumple ? auditorId : null,
        fecha_aprobacion: evaluacion.cumple ? new Date() : null,
        observaciones_auditor: evaluacion.observaciones,
        razon_rechazo: !evaluacion.cumple ? evaluacion.razon : null
      }, { transaction });
      
      // Verificar si todas las secciones han sido evaluadas
      const documentosPendientes = await Documento.count({
        where: {
          auditoria_id: auditoriaId,
          es_version_actual: true,
          revisado_por_id: null
        }
      });
      
      if (documentosPendientes === 0) {
        // Todas las secciones evaluadas, completar etapa 4
        await this.completarRevisionAuditor(auditoriaId, auditorId, { transaction });
      }
      
      await transaction.commit();
      
      return {
        success: true,
        message: 'Sección evaluada correctamente',
        pendientes: documentosPendientes
      };
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error evaluando sección: ${error.message}`);
    }
  }
  
  /**
   * Completar revisión del auditor
   */
  async completarRevisionAuditor(auditoriaId, auditorId, options = {}) {
    const { transaction } = options;
    
    const auditoria = await Auditoria.findByPk(auditoriaId);
    const documentos = await Documento.findAll({
      where: {
        auditoria_id: auditoriaId,
        es_version_actual: true
      }
    });
    
    // Calcular score del auditor
    const documentosAprobados = documentos.filter(d => d.estado === 'APROBADO').length;
    const scoreAuditor = (documentosAprobados / documentos.length) * 100;
    
    // Actualizar auditoría
    await auditoria.update({
      score_auditor: scoreAuditor,
      score_final: (auditoria.score_automatico + scoreAuditor) / 2,
      auditor_asignado_id: auditorId,
      fecha_revision_completada: new Date(),
      estado: auditoria.requiere_visita ? 'VISITA_PROGRAMADA' : 'INFORME_GENERADO',
      etapa_actual: auditoria.requiere_visita ? 5 : 7
    }, { transaction });
    
    // Completar Etapa 4
    await this.completarEtapa(auditoriaId, 4, { transaction });
    
    // Si no requiere visita, saltar a generación de informe
    if (!auditoria.requiere_visita) {
      await this.generarInforme(auditoriaId, { transaction });
    }
    
    return {
      success: true,
      score_auditor: scoreAuditor,
      requiere_visita: auditoria.requiere_visita
    };
  }
  
  /**
   * ETAPA 7: Generar informe final
   */
  async generarInforme(auditoriaId, options = {}) {
    const { transaction } = options;
    
    try {
      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: [
          { model: Documento, as: 'documentos' },
          { model: Etapa, as: 'etapas' }
        ]
      });
      
      // Generar estructura del informe
      const informe = {
        codigo_auditoria: auditoria.codigo,
        periodo: auditoria.periodo,
        fecha_generacion: new Date(),
        resumen_ejecutivo: {
          score_final: auditoria.score_final,
          documentos_totales: auditoria.documentos_cargados,
          documentos_aprobados: auditoria.documentos_aprobados,
          cumplimiento: auditoria.score_final >= 70 ? 'CUMPLE' : 'NO CUMPLE'
        },
        detalle_evaluacion: await this.generarDetalleEvaluacion(auditoria),
        recomendaciones: await this.generarRecomendaciones(auditoria),
        proximos_pasos: await this.generarProximosPasos(auditoria)
      };
      
      // Guardar informe como documento
      const rutaInforme = await this.guardarInformePDF(informe, auditoriaId);
      
      await Documento.create({
        auditoria_id: auditoriaId,
        tipo_documento: 'INFORME_FINAL',
        nombre_documento: `Informe Final - ${auditoria.codigo}`,
        nombre_archivo: `informe_${auditoria.codigo}.pdf`,
        ruta_archivo: rutaInforme,
        tipo_mime: 'application/pdf',
        tamaño_bytes: 0, // Se actualizará después de generar el PDF
        extension: 'pdf',
        cargado_por_id: auditoria.auditor_asignado_id,
        estado: 'APROBADO'
      }, { transaction });
      
      // Actualizar estado
      await auditoria.update({
        estado: 'INFORME_GENERADO',
        etapa_actual: 7,
        fecha_informe: new Date()
      }, { transaction });
      
      // Completar Etapa 7
      await this.completarEtapa(auditoriaId, 7, { transaction });
      
      // Iniciar ETAPA 8: Notificación y cierre
      await this.notificarResultados(auditoriaId, { transaction });
      
      return {
        success: true,
        informe,
        ruta: rutaInforme
      };
      
    } catch (error) {
      throw new Error(`Error generando informe: ${error.message}`);
    }
  }
  
  /**
   * ETAPA 8: Notificar resultados y cerrar auditoría
   */
  async notificarResultados(auditoriaId, options = {}) {
    const { transaction } = options;
    
    try {
      const auditoria = await Auditoria.findByPk(auditoriaId);
      
      // Enviar notificación al proveedor
      await notificationService.notificarResultadosAuditoria(auditoriaId);
      
      // Actualizar estado final
      await auditoria.update({
        estado: 'CERRADA',
        etapa_actual: 8,
        fecha_cierre: new Date()
      }, { transaction });
      
      // Completar Etapa 8
      await this.completarEtapa(auditoriaId, 8, { transaction });
      
      return {
        success: true,
        message: 'Auditoría cerrada y resultados notificados'
      };
      
    } catch (error) {
      throw new Error(`Error notificando resultados: ${error.message}`);
    }
  }
  
  /**
   * Métodos auxiliares
   */
  
  async completarEtapa(auditoriaId, numeroEtapa, options = {}) {
    const { transaction } = options;
    
    const etapa = await Etapa.findOne({
      where: { auditoria_id: auditoriaId, numero_etapa: numeroEtapa }
    });
    
    if (etapa && etapa.estado !== 'COMPLETADA') {
      await etapa.update({
        estado: 'COMPLETADA',
        fecha_fin: new Date(),
        cumplimiento: 100
      }, { transaction });
      
      // Activar siguiente etapa si existe
      const siguienteEtapa = await Etapa.findOne({
        where: { auditoria_id: auditoriaId, numero_etapa: numeroEtapa + 1 }
      });
      
      if (siguienteEtapa) {
        await siguienteEtapa.update({
          estado: 'EN_PROCESO',
          fecha_inicio: new Date()
        }, { transaction });
      }
    }
  }
  
  async verificarDocumentosObligatorios(auditoria) {
    const tiposObligatorios = [
      'CUARTO_TECNOLOGIA',
      'ENERGIA',
      'SEGURIDAD_INFORMATICA',
      'PARQUE_INFORMATICO'
    ];
    
    const documentosCargados = await Documento.findAll({
      where: {
        auditoria_id: auditoria.id,
        tipo_documento: tiposObligatorios,
        es_version_actual: true
      },
      attributes: ['tipo_documento']
    });
    
    const tiposCargados = documentosCargados.map(d => d.tipo_documento);
    const faltantes = tiposObligatorios.filter(tipo => !tiposCargados.includes(tipo));
    
    return {
      completo: faltantes.length === 0,
      faltantes
    };
  }
  
  esDocumentoObligatorio(tipo) {
    const obligatorios = [
      'CUARTO_TECNOLOGIA',
      'ENERGIA', 
      'SEGURIDAD_INFORMATICA',
      'PARQUE_INFORMATICO'
    ];
    return obligatorios.includes(tipo);
  }
  
  async guardarArchivo(archivo, auditoriaId) {
    // Implementar lógica de guardado de archivo
    // Por ahora retornamos una ruta mock
    return `/uploads/auditorias/${auditoriaId}/${archivo.originalname}`;
  }
  
  async procesarParqueInformatico(documentoId, options = {}) {
    // Se implementará con el servicio ETL
    console.log('Procesando parque informático:', documentoId);
  }
  
  async generarDetalleEvaluacion(auditoria) {
    // Generar detalle de evaluación para el informe
    return {};
  }
  
  async generarRecomendaciones(auditoria) {
    // Generar recomendaciones basadas en los resultados
    return [];
  }
  
  async generarProximosPasos(auditoria) {
    // Generar próximos pasos para el proveedor
    return [];
  }
  
  async guardarInformePDF(informe, auditoriaId) {
    // Implementar generación de PDF
    // Por ahora retornamos una ruta mock
    return `/uploads/auditorias/${auditoriaId}/informe_final.pdf`;
  }
  
  async notificarInicioAuditoria(auditoriaId, options = {}) {
    // Implementar notificación al proveedor
    console.log('Notificando inicio de auditoría:', auditoriaId);
  }
}

module.exports = new AuditoriasService();
