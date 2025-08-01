// /client/src/domains/chat/components/ConnectionStatus.jsx
import React, { useState } from 'react';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import useChatStore from '../store/chatStore';
import ChatDiagnostics from './ChatDiagnostics';

const ConnectionStatus = ({ className = '' }) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const { 
    connected, 
    connectionStatus, 
    error, 
    loading,
    reconnect,
    getConnectionInfo 
  } = useChatStore();

  const connectionInfo = getConnectionInfo();

  const getStatusIcon = () => {
    switch (connectionInfo.status) {
      case 'connected':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <XCircleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionInfo.color) {
      case 'green':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'red':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleReconnect = () => {
    console.log('🔄 Usuario solicita reconexión manual');
    reconnect();
  };

  return (
    <>
      <div className={`flex items-center justify-between p-3 border rounded-lg ${getStatusColor()} ${className}`}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {connectionInfo.message}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {connectionInfo.showReconnect && (
            <button
              onClick={handleReconnect}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-current rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Reconectar</span>
            </button>
          )}
          
          <button
            onClick={() => setShowDiagnostics(true)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-current rounded-md hover:bg-opacity-90 transition-colors"
            title="Abrir diagnóstico del sistema"
          >
            <WrenchScrewdriverIcon className="h-4 w-4" />
            <span>Diagnóstico</span>
          </button>
        </div>
      </div>
      
      {showDiagnostics && (
        <ChatDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}
    </>
  );
};

export default ConnectionStatus;