import React, { useState, useEffect } from 'react';
import { Plus, Hash, Lock, Users, ChevronDown, ChevronRight, Search } from 'lucide-react';

const WorkspaceManager = ({ 
  onWorkspaceSelect, 
  onChannelSelect, 
  selectedWorkspace, 
  selectedChannel 
}) => {
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(new Set([1]));
  const [searchTerm, setSearchTerm] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data estructura ClickUp
  const mockWorkspaces = [
    {
      id: 1,
      nombre: 'Auditoría Proveedor XYZ - Q1 2025',
      tipo: 'AUDITORIA',
      icono: '📋',
      color: '#7C3AED',
      canales: [
        {
          id: 1,
          nombre: 'General',
          icono: '💬',
          tipo: 'GENERAL',
          mensajes_no_leidos: 5,
          privado: false,
          pestanas_habilitadas: {
            canal: true,
            publicaciones: true,
            lista: true,
            documentos: true,
            actividad: true
          },
          participantes_online: 3
        },
        {
          id: 2,
          nombre: 'Equipo Auditores',
          icono: '👥',
          tipo: 'EQUIPO',
          mensajes_no_leidos: 2,
          privado: true,
          pestanas_habilitadas: {
            canal: true,
            lista: true,
            actividad: true
          },
          participantes_online: 2
        },
        {
          id: 3,
          nombre: 'Comunicación Proveedor',
          icono: '🏢',
          tipo: 'PROVEEDOR',
          mensajes_no_leidos: 0,
          privado: false,
          pestanas_habilitadas: {
            canal: true,
            publicaciones: true,
            documentos: true
          },
          participantes_online: 1
        },
        {
          id: 4,
          nombre: 'Documentos',
          icono: '📄',
          tipo: 'DOCUMENTOS',
          mensajes_no_leidos: 0,
          privado: false,
          pestanas_habilitadas: {
            canal: true,
            lista: true,
            tablero: true,
            documentos: true
          },
          participantes_online: 4
        }
      ],
      participantes: 8,
      ultima_actividad: new Date(Date.now() - 1800000)
    },
    {
      id: 2,
      nombre: 'Espacio del Equipo [ES]',
      tipo: 'EQUIPO',
      icono: '👥',
      color: '#EC4899',
      canales: [
        {
          id: 5,
          nombre: 'Team Chat',
          icono: '💬',
          tipo: 'GENERAL',
          mensajes_no_leidos: 0,
          privado: false,
          pestanas_habilitadas: {
            canal: true,
            publicaciones: true,
            actividad: true
          },
          participantes_online: 5
        },
        {
          id: 6,
          nombre: 'Proyectos',
          icono: '📊',
          tipo: 'PROYECTOS',
          mensajes_no_leidos: 1,
          privado: false,
          pestanas_habilitadas: {
            canal: true,
            lista: true,
            tablero: true,
            calendario: true
          },
          participantes_online: 3
        }
      ],
      participantes: 12,
      ultima_actividad: new Date(Date.now() - 3600000)
    },
    {
      id: 3,
      nombre: 'Consultas Técnicas',
      tipo: 'CONSULTA',
      icono: '🔧',
      color: '#10B981',
      canales: [
        {
          id: 7,
          nombre: 'Hardware',
          icono: '💻',
          tipo: 'TECNICO',
          mensajes_no_leidos: 3,
          privado: false,
          pestanas_habilitadas: {
            canal: true,
            lista: true,
            documentos: true
          },
          participantes_online: 2
        },
        {
          id: 8,
          nombre: 'Software',
          icono: '⚙️',
          tipo: 'TECNICO',
          mensajes_no_leidos: 0,
          privado: false,
          pestanas_habilitadas: {
            canal: true,
            lista: true
          },
          participantes_online: 1
        }
      ],
      participantes: 6,
      ultima_actividad: new Date(Date.now() - 7200000)
    }
  ];

  const mockDirectMessages = [
    {
      id: 101,
      nombre: 'Carlos Ruiz',
      avatar: 'CR',
      rol: 'PROVEEDOR',
      online: false,
      mensajes_no_leidos: 1,
      ultimo_mensaje: 'Confirmamos recepción de documentos',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: 102,
      nombre: 'Pedro Sánchez',
      avatar: 'PS',
      rol: 'AUDITOR',
      online: true,
      mensajes_no_leidos: 0,
      ultimo_mensaje: 'Revisé el informe, todo correcto',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: 103,
      nombre: 'Ana García',
      avatar: 'AG',
      rol: 'SUPERVISOR',
      online: true,
      mensajes_no_leidos: 0,
      ultimo_mensaje: 'Reunión programada para mañana',
      timestamp: new Date(Date.now() - 7200000)
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setWorkspaces(mockWorkspaces);
      setLoading(false);
      
      // Seleccionar primer workspace por defecto
      if (mockWorkspaces.length > 0 && !selectedWorkspace) {
        onWorkspaceSelect(mockWorkspaces[0]);
        if (mockWorkspaces[0].canales.length > 0) {
          onChannelSelect(mockWorkspaces[0].canales[0]);
        }
      }
    }, 1000);
  }, []);

  const toggleWorkspace = (workspaceId) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId);
    } else {
      newExpanded.add(workspaceId);
    }
    setExpandedWorkspaces(newExpanded);
  };

  const handleWorkspaceClick = (workspace) => {
    onWorkspaceSelect(workspace);
    if (!expandedWorkspaces.has(workspace.id)) {
      toggleWorkspace(workspace.id);
    }
  };

  const handleChannelClick = (channel, workspace) => {
    onWorkspaceSelect(workspace);
    onChannelSelect(channel);
  };

  const getTotalUnreadMessages = () => {
    const workspaceUnread = workspaces.reduce((total, workspace) => {
      return total + workspace.canales.reduce((channelTotal, channel) => {
        return channelTotal + channel.mensajes_no_leidos;
      }, 0);
    }, 0);
    
    const dmUnread = mockDirectMessages.reduce((total, dm) => {
      return total + dm.mensajes_no_leidos;
    }, 0);
    
    return workspaceUnread + dmUnread;
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    if (diff < 60000) return 'ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.canales.some(channel => 
      channel.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredDirectMessages = mockDirectMessages.filter(dm =>
    dm.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-80 p-4 flex flex-col h-full" style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-primary)'
      }}>
        <div className="animate-pulse">
          <div className="h-8 rounded mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex flex-col h-full" style={{ 
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-primary)'
    }}>
      
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Colaboración
          </h2>
          {getTotalUnreadMessages() > 0 && (
            <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {getTotalUnreadMessages()}
            </div>
          )}
        </div>
        
        {/* Búsqueda */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar espacios y canales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Espacios de Trabajo */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Espacios de Trabajo
            </h3>
            <button className="p-1 transition-colors duration-200 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1">
            {filteredWorkspaces.map(workspace => {
              const isExpanded = expandedWorkspaces.has(workspace.id);
              const isSelected = selectedWorkspace?.id === workspace.id;
              
              return (
                <div key={workspace.id} className="space-y-1">
                  {/* Workspace Header */}
                  <div
                    onClick={() => handleWorkspaceClick(workspace)}
                    className={`flex items-center space-x-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(123, 104, 238, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'var(--bg-tertiary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWorkspace(workspace.id);
                      }}
                      className="p-0.5 rounded transition-colors duration-200"
                      style={{ 
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-quaternary)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                    
                    <div className="text-lg">{workspace.icono}</div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {workspace.nombre}
                      </p>
                      <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{workspace.participantes} miembros</span>
                        <span>•</span>
                        <span>{formatTime(workspace.ultima_actividad)}</span>
                      </div>
                    </div>

                    {/* Unread badge for workspace */}
                    {workspace.canales.some(c => c.mensajes_no_leidos > 0) && (
                      <div className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center">
                        {workspace.canales.reduce((sum, c) => sum + c.mensajes_no_leidos, 0)}
                      </div>
                    )}
                  </div>

                  {/* Channels */}
                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {workspace.canales.map(channel => {
                        const isChannelSelected = selectedChannel?.id === channel.id;
                        
                        return (
                          <div
                            key={channel.id}
                            onClick={() => handleChannelClick(channel, workspace)}
                            className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200`}
                            style={{
                              backgroundColor: isChannelSelected ? 'rgba(123, 104, 238, 0.15)' : 'transparent',
                              color: isChannelSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isChannelSelected) {
                                e.target.style.backgroundColor = 'var(--bg-tertiary)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isChannelSelected) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <div className="text-sm">{channel.icono}</div>
                            
                            {channel.privado ? (
                              <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                            ) : (
                              <Hash size={12} style={{ color: 'var(--text-muted)' }} />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{channel.nombre}</p>
                            </div>

                            {/* Channel indicators */}
                            <div className="flex items-center space-x-1">
                              {channel.participantes_online > 0 && (
                                <div className="flex items-center space-x-0.5">
                                  <Users size={10} className="text-green-500" />
                                  <span className="text-xs text-green-500">
                                    {channel.participantes_online}
                                  </span>
                                </div>
                              )}
                              
                              {channel.mensajes_no_leidos > 0 && (
                                <div className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                                  {channel.mensajes_no_leidos}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensajes Directos */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Mensajes Directos
            </h3>
            <button className="p-1 transition-colors duration-200 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1">
            {filteredDirectMessages.map(dm => (
              <div
                key={dm.id}
                className="flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {dm.avatar}
                  </div>
                  {dm.online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full" style={{
                      border: '2px solid var(--bg-primary)'
                    }}></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {dm.nombre}
                    </p>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(dm.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {dm.ultimo_mensaje}
                  </p>
                </div>

                {dm.mensajes_no_leidos > 0 && (
                  <div className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center">
                    {dm.mensajes_no_leidos}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer con estado */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Conectado</span>
          </div>
          <div>{workspaces.length} espacios</div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceManager;