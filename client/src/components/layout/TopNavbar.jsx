/**
 * Navbar superior con tema oscuro
 * Portal de Auditorías Técnicas
 * 
 * Características:
 * - Breadcrumbs dinámicos
 * - Barra de búsqueda global
 * - Notificaciones con badge
 * - Menu de usuario integrado
 * - Botón acción principal
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from './Icons';

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
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const leftMargin = isCollapsed ? 'ml-20' : 'ml-64';
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
    <nav className={`
      fixed top-0 right-0 h-16 bg-[#292D34] border-b border-[#5C6470] z-40
      transition-all duration-300 ease-out ${leftMargin}
    `}>
      <div className="flex items-center justify-between h-full px-6">
        
        {/* Izquierda: Breadcrumbs */}
        <div className="flex items-center space-x-2 min-w-0">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.name} className="flex items-center">
              {index > 0 && (
                <Icons.ChevronRight className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />
              )}
              <button
                onClick={() => navigate(crumb.href)}
                className={`
                  flex items-center space-x-1 px-2 py-1 rounded-md text-sm
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#7B68EE]
                  ${index === breadcrumbs.length - 1 
                    ? 'text-white font-medium cursor-default' 
                    : 'text-gray-300 hover:text-white hover:bg-[rgba(123,104,238,0.1)]'
                  }
                `}
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar auditorías, proveedores..."
              className="
                block w-full pl-10 pr-3 py-2 border border-[#5C6470] rounded-lg
                bg-[#1F2937] text-white placeholder-gray-400 text-sm
                focus:outline-none focus:ring-2 focus:ring-[#7B68EE] focus:border-transparent
                transition-all duration-200
              "
            />
          </form>
        </div>

        {/* Derecha: Acciones */}
        <div className="flex items-center space-x-4">
          
          {/* Botón Crear Auditoría */}
          <button 
            onClick={handleCreateAuditoria}
            className="
              flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#7B68EE] to-[#FD71AF]
              text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-0.5
              transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#7B68EE]
              text-sm
            "
          >
            <Icons.Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Auditoría</span>
          </button>

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="
                relative p-2 text-gray-300 hover:text-white hover:bg-[rgba(123,104,238,0.1)]
                rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7B68EE]
              "
            >
              <Icons.Bell className="w-5 h-5" />
              {/* Badge de notificaciones */}
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FD71AF] rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                </span>
              )}
            </button>

            {/* Dropdown de notificaciones */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#292D34] border border-[#5C6470] rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-[#5C6470] bg-[#1F2937]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                    {unreadNotifications > 0 && (
                      <span className="text-xs text-[#7B68EE] font-medium">
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
                        p-4 border-b border-[#5C6470] hover:bg-[rgba(123,104,238,0.05)] 
                        transition-colors cursor-pointer
                        ${notification.unread ? 'bg-[rgba(123,104,238,0.02)]' : ''}
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          w-2 h-2 rounded-full mt-2 flex-shrink-0
                          ${notification.type === 'warning' ? 'bg-yellow-400' :
                            notification.type === 'info' ? 'bg-[#49CCF9]' :
                            'bg-green-400'}
                        `} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </p>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-[#FD71AF] rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-xs text-gray-300 mb-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 text-center border-t border-[#5C6470] bg-[#1F2937]">
                  <button 
                    onClick={() => navigate('/notificaciones')}
                    className="text-sm text-[#7B68EE] hover:text-white transition-colors"
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
                flex items-center space-x-2 p-2 text-gray-300 hover:text-white
                hover:bg-[rgba(123,104,238,0.1)] rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[#7B68EE]
              "
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#49CCF9] to-[#7B68EE] rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-medium text-sm">
                  {getUserInitials(user)}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white truncate max-w-24">
                  {getUserFullName(user)}
                </p>
              </div>
            </button>

            {/* Dropdown usuario */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#292D34] border border-[#5C6470] rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-[#5C6470] bg-[#1F2937]">
                  <p className="text-sm font-medium text-white truncate">{getUserFullName(user)}</p>
                  <p className="text-xs text-gray-300 truncate">{user.email}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[#7B68EE] font-medium bg-[rgba(123,104,238,0.1)] px-2 py-1 rounded-full">
                      {translateUserRole(user.rol)}
                    </span>
                  </div>
                </div>
                
                <div className="py-1">
                  <button 
                    onClick={() => navigate('/perfil')}
                    className="flex items-center w-full px-4 py-3 text-sm text-white hover:bg-[rgba(123,104,238,0.1)] transition-colors"
                  >
                    <Icons.User className="w-4 h-4 mr-3" />
                    Mi Perfil
                  </button>
                  <button 
                    onClick={() => navigate('/configuracion')}
                    className="flex items-center w-full px-4 py-3 text-sm text-white hover:bg-[rgba(123,104,238,0.1)] transition-colors"
                  >
                    <Icons.Settings className="w-4 h-4 mr-3" />
                    Configuración
                  </button>
                </div>
                
                <div className="border-t border-[#5C6470]">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-white hover:bg-[rgba(253,113,175,0.1)] transition-colors"
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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="
              block w-full pl-10 pr-3 py-2 border border-[#5C6470] rounded-lg
              bg-[#1F2937] text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-[#7B68EE] focus:border-transparent
              transition-all duration-200
            "
          />
        </form>
      </div>

      {/* Estilos para scrollbar personalizado */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #5C6470;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7B68EE;
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
