// /client/src/domains/chat/components/ChatStatusBar.jsx
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Users, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const ChatStatusBar = ({ 
  connected, 
  connectionStatus, 
  workspace, 
  channel, 
  unreadCount 
}) => {
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showReconnectButton, setShowReconnectButton] = useState(false);

  // Mostrar botón de reconectar después de varios intentos fallidos
  useEffect(() => {
    if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
      const timer = setTimeout(() => {
        setShowReconnectButton(true);
      }, 5000); // Mostrar después de 5 segundos
      
      return () => clearTimeout(timer);
    } else {
      setShowReconnectButton(false);
      setReconnectAttempts(0);
    }
  }, [connectionStatus]);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <WifiOff className="w-3 h-3 text-gray-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Error de conexión';
      default:
        return 'Desconectado';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleReconnect = () => {
    setReconnectAttempts(prev => prev + 1);
    setShowReconnectButton(false);
    console.log('🔄 Intentando reconectar...');
    // TODO: Implementar lógica de reconexión desde el store
    window.location.reload(); // Temporal - recargar página
  };

  return (
    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs flex items-center justify-between">
      
      {/* Estado de conexión */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
          {getConnectionIcon()}
          <span className="font-medium">{getConnectionText()}</span>
          {reconnectAttempts > 0 && (
            <span className="text-gray-500">({reconnectAttempts})</span>
          )}
        </div>
        
        {/* Información del workspace/canal */}
        {workspace && (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <span>{workspace.icono}</span>
            <span>{workspace.nombre}</span>
            {channel && (
              <>
                <span>/</span>
                <span>#{channel.nombre}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Acciones y estadísticas */}
      <div className="flex items-center space-x-3">
        
        {/* Mensajes no leídos */}
        {unreadCount > 0 && (
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {unreadCount} no leído{unreadCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Usuarios online */}
        {connected && channel && (
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
            <Users className="w-3 h-3" />
            <span>{channel.participantes_online || 0} online</span>
          </div>
        )}

        {/* Botón de reconexión */}
        {showReconnectButton && (
          <button
            onClick={handleReconnect}
            className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reconectar</span>
          </button>
        )}

        {/* Indicador de estado del servidor */}
        <div className={`w-2 h-2 rounded-full ${
          connected 
            ? 'bg-green-500' 
            : connectionStatus === 'connecting' 
              ? 'bg-yellow-500 animate-pulse' 
              : 'bg-red-500'
        }`}></div>
      </div>
    </div>
  );
};

export default ChatStatusBar;