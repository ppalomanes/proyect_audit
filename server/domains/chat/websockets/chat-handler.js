const chatService = require('../chat.service');
const roomManager = require('./room-manager');
const { 
  authenticateSocket, 
  verifyConversationAccess,
  joinUserRoleRoom,
  joinPersonalRoom,
  leaveAllRooms,
  createWebSocketRateLimit 
} = require('./socket-auth');

/**
 * Manejador principal de eventos WebSocket para Chat
 */
class ChatWebSocketHandler {
  constructor(io) {
    this.io = io;
    this.rateLimit = createWebSocketRateLimit();
    this.setupNamespace();
  }

  /**
   * Configurar namespace de chat
   */
  setupNamespace() {
    // Usar namespace específico para chat
    this.chatNamespace = this.io.of('/chat');
    
    // Middleware de autenticación
    this.chatNamespace.use(authenticateSocket);
    
    // Manejador de conexiones
    this.chatNamespace.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('🔌 Chat WebSocket namespace configurado en /chat');
  }

  /**
   * Manejar nueva conexión de socket
   */
  handleConnection(socket) {
    console.log(`🔗 Nueva conexión de chat: Usuario ${socket.usuario.id} (${socket.usuario.email})`);

    // Unir a salas básicas
    joinUserRoleRoom(socket);
    joinPersonalRoom(socket);

    // Emitir confirmación de conexión
    socket.emit('chat_connected', {
      user_id: socket.usuario.id,
      user_info: socket.usuario,
      server_time: new Date().toISOString(),
      features: {
        typing_indicators: true,
        file_upload: true,
        message_threading: true,
        real_time_notifications: true
      }
    });

    // Registrar manejadores de eventos
    this.registerEventHandlers(socket);

    // Manejar desconexión
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Registrar todos los manejadores de eventos
   */
  registerEventHandlers(socket) {
    // Eventos de conversación
    socket.on('join_conversation', (data) => this.handleJoinConversation(socket, data));
    socket.on('leave_conversation', (data) => this.handleLeaveConversation(socket, data));
    
    // Eventos de mensajería
    socket.on('send_message', (data) => this.handleSendMessage(socket, data));
    socket.on('message_read', (data) => this.handleMessageRead(socket, data));
    
    // Eventos de typing
    socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
    
    // Eventos de estado
    socket.on('get_conversation_status', (data) => this.handleGetConversationStatus(socket, data));
    socket.on('get_online_users', (data) => this.handleGetOnlineUsers(socket, data));
    
    // Eventos de error handling
    socket.on('error', (error) => this.handleSocketError(socket, error));
  }

  /**
   * Unirse a conversación
   */
  async handleJoinConversation(socket, data) {
    try {
      const { conversacion_id } = data;

      if (!conversacion_id) {
        socket.emit('error', { message: 'conversacion_id es requerido' });
        return;
      }

      // Rate limiting
      if (!this.rateLimit(socket, 'join_conversation', 20, 60000)) {
        return;
      }

      // Verificar permisos
      const hasAccess = await verifyConversationAccess(socket, conversacion_id);
      if (!hasAccess) {
        socket.emit('conversation_access_denied', { 
          conversacion_id,
          message: 'Sin permisos para acceder a esta conversación'
        });
        return;
      }

      // Unir a sala
      const roomName = roomManager.joinConversationRoom(socket, conversacion_id);
      
      // Obtener info de la conversación
      const conversationInfo = roomManager.getConversationInfo(conversacion_id);
      
      // Confirmar unión
      socket.emit('conversation_joined', {
        conversacion_id,
        room_name: roomName,
        connected_users: conversationInfo.connected_users,
        typing_users: conversationInfo.typing_users,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Usuario ${socket.usuario.id} se unió a conversación ${conversacion_id}`);

    } catch (error) {
      console.error('❌ Error en join_conversation:', error);
      socket.emit('error', { 
        event: 'join_conversation',
        message: 'Error al unirse a conversación',
        error: error.message
      });
    }
  }

  /**
   * Salir de conversación
   */
  handleLeaveConversation(socket, data) {
    try {
      const { conversacion_id } = data;

      if (!conversacion_id) {
        socket.emit('error', { message: 'conversacion_id es requerido' });
        return;
      }

      // Salir de sala
      const roomName = roomManager.leaveConversationRoom(socket, conversacion_id);
      
      // Confirmar salida
      socket.emit('conversation_left', {
        conversacion_id,
        room_name: roomName,
        timestamp: new Date().toISOString()
      });

      console.log(`👋 Usuario ${socket.usuario.id} salió de conversación ${conversacion_id}`);

    } catch (error) {
      console.error('❌ Error en leave_conversation:', error);
      socket.emit('error', { 
        event: 'leave_conversation',
        message: 'Error al salir de conversación',
        error: error.message
      });
    }
  }

  /**
   * Enviar mensaje via WebSocket
   */
  async handleSendMessage(socket, data) {
    try {
      const { conversacion_id, contenido, tipo, respuesta_a } = data;

      if (!conversacion_id || !contenido) {
        socket.emit('error', { message: 'conversacion_id y contenido son requeridos' });
        return;
      }

      // Rate limiting para mensajes
      if (!this.rateLimit(socket, 'send_message', 30, 60000)) {
        return;
      }

      // Enviar mensaje usando el service
      const mensaje = await chatService.enviarMensaje({
        conversacion_id,
        usuario_id: socket.usuario.id,
        contenido,
        tipo: tipo || 'TEXTO',
        respuesta_a
      });

      // Broadcast a todos en la conversación
      const roomName = `conversacion_${conversacion_id}`;
      this.chatNamespace.to(roomName).emit('message_received', {
        mensaje: {
          ...mensaje.toJSON(),
          usuario_info: {
            id: socket.usuario.id,
            nombre: socket.usuario.nombre,
            rol: socket.usuario.rol
          }
        },
        conversacion_id,
        timestamp: new Date().toISOString()
      });

      // Detener typing automáticamente
      roomManager.stopTyping(socket, conversacion_id);

      console.log(`📨 Mensaje WebSocket enviado en conversación ${conversacion_id} por usuario ${socket.usuario.id}`);

    } catch (error) {
      console.error('❌ Error en send_message:', error);
      socket.emit('message_send_failed', {
        conversacion_id: data.conversacion_id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Marcar mensaje como leído
   */
  async handleMessageRead(socket, data) {
    try {
      const { conversacion_id, mensaje_id } = data;

      if (!conversacion_id || !mensaje_id) {
        socket.emit('error', { message: 'conversacion_id y mensaje_id son requeridos' });
        return;
      }

      // Marcar como leído usando el service
      await chatService.marcarComoLeido(conversacion_id, socket.usuario.id, mensaje_id);

      // Broadcast a otros en la conversación
      const roomName = `conversacion_${conversacion_id}`;
      socket.to(roomName).emit('message_read_by_user', {
        mensaje_id,
        conversacion_id,
        user_id: socket.usuario.id,
        user_info: {
          id: socket.usuario.id,
          nombre: socket.usuario.nombre
        },
        timestamp: new Date().toISOString()
      });

      console.log(`👁️ Mensaje ${mensaje_id} marcado como leído por usuario ${socket.usuario.id}`);

    } catch (error) {
      console.error('❌ Error en message_read:', error);
      socket.emit('error', { 
        event: 'message_read',
        message: 'Error al marcar mensaje como leído',
        error: error.message
      });
    }
  }

  /**
   * Iniciar indicador de typing
   */
  handleTypingStart(socket, data) {
    try {
      const { conversacion_id } = data;

      if (!conversacion_id) {
        socket.emit('error', { message: 'conversacion_id es requerido' });
        return;
      }

      // Rate limiting para typing
      if (!this.rateLimit(socket, 'typing', 20, 10000)) {
        return;
      }

      roomManager.startTyping(socket, conversacion_id);

    } catch (error) {
      console.error('❌ Error en typing_start:', error);
    }
  }

  /**
   * Detener indicador de typing
   */
  handleTypingStop(socket, data) {
    try {
      const { conversacion_id } = data;

      if (!conversacion_id) {
        socket.emit('error', { message: 'conversacion_id es requerido' });
        return;
      }

      roomManager.stopTyping(socket, conversacion_id);

    } catch (error) {
      console.error('❌ Error en typing_stop:', error);
    }
  }

  /**
   * Obtener estado de conversación
   */
  handleGetConversationStatus(socket, data) {
    try {
      const { conversacion_id } = data;

      if (!conversacion_id) {
        socket.emit('error', { message: 'conversacion_id es requerido' });
        return;
      }

      const conversationInfo = roomManager.getConversationInfo(conversacion_id);
      
      socket.emit('conversation_status', conversationInfo);

    } catch (error) {
      console.error('❌ Error en get_conversation_status:', error);
      socket.emit('error', { 
        event: 'get_conversation_status',
        message: 'Error al obtener estado de conversación',
        error: error.message
      });
    }
  }

  /**
   * Obtener usuarios online
   */
  handleGetOnlineUsers(socket, data) {
    try {
      const { conversacion_id } = data;
      
      if (conversacion_id) {
        // Usuarios en conversación específica
        const users = roomManager.getConnectedUsersInConversation(conversacion_id);
        socket.emit('online_users', { conversacion_id, users });
      } else {
        // Estadísticas generales
        const stats = roomManager.getStats();
        socket.emit('online_stats', stats);
      }

    } catch (error) {
      console.error('❌ Error en get_online_users:', error);
      socket.emit('error', { 
        event: 'get_online_users',
        message: 'Error al obtener usuarios online',
        error: error.message
      });
    }
  }

  /**
   * Manejar errores de socket
   */
  handleSocketError(socket, error) {
    console.error(`❌ Error en socket ${socket.id}:`, error);
    
    socket.emit('error_acknowledged', {
      original_error: error,
      timestamp: new Date().toISOString(),
      user_id: socket.usuario.id
    });
  }

  /**
   * Manejar desconexión
   */
  handleDisconnection(socket) {
    console.log(`🔌 Usuario ${socket.usuario.id} desconectado del chat`);
    
    // Limpiar todas las salas y estados
    roomManager.cleanupSocket(socket);
    leaveAllRooms(socket);
    
    // Emitir evento de desconexión a salas relevantes
    this.chatNamespace.emit('user_disconnected', {
      user_id: socket.usuario.id,
      user_info: socket.usuario,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Obtener estadísticas del handler
   */
  getStats() {
    return {
      namespace: '/chat',
      connected_sockets: this.chatNamespace.sockets.size,
      room_manager_stats: roomManager.getStats(),
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    };
  }

  /**
   * Broadcast a todos los sockets conectados
   */
  broadcastToAll(event, data) {
    this.chatNamespace.emit(event, {
      ...data,
      broadcast_timestamp: new Date().toISOString()
    });
  }

  /**
   * Enviar mensaje a usuario específico
   */
  sendToUser(user_id, event, data) {
    this.chatNamespace.to(`user_${user_id}`).emit(event, {
      ...data,
      target_user: user_id,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ChatWebSocketHandler;