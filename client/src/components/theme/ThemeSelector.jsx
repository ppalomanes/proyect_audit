// ThemeSelector.jsx - Selector de tema profesional mejorado
import React from 'react';
import { SunIcon, MoonIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeSelector = ({ variant = 'button' }) => {
  const { theme, toggleTheme, setTheme, availableThemes } = useTheme();

  const themeConfig = {
    light: {
      icon: SunIcon,
      label: 'Claro',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100'
    },
    dark: {
      icon: MoonIcon,
      label: 'Oscuro',
      color: 'text-blue-400',
      bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
    },
    corporate: {
      icon: BuildingOfficeIcon,
      label: 'Corporativo',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    }
  };

  const currentConfig = themeConfig[theme] || themeConfig.dark;
  const CurrentIcon = currentConfig.icon;

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg transition-all duration-200 hover:scale-105 group relative"
        style={{
          backgroundColor: 'var(--hover-bg)',
          color: 'var(--text-secondary)'
        }}
        title={`Cambiar tema (actual: ${currentConfig.label})`}
        aria-label="Cambiar tema"
      >
        <CurrentIcon className={`h-5 w-5 transition-all duration-300 group-hover:rotate-12 ${currentConfig.color}`} />
        
        {/* Indicator dot */}
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative group">
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: 'var(--hover-bg)',
            color: 'var(--text-secondary)'
          }}
        >
          <CurrentIcon className={`h-4 w-4 ${currentConfig.color}`} />
          <span className="text-sm font-medium">{currentConfig.label}</span>
        </button>
        
        {/* Dropdown menu (opcional para futuro) */}
        <div className="absolute top-full right-0 mt-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div 
            className="rounded-lg shadow-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-primary)'
            }}
          >
            {availableThemes.map((themeName) => {
              const config = themeConfig[themeName];
              const Icon = config.icon;
              return (
                <button
                  key={themeName}
                  onClick={() => setTheme(themeName)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors ${
                    theme === themeName ? 'font-medium' : 'font-normal'
                  }`}
                  style={{
                    backgroundColor: theme === themeName ? 'var(--active-bg)' : 'transparent',
                    color: theme === themeName ? 'var(--brand-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Variant 'full' - Toggle con switch
  return (
    <div className="flex items-center space-x-3">
      <span 
        className="text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        Tema:
      </span>
      
      {/* Custom toggle switch */}
      <div className="flex items-center space-x-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {availableThemes.map((themeName) => {
          const config = themeConfig[themeName];
          const Icon = config.icon;
          const isActive = theme === themeName;
          
          return (
            <button
              key={themeName}
              onClick={() => setTheme(themeName)}
              className={`p-2 rounded-md transition-all duration-200 relative group ${
                isActive ? 'shadow-md' : 'hover:shadow-sm'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-muted)'
              }}
              title={config.label}
            >
              <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 rounded-md border-2 border-white/20 pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Current theme label */}
      <span 
        className="text-xs px-2 py-1 rounded-full"
        style={{
          backgroundColor: 'var(--active-bg)',
          color: 'var(--text-muted)'
        }}
      >
        {currentConfig.label}
      </span>
    </div>
  );
};

export default ThemeSelector;