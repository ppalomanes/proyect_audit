/**
 * SERVICIO MEJORADO DE COMUNICACIÓN ASÍNCRONA
 * 
 * Implementación según especificaciones del PDF "Módulos Adicionales"
 * - Categorización automática de mensajes
 * - Estados avanzados de seguimiento
 * - Plantillas predefinidas
 * - Integración con flujo de 8 etapas de auditoría
 * - Menciones y notificaciones inteligentes
 */

const { Op } = require('sequelize');
const ChatCategoriaMensaje = require('./models/ChatCategoriaMensaje.model');
const ChatEstadoMensaje = require('./models/ChatEstadoMensaje.model');
const ChatPlantillaMensaje = require('./models/ChatPlantillaMensaje.model');
const ChatSeguimientoAuditoria = require('./models/ChatSeguimientoAuditoria.model');
const ChatMencionUsuario = require('./models/ChatMencionUsuario.model');
const ChatMensaje = require('./models/Mensaje.model');
const ChatCanal = require('./models/Canal.model');
const ChatWorkspace = require('./models/Workspace.model');
const ChatParticipanteWorkspace = require('./models/ParticipanteWorkspace.model');
const Usuario = require('../../auth/models/Usuario.model');

class ComunicacionAsincronaService {
  constructor(bitacoraService, notificacionesService) {
    this.bitacoraService = bitacoraService;
    this.notificacionesService = notificacionesService;
    this.templateEngine = new TemplateEngine();
  }

  // =============================================
  // GESTIÓN DE CATEGORÍAS DE MENSAJES
  // =============================================

  /**
   * Crear mensaje categorizado según especificaciones del PDF
   */
  async crearMensajeCategorizado(datos) {
    const {
      canal_id,
      usuario_id,
      contenido,
      categoria_codigo,
      prioridad = 'MEDIA',
      seccion_auditoria,
      documento_referencia_id,
      requiere_respuesta = false,
      plantilla_id = null,
      menciones = []
    } = datos;

    try {
      // 1. Obtener categoría
      const categoria = await ChatCategoriaMensaje.findOne({
        where: { codigo: categoria_codigo, activo: true }
      });

      if (!categoria) {
        throw new Error(`Categoría ${categoria_codigo} no encontrada`);
      }

      // 2. Calcular fecha límite de respuesta
      let fechaLimiteRespuesta = null;
      if (requiere_respuesta || categoria.requiere_respuesta) {
        fechaLimiteRespuesta = new Date();
        fechaLimiteRespuesta.setHours(
          fechaLimiteRespuesta.getHours() + categoria.tiempo_respuesta_horas
        );
      }

      // 3. Obtener contexto de auditoría
      const contextoAuditoria = await this.obtenerContextoAuditoria(canal_id);

      // 4. Crear mensaje
      const mensaje = await ChatMensaje.create({
        canal_id,
        usuario_id,
        contenido: contenido.trim(),
        categoria_id: categoria.id,
        prioridad,
        requiere_respuesta: requiere_respuesta || categoria.requiere_respuesta,
        fecha_limite_respuesta: fechaLimiteRespuesta,
        seccion_auditoria,
        documento_referencia_id,
        etapa_auditoria_contexto: contextoAuditoria?.etapa,
        plantilla_utilizada_id: plantilla_id,
        menciones_usuarios: menciones,
        tags: this.extraerTags(contenido)
      });

      // 5. Crear estado inicial
      await this.cambiarEstadoMensaje(mensaje.id, 'ENVIADO', usuario_id);

      // 6. Procesar menciones
      if (menciones.length > 0) {
        await this.procesarMenciones(mensaje.id, menciones, usuario_id);
      }

      // 7. Actualizar seguimiento de auditoría
      if (contextoAuditoria?.auditoria_id) {
        await this.actualizarSeguimientoAuditoria(contextoAuditoria.auditoria_id);
      }

      // 8. Registrar en bitácora
      if (this.bitacoraService) {
        await this.bitacoraService.registrarAccion(null, {
          tipo: 'CHAT_MENSAJE',
          descripcion: `Mensaje categorizado enviado: ${categoria.nombre}`,
          usuario_id,
          seccion: 'Comunicación Asíncrona',
          metadata: {
            categoria: categoria_codigo,
            prioridad,
            requiere_respuesta,
            canal_id
          }
        });
      }

      // 9. Enviar notificaciones
      await this.enviarNotificacionesMensaje(mensaje, categoria);

      return {
        success: true,
        mensaje: await this.obtenerMensajeCompleto(mensaje.id),
        categoria: categoria.nombre,
        tiempo_respuesta_esperado: categoria.tiempo_respuesta_horas
      };

    } catch (error) {
      console.error('Error creando mensaje categorizado:', error);
      throw error;
    }
  }

  // =============================================
  // GESTIÓN DE ESTADOS AVANZADOS
  // =============================================

  /**
   * Cambiar estado de mensaje según flujo del PDF
   */
  async cambiarEstadoMensaje(mensajeId, nuevoEstado, usuarioId, comentario = null) {
    try {
      // Validar transición de estado
      const estadoActual = await this.obtenerEstadoActual(mensajeId);
      if (estadoActual && !this.esTransicionValida(estadoActual, nuevoEstado)) {
        throw new Error(`Transición de estado inválida: ${estadoActual} → ${nuevoEstado}`);
      }

      // Crear registro de cambio de estado
      const cambioEstado = await ChatEstadoMensaje.create({
        mensaje_id: mensajeId,
        estado: nuevoEstado,
        usuario_actualizacion: usuarioId,
        comentario_cambio: comentario,
        metadata_estado: await this.generarMetadataEstado(mensajeId, nuevoEstado)
      });

      // Actualizar mensaje principal si es estado final
      if (['RESPONDIDO', 'CERRADO', 'ARCHIVADO'].includes(nuevoEstado)) {
        await ChatMensaje.update({
          resuelto: nuevoEstado === 'RESPONDIDO' || nuevoEstado === 'CERRADO',
          fecha_resolucion: nuevoEstado === 'RESPONDIDO' ? new Date() : null,
          resuelto_por: nuevoEstado === 'RESPONDIDO' ? usuarioId : null
        }, {
          where: { id: mensajeId }
        });
      }

      // Enviar notificación de cambio de estado
      await this.notificarCambioEstado(mensajeId, nuevoEstado, usuarioId);

      return cambioEstado;

    } catch (error) {
      console.error('Error cambiando estado de mensaje:', error);
      throw error;
    }
  }

  /**
   * Validar si una transición de estado es permitida
   */
  esTransicionValida(estadoActual, nuevoEstado) {
    const transicionesPermitidas = {
      'ENVIADO': ['ENTREGADO', 'LEIDO'],
      'ENTREGADO': ['LEIDO', 'EN_PROCESO'],
      'LEIDO': ['EN_PROCESO', 'RESPONDIDO', 'ESCALADO'],
      'EN_PROCESO': ['RESPONDIDO', 'ESCALADO', 'CERRADO'],
      'RESPONDIDO': ['CERRADO', 'ARCHIVADO'],
      'ESCALADO': ['EN_PROCESO', 'RESPONDIDO', 'CERRADO'],
      'CERRADO': ['ARCHIVADO'],
      'ARCHIVADO': [] // Estado final
    };

    return transicionesPermitidas[estadoActual]?.includes(nuevoEstado) || false;
  }

  /**
   * Obtener estado actual de un mensaje
   */
  async obtenerEstadoActual(mensajeId) {
    const ultimoEstado = await ChatEstadoMensaje.findOne({
      where: { mensaje_id: mensajeId },
      order: [['fecha_cambio', 'DESC']]
    });

    return ultimoEstado?.estado || null;
  }

  // =============================================
  // PLANTILLAS PREDEFINIDAS
  // =============================================

  /**
   * Crear mensaje desde plantilla con reemplazo de variables
   */
  async crearMensajeDesdeePlantilla(plantillaId, variables, datosAdicionales) {
    try {
      const plantilla = await ChatPlantillaMensaje.findByPk(plantillaId, {
        include: ['categoria']
      });

      if (!plantilla || !plantilla.activo) {
        throw new Error('Plantilla no encontrada o inactiva');
      }

      // Verificar permisos de rol
      const { usuario_id } = datosAdicionales;
      const usuario = await Usuario.findByPk(usuario_id);
      
      if (!this.puedeUsarPlantilla(usuario.rol, plantilla.rol_usuario)) {
        throw new Error('No tienes permisos para usar esta plantilla');
      }

      // Procesar contenido con variables
      const contenidoProcesado = this.templateEngine.procesar(
        plantilla.contenido,
        variables
      );

      // Crear mensaje usando la plantilla
      return await this.crearMensajeCategorizado({
        ...datosAdicionales,
        contenido: contenidoProcesado,
        categoria_codigo: plantilla.categoria.codigo,
        plantilla_id: plantillaId,
        requiere_respuesta: plantilla.categoria.requiere_respuesta
      });

    } catch (error) {
      console.error('Error creando mensaje desde plantilla:', error);
      throw error;
    }
  }

  /**
   * Obtener plantillas disponibles para un usuario
   */
  async obtenerPlantillasDisponibles(usuarioRol, categoriaId = null) {
    const whereClause = {
      activo: true,
      [Op.or]: [
        { rol_usuario: usuarioRol },
        { rol_usuario: 'TODOS' }
      ]
    };

    if (categoriaId) {
      whereClause.categoria_id = categoriaId;
    }

    return await ChatPlantillaMensaje.findAll({
      where: whereClause,
      include: ['categoria'],
      order: [
        ['uso_frecuente', 'DESC'],
        ['nombre', 'ASC']
      ]
    });
  }

  // =============================================
  // MENCIONES Y NOTIFICACIONES INTELIGENTES
  // =============================================

  /**
   * Procesar menciones de usuarios en mensajes
   */
  async procesarMenciones(mensajeId, menciones, usuarioQueMenciona) {
    try {
      for (const mencionado of menciones) {
        // Crear registro de mención
        const mencion = await ChatMencionUsuario.create({
          mensaje_id: mensajeId,
          usuario_mencionado_id: mencionado.usuario_id,
          usuario_menciona_id: usuarioQueMenciona,
          posicion_texto: mencionado.posicion || 0
        });

        // Enviar notificación de mención
        if (this.notificacionesService) {
          await this.notificacionesService.enviarNotificacion({
            usuario_id: mencionado.usuario_id,
            tipo: 'MENCION_CHAT',
            titulo: 'Te han mencionado en un mensaje',
            mensaje: `Te mencionaron en una conversación`,
            datos: {
              mensaje_id: mensajeId,
              mencion_id: mencion.id
            }
          });
        }

        // Marcar notificación como enviada
        await mencion.update({ notificacion_enviada: true });
      }

    } catch (error) {
      console.error('Error procesando menciones:', error);
      throw error;
    }
  }

  // =============================================
  // INTEGRACIÓN CON FLUJO DE AUDITORÍA
  // =============================================

  /**
   * Crear workspace automático para nueva auditoría
   */
  async crearWorkspaceAuditoria(auditoriaId, auditorId, proveedorId) {
    try {
      const auditoria = await Auditoria.findByPk(auditoriaId);
      if (!auditoria) {
        throw new Error('Auditoría no encontrada');
      }

      // Crear workspace principal
      const workspace = await ChatWorkspace.create({
        nombre: `Auditoría ${auditoria.nombre_proveedor} - ${auditoria.periodo}`,
        descripcion: `Comunicación para auditoría técnica ${auditoria.id}`,
        auditoria_id: auditoriaId,
        creado_por: auditorId,
        tipo: 'AUDITORIA'
      });

      // Crear canales por defecto según PDF
      const canalesPorDefecto = [
        {
          nombre: 'general',
          descripcion: 'Comunicación general de la auditoría',
          tipo: 'GENERAL'
        },
        {
          nombre: 'documentos',
          descripcion: 'Consultas sobre documentos y evidencias',
          tipo: 'DOCUMENTOS'
        },
        {
          nombre: 'seguimiento',
          descripcion: 'Seguimiento del proceso de auditoría',
          tipo: 'SEGUIMIENTO'
        },
        {
          nombre: 'tecnico',
          descripcion: 'Consultas técnicas específicas',
          tipo: 'TECNICO'
        }
      ];

      for (const canalData of canalesPorDefecto) {
        await ChatCanal.create({
          ...canalData,
          workspace_id: workspace.id,
          creado_por: auditorId
        });
      }

      // Agregar participantes iniciales
      await ChatParticipanteWorkspace.bulkCreate([
        {
          workspace_id: workspace.id,
          usuario_id: auditorId,
          rol: 'ADMIN',
          fecha_union: new Date()
        },
        {
          workspace_id: workspace.id,
          usuario_id: proveedorId,
          rol: 'MIEMBRO',
          fecha_union: new Date()
        }
      ]);

      // Crear seguimiento de auditoría
      await ChatSeguimientoAuditoria.create({
        auditoria_id: auditoriaId,
        workspace_id: workspace.id,
        etapa_auditoria: 'ETAPA_1_NOTIFICACION',
        mensajes_pendientes: 0,
        sla_cumplido: true
      });

      return workspace;

    } catch (error) {
      console.error('Error creando workspace de auditoría:', error);
      throw error;
    }
  }

  // =============================================
  // UTILIDADES AUXILIARES
  // =============================================

  /**
   * Extraer tags automáticamente del contenido
   */
  extraerTags(contenido) {
    const tags = [];
    
    // Tags de urgencia
    if (/urgente|crítico|inmediato/i.test(contenido)) {
      tags.push('urgente');
    }
    
    // Tags de tipo de consulta
    if (/documentos?|archivo|evidencia/i.test(contenido)) {
      tags.push('documentos');
    }
    
    if (/técnico|software|hardware|sistema/i.test(contenido)) {
      tags.push('tecnico');
    }
    
    if (/prórroga|extensión|plazo/i.test(contenido)) {
      tags.push('extension');
    }

    return tags;
  }

  /**
   * Verificar si usuario puede usar plantilla
   */
  puedeUsarPlantilla(rolUsuario, rolPlantilla) {
    if (rolPlantilla === 'TODOS') {
      return true;
    }
    return rolUsuario === rolPlantilla;
  }

  /**
   * Obtener contexto actual de auditoría
   */
  async obtenerContextoAuditoria(canalId) {
    try {
      const canal = await ChatCanal.findByPk(canalId, {
        include: [{
          model: ChatWorkspace,
          include: ['auditoria']
        }]
      });

      if (!canal?.workspace?.auditoria) {
        return null;
      }

      return {
        auditoria_id: canal.workspace.auditoria.id,
        etapa: await this.determinarEtapaActual(canal.workspace.auditoria.id)
      };
    } catch (error) {
      console.error('Error obteniendo contexto de auditoría:', error);
      return null;
    }
  }

  /**
   * Obtener mensaje completo con relaciones
   */
  async obtenerMensajeCompleto(mensajeId) {
    return await ChatMensaje.findByPk(mensajeId, {
      include: [
        'categoria',
        'usuario',
        'canal',
        'estados',
        'menciones'
      ]
    });
  }

  /**
   * Generar metadata específica para cada estado
   */
  async generarMetadataEstado(mensajeId, estado) {
    const metadata = {
      timestamp: new Date(),
      estado_anterior: await this.obtenerEstadoActual(mensajeId)
    };

    switch (estado) {
      case 'ESCALADO':
        metadata.nivel_escalamiento = 1;
        metadata.requiere_atencion_inmediata = true;
        break;
      case 'EN_PROCESO':
        metadata.tiempo_inicio_proceso = new Date();
        break;
      case 'RESPONDIDO':
        metadata.tiempo_respuesta = new Date();
        break;
    }

    return metadata;
  }

  /**
   * Enviar notificaciones de mensaje
   */
  async enviarNotificacionesMensaje(mensaje, categoria) {
    // Implementación simplificada
    // En producción, integrar con sistema de notificaciones completo
    console.log(`Notificación: Nuevo mensaje de categoría ${categoria.nombre}`);
  }

  /**
   * Notificar cambio de estado
   */
  async notificarCambioEstado(mensajeId, nuevoEstado, usuarioId) {
    // Implementación simplificada
    console.log(`Estado cambiado a ${nuevoEstado} para mensaje ${mensajeId}`);
  }

  /**
   * Actualizar seguimiento de auditoría
   */
  async actualizarSeguimientoAuditoria(auditoriaId) {
    // Implementación simplificada
    console.log(`Actualizando seguimiento para auditoría ${auditoriaId}`);
  }

  /**
   * Determinar etapa actual de auditoría
   */
  async determinarEtapaActual(auditoriaId) {
    // Implementación simplificada - en producción consultar estado real
    return 'ETAPA_2_CARGA';
  }
}

/**
 * Motor de plantillas simple
 */
class TemplateEngine {
  procesar(template, variables) {
    let resultado = template;
    
    for (const [clave, valor] of Object.entries(variables || {})) {
      const regex = new RegExp(`{{\\s*${clave}\\s*}}`, 'g');
      resultado = resultado.replace(regex, valor || '');
    }
    
    return resultado;
  }
}

module.exports = ComunicacionAsincronaService;
