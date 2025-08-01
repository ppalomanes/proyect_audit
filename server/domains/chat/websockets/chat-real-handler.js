// /server/domains/chat/websockets/chat-real-handler.js
const jwt = require('jsonwebtoken');
const chatRealService = require('../chat-real.service');

class ChatRealHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // usuario_id -> { socket_id, user_info, workspaces }
    this.userSockets = new Map(); // socket_id -> usuario_id
    this.workspaceRooms = new Map(); // workspace_id -> Set(socket_ids)
    
    this.setupNamespace();
  }

  setupNamespace() {
    const chatNamespace = this.io.of('/chat');
    
    // Middleware de autenticación para WebSocket
    chatNamespace.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('⚠️ WebSocket: Token faltante');
          return next(new Error('Token de autenticación requerido'));
        }

        // Verificar JWT
        const jwtSecret = process.env.JWT_SECRET || 'portal_auditorias_super_secret_key_2025';
        const decoded = jwt.verify(token, jwtSecret);
        
        console.log('✅ WebSocket: Token válido para usuario:', decoded.email || decoded.userId);
        
        // Usar datos del token directamente
        const user = {
          id: decoded.userId || decoded.id,
          email: decoded.email,
          nombre: decoded.nombre || decoded.email?.split('@')[0] || 'Usuario',
          rol: decoded.rol || 'USER'
        };

        socket.user = user;
        next();

      } catch (error) {
        console.error('❌ Error en autenticación WebSocket:', error.message);
        next(new Error(`Token inválido: ${error.message}`));
      }
    });

    // Manejo de conexiones
    chatNamespace.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  async handleConnection(socket) {
    const user = socket.user;
    console.log(`✅ Usuario conectado al chat: ${user.nombre} (ID: ${user.id})`);

    try {
      // Registrar usuario conectado
      this.connectedUsers.set(user.id, {
        socket_id: socket.id,
        user_info: user,
        connected_at: new Date(),
        last_activity: new Date()
      });
      
      this.userSockets.set(socket.id, user.id);

      // Cargar workspaces del usuario y unirse a las salas
      const workspaces = await chatRealService.getUserWorkspaces(user.id);
      
      for (const workspace of workspaces) {
        const roomName = `workspace_${workspace.id}`;
        socket.join(roomName);
        
        if (!this.workspaceRooms.has(workspace.id)) {
          this.workspaceRooms.set(workspace.id, new Set());
        }
        this.workspaceRooms.get(workspace.id).add(socket.id);
      }

      // Emitir evento de conexión exitosa
      socket.emit('chat_connected', {
        user: user,
        workspaces: workspaces,
        server_time: new Date()
      });

      // Notificar a otros usuarios en los workspaces que el usuario se conectó
      this.broadcastUserStatus(user.id, 'online', workspaces);

      // === MANEJO DE EVENTOS ===

      // Unirse a conversación específica
      socket.on('join_conversation', async (data) => {
        await this.handleJoinConversation(socket, data);
      });

      // Enviar mensaje
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Indicadores de typing
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Marcar mensaje como leído
      socket.on('mark_message_read', async (data) => {
        await this.handleMarkMessageRead(socket, data);
      });

      // Desconexión
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

    } catch (error) {
      console.error('❌ Error en handleConnection:', error);
      socket.emit('connection_error', {
        message: 'Error estableciendo conexión'
      });
    }
  }

  async handleJoinConversation(socket, data) {
    try {
      const { conversacion_id } = data;
      const user = socket.user;

      // TODO: Validar que conversacion_id corresponde a un canal válido
      // Por ahora, simplemente unir a la sala de conversación
      const roomName = `conversation_${conversacion_id}`;
      socket.join(roomName);

      socket.emit('conversation_joined', {
        conversacion_id,
        room: roomName
      });

    } catch (error) {
      console.error('❌ Error en join_conversation:', error);
      socket.emit('error', {
        event: 'join_conversation',
        message: 'Error uniéndose a la conversación'
      });
    }
  }

  async handleSendMessage(socket, data) {
    try {
      const { conversacion_id, contenido, tipo = 'TEXTO' } = data;
      const user = socket.user;

      // TODO: Mapear conversacion_id a canal_id
      // Por ahora, asumir que conversacion_id === canal_id
      const canal_id = conversacion_id;

      // Enviar mensaje usando el servicio
      const mensaje = await chatRealService.enviarMensaje(
        canal_id,
        user.id,
        contenido,
        tipo
      );

      // Emitir mensaje a todos los usuarios en la conversación
      const roomName = `conversation_${conversacion_id}`;
      socket.to(roomName).emit('message_received', {
        mensaje: mensaje,
        conversacion_id
      });

      // Confirmar al remitente
      socket.emit('message_sent', {
        mensaje: mensaje,
        conversacion_id
      });

      // Actualizar actividad del usuario
      this.updateUserActivity(user.id);

    } catch (error) {
      console.error('❌ Error en send_message:', error);
      socket.emit('error', {
        event: 'send_message',
        message: error.message || 'Error enviando mensaje'
      });
    }
  }

  handleTypingStart(socket, data) {
    try {
      const { conversacion_id } = data;
      const user = socket.user;

      const roomName = `conversation_${conversacion_id}`;
      socket.to(roomName).emit('user_typing', {
        usuario: {
          id: user.id,
          nombre: user.nombre
        },
        conversacion_id
      });

      this.updateUserActivity(user.id);

    } catch (error) {
      console.error('❌ Error en typing_start:', error);
    }
  }

  handleTypingStop(socket, data) {
    try {
      const { conversacion_id } = data;
      const user = socket.user;

      const roomName = `conversation_${conversacion_id}`;
      socket.to(roomName).emit('user_stopped_typing', {
        usuario: {
          id: user.id,
          nombre: user.nombre
        },
        conversacion_id
      });

    } catch (error) {
      console.error('❌ Error en typing_stop:', error);
    }
  }

  async handleMarkMessageRead(socket, data) {
    try {
      const { mensaje_id } = data;
      const user = socket.user;

      await chatRealService.marcarMensajesComoLeidos([mensaje_id], user.id);

      // Notificar a otros usuarios que el mensaje fue leído
      const roomName = `conversation_${data.conversacion_id}`;
      socket.to(roomName).emit('message_read_by_user', {
        mensaje_id,
        user_id: user.id,
        user_name: user.nombre
      });

      this.updateUserActivity(user.id);

    } catch (error) {
      console.error('❌ Error en mark_message_read:', error);
    }
  }

  handleDisconnect(socket) {
    const user_id = this.userSockets.get(socket.id);
    
    if (user_id) {
      const userInfo = this.connectedUsers.get(user_id);
      console.log(`🔌 Usuario desconectado del chat: ${userInfo?.user_info?.nombre} (ID: ${user_id})`);

      // Limpiar salas de workspace
      for (const [workspace_id, sockets] of this.workspaceRooms.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.workspaceRooms.delete(workspace_id);
          }
        }
      }

      // Notificar desconexión a otros usuarios
      if (userInfo?.workspaces) {
        this.broadcastUserStatus(user_id, 'offline', userInfo.workspaces);
      }

      // Limpiar registros
      this.connectedUsers.delete(user_id);
      this.userSockets.delete(socket.id);
    }
  }

  broadcastUserStatus(user_id, status, workspaces) {
    try {
      const userInfo = this.connectedUsers.get(user_id);
      
      for (const workspace of workspaces) {
        const roomName = `workspace_${workspace.id}`;
        this.io.of('/chat').to(roomName).emit('user_status_changed', {
          user_id,
          user_name: userInfo?.user_info?.nombre,
          status, // 'online' | 'offline'
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('❌ Error en broadcastUserStatus:', error);
    }
  }

  updateUserActivity(user_id) {
    const userInfo = this.connectedUsers.get(user_id);
    if (userInfo) {
      userInfo.last_activity = new Date();
    }
  }

  // Métodos utilitarios

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getWorkspaceUsersCount(workspace_id) {
    return this.workspaceRooms.get(workspace_id)?.size || 0;
  }

  getUsersInWorkspace(workspace_id) {
    const socketIds = this.workspaceRooms.get(workspace_id);
    if (!socketIds) return [];

    const users = [];
    for (const socketId of socketIds) {
      const userId = this.userSockets.get(socketId);
      const userInfo = this.connectedUsers.get(userId);
      if (userInfo) {
        users.push({
          id: userId,
          nombre: userInfo.user_info.nombre,
          avatar: userInfo.user_info.avatar,
          connected_at: userInfo.connected_at,
          last_activity: userInfo.last_activity
        });
      }
    }

    return users;
  }

  // Broadcast a usuarios específicos
  sendToUser(user_id, event, data) {
    const userInfo = this.connectedUsers.get(user_id);
    if (userInfo) {
      this.io.of('/chat').to(userInfo.socket_id).emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast a workspace
  sendToWorkspace(workspace_id, event, data) {
    const roomName = `workspace_${workspace_id}`;
    this.io.of('/chat').to(roomName).emit(event, data);
  }
}

module.exports = ChatRealHandler;