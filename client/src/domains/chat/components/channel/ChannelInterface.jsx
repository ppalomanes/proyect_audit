import React, { useState, useEffect } from 'react';
import { Hash, Lock, Users, Settings, MoreVertical, Pin, Bell } from 'lucide-react';
import ChannelTabs from './ChannelTabs';
import ThreadedMessaging from '../messaging/ThreadedMessaging';

const ChannelInterface = ({ 
  selectedChannel, 
  selectedWorkspace, 
  onToggleRightPanel, 
  showRightPanel 
}) => {
  const [activeTab, setActiveTab] = useState('canal');
  const [channelDetails, setChannelDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar detalles del canal cuando cambie
  useEffect(() => {
    if (selectedChannel) {
      setLoading(true);
      // Simular carga de detalles del canal
      setTimeout(() => {
        setChannelDetails({
          ...selectedChannel,
          descripcion: getChannelDescription(selectedChannel.tipo),
          tema_actual: getChannelTopic(selectedChannel.tipo),
          configuracion: {
            notificaciones: true,
            threads_habilitados: true,
            archivos_permitidos: true,
            mensajes_programados: selectedChannel.tipo !== 'DOCUMENTOS'
          }
        });
        setLoading(false);
        // Reset a la pestaña por defecto al cambiar canal
        setActiveTab('canal');
      }, 500);
    }
  }, [selectedChannel]);

  const getChannelDescription = (tipo) => {
    const descriptions = {
      'GENERAL': 'Canal principal para comunicación general del proyecto',
      'EQUIPO': 'Espacio privado para coordinación del equipo auditor',
      'PROVEEDOR': 'Comunicación directa con el proveedor auditado',
      'DOCUMENTOS': 'Gestión y revisión de documentación técnica',
      'TECNICO': 'Discusiones técnicas especializadas',
      'PROYECTOS': 'Seguimiento y planificación de proyectos'
    };
    return descriptions[tipo] || 'Canal de comunicación especializado';
  };

  const getChannelTopic = (tipo) => {
    const topics = {
      'GENERAL': '📋 Auditoría Q1 2025 en progreso - Fase: Validación de documentos',
      'EQUIPO': '👥 Reunión diaria 09:00 AM - Sprint actual: Etapa 3/8',
      'PROVEEDOR': '🏢 Contacto directo: carlos.ruiz@proveedor.com | Tel: +57-1-xxx-xxxx',
      'DOCUMENTOS': '📄 13 tipos de documentos requeridos - 8/13 completados',
      'TECNICO': '🔧 Issues técnicos y consultas de hardware/software',
      'PROYECTOS': '📊 Q1 2025: 3 auditorías activas | Q2 2025: 5 programadas'
    };
    return topics[tipo] || '💬 Canal activo para colaboración';
  };

  const getAvailableTabs = () => {
    if (!channelDetails?.pestanas_habilitadas) return ['canal'];
    
    const allTabs = [
      { id: 'canal', label: 'Canal', icon: '💬', enabled: true },
      { id: 'publicaciones', label: 'Publicaciones', icon: '📝', enabled: channelDetails.pestanas_habilitadas.publicaciones },
      { id: 'lista', label: 'Lista', icon: '📋', enabled: channelDetails.pestanas_habilitadas.lista },
      { id: 'tablero', label: 'Tablero', icon: '📊', enabled: channelDetails.pestanas_habilitadas.tablero },
      { id: 'calendario', label: 'Calendario', icon: '📅', enabled: channelDetails.pestanas_habilitadas.calendario },
      { id: 'documentos', label: 'Documentos', icon: '📄', enabled: channelDetails.pestanas_habilitadas.documentos },
      { id: 'actividad', label: 'Actividad', icon: '📈', enabled: channelDetails.pestanas_habilitadas.actividad }
    ];

    return allTabs.filter(tab => tab.enabled);
  };

  const formatParticipants = () => {
    if (!selectedChannel) return '0 participantes';
    
    const online = selectedChannel.participantes_online || 0;
    const total = selectedWorkspace?.participantes || 0;
    
    return `${online} online • ${total} miembros`;
  };

  if (!selectedChannel) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="text-6xl mb-6">💬</div>
          <h3 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Selecciona un canal
          </h3>
          <p className="max-w-md" style={{ color: 'var(--text-muted)' }}>
            Elige un canal o espacio de trabajo de la barra lateral para comenzar a colaborar con tu equipo
          </p>
          <div className="mt-6 p-4 rounded-lg max-w-md" style={{ backgroundColor: 'var(--info-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--info)' }}>
              💡 <strong>Tip:</strong> Usa el buscador para encontrar canales específicos rápidamente
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>Cargando canal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Channel Header */}
      <div className="z-10" style={{ 
        borderBottom: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        
        {/* Main Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Left: Channel Info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="text-2xl">{selectedChannel.icono}</div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  {selectedChannel.privado ? (
                    <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <Hash size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                  
                  <h1 className="text-xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {selectedChannel.nombre}
                  </h1>
                  
                  {selectedChannel.mensajes_no_leidos > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {selectedChannel.mensajes_no_leidos}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Users size={14} />
                    <span>{formatParticipants()}</span>
                  </div>
                  
                  {channelDetails?.tema_actual && (
                    <div className="text-sm truncate max-w-96" style={{ color: 'var(--text-secondary)' }}>
                      <Pin size={12} className="inline mr-1" />
                      {channelDetails.tema_actual}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 ml-4">
              
              {/* Notifications */}
              <button
                className={`p-2 rounded-lg transition-all duration-200`}
                style={{
                  backgroundColor: channelDetails?.configuracion?.notificaciones 
                    ? 'rgba(123, 104, 238, 0.15)' 
                    : 'transparent',
                  color: channelDetails?.configuracion?.notificaciones 
                    ? 'var(--accent-primary)' 
                    : 'var(--text-muted)'
                }}
                title="Notificaciones del canal"
                onMouseEnter={(e) => {
                  if (!channelDetails?.configuracion?.notificaciones) {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!channelDetails?.configuracion?.notificaciones) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Bell size={18} />
              </button>

              {/* Channel Settings */}
              <button
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: 'var(--text-muted)' }}
                title="Configuración del canal"
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  e.target.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'var(--text-muted)';
                }}
              >
                <Settings size={18} />
              </button>

              {/* Toggle Right Panel */}
              <button
                onClick={onToggleRightPanel}
                className={`p-2 rounded-lg transition-all duration-200`}
                style={{
                  backgroundColor: showRightPanel
                    ? 'rgba(123, 104, 238, 0.15)'
                    : 'transparent',
                  color: showRightPanel
                    ? 'var(--accent-primary)'
                    : 'var(--text-muted)'
                }}
                title="Panel de información"
                onMouseEnter={(e) => {
                  if (!showRightPanel) {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showRightPanel) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
          
          {/* Channel Description */}
          {channelDetails?.descripcion && (
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {channelDetails.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <ChannelTabs
          tabs={getAvailableTabs()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          channel={selectedChannel}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'canal' && (
          <ThreadedMessaging
            channel={selectedChannel}
            workspace={selectedWorkspace}
            threadsEnabled={channelDetails?.configuracion?.threads_habilitados}
          />
        )}
        
        {activeTab === 'publicaciones' && (
          <PublicationsTab
            channel={selectedChannel}
            workspace={selectedWorkspace}
          />
        )}
        
        {activeTab === 'lista' && (
          <ListTab
            channel={selectedChannel}
            workspace={selectedWorkspace}
          />
        )}
        
        {activeTab === 'tablero' && (
          <BoardTab
            channel={selectedChannel}
            workspace={selectedWorkspace}
          />
        )}
        
        {activeTab === 'calendario' && (
          <CalendarTab
            channel={selectedChannel}
            workspace={selectedWorkspace}
          />
        )}
        
        {activeTab === 'documentos' && (
          <DocumentsTab
            channel={selectedChannel}
            workspace={selectedWorkspace}
          />
        )}
        
        {activeTab === 'actividad' && (
          <ActivityTab
            channel={selectedChannel}
            workspace={selectedWorkspace}
          />
        )}
      </div>
    </div>
  );
};

// Placeholder components para las pestañas (se implementarán después)
const PublicationsTab = ({ channel }) => (
  <div className="p-6 text-center">
    <div className="text-4xl mb-4">📝</div>
    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
      Publicaciones
    </h3>
    <p style={{ color: 'var(--text-muted)' }}>
      Vista de publicaciones para el canal {channel.nombre}
    </p>
  </div>
);

const ListTab = ({ channel }) => (
  <div className="p-6 text-center">
    <div className="text-4xl mb-4">📋</div>
    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
      Lista de Tareas
    </h3>
    <p style={{ color: 'var(--text-muted)' }}>
      Gestión de tareas para {channel.nombre}
    </p>
  </div>
);

const BoardTab = ({ channel }) => (
  <div className="p-6 text-center">
    <div className="text-4xl mb-4">📊</div>
    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
      Tablero Kanban
    </h3>
    <p style={{ color: 'var(--text-muted)' }}>
      Vista de tablero para {channel.nombre}
    </p>
  </div>
);

const CalendarTab = ({ channel }) => (
  <div className="p-6 text-center">
    <div className="text-4xl mb-4">📅</div>
    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
      Calendario
    </h3>
    <p style={{ color: 'var(--text-muted)' }}>
      Eventos y fechas importantes para {channel.nombre}
    </p>
  </div>
);

const DocumentsTab = ({ channel }) => (
  <div className="p-6 text-center">
    <div className="text-4xl mb-4">📄</div>
    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
      Documentos
    </h3>
    <p style={{ color: 'var(--text-muted)' }}>
      Archivos y documentos compartidos en {channel.nombre}
    </p>
  </div>
);

const ActivityTab = ({ channel }) => (
  <div className="p-6 text-center">
    <div className="text-4xl mb-4">📈</div>
    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
      Actividad
    </h3>
    <p style={{ color: 'var(--text-muted)' }}>
      Historial de actividad en {channel.nombre}
    </p>
  </div>
);

export default ChannelInterface;