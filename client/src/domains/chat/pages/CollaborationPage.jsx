import React, { useState, useEffect } from 'react';
import WorkspaceManager from '../components/workspace/WorkspaceManager';
import ChannelInterface from '../components/channel/ChannelInterface';
import RightSidebar from '../components/sidebar/RightSidebar';

const CollaborationPage = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Simular conexión WebSocket
    const timer = setTimeout(() => {
      setIsConnected(true);
    }, 1000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  const handleWorkspaceSelect = (workspace) => {
    setSelectedWorkspace(workspace);
    // En mobile, cerrar sidebar al seleccionar
    if (isMobile) {
      setShowRightPanel(false);
    }
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    // En mobile, cerrar sidebar al seleccionar canal
    if (isMobile) {
      setShowRightPanel(false);
    }
  };

  const toggleRightPanel = () => {
    setShowRightPanel(!showRightPanel);
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Colaboración', href: '/chat' }
    ];
    
    if (selectedWorkspace) {
      breadcrumbs.push({
        label: selectedWorkspace.nombre,
        href: `/chat/workspace/${selectedWorkspace.id}`
      });
    }
    
    if (selectedChannel) {
      breadcrumbs.push({
        label: selectedChannel.nombre,
        href: `/chat/workspace/${selectedWorkspace?.id}/channel/${selectedChannel.id}`
      });
    }
    
    return breadcrumbs;
  };

  return (
    <div className="flex flex-col h-full">
      
      {/* Header con estado de conexión */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              💬 Colaboración ClickUp-Style
            </h1>
            
            {/* Breadcrumbs */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {getBreadcrumbs().map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--text-muted)' }}>
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`text-sm ${
                      index === getBreadcrumbs().length - 1
                        ? 'font-medium'
                        : 'hover:opacity-70 cursor-pointer'
                    }`} style={{
                      color: index === getBreadcrumbs().length - 1 
                        ? 'var(--accent-primary)' 
                        : 'var(--text-muted)'
                    }}>
                      {crumb.label}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          
          {/* Estado conexión y controles */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isConnected ? 'Conectado' : 'Conectando...'}
              </span>
            </div>

            {/* Mobile Menu Toggle */}
            {isMobile && (
              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className="p-2 rounded-lg transition-all duration-200 hover:opacity-80"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Layout 3 columnas */}
      <div className="flex-1 min-h-0">
        <div className="h-full rounded-xl shadow-lg overflow-hidden bg-primary border-primary" style={{ 
          backgroundColor: 'var(--bg-primary) !important',
          border: '1px solid var(--border-primary) !important'
        }}>
          <div className="flex h-full">
            
            {/* Left Sidebar - WorkspaceManager */}
            <div className={`${
              isMobile 
                ? `absolute inset-y-0 left-0 z-30 transform transition-transform duration-300 ${
                    showRightPanel ? 'translate-x-0' : '-translate-x-full'
                  }`
                : 'relative'
            }`}>
              <WorkspaceManager
                onWorkspaceSelect={handleWorkspaceSelect}
                onChannelSelect={handleChannelSelect}
                selectedWorkspace={selectedWorkspace}
                selectedChannel={selectedChannel}
              />
            </div>

            {/* Mobile Overlay */}
            {isMobile && showRightPanel && (
              <div 
                className="absolute inset-0 z-20"
                style={{ backgroundColor: 'var(--overlay)' }}
                onClick={() => setShowRightPanel(false)}
              />
            )}

            {/* Center Content - ChannelInterface */}
            <div className="flex-1 flex flex-col min-w-0">
              <ChannelInterface
                selectedChannel={selectedChannel}
                selectedWorkspace={selectedWorkspace}
                onToggleRightPanel={toggleRightPanel}
                showRightPanel={showRightPanel && !isMobile}
              />
            </div>

            {/* Right Sidebar - RightSidebar */}
            {showRightPanel && !isMobile && (
              <RightSidebar
                selectedChannel={selectedChannel}
                selectedWorkspace={selectedWorkspace}
                onClose={() => setShowRightPanel(false)}
              />
            )}

          </div>
        </div>
      </div>

      {/* Mobile Right Panel */}
      {isMobile && showRightPanel && selectedChannel && (
        <div className="absolute inset-y-0 right-0 w-80 shadow-lg z-30 transform transition-transform duration-300" style={{
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-primary)'
        }}>
          <RightSidebar
            selectedChannel={selectedChannel}
            selectedWorkspace={selectedWorkspace}
            onClose={() => setShowRightPanel(false)}
            isMobile={true}
          />
        </div>
      )}

      {/* Footer con estadísticas */}
      <div className="mt-4 px-6 py-3 rounded-lg" style={{
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)'
      }}>
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sistema operativo</span>
            </div>
            
            {selectedWorkspace && (
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {selectedWorkspace.nombre}
                </span>
                <span className="mx-2">•</span>
                <span>{selectedWorkspace.participantes} miembros</span>
              </div>
            )}
            
            {selectedChannel && (
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {selectedChannel.nombre}
                </span>
                <span className="mx-2">•</span>
                <span>{selectedChannel.participantes_online} online</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Portal de Auditorías Técnicas</span>
            <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;