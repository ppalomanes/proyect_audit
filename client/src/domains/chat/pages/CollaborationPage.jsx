// /client/src/domains/chat/pages/CollaborationPage.jsx
import React, { useEffect, useState } from 'react';
import useAuthStore from '../../auth/authStore';
import useChatStore from '../store/chatStore';
import WorkspaceManager from '../components/workspace/WorkspaceManager';
import ChannelInterface from '../components/channel/ChannelInterface';
import ChannelTabs from '../components/channel/ChannelTabs';
import ChatStatusBar from '../components/ChatStatusBar';
import ConnectionStatus from '../components/ConnectionStatus';
import ChatDiagnostics from '../components/ChatDiagnostics';
import { Loader2, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

const CollaborationPage = () => {
  const { user } = useAuthStore();
  const {
    // Estado
    connected,
    connectionStatus,
    loading,
    error,
    workspaces,
    selectedWorkspace,
    selectedChannel,
    currentView,
    chatSidebarOpen,
    
    // Acciones
    initializeSocket,
    selectWorkspace,
    selectChannel,
    setCurrentView,
    toggleChatSidebar,
    disconnect,
    reconnect,
    getTotalUnreadCount,
    getConnectionInfo
  } = useChatStore();

  const [showConnectionAlert, setShowConnectionAlert] = useState(false);

  // Inicializar conexión cuando el componente se monta
  useEffect(() => {
    if (user && !connected && connectionStatus === 'disconnected') {
      console.log('🚀 Inicializando chat para usuario:', user.nombre);
      initializeSocket(user);
    }

    // Cleanup al desmontar
    return () => {
      if (connected) {
        console.log('📌 Limpiando conexión al desmontar');
        disconnect();
      }
    };
  }, [user, connected, connectionStatus]);

  // Mostrar alerta de conexión cuando hay problemas
  useEffect(() => {
    if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
      setShowConnectionAlert(true);
      const timer = setTimeout(() => setShowConnectionAlert(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConnectionAlert(false);
    }
  }, [connectionStatus]);

  // Handlers para workspace y canales
  const handleWorkspaceSelect = (workspace) => {
    selectWorkspace(workspace);
  };

  const handleChannelSelect = (channel) => {
    selectChannel(channel);
  };

  const handleTabChange = (tab) => {
    setCurrentView(tab);
  };

  // Loading inicial
  if (loading && !workspaces.length) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Inicializando chat colaborativo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Alerta de conexión */}
      {showConnectionAlert && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Problemas de conexión al chat</span>
        </div>
      )}

      {/* Sidebar de Workspaces - Solo mostrar si está abierto */}
      {chatSidebarOpen && (
        <div className="flex-shrink-0">
          <WorkspaceManager
            workspaces={workspaces}
            selectedWorkspace={selectedWorkspace}
            selectedChannel={selectedChannel}
            onWorkspaceSelect={handleWorkspaceSelect}
            onChannelSelect={handleChannelSelect}
            loading={loading}
          />
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Estado de Conexión - Solo mostrar si no está conectado */}
        {!connected && (
          <div className="flex-shrink-0 p-4">
            <ConnectionStatus />
          </div>
        )}
        
        {/* Header con tabs del canal */}
        {selectedChannel && (
          <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <ChannelTabs
              channel={selectedChannel}
              currentView={currentView}
              onTabChange={handleTabChange}
              onToggleSidebar={toggleChatSidebar}
              sidebarOpen={chatSidebarOpen}
            />
          </div>
        )}

        {/* Contenido del Canal */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedChannel ? (
            <ChannelInterface
              channel={selectedChannel}
              workspace={selectedWorkspace}
              currentView={currentView}
              connected={connected}
            />
          ) : (
            // Estado sin canal seleccionado
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Bienvenido al Chat Colaborativo
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Selecciona un espacio de trabajo y canal para comenzar a colaborar con tu equipo.
                </p>
                
                {/* Botón de diagnóstico rápido */}
                <div className="mb-4">
                  <button
                    onClick={() => {
                      console.log('🔍 Diagnóstico rápido del chat:');
                      console.log('Connected:', connected);
                      console.log('Connection Status:', connectionStatus);
                      console.log('Error:', error);
                      console.log('Workspaces:', workspaces?.length || 0);
                      console.log('User:', user);
                      
                      const token = localStorage.getItem('auth_token');
                      console.log('Token presente:', !!token);
                      
                      // Intentar reconectar
                      if (!connected && user) {
                        console.log('🔄 Intentando reconectar...');
                        initializeSocket(user);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                  >
                    🔍 Diagnóstico & Reconectar
                  </button>
                  
                  <button
                    onClick={() => {
                      window.open('http://localhost:3001/health', '_blank');
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    🌐 Verificar Servidor
                  </button>
                </div>
                {!chatSidebarOpen && (
                  <button
                    onClick={toggleChatSidebar}
                    className="btn-primary"
                  >
                    Mostrar Espacios de Trabajo
                  </button>
                )}
                
                {/* Diagnóstico del Chat */}
                {!connected && (
                  <div className="mt-8">
                    <ChatDiagnostics />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex-shrink-0">
          <ChatStatusBar
            connected={connected}
            connectionStatus={connectionStatus}
            workspace={selectedWorkspace}
            channel={selectedChannel}
            unreadCount={getTotalUnreadCount()}
          />
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;