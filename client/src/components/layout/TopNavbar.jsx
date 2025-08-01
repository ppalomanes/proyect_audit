/**
 * Navbar superior con tema dinámico refinado
 * Portal de Auditorías Técnicas
 * 
 * Características:
 * - Breadcrumbs dinámicos
 * - Barra de búsqueda global
 * - Notificaciones con badge
 * - Menu de usuario integrado
 * - Botón acción principal
 * - Sistema de colores refinado basado en ClickUp
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from './Icons';
import { useTheme } from '../../contexts/ThemeContext';

// Store de autenticación real
import { useAuthStore } from '../../domains/auth/authStore';
import { getUserInitials, getUserFullName, translateUserRole } from '../../utils/userUtils';

// Configuración de breadcrumbs por ruta
const getBreadcrumbs = (pathname) => {
  const breadcrumbs = [
    { name: 'Inicio', href: '/dashboard', icon: Icons.Home }
  ];

  const pathMap = {
    '/dashboard': { name: 'Dashboard', icon: Icons.Dashboard },
    '/auditorias': { name: 'Auditorías', icon: Icons.Auditorias },
    '/etl': { name: 'ETL', icon: Icons.ETL },
    '/ia': { name: 'IA Scoring', icon: Icons.IA },
    '/chat': { name: 'Chat', icon: Icons.Chat },
    '/reportes': { name: 'Reportes', icon: Icons.Reportes },
    '/admin': { name: 'Administración', icon: Icons.Admin }
  };

  // Agregar breadcrumb específico según la ruta
  if (pathMap[pathname]) {
    breadcrumbs.push({
      name: pathMap[pathname].name,
      href: pathname,
      icon: pathMap[pathname].icon
    });
  } else {
    // Ruta por defecto
    breadcrumbs.push({ name: 'Dashboard', href: '/dashboard', icon: Icons.Dashboard });
  }

  return breadcrumbs;
};

// Datos mock de notificaciones
const mockNotifications = [
  {
    id: 1,
    type: 'warning',
    title: 'Auditoría Retrasada',
    message: 'CallCenter Solutions - Etapa 3 pendiente hace 5 días',
    time: '2 min',
    unread: true
  },
  {
    id: 2,
    type: 'info',
    title: 'Nuevo Documento',
    message: 'TechSupport Pro subió certificados SSL',
    time: '1 hora',
    unread: true
  },
  {
    id: 3,
    type: 'success',
    title: 'Auditoría Completada',
    message: 'Contact Express finalizó proceso exitosamente',
    time: '3 horas',
    unread: false
  },
  {
    id: 4,
    type: 'info',
    title: 'Actualización ETL',
    message: 'Nuevo batch de datos procesado - 245 registros',
    time: '5 horas',
    unread: false
  }
];

const TopNavbar = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const leftPadding = isCollapsed ? 'pl-24' : 'pl-80'; // Más espacio: 320px cuando expandido
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const unreadNotifications = mockNotifications.filter(n => n.unread).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Buscar:', searchQuery);
      // Aquí iría la lógica de búsqueda
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateAuditoria = () => {
    navigate('/auditorias?action=crear');
  };

  return (
    <nav 
      className="top-navbar fixed top-0 left-0 right-0 h-16 z-40 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-primary)',
        boxShadow: '0 1px 8px var(--shadow-light)'
      }}
    >
      <div className={`flex items-center justify-between h-full px-6 transition-all duration-300 ease-out ${leftPadding}`}>
        
        {/* Izquierda: Breadcrumbs */}
        <div className="flex items-center space-x-2 min-w-0">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.name} className="flex items-center">
              {index > 0 && (
                <Icons.ChevronRight 
                  className="w-4 h-4 mx-2 flex-shrink-0" 
                  style={{ color: 'var(--text-muted)' }}
                />
              )}
              <button
                onClick={() => navigate(crumb.href)}
                className={`
                  flex items-center space-x-1 px-2 py-1 rounded-md text-sm
                  transition-all duration-200 focus-visible interactive
                  ${index === breadcrumbs.length - 1 
                    ? 'font-medium cursor-default' 
                    : 'hover:scale-105'
                  }
                `}
                style={{
                  color: index === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (index < breadcrumbs.length - 1) {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                    e.target.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index < breadcrumbs.length - 1) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {crumb.icon && <crumb.icon className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">{crumb.name}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Centro: Barra de búsqueda */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icons.Search 
                className="w-4 h-4" 
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar auditorías, proveedores..."
              className="block w-full rounded-lg text-sm transition-all duration-200 focus-visible"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                paddingLeft: '3rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem'
              }}
            />
          </form>
        </div>

        {/* Derecha: Acciones */}
        <div className="flex items-center space-x-4">
          
          {/* Botón Crear Auditoría */}
          <button 
            onClick={handleCreateAuditoria}
            className="btn-primary flex items-center space-x-2 px-4 py-2 font-medium rounded-lg text-sm interactive"
          >
            <Icons.Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Auditoría</span>
          </button>

          {/* Toggle Tema Claro/Oscuro */}
          <button
            onClick={toggleTheme}
            className="
              relative p-2 rounded-lg transition-all duration-300 interactive focus-visible
            "
            style={{ 
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--text-secondary)';
            }}
            title={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            <div className="relative w-5 h-5">
              {/* Transición suave entre iconos */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                isDarkMode ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'
              }`}>
                <Icons.Sun className="w-5 h-5" />
              </div>
              <div className={`absolute inset-0 transition-all duration-300 ${
                !isDarkMode ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'
              }`}>
                <Icons.Moon className="w-5 h-5" />
              </div>
            </div>
          </button>

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="
                relative p-2 rounded-lg transition-all duration-200 interactive focus-visible
              "
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-tertiary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              <Icons.Bell className="w-5 h-5" />
              {/* Badge de notificaciones */}
              {unreadNotifications > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--error)' }}
                >
                  <span className="text-xs text-white font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                </span>
              )}
            </button>

            {/* Dropdown de notificaciones */}
            {showNotifications && (
              <div 
                className="dropdown absolute right-0 top-full mt-2 w-80 overflow-hidden z-50 fade-in"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px var(--shadow-medium)'
                }}
              >
                <div 
                  className="p-4 border-b"
                  style={{
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Notificaciones
                    </h3>
                    {unreadNotifications > 0 && (
                      <span 
                        className="text-xs font-medium"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {unreadNotifications} nuevas
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {mockNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`
                        p-4 border-b transition-colors cursor-pointer interactive
                        ${notification.unread ? 'opacity-100' : 'opacity-80'}
                      `}
                      style={{
                        borderColor: 'var(--border-primary)',
                        backgroundColor: notification.unread ? 'var(--bg-secondary)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = notification.unread ? 'var(--bg-secondary)' : 'transparent';
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          w-2 h-2 rounded-full mt-2 flex-shrink-0
                          ${notification.type === 'warning' ? 'bg-[var(--warning)]' :
                            notification.type === 'info' ? 'bg-[var(--info)]' :
                            'bg-[var(--success)]'}
                        `} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p 
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {notification.title}
                            </p>
                            {notification.unread && (
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0 ml-2" 
                                style={{ backgroundColor: 'var(--error)' }}
                              />
                            )}
                          </div>
                          <p 
                            className="text-xs mb-1 line-clamp-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {notification.message}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div 
                  className="p-3 text-center border-t"
                  style={{
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <button 
                    onClick={() => navigate('/notificaciones')}
                    className="text-sm transition-colors interactive"
                    style={{ color: 'var(--accent-primary)' }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--accent-primary)';
                    }}
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu Usuario */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="
                flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 interactive focus-visible
              "
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-tertiary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-tertiary)] to-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-medium text-sm">
                  {getUserInitials(user)}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p 
                  className="text-sm font-medium truncate max-w-24"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {getUserFullName(user)}
                </p>
              </div>
            </button>

            {/* Dropdown usuario */}
            {showUserMenu && (
              <div 
                className="dropdown absolute right-0 top-full mt-2 w-56 overflow-hidden z-50 fade-in"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px var(--shadow-medium)'
                }}
              >
                <div 
                  className="p-4 border-b"
                  style={{
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <p 
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {getUserFullName(user)}
                  </p>
                  <p 
                    className="text-xs truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {user.email}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ 
                        color: 'var(--accent-primary)',
                        backgroundColor: 'rgba(123, 104, 238, 0.1)'
                      }}
                    >
                      {translateUserRole(user.rol)}
                    </span>
                  </div>
                </div>
                
                <div className="py-1">
                  <button 
                    onClick={() => navigate('/perfil')}
                    className="dropdown-item flex items-center w-full px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Icons.User className="w-4 h-4 mr-3" />
                    Mi Perfil
                  </button>
                  <button 
                    onClick={() => navigate('/configuracion')}
                    className="dropdown-item flex items-center w-full px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Icons.Settings className="w-4 h-4 mr-3" />
                    Configuración
                  </button>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-primary)' }}>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item flex items-center w-full px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(253, 113, 175, 0.1)';
                      e.target.style.color = 'var(--accent-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Icons.Logout className="w-4 h-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Búsqueda móvil */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icons.Search 
              className="w-4 h-4" 
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="block w-full rounded-lg text-sm transition-all duration-200 focus-visible"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              paddingLeft: '3rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem'
            }}
          />
        </form>
      </div>

      {/* Estilos para scrollbar personalizado y utilidades */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-primary);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--border-hover);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </nav>
  );
};

export default TopNavbar;