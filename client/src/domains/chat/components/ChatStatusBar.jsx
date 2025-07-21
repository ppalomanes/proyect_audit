import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  MessageCircle, 
  Activity,
  RefreshCw,
  Settings,
  Bell,
  BellOff,
  Volume2,
  VolumeX
} from 'lucide-react';

const ChatStatusBar = ({ 
  isConnected = false, 
  onlineUsers = [], 
  currentConversationId = null,
  notifications = true,
  sounds = true,
  onToggleNotifications,
  onToggleSounds 
}) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastActivity, setLastActivity] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
      setRetryCount(0);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      setLastActivity(new Date());
    }
  }, [isConnected, currentConversationId]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return retryCount > 0 ? `Desconectado (Intento ${retryCount})` : 'Desconectado';
      default:
        return 'Sin conexión';
    }
  };

  const formatLastActivity = () => {
    if (!lastActivity) return 'Nunca';
    
    const now = new Date();
    const diff = Math.floor((now - lastActivity) / 1000);
    
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    return lastActivity.toLocaleDateString();
  };

  const handleReconnect = () => {
    setConnectionStatus('connecting');
    setRetryCount(prev => prev + 1);
    // Simular reconexión
    setTimeout(() => {
      // Aquí iría la lógica real de reconexión
      console.log('Intentando reconectar...');
    }, 1000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Estado de conexión */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className={`w-4 h-4 ${getStatusColor()}`} />
            ) : (
              <WifiOff className={`w-4 h-4 ${getStatusColor()}`} />
            )}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {connectionStatus === 'connected' && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  WebSocket activo
                </span>
              </div>
            )}
          </div>

          {/* Botón de reconexión */}
          {!isConnected && (
            <button
              onClick={handleReconnect}
              disabled={connectionStatus === 'connecting'}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 
                       dark:bg-blue-900/50 dark:text-blue-300 rounded hover:bg-blue-200 
                       dark:hover:bg-blue-900/70 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              <span>Reconectar</span>
            </button>
          )}
        </div>

        {/* Información central */}
        <div className="flex items-center space-x-6">
          {/* Usuarios online */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {onlineUsers.length} en línea
            </span>
            {onlineUsers.length > 0 && (
              <div className="flex -space-x-1">
                {onlineUsers.slice(0, 3).map((user, index) => (
                  <div
                    key={user.id || index}
                    className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full 
                             border-2 border-white dark:border-gray-800 flex items-center justify-center"
                    title={user.nombre || `Usuario ${index + 1}`}
                  >
                    <span className="text-xs text-white font-medium">
                      {(user.nombre || `U${index + 1}`).charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {onlineUsers.length > 3 && (
                  <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white 
                                dark:border-gray-800 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      +{onlineUsers.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actividad en conversación actual */}
          {currentConversationId && (
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Conversación #{currentConversationId}
              </span>
            </div>
          )}

          {/* Última actividad */}
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatLastActivity()}
            </span>
          </div>
        </div>

        {/* Controles de configuración */}
        <div className="flex items-center space-x-2">
          {/* Toggle notificaciones */}
          <button
            onClick={onToggleNotifications}
            className={`p-1.5 rounded transition-colors ${
              notifications 
                ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title={notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}
          >
            {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Toggle sonidos */}
          <button
            onClick={onToggleSounds}
            className={`p-1.5 rounded transition-colors ${
              sounds 
                ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title={sounds ? 'Silenciar sonidos' : 'Activar sonidos'}
          >
            {sounds ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Configuraciones */}
          <button
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                     rounded transition-colors"
            title="Configuración del chat"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de información adicional cuando está desconectado */}
      {!isConnected && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">
                Sin conexión al servidor de chat. Los mensajes no se enviarán en tiempo real.
              </span>
            </div>
            <button
              onClick={handleReconnect}
              className="text-sm text-red-700 dark:text-red-400 hover:text-red-800 
                       dark:hover:text-red-300 underline"
            >
              Intentar ahora
            </button>
          </div>
        </div>
      )}

      {/* Indicadores de estado específicos */}
      {isConnected && currentConversationId && (
        <div className="mt-1 flex items-center justify-center">
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Mensajes sincronizados</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Indicadores de lectura activos</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Notificaciones en tiempo real</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatStatusBar;