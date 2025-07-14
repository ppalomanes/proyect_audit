/**
 * Workflow Etapa 2 - Carga de Documentos
 * Portal de Auditorías Técnicas
 */

class Etapa2CargaDocumentos {
  
  /**
   * Tipos de documentos requeridos en la auditoría
   */
  static DOCUMENTOS_REQUERIDOS = [
    { tipo: 'PLIEGO_TECNICO', nombre: 'Pliego Técnico Firmado', obligatorio: true },
    { tipo: 'CERTIFICADO_EMPRESA', nombre: 'Certificado de Constitución Empresa', obligatorio: true },
    { tipo: 'RUT_EMPRESA', nombre: 'RUT Actualizado', obligatorio: true },
    { tipo: 'ESTADOS_FINANCIEROS', nombre: 'Estados Financieros Últimos 2 Años', obligatorio: true },
    { tipo: 'CERTIFICACIONES_ISO', nombre: 'Certificaciones ISO (9001, 27001)', obligatorio: false },
    { tipo: 'ORGANIGRAMA', nombre: 'Organigrama de la Empresa', obligatorio: true },
    { tipo: 'INVENTARIO_HARDWARE', nombre: 'Inventario Completo de Hardware', obligatorio: true },
    { tipo: 'INVENTARIO_SOFTWARE', nombre: 'Inventario de Software y Licencias', obligatorio: true },
    { tipo: 'DIAGRAMA_RED', nombre: 'Diagrama de Arquitectura de Red', obligatorio: true },
    { tipo: 'POLITICAS_SEGURIDAD', nombre: 'Políticas de Seguridad Informática', obligatorio: true },
    { tipo: 'PLAN_CONTINGENCIA', nombre: 'Plan de Contingencia y Backup', obligatorio: true },
    { tipo: 'CONTRATOS_PROVEEDORES', nombre: 'Contratos con Proveedores TI', obligatorio: false },
    { tipo: 'EVIDENCIAS_MONITOREO', nombre: 'Evidencias de Monitoreo y Logs', obligatorio: true }
  ];

  /**
   * Ejecutar lógica de la Etapa 2 - Carga de Documentos
   */
  static async ejecutar(auditoria, datosEtapa, usuario) {
    console.log(`📁 Ejecutando Etapa 2 - Carga de Documentos para auditoría ${auditoria.codigo_auditoria}`);
    
    try {
      // 1. Configurar fecha límite de carga
      const fechaLimiteCarga = datosEtapa.fecha_limite_carga || 
        this.calcularFechaLimiteCarga(auditoria.fecha_programada);

      // 2. Activar carga de documentos para proveedor
      const configuracionCarga = {
        fecha_limite: fechaLimiteCarga,
        documentos_requeridos: this.DOCUMENTOS_REQUERIDOS,
        instrucciones_especiales: datosEtapa.instrucciones || this.obtenerInstruccionesDefecto(),
        formatos_permitidos: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'PNG'],
        tamaño_maximo_mb: 50
      };

      // 3. Actualizar configuración de la auditoría
      const configuracionEtapas = auditoria.configuracion_etapas || {};
      configuracionEtapas.etapa_2 = {
        ...configuracionEtapas.etapa_2,
        fecha_limite_carga: fechaLimiteCarga,
        carga_habilitada: true,
        fecha_habilitacion: new Date().toISOString(),
        configuracion_carga: configuracionCarga
      };

      auditoria.configuracion_etapas = configuracionEtapas;
      await auditoria.save();

      // 4. Registrar evento de habilitación
      const eventoHabilitacion = {
        tipo: 'CARGA_DOCUMENTOS_HABILITADA',
        fecha: new Date().toISOString(),
        usuario_id: usuario.id,
        configuracion: configuracionCarga
      };

      const notificacionesActuales = auditoria.notificaciones_enviadas || [];
      notificacionesActuales.push(eventoHabilitacion);
      auditoria.notificaciones_enviadas = notificacionesActuales;
      await auditoria.save();

      // 5. TODO: Notificar al proveedor sobre habilitación de carga
      // await notificationsService.notificarHabilitacionCarga(auditoria, configuracionCarga);

      console.log('✅ Etapa 2 - Carga de Documentos habilitada exitosamente');
      
      return {
        success: true,
        message: 'Carga de documentos habilitada exitosamente',
        data: {
          fecha_limite_carga: fechaLimiteCarga,
          documentos_requeridos: this.DOCUMENTOS_REQUERIDOS.length,
          configuracion: configuracionCarga
        }
      };

    } catch (error) {
      console.error('❌ Error en Etapa 2 - Carga de Documentos:', error);
      
      return {
        success: false,
        message: 'Error habilitando carga de documentos',
        error: error.message
      };
    }
  }

  /**
   * Calcular fecha límite de carga (15 días calendario)
   */
  static calcularFechaLimiteCarga(fechaProgramada) {
    const fecha = new Date(fechaProgramada);
    fecha.setDate(fecha.getDate() + 15);
    return fecha.toISOString();
  }

  /**
   * Validar requisitos para avanzar de Etapa 2
   */
  static async validarRequisitos(auditoria) {
    // Verificar que está en la etapa correcta
    if (auditoria.etapa_actual !== 2) {
      return {
        esValido: false,
        mensaje: 'La auditoría debe estar en etapa 2 para validar documentos'
      };
    }

    // TODO: Verificar que hay documentos cargados
    // const { Documento } = await require('../../../models').getModels();
    // const documentosCargados = await Documento.count({
    //   where: { auditoria_id: auditoria.id }
    // });

    // Simulación temporal
    const documentosCargados = 0;

    if (documentosCargados === 0) {
      return {
        esValido: false,
        mensaje: 'Debe haber al menos un documento cargado para avanzar',
        detalles: {
          documentos_requeridos: this.DOCUMENTOS_REQUERIDOS.length,
          documentos_cargados: documentosCargados
        }
      };
    }

    return {
      esValido: true,
      mensaje: 'Documentos disponibles para validación'
    };
  }

  /**
   * Obtener instrucciones por defecto para carga
   */
  static obtenerInstruccionesDefecto() {
    return [
      'Todos los documentos deben estar en formato PDF cuando sea posible',
      'Los archivos de Excel deben contener el inventario completo actualizado',
      'Las imágenes deben tener resolución mínima de 300 DPI',
      'Los documentos deben estar firmados digitalmente o con sello húmedo',
      'Incluir fecha de generación en cada documento',
      'Los inventarios deben incluir números de serie y modelos específicos',
      'Las políticas de seguridad deben estar vigentes (máximo 1 año)',
      'Los diagramas de red deben mostrar la topología actual completa'
    ];
  }

  /**
   * Verificar completitud de documentos cargados
   */
  static async verificarCompletitud(auditoriaId) {
    // TODO: Implementar verificación real con modelo Documento
    const documentosCargados = [];
    
    const documentosObligatorios = this.DOCUMENTOS_REQUERIDOS
      .filter(doc => doc.obligatorio)
      .map(doc => doc.tipo);

    const documentosFaltantes = documentosObligatorios.filter(tipo => 
      !documentosCargados.some(doc => doc.tipo_documento === tipo)
    );

    const porcentajeCompletitud = ((documentosObligatorios.length - documentosFaltantes.length) / 
      documentosObligatorios.length) * 100;

    return {
      documentos_obligatorios: documentosObligatorios.length,
      documentos_cargados: documentosCargados.length,
      documentos_faltantes: documentosFaltantes,
      porcentaje_completitud: Math.round(porcentajeCompletitud),
      esta_completo: documentosFaltantes.length === 0
    };
  }

  /**
   * Obtener plantilla de notificación para habilitación de carga
   */
  static obtenerPlantillaHabilitacion(auditoria, configuracion) {
    return {
      asunto: `Habilitación Carga de Documentos - ${auditoria.codigo_auditoria}`,
      contenido: `
        Estimado Proveedor,
        
        Se ha habilitado la carga de documentos para la auditoría técnica:
        
        📋 Código de Auditoría: ${auditoria.codigo_auditoria}
        📅 Fecha Límite de Carga: ${new Date(configuracion.fecha_limite).toLocaleDateString('es-CO')}
        📄 Documentos Requeridos: ${configuracion.documentos_requeridos.length}
        
        DOCUMENTOS OBLIGATORIOS:
        ${configuracion.documentos_requeridos
          .filter(doc => doc.obligatorio)
          .map(doc => `• ${doc.nombre}`)
          .join('\n        ')}
        
        DOCUMENTOS OPCIONALES:
        ${configuracion.documentos_requeridos
          .filter(doc => !doc.obligatorio)
          .map(doc => `• ${doc.nombre}`)
          .join('\n        ')}
        
        REQUISITOS TÉCNICOS:
        • Formatos permitidos: ${configuracion.formatos_permitidos.join(', ')}
        • Tamaño máximo por archivo: ${configuracion.tamaño_maximo_mb} MB
        • Documentos firmados digitalmente o con sello húmedo
        
        Para cargar los documentos, ingrese al portal con sus credenciales y dirígase a la sección de auditorías.
        
        Atentamente,
        Portal de Auditorías Técnicas
      `
    };
  }

  /**
   * Generar reporte de estado de carga
   */
  static async generarReporteEstado(auditoriaId) {
    const completitud = await this.verificarCompletitud(auditoriaId);
    
    return {
      resumen: {
        estado: completitud.esta_completo ? 'COMPLETO' : 'PENDIENTE',
        porcentaje: completitud.porcentaje_completitud,
        documentos_cargados: completitud.documentos_cargados,
        documentos_faltantes: completitud.documentos_faltantes.length
      },
      detalles: {
        documentos_obligatorios_faltantes: completitud.documentos_faltantes,
        recomendaciones: this.generarRecomendaciones(completitud)
      },
      proximos_pasos: completitud.esta_completo 
        ? ['Documentos completos', 'Listo para validación']
        : ['Cargar documentos faltantes', 'Verificar formatos', 'Completar información']
    };
  }

  /**
   * Generar recomendaciones basadas en completitud
   */
  static generarRecomendaciones(completitud) {
    const recomendaciones = [];
    
    if (completitud.porcentaje_completitud < 50) {
      recomendaciones.push('Priorizar carga de documentos obligatorios');
      recomendaciones.push('Revisar lista completa de documentos requeridos');
    }
    
    if (completitud.documentos_faltantes.includes('INVENTARIO_HARDWARE')) {
      recomendaciones.push('El inventario de hardware es crítico para la auditoría');
    }
    
    if (completitud.documentos_faltantes.includes('INVENTARIO_SOFTWARE')) {
      recomendaciones.push('El inventario de software debe incluir todas las licencias');
    }
    
    if (completitud.porcentaje_completitud >= 80) {
      recomendaciones.push('Excelente progreso, pocos documentos pendientes');
    }
    
    return recomendaciones;
  }
}

module.exports = Etapa2CargaDocumentos;
