// components/layout/SidebarHeader.jsx
import React from 'react';
import { 
  ChevronLeftIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const SidebarHeader = ({ collapsed, toggleCollapsed }) => {
  return (
    <header className="flex items-center justify-between p-4 border-b border-sidebar-primary sidebar-header-shadow bg-sidebar-primary">
      
      {/* Logo y título cuando no está colapsado */}
      {!collapsed && (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <CheckCircleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sidebar-primary font-semibold text-base tracking-tight">
              Portal Auditorías
            </h1>
            <p className="text-sidebar-secondary text-xs">
              Técnicas
            </p>
          </div>
        </div>
      )}

      {/* Solo logo cuando está colapsado */}
      {collapsed && (
        <div className="flex items-center justify-center w-full">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <CheckCircleIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Botón de colapso/expansión - siempre visible */}
      <button
        onClick={toggleCollapsed}
        className="p-2 rounded-lg hover:bg-sidebar-hover transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        <ChevronLeftIcon 
          className={`w-5 h-5 text-sidebar-secondary transition-transform duration-300 ${
            collapsed ? 'rotate-180' : ''
          }`} 
        />
      </button>
    </header>
  );
};

export default SidebarHeader;