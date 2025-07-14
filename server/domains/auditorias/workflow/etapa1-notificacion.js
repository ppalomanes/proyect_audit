/**
 * Workflow Etapa 1 - Notificación
 * Portal de Auditorías Técnicas
 */

class Etapa1Notificacion {
  
  /**
   * Ejecutar lógica de la Etapa 1 - Notificación
   */
  static async ejecutar(auditoria, datosEtapa, usuario) {
    console.log(`🔔 Ejecutando Etapa 1 - Notificación para auditoría ${auditoria.codigo_auditoria}`);
    
    try {
      // 1. Preparar datos de notificación
      const datosNotificacion = {
        auditoria_id: auditoria.id,
        codigo_auditoria: auditoria.codigo_auditoria,
        titulo: auditoria.titulo,
        fecha_programada: auditoria.fecha_programada,
        auditor_principal: usuario.nombres + ' ' + usuario.apellidos,
        fecha_limite_respuesta: this.calcularFechaLimiteRespuesta(auditoria.fecha_programada)
      };

      // 2. Registrar notificación enviada
      const notificacionEnviada = {
        tipo: 'NOTIFICACION_INICIAL',
        destinatario: 'PROVEEDOR',
        fecha_envio: new Date().toISOString(),
        contenido: 'Notificación inicial de auditoría técnica programada',
        metadatos: datosNotificacion
      };

      // 3. Actualizar array de notificaciones enviadas
      const notificacionesActuales = auditoria.notificaciones_enviadas || [];
      notificacionesActuales.push(notificacionEnviada);
      
      auditoria.notificaciones_enviadas = notificacionesActuales;
      await auditoria.save();

      // 4. TODO: Integrar con módulo de notificaciones
      // await notificationsService.enviarNotificacionProveedor(datosNotificacion);

      console.log('✅ Etapa 1 - Notificación completada exitosamente');
      
      return {
        success: true,
        message: 'Notificación enviada exitosamente',
        data: {
          notificacion_enviada: notificacionEnviada,
          fecha_limite_respuesta: datosNotificacion.fecha_limite_respuesta
        }
      };

    } catch (error) {
      console.error('❌ Error en Etapa 1 - Notificación:', error);
      
      return {
        success: false,
        message: 'Error enviando notificación',
        error: error.message
      };
    }
  }

  /**
   * Calcular fecha límite de respuesta (5 días hábiles)
   */
  static calcularFechaLimiteRespuesta(fechaProgramada) {
    const fecha = new Date(fechaProgramada);
    let diasHabiles = 0;
    
    while (diasHabiles < 5) {
      fecha.setDate(fecha.getDate() + 1);
      
      // Saltar fines de semana (0 = domingo, 6 = sábado)
      if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
        diasHabiles++;
      }
    }
    
    return fecha.toISOString();
  }

  /**
   * Validar requisitos para avanzar de Etapa 1
   */
  static async validarRequisitos(auditoria) {
    // La etapa 1 siempre puede ejecutarse desde estado PROGRAMADA
    if (auditoria.estado === 'PROGRAMADA') {
      return {
        esValido: true,
        mensaje: 'Auditoría lista para notificación'
      };
    }

    return {
      esValido: false,
      mensaje: 'La auditoría debe estar en estado PROGRAMADA para enviar notificación'
    };
  }

  /**
   * Obtener plantilla de notificación
   */
  static obtenerPlantillaNotificacion(auditoria, auditor) {
    return {
      asunto: `Notificación de Auditoría Técnica - ${auditoria.codigo_auditoria}`,
      contenido: `
        Estimado Proveedor,
        
        Se ha programado una auditoría técnica con los siguientes detalles:
        
        📋 Código de Auditoría: ${auditoria.codigo_auditoria}
        📝 Título: ${auditoria.titulo}
        📅 Fecha Programada: ${new Date(auditoria.fecha_programada).toLocaleDateString('es-CO')}
        👤 Auditor Principal: ${auditor.nombres} ${auditor.apellidos}
        📧 Contacto Auditor: ${auditor.email}
        
        Próximos pasos:
        1. Preparar documentación requerida (13 tipos de documentos)
        2. Coordinar acceso al parque informático
        3. Designar contacto técnico para la auditoría
        
        La siguiente etapa será la carga de documentos que iniciará próximamente.
        
        Atentamente,
        Portal de Auditorías Técnicas
      `
    };
  }
}

module.exports = Etapa1Notificacion;
