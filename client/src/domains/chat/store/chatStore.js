// /client/src/domains/chat/store/chatStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import io from 'socket.io-client';

// Configuración fija - usar servidor principal
const CHAT_BASE_URL = 'http://localhost:5000'; // Cambiar a puerto 5000 donde está el servidor

// Función simplificada para obtener URL del servidor
const getChatServerUrl = () => {
  console.log('🌐 Usando servidor principal para chat: puerto 5000');
  return CHAT_BASE_URL;
};

// Función para detectar servidor de chat disponible
const detectChatServer = async () => {
  // Usar configuración fija por simplicidad
  return CHAT_BASE_URL;
};

const useChatStore = create(
  subscribeWithSelector((set, get) => ({
    // === ESTADO DE CONEXIÓN ===
    socket: null,
    connected: false,
    connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
    
    // === WORKSPACES Y CANALES ===
    workspaces: [],
    selectedWorkspace: null,
    selectedChannel: null,
    currentView: 'chat', // 'chat', 'lista', 'tablero', 'documentos', 'actividad'
    
    // === MENSAJES ===
    messages: {}, // { channelId: [messages] }
    typingUsers: {}, // { channelId: [userIds] }
    unreadCounts: {}, // { channelId: count }
    
    // === USUARIO ACTUAL ===
    currentUser: null,
    
    // === ESTADO UI ===
    loading: false,
    error: null,
    chatSidebarOpen: true,
    
    // === ACTIONS ===
    
    /**
     * Inicializar conexión WebSocket con Chat Real
     */
    initializeSocket: async (user) => {
      const { socket, connected, connectionStatus } = get();
      
      // Evitar múltiples conexiones
      if (connected || connectionStatus === 'connecting') {
        console.log('⚠️ Ya hay una conexión activa o en proceso');
        return;
      }
      
      // Cerrar conexión existente si la hay
      if (socket) {
        socket.disconnect();
      }
      
      set({ 
        currentUser: user,
        connectionStatus: 'connecting',
        loading: true 
      });
      
      try {
        // Detectar servidor disponible
        const baseUrl = await detectChatServer();
        const socketUrl = `${baseUrl}/chat`;
        
        console.log(`🔌 Conectando WebSocket a: ${socketUrl}`);
        
        // Crear nueva conexión al namespace de chat real
        const newSocket = io(socketUrl, {
          auth: {
            token: localStorage.getItem('auth_token')
          },
          transports: ['websocket', 'polling'],
          upgrade: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000
        });
        
        // Configurar eventos del socket
        get().setupSocketEvents(newSocket);
        
        set({ socket: newSocket });
        
      } catch (error) {
        console.error('❌ Error inicializando socket:', error);
        set({ 
          connectionStatus: 'error',
          error: error.message,
          loading: false 
        });
      }
    },
    
    /**
     * Configurar eventos del WebSocket
     */
    setupSocketEvents: (socket) => {
      // Eventos de conexión
      socket.on('connect', () => {
        console.log('🔌 Socket conectado, esperando autenticación...');
        set({ 
          connectionStatus: 'connecting',
          error: null 
        });
      });
      
      // Conexión exitosa con autenticación
      socket.on('chat_connected', (data) => {
        console.log('✅ Conectado y autenticado al chat real:', data);
        set({ 
          connected: true,
          connectionStatus: 'connected',
          loading: false,
          error: null 
        });
        
        // Cargar workspaces desde servidor
        if (data.workspaces) {
          set({ workspaces: data.workspaces });
          
          // Seleccionar primer workspace y canal por defecto
          if (data.workspaces.length > 0) {
            get().selectWorkspace(data.workspaces[0]);
            if (data.workspaces[0].canales.length > 0) {
              get().selectChannel(data.workspaces[0].canales[0]);
            }
          }
        }
      });
      
      // Manejo de errores de conexión
      socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error);
        const errorMessage = error.message || 'Error de conexión al servidor';
        
        // Determinar tipo de error
        let userMessage = 'Error de conexión al servidor';
        if (errorMessage.includes('Token')) {
          userMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
        } else if (errorMessage.includes('ECONNREFUSED')) {
          userMessage = 'Servidor no disponible. Verifica que esté ejecutándose.';
        }
        
        set({ 
          connected: false,
          connectionStatus: 'error',
          error: userMessage,
          loading: false 
        });
      });
      
      // Desconexión
      socket.on('disconnect', (reason) => {
        console.log('🔌 Desconectado del chat:', reason);
        
        let userMessage = 'Desconectado del servidor';
        if (reason === 'io server disconnect') {
          userMessage = 'Desconectado por el servidor';
        } else if (reason === 'transport close') {
          userMessage = 'Conexión perdida';
        }
        
        set({ 
          connected: false,
          connectionStatus: 'disconnected',
          error: userMessage
        });
      });
      
      // Errores de autenticación
      socket.on('auth_error', (error) => {
        console.error('❌ Error de autenticación:', error);
        set({ 
          connected: false,
          connectionStatus: 'error',
          error: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
          loading: false 
        });
      });
      
      // Mensaje recibido
      socket.on('message_received', (data) => {
        get().addMessage(data.mensaje, data.conversacion_id);
      });
      
      // Usuario escribiendo
      socket.on('user_typing', (data) => {
        get().setUserTyping(data.conversacion_id, data.usuario, true);
      });
      
      // Usuario dejó de escribir
      socket.on('user_stopped_typing', (data) => {
        get().setUserTyping(data.conversacion_id, data.usuario, false);
      });
      
      // Mensaje leído
      socket.on('message_read_by_user', (data) => {
        get().markMessageAsRead(data.mensaje_id, data.user_id);
      });
    },
    
    /**
     * Cargar workspaces desde el servidor real
     */
    loadWorkspaces: async () => {
      try {
        set({ loading: true });
        
        const baseUrl = await detectChatServer();
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${baseUrl}/api/chat/workspaces`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Error cargando workspaces');
        }
        
        const data = await response.json();
        const workspaces = data.data || [];
        
        set({ 
          workspaces,
          loading: false 
        });
        
        // Seleccionar primer workspace y canal por defecto si hay
        if (workspaces.length > 0) {
          get().selectWorkspace(workspaces[0]);
          if (workspaces[0].canales.length > 0) {
            get().selectChannel(workspaces[0].canales[0]);
          }
        }
        
      } catch (error) {
        console.error('❌ Error cargando workspaces:', error);
        set({ 
          error: error.message,
          loading: false 
        });
      }
    },
    
    /**
     * Seleccionar workspace
     */
    selectWorkspace: (workspace) => {
      set({ selectedWorkspace: workspace });
    },
    
    /**
     * Seleccionar canal
     */
    selectChannel: (channel) => {
      const { socket } = get();
      
      set({ 
        selectedChannel: channel,
        currentView: 'chat' // Reset to chat view when changing channel
      });
      
      // Unirse al canal via WebSocket
      if (socket && channel.conversacion_id) {
        socket.emit('join_conversation', {
          conversacion_id: channel.conversacion_id
        });
      }
      
      // Cargar mensajes del canal
      get().loadChannelMessages(channel.id);
      
      // Marcar mensajes como leídos
      get().markChannelAsRead(channel.id);
    },
    
    /**
     * Cambiar vista del canal (chat, lista, documentos, etc.)
     */
    setCurrentView: (view) => {
      set({ currentView: view });
    },
    
    /**
     * Cargar mensajes de un canal desde el servidor
     */
    loadChannelMessages: async (channelId) => {
      const { selectedChannel } = get();
      
      if (!selectedChannel || !selectedChannel.conversacion_id) {
        return;
      }
      
      try {
        const baseUrl = await detectChatServer();
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${baseUrl}/api/chat/canales/${selectedChannel.conversacion_id}/mensajes?limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Error cargando mensajes');
        }
        
        const data = await response.json();
        const mensajes = data.data?.mensajes || [];
        
        set({ 
          messages: {
            ...get().messages,
            [channelId]: mensajes
          }
        });
        
      } catch (error) {
        console.error('❌ Error cargando mensajes:', error);
      }
    },
    
    /**
     * Enviar mensaje
     */
    sendMessage: async (contenido, tipo = 'TEXTO') => {
      const { socket, selectedChannel, currentUser } = get();
      
      if (!socket || !selectedChannel || !contenido.trim()) {
        return;
      }
      
      try {
        // Enviar via WebSocket (para tiempo real)
        socket.emit('send_message', {
          conversacion_id: selectedChannel.conversacion_id,
          contenido: contenido.trim(),
          tipo
        });
        
        // También enviar via REST API para persistencia
        const baseUrl = await detectChatServer();
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${baseUrl}/api/chat/canales/${selectedChannel.conversacion_id}/mensajes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contenido: contenido.trim(),
            tipo
          })
        });
        
        if (!response.ok) {
          throw new Error('Error enviando mensaje');
        }
        
      } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
      }
    },
    
    /**
     * Agregar mensaje recibido
     */
    addMessage: (mensaje, conversacion_id) => {
      const { selectedChannel, messages } = get();
      
      if (!selectedChannel || selectedChannel.conversacion_id !== conversacion_id) {
        // Incrementar contador de no leídos si no estamos en ese canal
        get().incrementUnreadCount(conversacion_id);
        return;
      }
      
      const channelId = selectedChannel.id;
      const currentMessages = messages[channelId] || [];
      
      set({
        messages: {
          ...messages,
          [channelId]: [...currentMessages, mensaje]
        }
      });
    },
    
    /**
     * Incrementar contador de mensajes no leídos
     */
    incrementUnreadCount: (conversacion_id) => {
      const { workspaces, unreadCounts } = get();
      
      for (const workspace of workspaces) {
        const channel = workspace.canales.find(c => c.conversacion_id === conversacion_id);
        if (channel) {
          const currentCount = unreadCounts[channel.id] || 0;
          set({
            unreadCounts: {
              ...unreadCounts,
              [channel.id]: currentCount + 1
            }
          });
          break;
        }
      }
    },
    
    /**
     * Marcar canal como leído
     */
    markChannelAsRead: (channelId) => {
      const { unreadCounts } = get();
      
      if (unreadCounts[channelId] > 0) {
        const newUnreadCounts = { ...unreadCounts };
        delete newUnreadCounts[channelId];
        
        set({ unreadCounts: newUnreadCounts });
      }
    },
    
    /**
     * Configurar estado de typing
     */
    setUserTyping: (conversacion_id, usuario, isTyping) => {
      const { typingUsers } = get();
      const currentTyping = typingUsers[conversacion_id] || [];
      
      let newTyping;
      if (isTyping) {
        newTyping = currentTyping.includes(usuario.id) 
          ? currentTyping 
          : [...currentTyping, usuario.id];
      } else {
        newTyping = currentTyping.filter(id => id !== usuario.id);
      }
      
      set({
        typingUsers: {
          ...typingUsers,
          [conversacion_id]: newTyping
        }
      });
    },
    
    /**
     * Enviar indicador de typing
     */
    startTyping: () => {
      const { socket, selectedChannel } = get();
      
      if (socket && selectedChannel) {
        socket.emit('typing_start', {
          conversacion_id: selectedChannel.conversacion_id
        });
      }
    },
    
    /**
     * Detener indicador de typing
     */
    stopTyping: () => {
      const { socket, selectedChannel } = get();
      
      if (socket && selectedChannel) {
        socket.emit('typing_stop', {
          conversacion_id: selectedChannel.conversacion_id
        });
      }
    },
    
    /**
     * Alternar sidebar del chat
     */
    toggleChatSidebar: () => {
      set({ chatSidebarOpen: !get().chatSidebarOpen });
    },
    
    /**
     * Limpiar estado y desconectar
     */
    disconnect: () => {
      const { socket } = get();
      
      if (socket) {
        socket.disconnect();
      }
      
      set({
        socket: null,
        connected: false,
        connectionStatus: 'disconnected',
        workspaces: [],
        selectedWorkspace: null,
        selectedChannel: null,
        messages: {},
        typingUsers: {},
        unreadCounts: {},
        currentUser: null,
        loading: false,
        error: null
      });
    },
    
    /**
     * Obtener mensajes del canal actual
     */
    getCurrentChannelMessages: () => {
      const { selectedChannel, messages } = get();
      
      if (!selectedChannel) return [];
      
      return messages[selectedChannel.id] || [];
    },
    
    /**
     * Obtener usuarios escribiendo en canal actual
     */
    getCurrentChannelTypingUsers: () => {
      const { selectedChannel, typingUsers, currentUser } = get();
      
      if (!selectedChannel) return [];
      
      const typing = typingUsers[selectedChannel.conversacion_id] || [];
      
      // Filtrar al usuario actual
      return typing.filter(userId => userId !== currentUser?.id);
    },
    
    /**
     * Obtener total de mensajes no leídos
     */
    getTotalUnreadCount: () => {
      const { unreadCounts } = get();
      
      return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
    },

    /**
     * Marcar mensaje como leído
     */
    markMessageAsRead: (mensaje_id, user_id) => {
      // Implementar lógica para marcar mensaje específico como leído
      console.log(`Mensaje ${mensaje_id} leído por usuario ${user_id}`);
    },
    
    /**
     * Reconectar manualmente
     */
    reconnect: () => {
      const { currentUser, socket } = get();
      
      console.log('🔄 Reconectando manualmente...');
      
      // Limpiar conexión actual
      if (socket) {
        socket.disconnect();
      }
      
      set({ 
        socket: null,
        connected: false,
        connectionStatus: 'disconnected',
        error: null,
        loading: true
      });
      
      // Intentar nueva conexión después de un breve delay
      setTimeout(() => {
        get().initializeSocket(currentUser);
      }, 1000);
    },
    
    /**
     * Obtener estado de conexión formateado para UI
     */
    getConnectionInfo: () => {
      const { connected, connectionStatus, error } = get();
      
      if (connected) {
        return {
          status: 'connected',
          message: 'Conectado',
          color: 'green',
          showReconnect: false
        };
      }
      
      if (connectionStatus === 'connecting') {
        return {
          status: 'connecting',
          message: 'Conectando...',
          color: 'blue',
          showReconnect: false
        };
      }
      
      if (connectionStatus === 'error') {
        return {
          status: 'error',
          message: error || 'Error de conexión',
          color: 'red',
          showReconnect: true
        };
      }
      
      return {
        status: 'disconnected',
        message: 'Desconectado',
        color: 'gray',
        showReconnect: true
      };
    }
  }))
);

export default useChatStore;
