// components/layout/Sidebar.jsx - VERSIÓN REFINADA SIN CONTORNOS
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentCheckIcon,
  CogIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  BellIcon,
  CheckCircleIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';

import { useSidebarStore } from '../../stores/sidebarStore';
import useNotificacionesStore from '../../domains/notificaciones/NotificacionesStore';
import useAuthStore from '../../domains/auth/authStore';
import SidebarItem from './SidebarItem';

const Sidebar = () => {
  const location = useLocation();
  const { 
    collapsed, 
    toggleCollapsed,
    setActiveItem
  } = useSidebarStore();
  const { noLeidas } = useNotificacionesStore();
  const { user, logout } = useAuthStore();

  // Configuración del menú
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
    },
    {
      id: "auditorias",
      label: "Auditorías",
      href: "/auditorias",
      icon: DocumentCheckIcon,
      badge: { count: 3, type: "success" },
      children: [
        { id: "auditorias-todas", label: "Todas las Auditorías", href: "/auditorias" },
        { id: "auditorias-nueva", label: "Nueva Auditoría", href: "/auditorias/nueva" },
        { id: "auditorias-progreso", label: "En Progreso", href: "/auditorias?estado=CARGA_PRESENCIAL,CARGA_PARQUE" },
        { id: "auditorias-completadas", label: "Completadas", href: "/auditorias?estado=COMPLETADA" },
        { id: "auditorias-reportes", label: "Reportes", href: "/reportes/auditorias" },
      ],
    },
    {
      id: "etl-parque",
      label: "ETL Parque",
      href: "/etl",
      icon: BeakerIcon,
      badge: { count: 2, type: "warning" },
      children: [
        { id: "etl-procesar", label: "Procesar Archivos", href: "/etl/procesar" },
        { id: "etl-validaciones", label: "Validaciones", href: "/etl/validaciones" },
        { id: "etl-historial", label: "Historial ETL", href: "/etl/historial" },
        { id: "etl-configuracion", label: "Configuración", href: "/etl/configuracion" },
      ],
    },
    {
      id: "ia-scoring",
      label: "IA Scoring",
      href: "/ia-scoring",
      icon: CogIcon,
      children: [
        { id: "ia-documentos", label: "Análisis Documentos", href: "/ia-scoring/documentos" },
        { id: "ia-imagenes", label: "Análisis Imágenes", href: "/ia-scoring/imagenes" },
        { id: "ia-resultados", label: "Resultados", href: "/ia-scoring/resultados" },
        { id: "ia-config", label: "Configuración IA", href: "/ia-scoring/config" },
      ],
    },
    {
      id: "mensajeria",
      label: "Mensajería",
      href: "/chat",
      icon: ChatBubbleLeftRightIcon,
      badge: { count: 5, type: "info" },
      children: [
        { id: "chat-conversaciones", label: "Conversaciones", href: "/chat/conversaciones" },
        { id: "chat-global", label: "Chat Global", href: "/chat/global" },
        { id: "chat-notificaciones", label: "Notificaciones", href: "/chat/notificaciones" },
      ],
    },
    {
      id: "bitacora",
      label: "Bitácora",
      href: "/bitacora",
      icon: ClipboardDocumentListIcon,
      children: [
        { id: "bitacora-actividad", label: "Actividad", href: "/bitacora/actividad" },
        { id: "bitacora-cambios", label: "Cambios", href: "/bitacora/cambios" },
        { id: "bitacora-reportes", label: "Reportes", href: "/bitacora/reportes" },
      ],
    },
    {
      id: "reportes",
      label: "Reportes",
      href: "/reportes",
      icon: ChartBarIcon,
      children: [
        { id: "reportes-ejecutivo", label: "Dashboard Ejecutivo", href: "/reportes/ejecutivo" },
        { id: "reportes-metricas", label: "Métricas", href: "/reportes/metricas" },
        { id: "reportes-exportar", label: "Exportar", href: "/reportes/exportar" },
      ],
    },
    {
      id: "versiones",
      label: "Versiones",
      href: "/versiones",
      icon: ArchiveBoxIcon,
      children: [
        { id: "versiones-control", label: "Control Versiones", href: "/versiones/control" },
        { id: "versiones-historial", label: "Historial", href: "/versiones/historial" },
        { id: "versiones-comparar", label: "Comparar", href: "/versiones/comparar" },
      ],
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      href: "/notificaciones",
      icon: BellIcon,
      badge: noLeidas > 0 ? { count: noLeidas, type: "error" } : null,
    },
    {
      id: "configuracion",
      label: "Configuración",
      href: "/configuracion",
      icon: Cog6ToothIcon,
      children: [
        { id: "config-general", label: "General", href: "/configuracion/general" },
        { id: "config-usuarios", label: "Usuarios", href: "/configuracion/usuarios" },
        { id: "config-sistema", label: "Sistema", href: "/configuracion/sistema" },
      ],
    },
  ];

  // Detectar item activo basado en la ruta actual
  useEffect(() => {
    const path = location.pathname;
    
    // Buscar item activo
    for (const item of menuItems) {
      if (path === item.href || path.startsWith(item.href + '/')) {
        setActiveItem(item.id);
        return;
      }
      
      // Buscar en subitems
      if (item.children) {
        for (const child of item.children) {
          if (path === child.href || path.startsWith(child.href + '/')) {
            setActiveItem(child.id);
            return;
          }
        }
      }
    }
    
    // Default dashboard
    if (path === '/') {
      setActiveItem('dashboard');
    }
  }, [location.pathname, setActiveItem]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getUserInitials = () => {
    if (!user?.nombre) return 'U';
    return user.nombre.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-full bg-sidebar-primary transition-theme no-scrollbar">
      
      {/* Header del Sidebar - CLICK PARA EXPANDIR/COLAPSAR */}
      <div 
        className="flex items-center p-4 cursor-pointer hover:bg-sidebar-hover transition-all"
        onClick={toggleCollapsed}
        title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sidebar-primary font-semibold text-base transition-theme">
                Portal Auditorías
              </h1>
              <p className="text-sidebar-secondary text-xs transition-theme">
                Técnicas
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              {...item}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>
      
      {/* Footer del Sidebar */}
      <div className="p-4">
        
        {/* Información del usuario */}
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {getUserInitials()}
            </span>
          </div>
          
          {!collapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-sidebar-primary font-medium text-sm truncate transition-theme">
                {user?.nombre || 'Usuario'}
              </div>
              <div className="text-sidebar-secondary text-xs truncate transition-theme">
                {user?.rol || 'Portal Auditorías'}
              </div>
            </div>
          )}
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={handleLogout}
          className={`
            flex items-center w-full p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all
            ${collapsed ? 'justify-center' : ''}
          `}
          title="Cerrar Sesión"
        >
          <PowerIcon className="w-5 h-5" />
          {!collapsed && (
            <span className="ml-3 text-sm font-medium">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;