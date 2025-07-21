import React, { useState } from 'react';
import { 
  Hash, 
  Lock, 
  Search, 
  Plus, 
  UserPlus, 
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Users,
  Bell,
  BellOff,
  Circle
} from 'lucide-react';

const ChatSidebar = ({ 
  channels = [], 
  directMessages = [], 
  selectedChannel, 
  selectedConversation,
  onChannelSelect,
  onConversationSelect,
  onNewChannel,
  onInviteUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    respuestas: true,
    publicaciones: true,
    followUps: false,
    actividad: false,
    borradores: true,
    canales: true,
    mensajesDirectos: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getChannelIcon = (channel) => {
    if (channel.isPrivate) return <Lock className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'AUDITOR': return 'text-purple-500';
      case 'PROVEEDOR': return 'text-blue-500';
      case 'SUPERVISOR': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDirectMessages = directMessages.filter(dm =>
    dm.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      
      {/* Header con título y botones */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={onNewChannel}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                       hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Nuevo canal"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={onInviteUser}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                       hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Invitar usuario"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
                     rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Sección Respuestas */}
        <div className="px-2 py-2">
          <button
            onClick={() => toggleSection('respuestas')}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {expandedSections.respuestas ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
            }
            <span>📥 Respuestas</span>
          </button>
          
          {expandedSections.respuestas && (
            <div className="ml-6 mt-1 space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 
                            hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                <span>Sin leer</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">2</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 
                            hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                <span>Leído</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">8</span>
              </div>
            </div>
          )}
        </div>

        {/* Sección Publicaciones */}
        <div className="px-2 py-1">
          <button
            onClick={() => toggleSection('publicaciones')}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {expandedSections.publicaciones ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
            }
            <span>📝 Publicaciones</span>
          </button>
        </div>

        {/* Sección Follow Ups */}
        <div className="px-2 py-1">
          <button
            onClick={() => toggleSection('followUps')}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {expandedSections.followUps ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
            }
            <span>📌 FollowUps</span>
          </button>
        </div>

        {/* Sección Actividad */}
        <div className="px-2 py-1">
          <button
            onClick={() => toggleSection('actividad')}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {expandedSections.actividad ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
            }
            <span>📊 Actividad</span>
          </button>
        </div>

        {/* Sección Borradores y Enviados */}
        <div className="px-2 py-1">
          <button
            onClick={() => toggleSection('borradores')}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {expandedSections.borradores ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
            }
            <span>📤 Borradores y Enviados</span>
          </button>
        </div>

        {/* Separator */}
        <div className="mx-4 my-3 border-t border-gray-200 dark:border-gray-700"></div>

        {/* Sección Canales */}
        <div className="px-2 py-1">
          <button
            onClick={() => toggleSection('canales')}
            className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <div className="flex items-center space-x-2">
              {expandedSections.canales ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
              <span>Canales</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNewChannel();
              }}
              className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </button>
          
          {expandedSections.canales && (
            <div className="ml-4 mt-1 space-y-1">
              {filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect(channel)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 text-sm rounded-md transition-colors group
                    ${selectedChannel?.id === channel.id 
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {getChannelIcon(channel)}
                    </span>
                    <span className="truncate font-medium">{channel.name}</span>
                    {channel.isPrivate && (
                      <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {channel.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {channel.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{channel.members}</span>
                  </div>
                </button>
              ))}
              
              {/* Botón añadir canal */}
              <button
                onClick={onNewChannel}
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 
                         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir canal</span>
              </button>
            </div>
          )}
        </div>

        {/* Sección Mensajes Directos */}
        <div className="px-2 py-1">
          <button
            onClick={() => toggleSection('mensajesDirectos')}
            className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <div className="flex items-center space-x-2">
              {expandedSections.mensajesDirectos ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
              <span>Mensajes directos</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInviteUser();
              }}
              className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </button>
          
          {expandedSections.mensajesDirectos && (
            <div className="ml-4 mt-1 space-y-1">
              {filteredDirectMessages.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => onConversationSelect(dm)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 text-sm rounded-md transition-colors group
                    ${selectedConversation?.id === dm.id 
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {dm.user.avatar}
                      </div>
                      {/* Estado online */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-900
                        ${dm.user.online ? 'bg-green-500' : 'bg-gray-400'}`}>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="truncate font-medium">{dm.user.name}</span>
                        <span className={`text-xs px-1 py-0.5 rounded ${getRoleColor(dm.user.role)} bg-opacity-20`}>
                          {dm.user.role}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {dm.lastMessage}
                      </div>
                    </div>
                  </div>
                  
                  {dm.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {dm.unreadCount}
                    </span>
                  )}
                </button>
              ))}
              
              {/* Botón invitar a personas */}
              <button
                onClick={onInviteUser}
                className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 
                         hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invitar a personas</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatSidebar;