import React from 'react';

const ChannelTabs = ({ tabs, activeTab, onTabChange, channel }) => {
  
  const getTabCount = (tabId) => {
    // Simular conteos por tipo de pestaña
    const counts = {
      'canal': null, // No mostrar conteo en chat principal
      'publicaciones': 3,
      'lista': 12,
      'tablero': 8,
      'calendario': 5,
      'documentos': 7,
      'actividad': null // Actividad no necesita conteo
    };
    
    return counts[tabId];
  };

  const getTabNotification = (tabId) => {
    // Indicadores de notificación por pestaña
    if (tabId === 'lista' && channel.tipo === 'EQUIPO') {
      return { type: 'warning', count: 2 }; // 2 tareas vencidas
    }
    
    if (tabId === 'documentos' && channel.tipo === 'DOCUMENTOS') {
      return { type: 'info', count: 3 }; // 3 documentos nuevos
    }
    
    return null;
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="px-6">
      <div className="flex space-x-1" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);
          const notification = getTabNotification(tab.id);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 flex items-center space-x-2`}
              style={{
                borderBottomColor: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(123, 104, 238, 0.08)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.color = 'var(--text-primary)';
                  e.target.style.borderBottomColor = 'var(--border-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.color = 'var(--text-secondary)';
                  e.target.style.borderBottomColor = 'transparent';
                }
              }}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              
              {/* Count Badge */}
              {count && (
                <span 
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full`}
                  style={{
                    backgroundColor: isActive 
                      ? 'rgba(123, 104, 238, 0.2)' 
                      : 'var(--bg-tertiary)',
                    color: isActive 
                      ? 'var(--accent-primary)' 
                      : 'var(--text-muted)'
                  }}
                >
                  {count}
                </span>
              )}
              
              {/* Notification Badge */}
              {notification && (
                <span 
                  className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs rounded-full text-white`}
                  style={{
                    backgroundColor: notification.type === 'warning' 
                      ? 'var(--warning)' 
                      : notification.type === 'error'
                      ? 'var(--error)'
                      : 'var(--info)'
                  }}
                >
                  {notification.count}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Tab Actions */}
        <div className="flex items-center ml-auto">
          <div className="text-xs px-3" style={{ color: 'var(--text-muted)' }}>
            {getTabDescription(activeTab, channel)}
          </div>
        </div>
      </div>
    </div>
  );
};

const getTabDescription = (activeTab, channel) => {
  const descriptions = {
    'canal': `💬 Mensajes en tiempo real`,
    'publicaciones': `📝 Anuncios y actualizaciones importantes`,
    'lista': `📋 Tareas y checklist del ${channel.tipo.toLowerCase()}`,
    'tablero': `📊 Vista Kanban de progreso`,
    'calendario': `📅 Eventos y fechas clave`,
    'documentos': `📄 Archivos compartidos`,
    'actividad': `📈 Historial de acciones`
  };
  
  return descriptions[activeTab] || '';
};

export default ChannelTabs;