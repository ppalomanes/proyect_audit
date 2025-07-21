/**
 * Sidebar ClickUp Style - Portal de Auditorías Técnicas
 * 
 * Replica exacta del diseño de ClickUp observado en las imágenes:
 * - Colores: Fondo azul oscuro #1a1f36, texto blanco, elementos activos azul claro
 * - Estructura: Workspace branding, navegación jerárquica, secciones expandibles
 * - Comportamiento: Expansión/colapso suave, estados hover/active precisos
 * - Tipografía: Plus Jakarta Sans, jerarquía clara, badges y contadores
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from './Icons';

// Store de autenticación
import { useAuthStore } from '../../domains/auth/authStore';
import { getUserInitials, getUserFullName, translateUserRole } from '../../utils/userUtils';

// Configuración de navegación principal - Estructura ClickUp
const getMainNavigation = (userRole, currentPath) => {
  const mainNav = [
    { 
      id: 'dashboard',
      name: 'Inicio', 
      href: '/dashboard', 
      icon: Icons.Dashboard, 
      current: currentPath === '/dashboard' 
    },
    { 
      id: 'auditorias',
      name: 'Auditorías', 
      href: '/auditorias', 
      icon: Icons.Auditorias, 
      current: currentPath === '/auditorias',
      badge: '2' // Ejemplo de badge activo
    },
    { 
      id: 'etl',
      name: 'ETL', 
      href: '/etl', 
      icon: Icons.ETL, 
      current: currentPath === '/etl' 
    },
    { 
      id: 'ia',
      name: 'IA Scoring', 
      href: '/ia', 
      icon: Icons.IA, 
      current: currentPath === '/ia' 
    },
    { 
      id: 'chat',
      name: 'Chat', 
      href: '/chat', 
      icon: Icons.Chat, 
      current: currentPath.startsWith('/chat'),
      isActive: currentPath.startsWith('/chat') // Chat siempre destacado como en ClickUp
    },
    { 
      id: 'reportes',
      name: 'Reportes', 
      href: '/reportes', 
      icon: Icons.Reportes, 
      current: currentPath === '/reportes' 
    }
  ];

  // Administración solo para ADMIN
  if (userRole === 'ADMIN') {
    mainNav.push({
      id: 'admin',
      name: 'Administración',
      href: '/admin',
      icon: Icons.Admin,
      current: currentPath === '/admin'
    });
  }

  return mainNav;
};

// Configuración de secciones expandibles - Estilo ClickUp
const getWorkspaceSections = (currentPath) => {
  return [
    {
      id: 'favoritos',
      name: 'Favoritos',
      icon: Icons.Star,
      items: [
        { id: 'fav-1', name: 'Dashboard Principal', href: '/dashboard', icon: Icons.Dashboard },
        { id: 'fav-2', name: 'Auditorías Activas', href: '/auditorias?filter=active', icon: Icons.Auditorias }
      ]
    },
    {
      id: 'espacios',
      name: 'Espacios',
      icon: Icons.Folder,
      items: [
        { 
          id: 'space-all', 
          name: 'Todo', 
          href: '/espacios/todo', 
          icon: Icons.Globe,
          current: currentPath === '/espacios/todo'
        },
        { 
          id: 'space-team', 
          name: 'Espacio del equipo [ES]', 
          href: '/espacios/equipo', 
          icon: Icons.Users,
          current: currentPath === '/espacios/equipo',
          color: '#7B68EE' // Color corporativo
        }
      ],
      actions: [
        { id: 'create-space', name: 'Crear espacio', icon: Icons.Plus }
      ]
    }
  ];
};

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  
  // Estados locales para manejo de expansión
  const [expandedSections, setExpandedSections] = useState(new Set(['espacios']));
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Verificación de seguridad
  if (!isAuthenticated || !user) {
    return <SidebarSkeleton isCollapsed={isCollapsed} />;
  }

  const mainNavigation = getMainNavigation(user.rol, location.pathname);
  const workspaceSections = getWorkspaceSections(location.pathname);

  // Clases dinámicas para el sidebar
  const sidebarClasses = `
    clickup-sidebar fixed inset-y-0 left-0 z-50 flex flex-col
    ${isCollapsed ? 'clickup-sidebar-collapsed' : 'clickup-sidebar-expanded'}
    transition-all duration-300 ease-out
    ${isMobile && !isCollapsed ? 'shadow-2xl' : ''}
  `;

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleNavigation = (href) => {
    navigate(href);
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={sidebarClasses}>
      {/* Header del workspace - Estilo ClickUp */}
      <div className="clickup-sidebar-header">
        {!isCollapsed && (
          <div className="clickup-workspace-brand">
            <div className="clickup-workspace-avatar">
              <span className="clickup-workspace-initial">B</span>
            </div>
            <div className="clickup-workspace-info">
              <span className="clickup-workspace-name">BITÁCORA</span>
              <span className="clickup-workspace-type">Espacio de trabajo</span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="clickup-collapse-btn"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navegación principal - Lista estilo ClickUp */}
      <nav className="clickup-main-nav">
        {mainNavigation.map((item) => (
          <NavigationItem 
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigation(item.href)}
          />
        ))}
      </nav>

      {/* Secciones de workspace expandibles */}
      {!isCollapsed && (
        <div className="clickup-workspace-sections">
          {workspaceSections.map((section) => (
            <WorkspaceSection
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              onNavigate={handleNavigation}
            />
          ))}
        </div>
      )}

      {/* Área de usuario inferior */}
      <div className="clickup-user-area">
        <UserProfile 
          user={user}
          isCollapsed={isCollapsed}
          showDropdown={showUserDropdown}
          setShowDropdown={setShowUserDropdown}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
};

// Componente NavigationItem - Elemento de navegación principal
const NavigationItem = ({ item, isCollapsed, onClick }) => {
  const isActive = item.current || item.isActive;
  
  return (
    <button
      onClick={onClick}
      className={`clickup-nav-item ${isActive ? 'clickup-nav-item-active' : ''}`}
      title={isCollapsed ? item.name : undefined}
    >
      <item.icon className="clickup-nav-icon" />
      {!isCollapsed && (
        <>
          <span className="clickup-nav-label">{item.name}</span>
          {item.badge && (
            <span className="clickup-nav-badge">{item.badge}</span>
          )}
        </>
      )}
    </button>
  );
};

// Componente WorkspaceSection - Sección expandible
const WorkspaceSection = ({ section, isExpanded, onToggle, onNavigate }) => {
  return (
    <div className="clickup-workspace-section">
      <button
        onClick={onToggle}
        className="clickup-section-header"
      >
        <section.icon className="clickup-section-icon" />
        <span className="clickup-section-title">{section.name}</span>
        <Icons.ChevronRight 
          className={`clickup-section-chevron ${isExpanded ? 'clickup-section-chevron-expanded' : ''}`} 
        />
      </button>
      
      {isExpanded && (
        <div className="clickup-section-content">
          {section.items?.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.href)}
              className={`clickup-section-item ${item.current ? 'clickup-section-item-active' : ''}`}
              style={item.color ? { '--item-color': item.color } : {}}
            >
              <item.icon className="clickup-section-item-icon" />
              <span className="clickup-section-item-name">{item.name}</span>
            </button>
          ))}
          
          {section.actions?.map((action) => (
            <button
              key={action.id}
              className="clickup-section-action"
            >
              <action.icon className="clickup-section-action-icon" />
              <span className="clickup-section-action-name">{action.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente UserProfile - Área de usuario
const UserProfile = ({ user, isCollapsed, showDropdown, setShowDropdown, onNavigate, onLogout }) => {
  if (isCollapsed) {
    return (
      <button
        className="clickup-user-profile-collapsed"
        title={getUserFullName(user)}
      >
        <div className="clickup-user-avatar-small">
          <span>{getUserInitials(user)}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="clickup-user-profile">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="clickup-user-profile-btn"
      >
        <div className="clickup-user-avatar">
          <span>{getUserInitials(user)}</span>
        </div>
        <div className="clickup-user-info">
          <span className="clickup-user-name">{getUserFullName(user)}</span>
          <span className="clickup-user-role">{translateUserRole(user.rol)}</span>
        </div>
        <Icons.ChevronDown className="clickup-user-chevron" />
      </button>

      {showDropdown && (
        <div className="clickup-user-dropdown">
          <div className="clickup-user-dropdown-header">
            <span className="clickup-user-dropdown-name">{getUserFullName(user)}</span>
            <span className="clickup-user-dropdown-email">{user.email}</span>
          </div>
          
          <button 
            onClick={() => onNavigate('/perfil')}
            className="clickup-user-dropdown-item"
          >
            <Icons.User className="w-4 h-4" />
            Mi Perfil
          </button>
          
          <button 
            onClick={() => onNavigate('/configuracion')}
            className="clickup-user-dropdown-item"
          >
            <Icons.Settings className="w-4 h-4" />
            Configuración
          </button>
          
          <div className="clickup-user-dropdown-divider" />
          
          <button
            onClick={onLogout}
            className="clickup-user-dropdown-item clickup-user-dropdown-logout"
          >
            <Icons.Logout className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

// Componente SidebarSkeleton - Loading state
const SidebarSkeleton = ({ isCollapsed }) => {
  return (
    <div className={`clickup-sidebar ${isCollapsed ? 'clickup-sidebar-collapsed' : 'clickup-sidebar-expanded'}`}>
      <div className="clickup-sidebar-header">
        {!isCollapsed && (
          <div className="animate-pulse flex items-center space-x-3">
            <div className="clickup-workspace-avatar bg-gray-600"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-600 rounded w-20"></div>
              <div className="h-3 bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        )}
        <div className="w-6 h-6 bg-gray-600 rounded animate-pulse"></div>
      </div>
      
      <div className="clickup-main-nav">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-600 rounded-lg animate-pulse mx-3 mb-2"></div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;