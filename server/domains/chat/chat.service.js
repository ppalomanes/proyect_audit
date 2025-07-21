const { Conversacion, Mensaje, ParticipanteChat } = require('./models');
const { Op } = require('sequelize');

class ChatService {
  
  /**
   * Crear una nueva conversación
   */
  async crearConversacion(datos) {
    const { auditoria_id, titulo, tipo = 'AUDITORIA', creado_por, participantes = [] } = datos;
    
    try {
      // Crear la conversación
      const conversacion = await Conversacion.create({
        auditoria_id,
        titulo,
        tipo,
        creado_por,
        metadatos: {
          fecha_creacion: new Date(),
          total_participantes: participantes.length + 1
        }
      });

      // Agregar al creador como moderador
      await ParticipanteChat.create({
        conversacion_id: conversacion.id,
        usuario_id: creado_por,
        rol_en_chat: 'MODERADOR',
        agregado_por: creado_por
      });

      // Agregar participantes adicionales
      for (const participante of participantes) {
        await ParticipanteChat.create({
          conversacion_id: conversacion.id,
          usuario_id: participante.usuario_id,
          rol_en_chat: participante.rol || 'PARTICIPANTE',
          agregado_por: creado_por
        });
      }

      // Crear mensaje del sistema
      await this.enviarMensaje({
        conversacion_id: conversacion.id,
        usuario_id: creado_por,
        contenido: `Conversación "${titulo}" iniciada`,
        tipo: 'SISTEMA'
      });

      console.log(`✅ Conversación creada: ${titulo} con ${participantes.length + 1} participantes`);
      
      return await this.obtenerConversacion(conversacion.id);
      
    } catch (error) {
      console.error('❌ Error creando conversación:', error);
      throw new Error(`Error al crear conversación: ${error.message}`);
    }
  }

  /**
   * Obtener conversaciones del usuario
   */
  async obtenerConversacionesUsuario(usuario_id, filtros = {}) {
    try {
      const { limite = 20, offset = 0, estado = 'ACTIVA' } = filtros;
      
      const conversaciones = await Conversacion.findAll({
        include: [
          {
            model: ParticipanteChat,
            as: 'participantes',
            where: { usuario_id },
            required: true
          },
          {
            model: Mensaje,
            as: 'ultimo_mensaje',
            required: false,
            attributes: ['id', 'contenido', 'tipo', 'usuario_id', 'created_at']
          }
        ],
        where: estado ? { estado } : {},
        order: [['ultimo_mensaje_fecha', 'DESC']],
        limit: limite,
        offset: offset
      });

      // Agregar información de mensajes no leídos
      const conversacionesConInfo = await Promise.all(
        conversaciones.map(async (conv) => {
          const participante = conv.participantes[0];
          const mensajesNoLeidos = await participante.getMensajesNoLeidos();
          
          return {
            ...conv.toJSON(),
            mensajes_no_leidos: mensajesNoLeidos,
            mi_rol: participante.rol_en_chat,
            silenciado: !participante.notificaciones_habilitadas
          };
        })
      );

      return conversacionesConInfo;
      
    } catch (error) {
      console.error('❌ Error obteniendo conversaciones:', error);
      throw new Error(`Error al obtener conversaciones: ${error.message}`);
    }
  }

  /**
   * Obtener una conversación específica
   */
  async obtenerConversacion(conversacion_id, usuario_id = null) {
    try {
      const conversacion = await Conversacion.findByPk(conversacion_id, {
        include: [
          {
            model: ParticipanteChat,
            as: 'participantes',
            attributes: ['usuario_id', 'rol_en_chat', 'estado', 'ultimo_acceso']
          }
        ]
      });

      if (!conversacion) {
        throw new Error('Conversación no encontrada');
      }

      // Verificar si el usuario tiene acceso
      if (usuario_id) {
        const tieneAcceso = conversacion.participantes.some(p => p.usuario_id === usuario_id);
        if (!tieneAcceso) {
          throw new Error('Sin permisos para acceder a esta conversación');
        }
      }

      return conversacion;
      
    } catch (error) {
      console.error('❌ Error obteniendo conversación:', error);
      throw error;
    }
  }

  /**
   * Enviar un mensaje
   */
  async enviarMensaje(datos) {
    const { 
      conversacion_id, 
      usuario_id, 
      contenido, 
      tipo = 'TEXTO',
      archivo_url = null,
      archivo_nombre = null,
      respuesta_a = null 
    } = datos;

    try {
      // Verificar que el usuario pueda enviar mensajes
      const participante = await ParticipanteChat.findOne({
        where: { conversacion_id, usuario_id, estado: 'ACTIVO' }
      });

      if (!participante) {
        throw new Error('Usuario no autorizado para enviar mensajes en esta conversación');
      }

      // Crear el mensaje
      const mensaje = await Mensaje.create({
        conversacion_id,
        usuario_id,
        contenido,
        tipo,
        archivo_url,
        archivo_nombre,
        respuesta_a,
        metadatos: {
          enviado_desde: 'web',
          timestamp: new Date()
        }
      });

      // Actualizar último acceso del remitente
      await participante.update({
        ultimo_acceso: new Date()
      });

      console.log(`📨 Mensaje enviado en conversación ${conversacion_id} por usuario ${usuario_id}`);
      
      return await this.obtenerMensaje(mensaje.id);
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw new Error(`Error al enviar mensaje: ${error.message}`);
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async obtenerMensajes(conversacion_id, filtros = {}) {
    try {
      const { limite = 50, offset = 0, desde_mensaje_id = null } = filtros;
      
      let whereCondition = { conversacion_id };
      
      if (desde_mensaje_id) {
        whereCondition.id = { [Op.gt]: desde_mensaje_id };
      }

      const mensajes = await Mensaje.findAll({
        where: whereCondition,
        include: [
          {
            model: Mensaje,
            as: 'mensaje_padre',
            attributes: ['id', 'contenido', 'usuario_id', 'tipo'],
            required: false
          }
        ],
        order: [['created_at', 'ASC']],
        limit: limite,
        offset: offset
      });

      return mensajes;
      
    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      throw new Error(`Error al obtener mensajes: ${error.message}`);
    }
  }

  /**
   * Marcar mensaje como leído
   */
  async marcarComoLeido(conversacion_id, usuario_id, mensaje_id) {
    try {
      const participante = await ParticipanteChat.findOne({
        where: { conversacion_id, usuario_id }
      });

      if (!participante) {
        throw new Error('Participante no encontrado');
      }

      await participante.update({
        ultimo_mensaje_leido_id: mensaje_id,
        ultimo_acceso: new Date()
      });

      console.log(`👁️ Usuario ${usuario_id} leyó hasta mensaje ${mensaje_id}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error marcando como leído:', error);
      throw new Error(`Error al marcar como leído: ${error.message}`);
    }
  }

  /**
   * Agregar participante a conversación
   */
  async agregarParticipante(conversacion_id, usuario_id, agregado_por, rol = 'PARTICIPANTE') {
    try {
      // Verificar que quien agrega tenga permisos
      const moderador = await ParticipanteChat.findOne({
        where: { 
          conversacion_id, 
          usuario_id: agregado_por, 
          rol_en_chat: ['MODERADOR', 'PARTICIPANTE'] 
        }
      });

      if (!moderador) {
        throw new Error('Sin permisos para agregar participantes');
      }

      // Verificar que no esté ya agregado
      const existente = await ParticipanteChat.findOne({
        where: { conversacion_id, usuario_id }
      });

      if (existente) {
        throw new Error('El usuario ya es participante de esta conversación');
      }

      // Agregar participante
      const participante = await ParticipanteChat.create({
        conversacion_id,
        usuario_id,
        rol_en_chat: rol,
        agregado_por
      });

      // Mensaje del sistema
      await this.enviarMensaje({
        conversacion_id,
        usuario_id: agregado_por,
        contenido: `Usuario agregado a la conversación`,
        tipo: 'SISTEMA'
      });

      return participante;
      
    } catch (error) {
      console.error('❌ Error agregando participante:', error);
      throw new Error(`Error al agregar participante: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de conversación
   */
  async obtenerEstadisticas(conversacion_id) {
    try {
      const [totalMensajes, participantesActivos] = await Promise.all([
        Mensaje.count({ where: { conversacion_id } }),
        ParticipanteChat.count({ 
          where: { conversacion_id, estado: 'ACTIVO' } 
        })
      ]);

      const mensajesPorTipo = await Mensaje.findAll({
        where: { conversacion_id },
        attributes: [
          'tipo',
          [Mensaje.sequelize.fn('COUNT', Mensaje.sequelize.col('id')), 'total']
        ],
        group: ['tipo'],
        raw: true
      });

      return {
        total_mensajes: totalMensajes,
        participantes_activos: participantesActivos,
        mensajes_por_tipo: mensajesPorTipo,
        ultima_actividad: await this.obtenerUltimaActividad(conversacion_id)
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener última actividad
   */
  async obtenerUltimaActividad(conversacion_id) {
    try {
      const ultimoMensaje = await Mensaje.findOne({
        where: { conversacion_id },
        order: [['created_at', 'DESC']],
        attributes: ['created_at', 'usuario_id', 'tipo']
      });

      return ultimoMensaje || null;
      
    } catch (error) {
      console.error('❌ Error obteniendo última actividad:', error);
      return null;
    }
  }

  /**
   * Obtener un mensaje específico
   */
  async obtenerMensaje(mensaje_id) {
    try {
      return await Mensaje.findByPk(mensaje_id, {
        include: [
          {
            model: Mensaje,
            as: 'mensaje_padre',
            attributes: ['id', 'contenido', 'usuario_id'],
            required: false
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error obteniendo mensaje:', error);
      throw new Error(`Error al obtener mensaje: ${error.message}`);
    }
  }

  /**
   * Verificar permisos de usuario en conversación
   */
  async verificarPermisos(conversacion_id, usuario_id) {
    try {
      const participante = await ParticipanteChat.findOne({
        where: { conversacion_id, usuario_id }
      });

      if (!participante) {
        return { 
          acceso: false, 
          rol: null, 
          puede_escribir: false,
          puede_moderar: false 
        };
      }

      return {
        acceso: participante.estado === 'ACTIVO',
        rol: participante.rol_en_chat,
        puede_escribir: participante.estado === 'ACTIVO',
        puede_moderar: participante.rol_en_chat === 'MODERADOR',
        silenciado: !participante.notificaciones_habilitadas
      };
      
    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      return { acceso: false, rol: null, puede_escribir: false, puede_moderar: false };
    }
  }
}

module.exports = new ChatService();