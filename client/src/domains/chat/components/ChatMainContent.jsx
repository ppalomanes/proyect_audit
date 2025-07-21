import React, { useState, useEffect } from 'react';
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react';

const ChatMainContent = ({ 
  selectedView, 
  selectedChannel, 
  selectedConversation, 
  onViewChange, 
  onToggleRightPanel, 
  showRightPanel 
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Mock messages data
  const mockMessages = {
    1: [ // Auditoría Proveedor XYZ
      {
        id: 1,
        content: 'Buenos días, iniciamos la auditoría técnica para el Q1 2025. Por favor confirmen recepción de documentos.',
        author: { id: 1, name: 'Ana García', avatar: 'AG', role: 'AUDITOR' },
        timestamp: new Date(Date.now() - 3600000),
        reactions: { '👍': [2, 3], '✅': [2] },
        thread_count: 2,
        is_thread_parent: true
      },
      {
        id: 2,
        content: 'Confirmamos recepción. Tenemos listos todos los documentos solicitados para revisión.',
        author: { id: 2, name: 'Carlos Ruiz', avatar: 'CR', role: 'PROVEEDOR' },
        timestamp: new Date(Date.now() - 3000000),
        reply_to: 1
      },
      {
        id: 3,
        content: 'Perfecto. Procedan con la carga en el sistema ETL. El enlace está en la sección de documentos.',
        author: { id: 3, name: 'María López', avatar: 'ML', role: 'SUPERVISOR' },
        timestamp: new Date(Date.now() - 1800000)
      }
    ],
    2: [ // Espacio del Equipo
      {
        id: 4,
        content: 'Reunión de sincronización programada para las 15:00',
        author: { id: 3, name: 'María López', avatar: 'ML', role: 'SUPERVISOR' },
        timestamp: new Date(Date.now() - 7200000)
      }
    ]
  };

  // Load messages when channel/conversation changes
  useEffect(() => {
    if (selectedChannel) {
      setMessages(mockMessages[selectedChannel.id] || []);
    } else if (selectedConversation) {
      setMessages([
        {
          id: 5,
          content: selectedConversation.lastMessage,
          author: selectedConversation.user,
          timestamp: selectedConversation.timestamp
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedChannel, selectedConversation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      content: message,
      author: { id: 1, name: 'Usuario Actual', avatar: 'UC', role: 'AUDITOR' },
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getChannelTitle = () => {
    if (selectedChannel) return selectedChannel.name;
    if (selectedConversation) return selectedConversation.user.name;
    return 'Selecciona un canal';
  };

  const views = [
    { id: 'canal', label: 'Canal', icon: '💬' },
    { id: 'respuestas', label: 'Respuestas', icon: '🧵' },
    { id: 'publicaciones', label: 'Publicaciones', icon: '📝' },
    { id: 'actividad', label: 'Actividad', icon: '📊' },
    { id: 'borradores', label: 'Borradores', icon: '✏️' }
  ];

  if (!selectedChannel && !selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selecciona un canal o conversación
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Elige un canal de la lista para comenzar a chatear
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      
      {/* Header del canal */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-xl">
              {selectedChannel?.icon || '💬'}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {getChannelTitle()}
              </h2>
              {selectedChannel && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedChannel.members} miembros
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleRightPanel}
              className={`p-2 rounded-lg transition-colors ${
                showRightPanel 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Tabs de vistas */}
        <div className="flex space-x-1 mt-4">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                selectedView === view.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{view.icon}</span>
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="flex space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {msg.author.avatar}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  {msg.author.name}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {msg.author.role}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-gray-900 dark:text-white">{msg.content}</p>
                
                {/* Reactions */}
                {msg.reactions && (
                  <div className="flex space-x-1 mt-2">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-xs flex items-center space-x-1 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                      >
                        <span>{emoji}</span>
                        <span className="text-blue-600 dark:text-blue-400">{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Thread indicator */}
                {msg.thread_count > 0 && (
                  <button className="text-blue-600 dark:text-blue-400 text-xs mt-2 hover:underline">
                    {msg.thread_count} respuestas
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <Paperclip size={18} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Mensaje a ${getChannelTitle()}...`}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <Smile size={18} />
          </button>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatMainContent;