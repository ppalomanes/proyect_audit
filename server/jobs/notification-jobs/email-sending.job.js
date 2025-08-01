/**
 * Job BullMQ - Envío de Notificaciones y Emails
 * Portal de Auditorías Técnicas
 */

const nodemailer = require('nodemailer');
const { cache } = require('../../config/redis');

// Configuración de email
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'portal@auditorias.com',
    pass: process.env.SMTP_PASS || 'password123'
  }
};

// Templates de email básicos
const EMAIL_TEMPLATES = {
  inicio_auditoria: {
    subject: 'Nueva Auditoría Técnica Asignada',
    template: (data) => `
      <h2>Nueva Auditoría Asignada</h2>
      <p>Estimado/a ${data.destinatario_nombre},</p>
      <p>Se ha iniciado una nueva auditoría técnica:</p>
      <ul>
        <li>ID: ${data.auditoria_id}</li>
        <li>Proveedor: ${data.proveedor}</li>
        <li>Fecha límite: ${data.fecha_limite}</li>
      </ul>
      <p><a href="${data.url_portal}">Acceder al Portal</a></p>
    `
  },
  etl_completado: {
    subject: 'Procesamiento ETL Completado',
    template: (data) => `
      <h2>Procesamiento ETL Completado</h2>
      <p>Su archivo de parque informático ha sido procesado:</p>
      <ul>
        <li>Registros: ${data.total_registros}</li>
        <li>Score promedio: ${data.score_promedio}%</li>
        <li>Tasa éxito: ${data.tasa_exito}%</li>
      </ul>
      <p><a href="${data.url_resultados}">Ver Resultados</a></p>
    `
  },
  ia_analisis_completado: {
    subject: 'Análisis IA Completado',
    template: (data) => `
      <h2>Análisis IA Completado</h2>
      <p>El análisis de su documento ha finalizado:</p>
      <ul>
        <li>Tipo: ${data.documento_tipo}</li>
        <li>Score IA: ${data.score_ia}/100</li>
        <li>Categoría: ${data.categoria}</li>
      </ul>
      <p><a href="${data.url_analisis}">Ver Análisis</a></p>
    `
  }
};

async function emailSendingJob(job) {
  const { 
    tipo_notificacion, 
    destinatario_email, 
    destinatario_nombre,
    datos_template,
    prioridad = 'normal'
  } = job.data;

  try {
    console.log(`📧 Iniciando envío de email job ${job.id}`);
    
    await job.updateProgress(10);
    const transporter = await configurarTransporter();
    
    await job.updateProgress(30);
    const emailContent = generarContenidoEmail(tipo_notificacion, datos_template);
    
    await job.updateProgress(60);
    const resultado = await enviarEmail(transporter, {
      to: destinatario_email,
      subject: emailContent.subject,
      html: emailContent.html,
      destinatario_nombre
    });
    
    await job.updateProgress(90);
    await registrarEnvio(job.id, tipo_notificacion, destinatario_email, resultado);
    
    await job.updateProgress(100);
    console.log(`✅ Email enviado exitosamente: ${job.id} -> ${destinatario_email}`);
    
    return {
      job_id: job.id,
      estado: 'ENVIADO',
      destinatario: destinatario_email,
      timestamp: new Date().toISOString(),
      message_id: resultado.messageId
    };

  } catch (error) {
    console.error(`❌ Error enviando email ${job.id}:`, error.message);
    throw error;
  }
}

async function configurarTransporter() {
  try {
    const transporter = nodemailer.createTransporter(EMAIL_CONFIG);
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');
    return transporter;
  } catch (error) {
    throw new Error(`Error configurando SMTP: ${error.message}`);
  }
}

function generarContenidoEmail(tipo, datos) {
  const template = EMAIL_TEMPLATES[tipo];
  
  if (!template) {
    throw new Error(`Template de email no encontrado: ${tipo}`);
  }
  
  return {
    subject: template.subject,
    html: template.template(datos)
  };
}

async function enviarEmail(transporter, emailData) {
  try {
    const mailOptions = {
      from: `"Portal de Auditorías" <${EMAIL_CONFIG.auth.user}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      headers: {
        'X-Portal-Type': 'auditoria-tecnica',
        'X-Auto-Generated': 'true'
      }
    };
    
    const resultado = await transporter.sendMail(mailOptions);
    console.log(`📤 Email enviado a ${emailData.to}, ID: ${resultado.messageId}`);
    
    return resultado;
    
  } catch (error) {
    throw new Error(`Error enviando email: ${error.message}`);
  }
}

async function registrarEnvio(jobId, tipo, destinatario, resultado) {
  try {
    const registro = {
      job_id: jobId,
      tipo_notificacion: tipo,
      destinatario_email: destinatario,
      message_id: resultado.messageId,
      estado: 'ENVIADO',
      timestamp: new Date().toISOString(),
      response: resultado.response
    };
    
    await cache.set(`notification:${jobId}`, registro, 86400); // 24 horas
    console.log(`📝 Envío registrado: ${jobId}`);
    
  } catch (error) {
    console.error('❌ Error registrando envío:', error.message);
  }
}

// Helpers para crear notificaciones específicas
const NotificationHelpers = {
  crearNotificacionInicioAuditoria(auditoriaData) {
    return {
      tipo_notificacion: 'inicio_auditoria',
      destinatario_email: auditoriaData.proveedor_email,
      destinatario_nombre: auditoriaData.proveedor_nombre,
      datos_template: {
        destinatario_nombre: auditoriaData.proveedor_nombre,
        auditoria_id: auditoriaData.id,
        proveedor: auditoriaData.proveedor,
        periodo: auditoriaData.periodo,
        fecha_limite: auditoriaData.fecha_limite,
        estado: auditoriaData.estado,
        url_portal: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auditorias/${auditoriaData.id}`
      },
      prioridad: 'alta'
    };
  },

  crearNotificacionETLCompletado(etlData) {
    return {
      tipo_notificacion: 'etl_completado',
      destinatario_email: etlData.usuario_email,
      destinatario_nombre: etlData.usuario_nombre,
      datos_template: {
        destinatario_nombre: etlData.usuario_nombre,
        total_registros: etlData.estadisticas.total_registros,
        score_promedio: etlData.estadisticas.score_calidad_promedio,
        tasa_exito: etlData.estadisticas.tasa_exito,
        url_resultados: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/etl/resultados/${etlData.job_id}`
      },
      prioridad: 'normal'
    };
  },

  crearNotificacionIACompletado(iaData) {
    return {
      tipo_notificacion: 'ia_analisis_completado',
      destinatario_email: iaData.usuario_email,
      destinatario_nombre: iaData.usuario_nombre,
      datos_template: {
        destinatario_nombre: iaData.usuario_nombre,
        documento_tipo: iaData.analisis.tipo_analisis,
        score_ia: iaData.analisis.scoring.score_total,
        categoria: iaData.analisis.scoring.categoria,
        url_analisis: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ia/analisis/${iaData.job_id}`
      },
      prioridad: 'normal'
    };
  }
};

async function batchEmailSendingJob(job) {
  const { notificaciones, configuracion = {} } = job.data;
  
  try {
    console.log(`📧 Iniciando envío en lote: ${notificaciones.length} emails`);
    
    const transporter = await configurarTransporter();
    const resultados = [];
    
    for (let i = 0; i < notificaciones.length; i++) {
      const notif = notificaciones[i];
      
      try {
        const progreso = Math.round(((i + 1) / notificaciones.length) * 100);
        await job.updateProgress(progreso);
        
        const emailContent = generarContenidoEmail(notif.tipo_notificacion, notif.datos_template);
        
        const resultado = await enviarEmail(transporter, {
          to: notif.destinatario_email,
          subject: emailContent.subject,
          html: emailContent.html,
          destinatario_nombre: notif.destinatario_nombre
        });
        
        resultados.push({
          destinatario: notif.destinatario_email,
          estado: 'ENVIADO',
          message_id: resultado.messageId
        });
        
        if (configuracion.delay_ms) {
          await new Promise(resolve => setTimeout(resolve, configuracion.delay_ms));
        }
        
      } catch (error) {
        console.error(`❌ Error enviando a ${notif.destinatario_email}:`, error.message);
        resultados.push({
          destinatario: notif.destinatario_email,
          estado: 'ERROR',
          error: error.message
        });
      }
    }
    
    const exitosos = resultados.filter(r => r.estado === 'ENVIADO').length;
    const fallidos = resultados.filter(r => r.estado === 'ERROR').length;
    
    console.log(`✅ Envío en lote completado: ${exitosos} exitosos, ${fallidos} fallidos`);
    
    return {
      job_id: job.id,
      total_emails: notificaciones.length,
      exitosos: exitosos,
      fallidos: fallidos,
      tasa_exito: Math.round((exitosos / notificaciones.length) * 100),
      resultados: resultados,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Error en envío en lote ${job.id}:`, error.message);
    throw error;
  }
}

module.exports = {
  emailSendingJob,
  batchEmailSendingJob,
  NotificationHelpers
};