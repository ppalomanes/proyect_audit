/**
 * Gestión de salas de WebSocket para conversaciones
 */
class RoomManager {
  constructor() {
    this.conversationRooms = new Map(); // conversacion_id -> Set(socket_ids)
    this.userSockets = new Map();       // user_id -> Set(socket_ids)
    this.socketUsers = new Map();       // socket_id -> user_info
    this.typingUsers = new Map();       // conversacion_id -> Set(user_ids)
  }

  /**
   * Agregar socket a sala de conversación
   */
  joinConversationRoom(socket, conversacion_id) {
    const roomName = `conversacion_${conversacion_id}`;
    socket.join(roomName);

    // Actualizar mapas de tracking
    if (!this.conversationRooms.has(conversacion_id)) {
      this.conversationRooms.set(conversacion_id, new Set());
    }
    this.conversationRooms.get(conversacion_id).add(socket.id);

    if (!this.userSockets.has(socket.usuario.id)) {
      this.userSockets.set(socket.usuario.id, new Set());
    }
    this.userSockets.get(socket.usuario.id).add(socket.id);

    this.socketUsers.set(socket.id, {
      user_id: socket.usuario.id,
      user_info: socket.usuario,
      joined_at: new Date()
    });

    console.log(`🏠 Usuario ${socket.usuario.id} se unió a conversación ${conversacion_id}`);
    
    // Notificar a otros usuarios en la sala
    socket.to(roomName).emit('user_joined_conversation', {
      user_id: socket.usuario.id,
      user_info: {
        id: socket.usuario.id,
        nombre: socket.usuario.nombre,
        rol: socket.usuario.rol
      },
      conversacion_id,
      timestamp: new Date().toISOString()
    });

    return roomName;
  }

  /**
   * Remover socket de sala de conversación
   */
  leaveConversationRoom(socket, conversacion_id) {
    const roomName = `conversacion_${conversacion_id}`;
    socket.leave(roomName);

    // Actualizar mapas de tracking
    if (this.conversationRooms.has(conversacion_id)) {
      this.conversationRooms.get(conversacion_id).delete(socket.id);
      if (this.conversationRooms.get(conversacion_id).size === 0) {
        this.conversationRooms.delete(conversacion_id);
      }
    }

    if (this.userSockets.has(socket.usuario.id)) {
      this.userSockets.get(socket.usuario.id).delete(socket.id);
      if (this.userSockets.get(socket.usuario.id).size === 0) {
        this.userSockets.delete(socket.usuario.id);
      }
    }

    this.socketUsers.delete(socket.id);

    // Limpiar estado de typing
    this.stopTyping(socket, conversacion_id);

    console.log(`👋 Usuario ${socket.usuario.id} salió de conversación ${conversacion_id}`);
    
    // Notificar a otros usuarios
    socket.to(roomName).emit('user_left_conversation', {
      user_id: socket.usuario.id,
      conversacion_id,
      timestamp: new Date().toISOString()
    });

    return roomName;
  }

  /**
   * Obtener usuarios conectados en conversación
   */
  getConnectedUsersInConversation(conversacion_id) {
    if (!this.conversationRooms.has(conversacion_id)) {
      return [];
    }

    const socketIds = this.conversationRooms.get(conversacion_id);
    const users = [];

    for (const socketId of socketIds) {
      const userInfo = this.socketUsers.get(socketId);
      if (userInfo) {
        users.push({
          user_id: userInfo.user_id,
          user_info: userInfo.user_info,
          connected_since: userInfo.joined_at
        });
      }
    }

    return users;
  }

  /**
   * Verificar si usuario está conectado
   */
  isUserConnected(user_id) {
    return this.userSockets.has(user_id) && this.userSockets.get(user_id).size > 0;
  }

  /**
   * Obtener todas las conversaciones donde está conectado el usuario
   */
  getUserActiveConversations(user_id) {
    const conversations = [];
    
    for (const [conversacion_id, socketIds] of this.conversationRooms) {
      for (const socketId of socketIds) {
        const userInfo = this.socketUsers.get(socketId);
        if (userInfo && userInfo.user_id === user_id) {
          conversations.push(conversacion_id);
          break;
        }
      }
    }

    return conversations;
  }

  /**
   * Gestionar estado de "typing" (escribiendo)
   */
  startTyping(socket, conversacion_id) {
    if (!this.typingUsers.has(conversacion_id)) {
      this.typingUsers.set(conversacion_id, new Set());
    }

    const wasTyping = this.typingUsers.get(conversacion_id).has(socket.usuario.id);
    this.typingUsers.get(conversacion_id).add(socket.usuario.id);

    // Solo emitir si no estaba escribiendo antes
    if (!wasTyping) {
      const roomName = `conversacion_${conversacion_id}`;
      socket.to(roomName).emit('user_typing_start', {
        user_id: socket.usuario.id,
        user_info: {
          id: socket.usuario.id,
          nombre: socket.usuario.nombre
        },
        conversacion_id,
        timestamp: new Date().toISOString()
      });

      console.log(`⌨️ Usuario ${socket.usuario.id} comenzó a escribir en conversación ${conversacion_id}`);
    }

    // Auto-stop typing después de 10 segundos
    setTimeout(() => {
      this.stopTyping(socket, conversacion_id);
    }, 10000);
  }

  /**
   * Detener estado de "typing"
   */
  stopTyping(socket, conversacion_id) {
    if (!this.typingUsers.has(conversacion_id)) {
      return;
    }

    const wasTyping = this.typingUsers.get(conversacion_id).has(socket.usuario.id);
    this.typingUsers.get(conversacion_id).delete(socket.usuario.id);

    if (this.typingUsers.get(conversacion_id).size === 0) {
      this.typingUsers.delete(conversacion_id);
    }

    // Solo emitir si estaba escribiendo
    if (wasTyping) {
      const roomName = `conversacion_${conversacion_id}`;
      socket.to(roomName).emit('user_typing_stop', {
        user_id: socket.usuario.id,
        conversacion_id,
        timestamp: new Date().toISOString()
      });

      console.log(`✋ Usuario ${socket.usuario.id} dejó de escribir en conversación ${conversacion_id}`);
    }
  }

  /**
   * Obtener usuarios que están escribiendo en conversación
   */
  getTypingUsers(conversacion_id) {
    if (!this.typingUsers.has(conversacion_id)) {
      return [];
    }

    return Array.from(this.typingUsers.get(conversacion_id));
  }

  /**
   * Limpiar todas las referencias de un socket
   */
  cleanupSocket(socket) {
    const userInfo = this.socketUsers.get(socket.id);
    
    if (userInfo) {
      const user_id = userInfo.user_id;

      // Remover de userSockets
      if (this.userSockets.has(user_id)) {
        this.userSockets.get(user_id).delete(socket.id);
        if (this.userSockets.get(user_id).size === 0) {
          this.userSockets.delete(user_id);
        }
      }

      // Remover de conversationRooms
      for (const [conversacion_id, socketIds] of this.conversationRooms) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          this.stopTyping(socket, conversacion_id);
          
          if (socketIds.size === 0) {
            this.conversationRooms.delete(conversacion_id);
          }
        }
      }

      // Remover de socketUsers
      this.socketUsers.delete(socket.id);

      console.log(`🧹 Limpieza completa del socket para usuario ${user_id}`);
    }
  }

  /**
   * Obtener estadísticas del room manager
   */
  getStats() {
    return {
      total_conversations: this.conversationRooms.size,
      total_connected_users: this.userSockets.size,
      total_active_sockets: this.socketUsers.size,
      conversations_with_typing: this.typingUsers.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Broadcast a todos los usuarios conectados en una conversación
   */
  broadcastToConversation(conversacion_id, event, data, excludeUserId = null) {
    if (!this.conversationRooms.has(conversacion_id)) {
      return 0;
    }

    const socketIds = this.conversationRooms.get(conversacion_id);
    let sentCount = 0;

    for (const socketId of socketIds) {
      const userInfo = this.socketUsers.get(socketId);
      if (userInfo && userInfo.user_id !== excludeUserId) {
        // Obtener socket instance desde el servidor Socket.IO
        // Esto se maneja desde el chat-handler principal
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Obtener información detallada de una conversación
   */
  getConversationInfo(conversacion_id) {
    return {
      conversacion_id,
      connected_users: this.getConnectedUsersInConversation(conversacion_id),
      typing_users: this.getTypingUsers(conversacion_id),
      total_connected: this.conversationRooms.get(conversacion_id)?.size || 0,
      room_name: `conversacion_${conversacion_id}`
    };
  }
}

// Singleton instance
const roomManager = new RoomManager();

module.exports = roomManager;