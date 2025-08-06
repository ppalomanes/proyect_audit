// components/layout/SidebarItem.jsx - VERSIÓN PULIDA SIN CONTORNOS MARCADOS
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useSidebarStore } from '../../stores/sidebarStore';

const SidebarItem = ({ 
  id, 
  icon: Icon, 
  label, 
  href, 
  collapsed, 
  badge,
  children = [] 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveItem } = useSidebarStore();

  const isActive = location.pathname === href || location.pathname.startsWith(href + '/');
  const hasChildren = children.length > 0;

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else {
      setActiveItem(id);
      navigate(href);
    }
  };

  const handleChildClick = (childId, childHref) => {
    setActiveItem(childId);
    navigate(childHref);
  };

  const renderBadge = () => {
    if (!badge) return null;

    const badgeClasses = {
      success: 'bg-green-500/20 text-green-400',
      warning: 'bg-yellow-500/20 text-yellow-400',
      error: 'bg-red-500/20 text-red-400',
      info: 'bg-blue-500/20 text-blue-400',
    };

    return (
      <span className={`
        inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
        ${badgeClasses[badge.type] || badgeClasses.info}
        transition-all
      `}>
        {badge.count}
      </span>
    );
  };

  const mainItemClasses = `
    relative group flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200
    ${isActive 
      ? 'bg-sidebar-active text-white' 
      : 'text-sidebar-primary hover:bg-sidebar-hover hover:text-sidebar-primary'
    }
    ${collapsed ? 'justify-center' : ''}
  `;

  return (
    <li className="relative">
      {/* Item principal */}
      <div
        className={mainItemClasses}
        onClick={handleClick}
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        role="button"
        tabIndex={0}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        
        {!collapsed && (
          <>
            <span className="ml-3 font-medium text-sm truncate flex-1">
              {label}
            </span>
            
            <div className="flex items-center space-x-2">
              {renderBadge()}
              
              {hasChildren && (
                <ChevronRightIcon 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  }`} 
                />
              )}
            </div>
          </>
        )}

        {collapsed && renderBadge() && (
          <div className="absolute -top-1 -right-1">
            {renderBadge()}
          </div>
        )}
      </div>

      {/* Tooltip para modo colapsado */}
      {collapsed && showTooltip && (
        <div className="fixed left-16 z-50 px-3 py-2 ml-2 bg-tertiary rounded-lg shadow-lg text-sm font-medium text-primary transition-theme whitespace-nowrap">
          {label}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-tertiary rotate-45"></div>
        </div>
      )}

      {/* Subitems */}
      {!collapsed && hasChildren && isExpanded && (
        <ul className="ml-8 mt-1 space-y-1 pl-4">
          {children.map((child) => {
            const isChildActive = location.pathname === child.href;
            
            return (
              <li key={child.id}>
                <button
                  onClick={() => handleChildClick(child.id, child.href)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                    ${isChildActive
                      ? 'bg-sidebar-active/50 text-white'
                      : 'text-sidebar-secondary hover:text-sidebar-primary hover:bg-sidebar-hover'
                    }
                  `}
                >
                  {child.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

export default SidebarItem;