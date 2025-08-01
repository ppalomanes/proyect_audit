const chatService = require('./chat.service');
const BitacoraService = require('../bitacora/bitacora.service');
const { validationResult } = require('express-validator');

class ChatController {

  /**
   * GET /api/chat/conversaciones
   * Obtener conversaciones del usuario autenticado
   */
  async obtenerConversaciones(req, res) {
    try {
      const usuario_id = req.usuario.id;
      const { limite, offset, estado } = req.query;

      const conversaciones = await chatService.obtenerConversacionesUsuario(usuario_id, {
        limite: parseInt(limite) || 20,
        offset: parseInt(offset) || 0,
        estado
      });

      // Registrar en bitácora
      await BitacoraService.registrar({
        usuario_id,
        seccion: 'chat',
        accion: 'consultar_conversaciones',
        descripcion: `Usuario consultó ${conversaciones.length} conversaciones`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        datos_adicionales: {
          total_conversaciones: conversaciones.length,
          filtros_aplicados: { limite, offset, estado }
        }
      });

      res.json({
        success: true,
        data: conversaciones,
        meta: {
          total: conversaciones.length,
          usuario_id,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error en obtenerConversaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conversaciones',
        error: error.message
      });
    }
  }

  /**
   * POST /api/chat/conversaciones
   * Crear nueva conversación
   */
  async crearConversacion(req, res) {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { auditoria_id, titulo, tipo, participantes } = req.body;
      const creado_por = req.usuario.id;

      const conversacion = await chatService.crearConversacion({
        auditoria_id,
        titulo,
        tipo,
        creado_por,
        participantes
      });

      res.status(201).json({
        success: true,
        message: 'Conversación creada exitosamente',
        data: conversacion
      });

    } catch (error) {
      console.error('❌ Error en crearConversacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear conversación',
        error: error.message
      });
    }
  }

  /**
   * GET /api/chat/conversaciones/:id
   * Obtener conversación específica
   */
  async obtenerConversacion(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.usuario.id;

      const conversacion = await chatService.obtenerConversacion(id, usuario_id);

      res.json({
        success: true,
        data: conversacion
      });

    } catch (error) {
      console.error('❌ Error en obtenerConversacion:', error);
      
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }
      
      if (error.message.includes('Sin permisos')) {
        return res.status(403).json({
          success: false,
          message: 'Sin permisos para acceder a esta conversación'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener conversación',
        error: error.message
      });
    }
  }

  /**
   * GET /api/chat/conversaciones/:id/mensajes
   * Obtener mensajes de una conversación
   */
  async obtenerMensajes(req, res) {
    try {
      const { id } = req.params;
      const { limite, offset, desde_mensaje_id } = req.query;
      const usuario_id = req.usuario.id;

      // Verificar permisos primero
      const permisos = await chatService.verificarPermisos(id, usuario_id);
      if (!permisos.acceso) {
        return res.status(403).json({
          success: false,
          message: 'Sin permisos para acceder a esta conversación'
        });
      }

      const mensajes = await chatService.obtenerMensajes(id, {
        limite: parseInt(limite) || 50,
        offset: parseInt(offset) || 0,
        desde_mensaje_id
      });

      res.json({
        success: true,
        data: mensajes,
        meta: {
          conversacion_id: id,
          total: mensajes.length,
          permisos
        }
      });

    } catch (error) {
      console.error('❌ Error en obtenerMensajes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener mensajes',
        error: error.message
      });
    }
  }

  /**
   * POST /api/chat/conversaciones/:id/mensajes
   * Enviar mensaje a conversación
   */
  async enviarMensaje(req, res) {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { contenido, tipo, respuesta_a } = req.body;
      const usuario_id = req.usuario.id;

      // Verificar permisos
      const permisos = await chatService.verificarPermisos(id, usuario_id);
      if (!permisos.puede_escribir) {
        return res.status(403).json({
          success: false,
          message: 'Sin permisos para enviar mensajes en esta conversación'
        });
      }

      const mensaje = await chatService.enviarMensaje({
        conversacion_id: id,
        usuario_id,
        contenido,
        tipo: tipo || 'TEXTO',
        respuesta_a
      });

      res.status(201).json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: mensaje
      });

      // Emitir evento WebSocket (se manejará en el WebSocket handler)
      if (req.io) {
        req.io.to(`conversacion_${id}`).emit('nuevo_mensaje', {
          mensaje,
          conversacion_id: id
        });
      }

    } catch (error) {
      console.error('❌ Error en enviarMensaje:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar mensaje',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/chat/mensajes/:id/leido
   * Marcar mensaje como leído
   */
  async marcarComoLeido(req, res) {
    try {
      const { id } = req.params;
      const { conversacion_id } = req.body;
      const usuario_id = req.usuario.id;

      if (!conversacion_id) {
        return res.status(400).json({
          success: false,
          message: 'conversacion_id es requerido'
        });
      }

      await chatService.marcarComoLeido(conversacion_id, usuario_id, id);

      res.json({
        success: true,
        message: 'Mensaje marcado como leído'
      });

      // Emitir evento WebSocket
      if (req.io) {
        req.io.to(`conversacion_${conversacion_id}`).emit('mensaje_leido', {
          mensaje_id: id,
          usuario_id,
          conversacion_id
        });
      }

    } catch (error) {
      console.error('❌ Error en marcarComoLeido:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar mensaje como leído',
        error: error.message
      });
    }
  }

  /**
   * POST /api/chat/conversaciones/:id/participantes
   * Agregar participante a conversación
   */
  async agregarParticipante(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { usuario_id, rol } = req.body;
      const agregado_por = req.usuario.id;

      const participante = await chatService.agregarParticipante(
        id, 
        usuario_id, 
        agregado_por, 
        rol || 'PARTICIPANTE'
      );

      res.status(201).json({
        success: true,
        message: 'Participante agregado exitosamente',
        data: participante
      });

      // Emitir evento WebSocket
      if (req.io) {
        req.io.to(`conversacion_${id}`).emit('participante_agregado', {
          participante,
          conversacion_id: id,
          agregado_por
        });
      }

    } catch (error) {
      console.error('❌ Error en agregarParticipante:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar participante',
        error: error.message
      });
    }
  }

  /**
   * GET /api/chat/conversaciones/:id/estadisticas
   * Obtener estadísticas de conversación
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.usuario.id;

      // Verificar permisos
      const permisos = await chatService.verificarPermisos(id, usuario_id);
      if (!permisos.acceso) {
        return res.status(403).json({
          success: false,
          message: 'Sin permisos para acceder a esta conversación'
        });
      }

      const estadisticas = await chatService.obtenerEstadisticas(id);

      res.json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      console.error('❌ Error en obtenerEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }

  /**
   * GET /api/chat/conversaciones/:id/permisos
   * Verificar permisos de usuario en conversación
   */
  async verificarPermisos(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.usuario.id;

      const permisos = await chatService.verificarPermisos(id, usuario_id);

      res.json({
        success: true,
        data: permisos
      });

    } catch (error) {
      console.error('❌ Error en verificarPermisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  }

  /**
   * POST /api/chat/test
   * Endpoint de testing para desarrollo
   */
  async testChat(req, res) {
    try {
      const usuario_id = req.usuario.id;
      
      // Crear conversación de prueba
      const conversacionTest = await chatService.crearConversacion({
        auditoria_id: 1,
        titulo: 'Conversación de Prueba - Chat System',
        tipo: 'AUDITORIA',
        creado_por: usuario_id,
        participantes: []
      });

      // Enviar mensaje de prueba
      const mensajeTest = await chatService.enviarMensaje({
        conversacion_id: conversacionTest.id,
        usuario_id,
        contenido: '¡Sistema de chat funcionando correctamente! 🎉',
        tipo: 'TEXTO'
      });

      res.json({
        success: true,
        message: 'Test de chat ejecutado exitosamente',
        data: {
          conversacion: conversacionTest,
          mensaje: mensajeTest,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error en testChat:', error);
      res.status(500).json({
        success: false,
        message: 'Error en test de chat',
        error: error.message
      });
    }
  }
}

module.exports = new ChatController();