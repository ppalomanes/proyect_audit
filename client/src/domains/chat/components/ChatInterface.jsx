import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Smile, 
  Users, 
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Circle
} from 'lucide-react';

const ChatInterface = () => {
  const [selectedConversacion, setSelectedConversacion] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuariosConectados, setUsuariosConectados] = useState([]);
  const [usuariosEscribiendo, setUsuariosEscribiendo] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Datos mock para desarrollo
  const mockConversaciones = [
    {
      id: 1,
      titulo: 'Auditoría Proveedor XYZ - Q1 2025',
      auditoria_id: 123,
      tipo: 'AUDITORIA',
      estado: 'ACTIVA',
      mensajes_no_leidos: 3,
      ultimo_mensaje_fecha: new Date(),
      ultimo_mensaje: {
        contenido: 'Necesitamos revisar los documentos de infraestructura',
        usuario: 'Ana García'
      },
      mi_rol: 'PARTICIPANTE',
      participantes: [
        { id: 1, nombre: 'Ana García', rol: 'AUDITOR', online: true },
        { id: 2, nombre: 'Carlos Ruiz', rol: 'PROVEEDOR', online: false },
        { id: 3, nombre: 'María López', rol: 'SUPERVISOR', online: true }
      ]
    },
    {
      id: 2,
      titulo: 'Consulta Técnica - Equipos Bogotá',
      auditoria_id: 124,
      tipo: 'CONSULTA',
      estado: 'ACTIVA',
      mensajes_no_leidos: 0,
      ultimo_mensaje_fecha: new Date(Date.now() - 86400000),
      ultimo_mensaje: {
        contenido: 'Documentación aprobada',
        usuario: 'Sistema'
      },
      mi_rol: 'MODERADOR',
      participantes: [
        { id: 1, nombre: 'Ana García', rol: 'AUDITOR', online: true },
        { id: 4, nombre: 'Pedro Sánchez', rol: 'PROVEEDOR', online: true }
      ]
    }
  ];

  const mockMensajes = [
    {
      id: 1,
      conversacion_id: 1,
      usuario_id: 1,
      usuario_nombre: 'Ana García',
      usuario_rol: 'AUDITOR',
      contenido: 'Buenos días, iniciamos la auditoría técnica para el Q1 2025.',
      tipo: 'TEXTO',
      created_at: new Date(Date.now() - 7200000),
      estado: 'LEIDO'
    },
    {
      id: 2,
      conversacion_id: 1,
      usuario_id: 2,
      usuario_nombre: 'Carlos Ruiz',
      usuario_rol: 'PROVEEDOR',
      contenido: '¡Buenos días Ana! Confirmamos recepción. Tenemos listos todos los documentos.',
      tipo: 'TEXTO',
      created_at: new Date(Date.now() - 5400000),
      estado: 'LEIDO'
    }
  ];

  useEffect(() => {
    setConversaciones(mockConversaciones);
    if (mockConversaciones.length > 0) {
      setSelectedConversacion(mockConversaciones[0]);
      setMensajes(mockMensajes.filter(m => m.conversacion_id === mockConversaciones[0].id));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!nuevoMensaje.trim() || !selectedConversacion) return;

    const mensaje = {
      id: Date.now(),
      conversacion_id: selectedConversacion.id,
      usuario_id: 1,
      usuario_nombre: 'Ana García',
      usuario_rol: 'AUDITOR',
      contenido: nuevoMensaje.trim(),
      tipo: 'TEXTO',
      created_at: new Date(),
      estado: 'ENVIADO'
    };

    setMensajes(prev => [...prev, mensaje]);
    setNuevoMensaje('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (fecha) => {
    const now = new Date();
    const messageDate = new Date(fecha);
    const diffTime = Math.abs(now - messageDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `${diffDays} días`;
    
    return messageDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'AUDITOR': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300';
      case 'PROVEEDOR': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300';
      case 'SUPERVISOR': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300';
      case 'SISTEMA': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const conversacionesFiltradas = conversaciones.filter(conv =>
    conv.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Sidebar - Lista de Conversaciones */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-purple-500" />
              Mensajería
            </h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversacionesFiltradas.map((conversacion) => (
            <div
              key={conversacion.id}
              onClick={() => {
                setSelectedConversacion(conversacion);
                setMensajes(mockMensajes.filter(m => m.conversacion_id === conversacion.id));
              }}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedConversacion?.id === conversacion.id 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-r-2 border-r-purple-500' 
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                  {conversacion.titulo}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(conversacion.ultimo_mensaje_fecha)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                {conversacion.ultimo_mensaje?.contenido || 'Sin mensajes'}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  conversacion.tipo === 'AUDITORIA' 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>
                  {conversacion.tipo}
                </span>
                
                <div className="flex items-center">
                  <Users className="w-3 h-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {conversacion.participantes?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversacion ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selectedConversacion.titulo}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Auditoría #{selectedConversacion.auditoria_id}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mensajes.map((mensaje) => {
                const isOwn = mensaje.usuario_id === 1;
                
                return (
                  <div
                    key={mensaje.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'ml-4' : 'mr-4'}`}>
                      {!isOwn && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {mensaje.usuario_nombre}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getRolColor(mensaje.usuario_rol)}`}>
                            {mensaje.usuario_rol}
                          </span>
                        </div>
                      )}
                      <div className={`rounded-lg px-4 py-2 ${
                        isOwn 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm">{mensaje.contenido}</p>
                      </div>
                      <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(mensaje.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-end space-x-3">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    rows="1"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                             resize-none transition-colors"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!nuevoMensaje.trim() || isLoading}
                  className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Elige una conversación de la lista para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;