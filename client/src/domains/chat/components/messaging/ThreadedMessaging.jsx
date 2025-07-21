import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Reply } from 'lucide-react';

const ThreadedMessaging = ({ channel, workspace, threadsEnabled = true }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Mock data con mensajes estructurados
  const mockMessages = {
    1: [
      {
        id: 1,
        contenido: 'Buenos días equipo! 🌅 Iniciamos la auditoría técnica Q1 2025. Por favor confirmen recepción de la documentación inicial.',
        autor: {
          id: 1,
          nombre: 'Ana García',
          avatar: 'AG',
          rol: 'SUPERVISOR',
          online: true
        },
        timestamp: new Date(Date.now() - 7200000),
        canal_id: 1,
        reacciones: {
          '👍': [2, 3, 4],
          '✅': [2, 4],
          '🚀': [3]
        },
        thread_count: 3,
        es_thread_principal: true,
        prioridad: 'ALTA',
        etiquetas: ['inicio-auditoria', 'q1-2025']
      },
      {
        id: 2,
        contenido: 'Confirmado! ✅ Tenemos todos los documentos listos. El parque informático está actualizado según el pliego técnico.',
        autor: {
          id: 2,
          nombre: 'Carlos Ruiz',
          avatar: 'CR',
          rol: 'PROVEEDOR',
          online: false
        },
        timestamp: new Date(Date.now() - 6900000),
        canal_id: 1,
        reacciones: {
          '👏': [1, 3],
          '✅': [1]
        },
        archivos: [
          {
            id: 'f1',
            nombre: 'Parque_Informatico_Q1_2025.xlsx',
            tamano: '2.4 MB',
            tipo: 'excel'
          }
        ]
      },
      {
        id: 3,
        contenido: 'Update: Primera fase completada ✨ Procesados 245 registros, score promedio 87.5%. Detectamos 3 inconsistencias menores que requieren revisión.',
        autor: {
          id: 4,
          nombre: 'Pedro Sánchez',
          avatar: 'PS',
          rol: 'AUDITOR_TECNICO',
          online: true
        },
        timestamp: new Date(Date.now() - 1800000),
        canal_id: 1,
        reacciones: {
          '📈': [1, 2, 3],
          '👌': [1]
        },
        prioridad: 'MEDIA',
        etiquetas: ['update', 'fase-1'],
        archivos: [
          {
            id: 'f2',
            nombre: 'Reporte_Fase1_Inconsistencias.pdf',
            tamano: '856 KB',
            tipo: 'pdf'
          }
        ]
      }
    ],
    2: [
      {
        id: 6,
        contenido: 'Reunión de sincronización en 15 minutos 🕐 Agenda: revisar hallazgos técnicos y planificar visita presencial.',
        autor: {
          id: 1,
          nombre: 'Ana García',
          avatar: 'AG',
          rol: 'SUPERVISOR',
          online: true
        },
        timestamp: new Date(Date.now() - 900000),
        canal_id: 2,
        prioridad: 'URGENTE',
        etiquetas: ['reunion', 'planificacion']
      }
    ]
  };

  useEffect(() => {
    if (channel) {
      setLoading(true);
      setTimeout(() => {
        setMessages(mockMessages[channel.id] || []);
        setLoading(false);
        scrollToBottom();
      }, 800);
    }
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      contenido: newMessage,
      autor: {
        id: 'current_user',
        nombre: 'Usuario Actual',
        avatar: 'UA',
        rol: 'AUDITOR',
        online: true
      },
      timestamp: new Date(),
      canal_id: channel.id,
      reacciones: {},
      thread_count: 0,
      es_thread_principal: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleReaction = (messageId, emoji) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reacciones };
        const currentUserId = 'current_user';
        
        if (reactions[emoji]) {
          if (reactions[emoji].includes(currentUserId)) {
            reactions[emoji] = reactions[emoji].filter(id => id !== currentUserId);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji].push(currentUserId);
          }
        } else {
          reactions[emoji] = [currentUserId];
        }
        
        return { ...msg, reacciones: reactions };
      }
      return msg;
    }));
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getRoleColor = (rol) => {
    const colors = {
      'SUPERVISOR': 'badge badge-info',
      'AUDITOR_SENIOR': 'badge badge-success',
      'AUDITOR_TECNICO': 'badge badge-warning',
      'AUDITOR': 'badge badge-info',
      'PROVEEDOR': 'badge badge-error'
    };
    return colors[rol] || 'badge';
  };

  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'image': return '🖼️';
      case 'zip': return '🗂️';
      default: return '📎';
    }
  };

  const getPriorityStyle = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE':
        return { backgroundColor: 'var(--error-bg)', color: 'var(--error)' };
      case 'ALTA':
        return { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' };
      case 'MEDIA':
        return { backgroundColor: 'var(--info-bg)', color: 'var(--info)' };
      default:
        return { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => {
          const isThreadParent = message.es_thread_principal && message.thread_count > 0;
          
          return (
            <div
              key={message.id}
              className="group p-3 rounded-lg transition-all duration-200"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex space-x-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {message.autor.avatar}
                  </div>
                  {message.autor.online && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                      style={{ border: '2px solid var(--bg-primary)' }}
                    ></div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {message.autor.nombre}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRoleColor(message.autor.rol)}`}>
                      {message.autor.rol}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  {/* Priority & Tags */}
                  {(message.prioridad || message.etiquetas) && (
                    <div className="flex items-center space-x-2 mb-2">
                      {message.prioridad && (
                        <span 
                          className="px-2 py-0.5 text-xs rounded-full font-medium"
                          style={getPriorityStyle(message.prioridad)}
                        >
                          {message.prioridad}
                        </span>
                      )}
                      {message.etiquetas?.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="prose prose-sm max-w-none">
                    <p className="mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {message.contenido}
                    </p>
                  </div>

                  {/* Attachments */}
                  {message.archivos && message.archivos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.archivos.map(archivo => (
                        <div 
                          key={archivo.id} 
                          className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                          style={{ backgroundColor: 'var(--bg-tertiary)' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-quaternary)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-tertiary)';
                          }}
                        >
                          <div className="text-2xl">{getFileIcon(archivo.tipo)}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {archivo.nombre}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {archivo.tamano}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  {Object.keys(message.reacciones).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {Object.entries(message.reacciones).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all duration-200`}
                          style={{
                            backgroundColor: users.includes('current_user')
                              ? 'rgba(123, 104, 238, 0.15)'
                              : 'var(--bg-tertiary)',
                            color: users.includes('current_user')
                              ? 'var(--accent-primary)'
                              : 'var(--text-secondary)',
                            border: users.includes('current_user')
                              ? '1px solid var(--accent-primary)'
                              : '1px solid var(--border-primary)'
                          }}
                        >
                          <span>{emoji}</span>
                          <span className="text-xs font-medium">{users.length}</span>
                        </button>
                      ))}
                      
                      {/* Add Reaction */}
                      <div className="relative group">
                        <button 
                          className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all duration-200"
                          style={{ 
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-quaternary)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-tertiary)';
                          }}
                        >
                          <Smile size={14} />
                        </button>
                        
                        {/* Quick Reactions Popup */}
                        <div 
                          className="absolute bottom-full left-0 mb-2 hidden group-hover:block rounded-lg shadow-lg p-2 z-10"
                          style={{ 
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-primary)'
                          }}
                        >
                          <div className="flex space-x-1">
                            {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="p-1 rounded transition-all duration-200"
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thread Link */}
                  {isThreadParent && threadsEnabled && (
                    <button
                      onClick={() => setSelectedThread(message)}
                      className="flex items-center space-x-2 mt-3 text-sm font-medium hover:underline"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <Reply size={14} />
                      <span>{message.thread_count} respuestas</span>
                    </button>
                  )}
                </div>

                {/* Message Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-1 rounded transition-all duration-200"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-muted)';
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4" style={{ 
        borderTop: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          
          {/* Attachment Button */}
          <button
            type="button"
            className="p-2 transition-all duration-200"
            style={{ color: 'var(--text-muted)' }}
            title="Adjuntar archivo"
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--text-muted)';
            }}
          >
            <Paperclip size={20} />
          </button>
          
          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Mensaje a ${channel.nombre}...`}
              className="input-field resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {/* Input Actions */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <button
                type="button"
                className="p-1 transition-all duration-200"
                style={{ color: 'var(--text-muted)' }}
                title="Emojis"
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--text-muted)';
                }}
              >
                <Smile size={16} />
              </button>
            </div>
          </div>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar mensaje"
          >
            <Send size={18} />
          </button>
        </form>
        
        {/* Input Helper Text */}
        <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <strong>Enter</strong> para enviar, <strong>Shift + Enter</strong> para nueva línea
        </div>
      </div>

      {/* Thread Panel (if selected) */}
      {selectedThread && (
        <div 
          className="absolute inset-y-0 right-0 w-96 shadow-lg z-20"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderLeft: '1px solid var(--border-primary)'
          }}
        >
          <div className="h-full flex flex-col">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Thread: {selectedThread.contenido.substring(0, 50)}...
                </h3>
                <button
                  onClick={() => setSelectedThread(null)}
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--text-muted)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                Panel de thread en desarrollo...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadedMessaging;