import React, { useState } from 'react';
import { X, Users, Settings, Bell, Calendar, File, Activity, CheckSquare, MessageSquare } from 'lucide-react';

const RightSidebar = ({ selectedChannel, selectedWorkspace, onClose, isMobile = false }) => {
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Detalles', icon: Settings },
    { id: 'members', label: 'Miembros', icon: Users },
    { id: 'files', label: 'Archivos', icon: File },
    { id: 'activity', label: 'Actividad', icon: Activity }
  ];

  // Mock data para archivos
  const mockFiles = [
    {
      id: 1,
      name: 'Auditoria_Q1_2025.pdf',
      size: '2.4 MB',
      uploadedBy: 'Ana García',
      uploadedAt: new Date(Date.now() - 3600000),
      type: 'pdf'
    },
    {
      id: 2,
      name: 'Parque_Informatico.xlsx',
      size: '1.8 MB',
      uploadedBy: 'Carlos Ruiz',
      uploadedAt: new Date(Date.now() - 7200000),
      type: 'excel'
    },
    {
      id: 3,
      name: 'Screenshots_Equipos.zip',
      size: '15.2 MB',
      uploadedBy: 'María López',
      uploadedAt: new Date(Date.now() - 86400000),
      type: 'zip'
    },
    {
      id: 4,
      name: 'Validacion_Tecnica.docx',
      size: '854 KB',
      uploadedBy: 'Pedro Sánchez',
      uploadedAt: new Date(Date.now() - 172800000),
      type: 'doc'
    }
  ];

  // Mock data para actividad
  const mockActivity = [
    {
      id: 1,
      type: 'message',
      description: 'Ana García envió un mensaje',
      timestamp: new Date(Date.now() - 1800000),
      icon: MessageSquare,
      color: 'text-blue-500'
    },
    {
      id: 2,
      type: 'file',
      description: 'Carlos Ruiz subió Parque_Informatico.xlsx',
      timestamp: new Date(Date.now() - 7200000),
      icon: File,
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'member',
      description: 'María López se unió al canal',
      timestamp: new Date(Date.now() - 86400000),
      icon: Users,
      color: 'text-purple-500'
    },
    {
      id: 4,
      type: 'task',
      description: 'Pedro Sánchez completó validación técnica',
      timestamp: new Date(Date.now() - 172800000),
      icon: CheckSquare,
      color: 'text-orange-500'
    },
    {
      id: 5,
      type: 'meeting',
      description: 'Reunión de seguimiento programada',
      timestamp: new Date(Date.now() - 259200000),
      icon: Calendar,
      color: 'text-indigo-500'
    }
  ];

  // Participantes del workspace/canal
  const mockParticipants = [
    {
      id: 1,
      name: 'Ana García',
      avatar: 'AG',
      role: 'SUPERVISOR',
      online: true,
      lastSeen: new Date(),
      status: 'Disponible'
    },
    {
      id: 2,
      name: 'Carlos Ruiz',
      avatar: 'CR',
      role: 'PROVEEDOR',
      online: false,
      lastSeen: new Date(Date.now() - 3600000),
      status: 'En reunión'
    },
    {
      id: 3,
      name: 'María López',
      avatar: 'ML',
      role: 'AUDITOR_SENIOR',
      online: true,
      lastSeen: new Date(),
      status: 'Trabajando'
    },
    {
      id: 4,
      name: 'Pedro Sánchez',
      avatar: 'PS',
      role: 'AUDITOR_TECNICO',
      online: true,
      lastSeen: new Date(),
      status: 'Disponible'
    },
    {
      id: 5,
      name: 'Julia Morales',
      avatar: 'JM',
      role: 'AUDITOR',
      online: false,
      lastSeen: new Date(Date.now() - 86400000),
      status: 'Offline'
    }
  ];

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'doc': return '📝';
      case 'image': return '🖼️';
      case 'zip': return '🗂️';
      default: return '📎';
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'SUPERVISOR': 'badge badge-info',
      'AUDITOR_SENIOR': 'badge badge-success',
      'AUDITOR_TECNICO': 'badge badge-warning',
      'AUDITOR': 'badge badge-info',
      'PROVEEDOR': 'badge badge-error'
    };
    return colors[role] || 'badge';
  };

  const getStatusColor = (status, online) => {
    if (!online) return 'var(--text-muted)';
    switch (status) {
      case 'Disponible': return 'var(--success)';
      case 'En reunión': return 'var(--error)';
      case 'Trabajando': return 'var(--warning)';
      default: return 'var(--text-muted)';
    }
  };

  const currentItem = selectedChannel || selectedWorkspace;
  if (!currentItem) return null;

  return (
    <div className={`${isMobile ? 'w-full' : 'w-80'} flex flex-col h-full`} style={{ 
      backgroundColor: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-primary)'
    }}>
      
      {/* Header */}
      <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Panel de información
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-all duration-200"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg flex items-center justify-center space-x-1 transition-all duration-200`}
                style={{
                  backgroundColor: activeTab === tab.id
                    ? 'rgba(123, 104, 238, 0.15)'
                    : 'transparent',
                  color: activeTab === tab.id
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                    e.target.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="p-4 space-y-4">
            
            {/* Channel/Workspace Info */}
            <div className="text-center pb-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <div className="text-4xl mb-3">
                {selectedChannel ? selectedChannel.icono : selectedWorkspace?.icono}
              </div>
              <h4 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                {selectedChannel ? selectedChannel.nombre : selectedWorkspace?.nombre}
              </h4>
              {selectedChannel && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Canal en {selectedWorkspace?.nombre}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedChannel ? selectedChannel.participantes_online : selectedWorkspace?.participantes}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedChannel ? 'Online' : 'Miembros'}
                </div>
              </div>
              
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedChannel ? selectedChannel.mensajes_no_leidos : mockFiles.length}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedChannel ? 'No leídos' : 'Archivos'}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Tipo
                </label>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {selectedChannel ? selectedChannel.tipo : selectedWorkspace?.tipo}
                </p>
              </div>

              {selectedChannel && (
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Privacidad
                  </label>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {selectedChannel.privado ? '🔒 Privado' : '🌐 Público'}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Última actividad
                </label>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(selectedWorkspace?.ultima_actividad || new Date())}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <h5 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Acciones rápidas
              </h5>
              
              <div className="space-y-2">
                <button 
                  className="w-full text-left p-3 text-sm rounded-lg flex items-center space-x-3 transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <Bell size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Configurar notificaciones</span>
                </button>
                
                <button 
                  className="w-full text-left p-3 text-sm rounded-lg flex items-center space-x-3 transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Programar reunión</span>
                </button>
                
                <button 
                  className="w-full text-left p-3 text-sm rounded-lg flex items-center space-x-3 transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <File size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Compartir archivo</span>
                </button>
                
                <button 
                  className="w-full text-left p-3 text-sm rounded-lg flex items-center space-x-3 transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <CheckSquare size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Crear tarea</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Participantes ({mockParticipants.length})
              </h5>
              <button className="text-sm hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Invitar
              </button>
            </div>

            <div className="space-y-3">
              {mockParticipants.map(participant => (
                <div 
                  key={participant.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {participant.avatar}
                    </div>
                    {participant.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full" style={{
                        border: '2px solid var(--bg-primary)'
                      }}></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {participant.name}
                      </p>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRoleColor(participant.role)}`}>
                        {participant.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs`} style={{ color: getStatusColor(participant.status, participant.online) }}>
                        {participant.status}
                      </span>
                      {!participant.online && (
                        <>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatTimeAgo(participant.lastSeen)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Archivos compartidos
              </h5>
              <button className="text-sm hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {mockFiles.map(file => (
                <div 
                  key={file.id} 
                  className="p-3 rounded-lg cursor-pointer transition-all duration-200"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-quaternary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {file.size}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {file.uploadedBy}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(file.uploadedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="p-4 space-y-4">
            <h5 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Actividad reciente
            </h5>

            <div className="space-y-4">
              {mockActivity.map(activity => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${activity.color}`} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {activity.description}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RightSidebar;