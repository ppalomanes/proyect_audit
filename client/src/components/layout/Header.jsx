// Header.jsx - Header con fondo sólido sin transparencia
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  HomeIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import useNotificacionesStore from '../../domains/notificaciones/NotificacionesStore';
import useAuthStore from '../../domains/auth/authStore';
import { useTheme } from '../../contexts/ThemeContext';

const Header = ({ onToggleSidebar, isMobile, sidebarOpen, sidebarCollapsed }) => {
  const { noLeidas } = useNotificacionesStore();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Generar breadcrumb basado en la ruta actual
  const generateBreadcrumb = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    const breadcrumbMap = {
      'dashboard': 'Dashboard',
      'auditorias': 'Auditorías',
      'etl': 'ETL Parque',
      'ia-scoring': 'IA Scoring',
      'chat': 'Mensajería',
      'bitacora': 'Bitácora',
      'reportes': 'Reportes',
      'versiones': 'Versiones',
      'notificaciones': 'Notificaciones',
      'configuracion': 'Configuración',
      'nueva': 'Nueva Auditoría',
      'procesar': 'Procesar ETL',
      'documentos': 'Análisis Documentos',
      'imagenes': 'Análisis Imágenes',
    };

    const breadcrumbs = [
      { label: 'Inicio', href: '/dashboard', icon: HomeIcon }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += '/' + segment;
      const label = breadcrumbMap[segment] || segment;
      
      breadcrumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: currentPath,
        isLast: index === segments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumb();

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'corporate'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      case 'corporate':
        return <BuildingOfficeIcon className="w-5 h-5" />;
      default:
        return <SunIcon className="w-5 h-5" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'corporate':
        return 'Corporativo';
      default:
        return 'Claro';
    }
  };

  return (
    <header className="header-solid">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Left Section - Mobile menu + Breadcrumb */}
          <div className="flex items-center space-x-4">
            
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg bg-card hover-bg-card text-primary transition-all"
                aria-label="Abrir menú"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  {index > 0 && (
                    <ChevronRightIcon className="w-4 h-4 text-muted" />
                  )}
                  
                  {crumb.isLast ? (
                    <span className="text-primary font-medium transition-theme">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.href}
                      className="flex items-center text-secondary hover:text-primary transition-theme"
                    >
                      {crumb.icon && <crumb.icon className="w-4 h-4 mr-1" />}
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Buscar auditorías, proveedores..."
                className="w-full pl-10 pr-4 py-2 bg-card rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Right Section - Actions + Theme + Notifications + User */}
          <div className="flex items-center space-x-3">
            
            {/* Nueva Auditoría Button */}
            <button
              onClick={() => navigate('/auditorias/nueva')}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Nueva Auditoría</span>
            </button>

            {/* Theme Selector */}
            <button
              onClick={cycleTheme}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-card text-primary transition-all group"
              title={`Cambiar tema (actual: ${getThemeLabel()})`}
            >
              <div className="transition-transform group-hover:scale-110">
                {getThemeIcon()}
              </div>
              <span className="hidden lg:block text-sm font-medium">
                {getThemeLabel()}
              </span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notificaciones')}
              className="relative p-2 rounded-lg hover:bg-card text-primary transition-all"
              title="Notificaciones"
            >
              <BellIcon className="w-5 h-5" />
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-primary transition-theme">
                  {user?.nombres || 'Usuario'}
                </div>
                <div className="text-xs text-secondary transition-theme">
                  {user?.rol || 'ADMIN'}
                </div>
              </div>
              
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.nombres ? user.nombres.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;