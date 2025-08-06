// components/layout/SidebarFooter.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronUpIcon,
  Cog6ToothIcon,
  PowerIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../domains/auth/authStore';

const SidebarFooter = ({ collapsed }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user?.nombre) return 'U';
    return user.nombre.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <footer className="sidebar-footer-border bg-sidebar-primary">
      <div className="p-4">
        
        {/* Información del usuario */}
        <div className="relative">
          <button
            onClick={() => !collapsed && setShowUserMenu(!showUserMenu)}
            className="flex items-center w-full p-2 rounded-lg hover:bg-sidebar-hover transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-haspopup="true"
            aria-expanded={showUserMenu}
            title={collapsed ? user?.nombre || 'Usuario' : undefined}
          >
            
            {/* Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {getUserInitials()}
              </span>
            </div>
            
            {/* Información de usuario (solo cuando no está colapsado) */}
            {!collapsed && (
              <>
                <div className="ml-3 text-left flex-1 min-w-0">
                  <div className="text-sidebar-primary font-medium text-sm truncate">
                    {user?.nombre || 'Usuario'}
                  </div>
                  <div className="text-sidebar-secondary text-xs truncate">
                    {user?.rol || 'Portal Auditorías'}
                  </div>
                </div>
                
                <ChevronUpIcon 
                  className={`w-4 h-4 text-sidebar-secondary transition-transform duration-200 ${
                    showUserMenu ? 'rotate-180' : ''
                  }`} 
                />
              </>
            )}
          </button>
          
          {/* Menú desplegable de usuario (solo cuando no está colapsado) */}
          {showUserMenu && !collapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-sidebar-primary border border-sidebar-primary rounded-lg shadow-lg py-2 z-50">
              
              {/* Perfil */}
              <button 
                onClick={() => navigate('/perfil')}
                className="flex items-center w-full px-4 py-2 text-sidebar-primary hover:bg-sidebar-hover transition-colors text-sm"
              >
                <UserCircleIcon className="w-4 h-4 mr-3 text-sidebar-secondary" />
                Mi Perfil
              </button>
              
              {/* Configuración */}
              <button 
                onClick={() => navigate('/configuracion')}
                className="flex items-center w-full px-4 py-2 text-sidebar-primary hover:bg-sidebar-hover transition-colors text-sm"
              >
                <Cog6ToothIcon className="w-4 h-4 mr-3 text-sidebar-secondary" />
                Configuración
              </button>
              
              {/* Separador */}
              <div className="border-t border-sidebar-primary my-2"></div>
              
              {/* Cerrar sesión */}
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm"
              >
                <PowerIcon className="w-4 h-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
        
        {/* Botón de cerrar sesión directo (solo cuando está colapsado) */}
        {collapsed && (
          <div className="mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-red-500"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <PowerIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </footer>
  );
};

export default SidebarFooter;