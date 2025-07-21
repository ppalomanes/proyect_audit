const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación para WebSockets
 */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      console.log('❌ WebSocket: No token provided');
      return next(new Error('No token provided'));
    }

    // Remover 'Bearer ' si está presente
    const cleanToken = token.replace('Bearer ', '');
    
    // Verificar token JWT
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Agregar información del usuario al socket
    socket.usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      nombre: decoded.nombre
    };
    
    console.log(`✅ WebSocket autenticado: Usuario ${decoded.id} (${decoded.email})`);
    next();
    
  } catch (error) {
    console.error('❌ Error autenticando WebSocket:', error.message);
    next(new Error('Authentication failed'));
  }
};

/**
 * Verificar permisos para unirse a sala de conversación
 */
const verifyConversationAccess = async (socket, conversacion_id) => {
  try {
    // Importar service dinámicamente para evitar dependencias circulares
    const chatService = require('./chat.service');
    
    const permisos = await chatService.verificarPermisos(conversacion_id, socket.usuario.id);
    
    if (!permisos.acceso) {
      console.log(`❌ Usuario ${socket.usuario.id} sin acceso a conversación ${conversacion_id}`);
      return false;
    }
    
    console.log(`✅ Usuario ${socket.usuario.id} verificado para conversación ${conversacion_id}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando acceso a conversación:', error);
    return false;
  }
};

/**
 * Gestionar salas de usuario por rol
 */
const joinUserRoleRoom = (socket) => {
  const userRoleRoom = `role_${socket.usuario.rol.toLowerCase()}`;
  socket.join(userRoleRoom);
  console.log(`👥 Usuario ${socket.usuario.id} unido a sala de rol: ${userRoleRoom}`);
};

/**
 * Gestionar sala personal del usuario
 */
const joinPersonalRoom = (socket) => {
  const personalRoom = `user_${socket.usuario.id}`;
  socket.join(personalRoom);
  console.log(`🏠 Usuario ${socket.usuario.id} unido a sala personal: ${personalRoom}`);
};

/**
 * Limpiar salas al desconectar
 */
const leaveAllRooms = (socket) => {
  const rooms = Array.from(socket.rooms);
  rooms.forEach(room => {
    if (room !== socket.id) {
      socket.leave(room);
      console.log(`👋 Usuario ${socket.usuario.id} salió de sala: ${room}`);
    }
  });
};

/**
 * Rate limiting para WebSockets
 */
const createWebSocketRateLimit = () => {
  const userActions = new Map();
  
  return (socket, action, limit = 10, windowMs = 60000) => {
    const userId = socket.usuario.id;
    const key = `${userId}_${action}`;
    const now = Date.now();
    
    if (!userActions.has(key)) {
      userActions.set(key, []);
    }
    
    const actions = userActions.get(key);
    
    // Limpiar acciones antiguas
    const recentActions = actions.filter(timestamp => now - timestamp < windowMs);
    
    if (recentActions.length >= limit) {
      socket.emit('rate_limit_exceeded', {
        action,
        limit,
        window: windowMs,
        retry_after: windowMs - (now - recentActions[0])
      });
      return false;
    }
    
    recentActions.push(now);
    userActions.set(key, recentActions);
    return true;
  };
};

module.exports = {
  authenticateSocket,
  verifyConversationAccess,
  joinUserRoleRoom,
  joinPersonalRoom,
  leaveAllRooms,
  createWebSocketRateLimit
};