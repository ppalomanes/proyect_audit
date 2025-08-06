// notifications.service.js - Servicio para gestión de notificaciones
const Notificacion = require('./models/Notificacion.model');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');

class NotificationsService {
  constructor() {
    // Configurar transporter de email
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Templates de notificaciones
    this.templates = {
      AUDITORIA_INICIADA: {
        titulo: 'Nueva Auditoría Iniciada',
        mensaje: 'Se ha iniciado una nueva auditoría técnica para el período {periodo}. Fecha límite de carga: {fecha_limite}.'
      },
      DOCUMENTOS_PENDIENTES: {
        titulo: 'Documentos Pendientes de Carga',
        mensaje: 'Tiene {cantidad} documentos pendientes de cargar para la auditoría {codigo}.'
      },
      RECORDATORIO_CARGA: {
        titulo: 'Recordatorio: Fecha Límite Próxima',
        mensaje: 'La fecha límite para cargar documentos es {fecha_limite}. Faltan {dias} días.'
      },
      VALIDACION_COMPLETADA: {
        titulo: 'Validación Automática Completada',
        mensaje: 'La validación automática de la auditoría {codigo} ha finalizado. Score: {score}%'
      },
      REVISION_REQUERIDA: {
        titulo: 'Revisión de Auditoría Requerida',
        mensaje: 'La auditoría {codigo} está lista para su revisión.'
      },
      VISITA_PROGRAMADA: {
        titulo: 'Visita Presencial Programada',
        mensaje: 'Se ha programado una visita presencial para el {fecha_visita} en {sitio}.'
      },
      INFORME_DISPONIBLE: {
        titulo: 'Informe de Auditoría Disponible',
        mensaje: 'El informe final de la auditoría {codigo} está disponible para descarga.'
      },
      AUDITORIA_CERRADA: {
        titulo: 'Auditoría Cerrada',
        mensaje: 'La auditoría {codigo} ha sido cerrada. Score final: {score_final}%'
      },
      MENSAJE_NUEVO: {
        titulo: 'Nuevo Mensaje',
        mensaje: 'Tiene un nuevo mensaje de {remitente} en la auditoría {codigo}.'
      },
      DOCUMENTO_RECHAZADO: {
        titulo: 'Documento Rechazado',
        mensaje: 'El documento {documento} ha sido rechazado. Motivo: {razon}'
      }
    };
  }

  /**
   * Crear y enviar notificación
   */
  async crearNotificacion(datos) {
    const transaction = await sequelize.transaction();
    
    try {
      // Obtener template si existe
      const template = this.templates[datos.tipo];
      
      // Crear notificación en BD
      const notificacion = await Notificacion.create({
        usuario_id: datos.usuario_id,
        tipo: datos.tipo,
        titulo: datos.titulo || (template ? this.procesarTemplate(template.titulo, datos.variables) : 'Notificación'),
        mensaje: datos.mensaje || (template ? this.procesarTemplate(template.mensaje, datos.variables) : ''),
        auditoria_id: datos.auditoria_id,
        documento_id: datos.documento_id,
        conversacion_id: datos.conversacion_id,
        prioridad: datos.prioridad || 'MEDIA',
        requiere_accion: datos.requiere_accion || false,
        accion_url: datos.accion_url,
        accion_texto: datos.accion_texto,
        metadata: datos.metadata || {},
        fecha_expiracion: datos.fecha_expiracion
      }, { transaction });
      
      // Enviar por email si está configurado
      if (datos.enviar_email !== false) {
        await this.enviarEmail(notificacion, datos.email_destinatario);
      }
      
      // Enviar notificación push si está disponible
      if (datos.enviar_push !== false) {
        await this.enviarPushNotification(notificacion);
      }
      
      // Emitir evento WebSocket
      if (global.io) {
        global.io.to(`user_${datos.usuario_id}`).emit('nueva_notificacion', {
          id: notificacion.id,
          tipo: notificacion.tipo,
          titulo: notificacion.titulo,
          mensaje: notificacion.mensaje,
          prioridad: notificacion.prioridad,
          timestamp: notificacion.created_at
        });
      }
      
      await transaction.commit();
      
      return {
        success: true,
        notificacion
      };
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creando notificación: ${error.message}`);
    }
  }

  /**
   * Notificar inicio de auditoría (ETAPA 1)
   */
  async notificarInicioAuditoria(auditoriaId) {
    try {
      const Auditoria = require('../auditorias/models/Auditoria.model');
      const Usuario = require('../auth/models/Usuario.model');
      
      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: ['proveedor', 'sitio']
      });
      
      // Obtener usuarios del proveedor
      const usuarios = await Usuario.findAll({
        where: {
          proveedor_id: auditoria.proveedor_id,
          activo: true
        }
      });
      
      // Crear notificación para cada usuario
      const notificaciones = [];
      for (const usuario of usuarios) {
        const notif = await this.crearNotificacion({
          usuario_id: usuario.id,
          tipo: 'AUDITORIA_INICIADA',
          auditoria_id: auditoriaId,
          variables: {
            periodo: auditoria.periodo,
            fecha_limite: new Date(auditoria.fecha_limite_carga).toLocaleDateString()
          },
          prioridad: 'ALTA',
          requiere_accion: true,
          accion_url: `/auditorias/${auditoriaId}`,
          accion_texto: 'Ir a la auditoría',
          email_destinatario: usuario.email
        });
        notificaciones.push(notif);
      }
      
      return notificaciones;
      
    } catch (error) {
      throw new Error(`Error notificando inicio de auditoría: ${error.message}`);
    }
  }

  /**
   * Notificar auditor para revisión (ETAPA 4)
   */
  async notificarAuditorParaRevision(auditoriaId) {
    try {
      const Auditoria = require('../auditorias/models/Auditoria.model');
      
      const auditoria = await Auditoria.findByPk(auditoriaId, {
        include: ['auditor']
      });
      
      if (!auditoria.auditor) {
        throw new Error('No hay auditor asignado');
      }
      
      return await this.crearNotificacion({
        usuario_id: auditoria.auditor_asignado_id,
        tipo: 'REVISION_REQUERIDA',
        auditoria_id: auditoriaId,
        variables: {
          codigo: auditoria.codigo
        },
        prioridad: 'ALTA',
        requiere_accion: true,
        accion_url: `/auditorias/${auditoriaId}/revisar`,
        accion_texto: 'Revisar auditoría',
        email_destinatario: auditoria.auditor.email
      });
      
    } catch (error) {
      throw new Error(`Error notificando auditor: ${error.message}`);
    }
  }

  /**
   * Notificar resultados de auditoría (ETAPA 8)
   */
  async notificarResultadosAuditoria(auditoriaId) {
    try {
      const Auditoria = require('../auditorias/models/Auditoria.model');
      const Usuario = require('../auth/models/Usuario.model');
      
      const auditoria = await Auditoria.findByPk(auditoriaId);
      
      // Obtener usuarios del proveedor
      const usuarios = await Usuario.findAll({
        where: {
          proveedor_id: auditoria.proveedor_id,
          activo: true
        }
      });
      
      const notificaciones = [];
      for (const usuario of usuarios) {
        const notif = await this.crearNotificacion({
          usuario_id: usuario.id,
          tipo: 'AUDITORIA_CERRADA',
          auditoria_id: auditoriaId,
          variables: {
            codigo: auditoria.codigo,
            score_final: auditoria.score_final
          },
          prioridad: 'ALTA',
          requiere_accion: true,
          accion_url: `/auditorias/${auditoriaId}/informe`,
          accion_texto: 'Ver informe',
          email_destinatario: usuario.email
        });
        notificaciones.push(notif);
      }
      
      return notificaciones;
      
    } catch (error) {
      throw new Error(`Error notificando resultados: ${error.message}`);
    }
  }

  /**
   * Enviar recordatorio de fecha límite
   */
  async enviarRecordatorioFechaLimite() {
    try {
      const Auditoria = require('../auditorias/models/Auditoria.model');
      const Usuario = require('../auth/models/Usuario.model');
      
      // Buscar auditorías con fecha límite próxima (24 horas)
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      
      const auditorias = await Auditoria.findAll({
        where: {
          estado: 'CARGANDO',
          fecha_limite_carga: {
            [Op.between]: [new Date(), manana]
          }
        }
      });
      
      for (const auditoria of auditorias) {
        const usuarios = await Usuario.findAll({
          where: {
            proveedor_id: auditoria.proveedor_id,
            activo: true
          }
        });
        
        for (const usuario of usuarios) {
          await this.crearNotificacion({
            usuario_id: usuario.id,
            tipo: 'RECORDATORIO_CARGA',
            auditoria_id: auditoria.id,
            variables: {
              codigo: auditoria.codigo,
              fecha_limite: new Date(auditoria.fecha_limite_carga).toLocaleDateString(),
              dias: 1
            },
            prioridad: 'URGENTE',
            requiere_accion: true,
            accion_url: `/auditorias/${auditoria.id}`,
            accion_texto: 'Cargar documentos',
            email_destinatario: usuario.email
          });
        }
      }
      
    } catch (error) {
      console.error('Error enviando recordatorios:', error);
    }
  }

  /**
   * Marcar notificación como leída
   */
  async marcarComoLeida(notificacionId, usuarioId) {
    try {
      const notificacion = await Notificacion.findOne({
        where: {
          id: notificacionId,
          usuario_id: usuarioId
        }
      });
      
      if (!notificacion) {
        throw new Error('Notificación no encontrada');
      }
      
      await notificacion.marcarComoLeida();
      
      // Actualizar contador en WebSocket
      if (global.io) {
        const noLeidas = await Notificacion.contarNoLeidas(usuarioId);
        global.io.to(`user_${usuarioId}`).emit('actualizar_contador_notificaciones', {
          no_leidas: noLeidas
        });
      }
      
      return { success: true };
      
    } catch (error) {
      throw new Error(`Error marcando notificación: ${error.message}`);
    }
  }

  /**
   * Marcar todas como leídas
   */
  async marcarTodasComoLeidas(usuarioId) {
    try {
      await Notificacion.update(
        {
          leida: true,
          fecha_lectura: new Date(),
          estado: 'LEIDA'
        },
        {
          where: {
            usuario_id: usuarioId,
            leida: false,
            activo: true
          }
        }
      );
      
      // Actualizar contador en WebSocket
      if (global.io) {
        global.io.to(`user_${usuarioId}`).emit('actualizar_contador_notificaciones', {
          no_leidas: 0
        });
      }
      
      return { success: true };
      
    } catch (error) {
      throw new Error(`Error marcando todas como leídas: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones de usuario
   */
  async obtenerNotificaciones(usuarioId, opciones = {}) {
    try {
      const {
        limite = 20,
        offset = 0,
        solo_no_leidas = false,
        tipo = null
      } = opciones;
      
      const where = {
        usuario_id: usuarioId,
        activo: true
      };
      
      if (solo_no_leidas) {
        where.leida = false;
      }
      
      if (tipo) {
        where.tipo = tipo;
      }
      
      const { count, rows } = await Notificacion.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: limite,
        offset,
        include: [
          {
            model: require('../auditorias/models/Auditoria.model'),
            as: 'auditoria',
            attributes: ['id', 'codigo', 'estado']
          }
        ]
      });
      
      const noLeidas = await Notificacion.contarNoLeidas(usuarioId);
      
      return {
        notificaciones: rows,
        total: count,
        no_leidas: noLeidas,
        pagina: Math.floor(offset / limite) + 1,
        paginas: Math.ceil(count / limite)
      };
      
    } catch (error) {
      throw new Error(`Error obteniendo notificaciones: ${error.message}`);
    }
  }

  /**
   * Eliminar notificaciones antiguas
   */
  async limpiarNotificacionesAntiguas() {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30); // 30 días
      
      await Notificacion.update(
        { activo: false },
        {
          where: {
            created_at: { [Op.lt]: fechaLimite },
            estado: 'LEIDA'
          }
        }
      );
      
    } catch (error) {
      console.error('Error limpiando notificaciones antiguas:', error);
    }
  }

  /**
   * Métodos auxiliares
   */
  
  procesarTemplate(template, variables) {
    let resultado = template;
    
    for (const [key, value] of Object.entries(variables || {})) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      resultado = resultado.replace(regex, value);
    }
    
    return resultado;
  }

  async enviarEmail(notificacion, emailDestinatario) {
    if (!emailDestinatario || !process.env.SMTP_USER) {
      return;
    }
    
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f8f9fa; padding: 20px; margin-top: 20px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notificacion.titulo}</h2>
            </div>
            <div class="content">
              <p>${notificacion.mensaje}</p>
              ${notificacion.requiere_accion ? `
                <a href="${process.env.APP_URL}${notificacion.accion_url}" class="button">
                  ${notificacion.accion_texto}
                </a>
              ` : ''}
            </div>
            <div class="footer">
              <p>Portal de Auditorías Técnicas</p>
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: emailDestinatario,
        subject: notificacion.titulo,
        html: htmlContent
      });
      
      await notificacion.update({
        enviada_email: true,
        fecha_envio_email: new Date()
      });
      
    } catch (error) {
      console.error('Error enviando email:', error);
    }
  }

  async enviarPushNotification(notificacion) {
    // Implementar cuando se configure servicio de push notifications
    // Por ahora solo marcar como enviada
    if (process.env.PUSH_ENABLED === 'true') {
      try {
        // Lógica de push notification aquí
        
        await notificacion.update({
          enviada_push: true,
          fecha_envio_push: new Date()
        });
      } catch (error) {
        console.error('Error enviando push notification:', error);
      }
    }
  }
}

module.exports = new NotificationsService();
