// /client/src/domains/chat/components/ChatDiagnostics.jsx
import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  WifiIcon,
  ServerIcon,
  KeyIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import io from 'socket.io-client';
import useChatStore from '../store/chatStore';
import useAuthStore from '../../auth/authStore';

const ChatDiagnostics = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState({
    server: { status: 'checking', message: 'Verificando...', details: null },
    auth: { status: 'checking', message: 'Verificando...', details: null },
    websocket: { status: 'checking', message: 'Verificando...', details: null },
    api: { status: 'checking', message: 'Verificando...', details: null }
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const { connectionStatus, connected, error } = useChatStore();
  const { user, token } = useAuthStore();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('🔍 Iniciando diagnóstico del sistema de chat...', 'info');

    // 1. Verificar servidor
    await checkServer();
    
    // 2. Verificar autenticación
    await checkAuthentication();
    
    // 3. Verificar API
    await checkAPI();
    
    // 4. Verificar WebSocket
    await checkWebSocket();
    
    addLog('✅ Diagnóstico completado', 'success');
    setIsRunning(false);
  };

  const checkServer = async () => {
    addLog('📡 Verificando servidor en puerto 5000...', 'info');
    
    try {
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(prev => ({
          ...prev,
          server: {
            status: 'success',
            message: 'Servidor activo',
            details: `API: ${data.services.api}, WebSocket: ${data.services.websocket}, BD: ${data.services.database}`
          }
        }));
        addLog('✅ Servidor respondiendo correctamente', 'success');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        server: {
          status: 'error',
          message: 'Servidor no disponible',
          details: `Error: ${error.message}. Verificar que el servidor esté ejecutándose en puerto 5000`
        }
      }));
      addLog('❌ Error conectando al servidor: ' + error.message, 'error');
    }
  };

  const checkAuthentication = async () => {
    addLog('🔐 Verificando autenticación...', 'info');
    
    try {
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        throw new Error('No hay token de autenticación');
      }
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      // Verificar que el token sea válido
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const expiry = payload.exp * 1000;
        const now = Date.now();
        
        if (now > expiry) {
          throw new Error('Token expirado');
        }
        
        setDiagnostics(prev => ({
          ...prev,
          auth: {
            status: 'success',
            message: 'Autenticación válida',
            details: `Usuario: ${user.nombre || user.email}, Expira: ${new Date(expiry).toLocaleString()}`
          }
        }));
        addLog('✅ Token JWT válido', 'success');
        
      } catch (jwtError) {
        throw new Error('Token JWT malformado');
      }
      
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        auth: {
          status: 'error',
          message: 'Error de autenticación',
          details: error.message
        }
      }));
      addLog('❌ Error de autenticación: ' + error.message, 'error');
    }
  };

  const checkAPI = async () => {
    addLog('🌐 Verificando API REST...', 'info');
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No hay token para autenticar API');
      }
      
      const response = await fetch('http://localhost:5000/api/chat/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(prev => ({
          ...prev,
          api: {
            status: 'success',
            message: 'API funcionando',
            details: `Workspaces encontrados: ${data.data?.length || 0}`
          }
        }));
        addLog('✅ API REST respondiendo correctamente', 'success');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        api: {
          status: 'error',
          message: 'Error en API',
          details: error.message
        }
      }));
      addLog('❌ Error en API: ' + error.message, 'error');
    }
  };

  const checkWebSocket = async () => {
    addLog('🔌 Verificando conexión WebSocket...', 'info');
    
    return new Promise((resolve) => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('No hay token para WebSocket');
        }
        
        // Crear conexión temporal para testing
        const testSocket = io('http://localhost:5000/chat', {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 5000
        });
        
        const timeout = setTimeout(() => {
          testSocket.disconnect();
          setDiagnostics(prev => ({
            ...prev,
            websocket: {
              status: 'error',
              message: 'Timeout de conexión',
              details: 'WebSocket no responde en 5 segundos'
            }
          }));
          addLog('❌ WebSocket timeout', 'error');
          resolve();
        }, 5000);
        
        testSocket.on('connect', () => {
          clearTimeout(timeout);
          addLog('✅ WebSocket conectado', 'success');
        });
        
        testSocket.on('chat_connected', (data) => {
          clearTimeout(timeout);
          testSocket.disconnect();
          
          setDiagnostics(prev => ({
            ...prev,
            websocket: {
              status: 'success',
              message: 'WebSocket funcionando',
              details: `Autenticado correctamente, Workspaces: ${data.workspaces?.length || 0}`
            }
          }));
          addLog('✅ WebSocket autenticado correctamente', 'success');
          resolve();
        });
        
        testSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          testSocket.disconnect();
          
          setDiagnostics(prev => ({
            ...prev,
            websocket: {
              status: 'error',
              message: 'Error de conexión WebSocket',
              details: error.message
            }
          }));
          addLog('❌ Error WebSocket: ' + error.message, 'error');
          resolve();
        });
        
        testSocket.on('auth_error', (error) => {
          clearTimeout(timeout);
          testSocket.disconnect();
          
          setDiagnostics(prev => ({
            ...prev,
            websocket: {
              status: 'error',
              message: 'Error de autenticación WebSocket',
              details: error.message || 'Token JWT inválido'
            }
          }));
          addLog('❌ Error autenticación WebSocket: ' + (error.message || 'Token inválido'), 'error');
          resolve();
        });
        
      } catch (error) {
        setDiagnostics(prev => ({
          ...prev,
          websocket: {
            status: 'error',
            message: 'Error iniciando WebSocket',
            details: error.message
          }
        }));
        addLog('❌ Error iniciando WebSocket: ' + error.message, 'error');
        resolve();
      }
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on component mount
    runDiagnostics();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Diagnóstico del Sistema de Chat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Estado actual del chat */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Estado Actual del Chat</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Conexión:</span>
                <span className={`ml-2 font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
                  {connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className="ml-2 font-medium text-gray-900">{connectionStatus}</span>
              </div>
              <div>
                <span className="text-gray-600">Usuario:</span>
                <span className="ml-2 font-medium text-gray-900">{user?.nombre || user?.email || 'No autenticado'}</span>
              </div>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagnósticos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Componentes del Sistema</h3>
                <button
                  onClick={runDiagnostics}
                  disabled={isRunning}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning ? (
                    <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                  )}
                  {isRunning ? 'Diagnosticando...' : 'Ejecutar Diagnóstico'}
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries({
                  server: { name: 'Servidor HTTP', icon: ServerIcon },
                  auth: { name: 'Autenticación JWT', icon: KeyIcon },
                  api: { name: 'API REST', icon: WifiIcon },
                  websocket: { name: 'WebSocket', icon: WifiIcon }
                }).map(([key, { name, icon: Icon }]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border ${getStatusColor(diagnostics[key].status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{name}</span>
                      </div>
                      {getStatusIcon(diagnostics[key].status)}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">
                        {diagnostics[key].message}
                      </p>
                      {diagnostics[key].details && (
                        <p className="text-xs text-gray-600 mt-1">
                          {diagnostics[key].details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logs */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Log de Diagnóstico</h3>
              <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm mb-2">
                    <span className="text-gray-500 font-mono">{log.timestamp}</span>
                    <span>{getLogIcon(log.type)}</span>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-500 text-center py-8">
                    Los logs del diagnóstico aparecerán aquí...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Soluciones rápidas */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Soluciones Rápidas</h4>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>• Verificar que el servidor esté ejecutándose: <code className="bg-blue-100 px-1 rounded">npm run chat</code></li>
                  <li>• Verificar que XAMPP esté ejecutándose (MySQL)</li>
                  <li>• Verificar que no haya conflictos de puerto</li>
                  <li>• Limpiar localStorage y volver a autenticarse</li>
                  <li>• Revisar la consola del navegador para errores</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDiagnostics;