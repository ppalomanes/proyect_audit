import React, { useState } from 'react';
import { X, Users, Settings, Bell, Calendar, File, Activity } from 'lucide-react';

const ChatRightPanel = ({ selectedChannel, selectedConversation, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Detalles', icon: Settings },
    { id: 'members', label: 'Miembros', icon: Users },
    { id: 'files', label: 'Archivos', icon: File },
    { id: 'activity', label: 'Actividad', icon: Activity }
  ];

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
    }
  ];

  const mockActivity = [
    {
      id: 1,
      type: 'message',
      description: 'Ana García envió un mensaje',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: 2,
      type: 'file',
      description: 'Carlos Ruiz subió Parque_Informatico.xlsx',
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: 3,
      type: 'member',
      description: 'María López se unió al canal',
      timestamp: new Date(Date.now() - 86400000)
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

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'zip': return '🗂️';
      default: return '📎';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'message': return '💬';
      case 'file': return '📎';
      case 'member': return '👤';
      default: return '📌';
    }
  };

  const currentItem = selectedChannel || selectedConversation;
  if (!currentItem) return null;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Panel de información
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">
                {selectedChannel ? selectedChannel.icon : '💬'}
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {selectedChannel ? selectedChannel.name : selectedConversation?.user.name}
              </h4>
              {selectedChannel && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedChannel.description}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {selectedChannel ? selectedChannel.type : 'DIRECTO'}
                </p>
              </div>

              {selectedChannel && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Miembros
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedChannel.members} participantes
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Privacidad
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedChannel.isPrivate ? '🔒 Privado' : '🌐 Público'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Última actividad
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {formatTime(selectedChannel.lastActivity)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Acciones rápidas
              </h5>
              <div className="space-y-1">
                <button className="w-full text-left p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2">
                  <Bell size={14} />
                  <span>Configurar notificaciones</span>
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2">
                  <Calendar size={14} />
                  <span>Programar reunión</span>
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2">
                  <File size={14} />
                  <span>Compartir archivo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && selectedChannel && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Participantes ({selectedChannel.members})
              </h5>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Invitar
              </button>
            </div>

            <div className="space-y-2">
              {selectedChannel.participants?.map(participant => (
                <div key={participant.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {participant.avatar}
                    </div>
                    {participant.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {participant.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {participant.role}
                    </p>
                  </div>
                  
                  <div className={`w-2 h-2 rounded-full ${participant.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Archivos compartidos
              </h5>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Ver todos
              </button>
            </div>

            <div className="space-y-2">
              {mockFiles.map(file => (
                <div key={file.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.size} • {file.uploadedBy}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Actividad reciente
            </h5>

            <div className="space-y-3">
              {mockActivity.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="text-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChatRightPanel;