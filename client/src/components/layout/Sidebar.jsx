/**
 * Sidebar principal con tema oscuro
 * Portal de Auditorías Técnicas
 * 
 * Implementa los parámetros de diseño especificados:
 * - Fondo #292D34 (Shark)
 * - Ancho 280px expandido, 80px colapsado
 * - Colores de acento #7B68EE, #FD71AF, #49CCF9
 * - Transiciones suaves 300ms
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from './Icons';

// Store de autenticación real
import { useAuthStore } from '../../domains/auth/authStore';
import { getUserInitials, getUserFullName, translateUserRole } from '../../utils/userUtils';

// Configuración de navegación según roles
const getNavigation = (userRole, currentPath) => {
  const baseNavigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Icons.Dashboard, 
      current: currentPath === '/dashboard' 
    },
    { 
      name: 'Auditorías', 
      href: '/auditorias', 
      icon: Icons.Auditorias, 
      current: currentPath === '/auditorias' 
    },
    { 
      name: 'ETL', 
      href: '/etl', 
      icon: Icons.ETL, 
      current: currentPath === '/etl' 
    },
    { 
      name: 'IA Scoring', 
      href: '/ia', 
      icon: Icons.IA, 
      current: currentPath === '/ia' 
    },
    { 
      name: 'Chat', 
      href: '/chat', 
      icon: Icons.Chat, 
      current: currentPath === '/chat' 
    },
    { 
      name: 'Reportes', 
      href: '/reportes', 
      icon: Icons.Reportes, 
      current: currentPath === '/reportes' 
    }
  ];

  // Agregar Administración solo para ADMIN
  if (userRole === 'ADMIN') {
    baseNavigation.push({
      name: 'Administración',
      href: '/admin',
      icon: Icons.Admin,
      current: currentPath === '/admin'
    });
  }

  return baseNavigation;
};

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navigation = getNavigation(user.rol, location.pathname);

  // Configuración de estilos responsive
  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  const sidebarStyles = `
    fixed inset-y-0 left-0 z-50 flex flex-col
    ${sidebarWidth} transition-all duration-300 ease-out
    bg-[#292D34] border-r border-[#5C6470]
    ${isMobile && !isCollapsed ? 'shadow-2xl' : ''}
  `;

  const handleNavigation = (href) => {
    navigate(href);
    // Cerrar sidebar en móvil después de navegar
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={sidebarStyles}>
      {/* Header del sidebar */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#5C6470]">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7B68EE] to-[#FD71AF] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">PA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight">Portal</span>
              <span className="text-gray-300 font-medium text-sm leading-tight">Auditorías</span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            p-2 text-white hover:bg-[#5C6470] rounded-lg 
            transition-all duration-200 hover:-translate-y-0.5
            focus:outline-none focus:ring-2 focus:ring-[#7B68EE]
          "
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? <Icons.ChevronRight className="w-5 h-5" /> : <Icons.ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = item.current;
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`
                group flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg 
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7B68EE]
                ${isActive 
                  ? 'bg-[#7B68EE] text-white shadow-lg transform scale-105 shadow-[#7B68EE]/20' 
                  : 'text-white hover:bg-[rgba(123,104,238,0.1)] hover:text-white hover:-translate-y-0.5'
                }
                ${isCollapsed ? 'justify-center px-2' : 'justify-start'}
              `}
            >
              <item.icon className={`
                ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}
                ${isActive ? 'text-white' : 'text-white group-hover:text-white'}
                transition-all duration-200 flex-shrink-0
              `} />
              {!isCollapsed && (
                <span className="ml-3 transition-all duration-200 truncate">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Área inferior del sidebar */}
      <div className="border-t border-[#5C6470] p-4">
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className={`
              group flex items-center w-full px-3 py-3 text-sm font-medium text-white
              hover:bg-[rgba(123,104,238,0.1)] rounded-lg transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#7B68EE]
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-[#49CCF9] to-[#7B68EE] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {getUserInitials(user)}
                </span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getUserFullName(user)}
                </p>
                <p className="text-xs text-gray-300 truncate">
                  {translateUserRole(user.rol)}
                </p>
              </div>
            )}
          </button>

          {/* Dropdown del usuario */}
          {showUserDropdown && !isCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#292D34] border border-[#5C6470] rounded-lg shadow-xl overflow-hidden z-10">
              <div className="p-3 border-b border-[#5C6470] bg-[#1F2937]">
                <p className="text-sm font-medium text-white truncate">{getUserFullName(user)}</p>
                <p className="text-xs text-gray-300 truncate">{user.email}</p>
                <p className="text-xs text-[#7B68EE] mt-1 font-medium">{translateUserRole(user.rol)}</p>
              </div>
              
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

      {/* Scrollbar personalizado */}
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
      `}</style>
    </div>
  );
};

export default Sidebar;
