// client/src/components/layout/Sidebar.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../domains/auth/authStore";
import { useNotificacionesStore } from "../../domains/notificaciones/NotificacionesStore";
import {
  HomeIcon,
  DocumentCheckIcon,
  CogIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PowerIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ isOpen, onClose, isMobile, isCollapsed, onCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { noLeidas } = useNotificacionesStore();
  const [expandedMenus, setExpandedMenus] = useState({});
  // isCollapsed y onCollapse ahora vienen como props desde MainLayout

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      path: "/dashboard",
      icon: HomeIcon,
      badge: null,
    },
    {
      id: "auditorias",
      name: "Auditorías",
      path: "/auditorias",
      icon: DocumentCheckIcon,
      badge: { count: 3, type: "success" },
      subItems: [
        { name: "Todas las Auditorías", path: "/auditorias" },
        { name: "Nueva Auditoría", path: "/auditorias", action: "nueva" },
        { name: "En Progreso", path: "/auditorias?estado=CARGA_PRESENCIAL,CARGA_PARQUE" },
        { name: "Completadas", path: "/auditorias?estado=COMPLETADA" },
        { name: "Reportes", path: "/reportes/auditorias" },
      ],
    },
    {
      id: "etl",
      name: "ETL Parque",
      path: "/etl",
      icon: CogIcon,
      badge: { count: 2, type: "success" },
      subItems: [
        { name: "Cargar Datos", path: "/etl/upload" },
        { name: "Procesos", path: "/etl/procesos" },
        { name: "Validaciones", path: "/etl/validaciones" },
      ],
    },
    {
      id: "ia-scoring",
      name: "IA Scoring",
      path: "/ia-scoring",
      icon: BeakerIcon,
      badge: null,
      subItems: [
        { name: "Análisis Documentos", path: "/ia-scoring/documentos" },
        { name: "Análisis Imágenes", path: "/ia-scoring/imagenes" },
        { name: "Resultados", path: "/ia-scoring/resultados" },
      ],
    },
    {
      id: "chat",
      name: "Mensajería",
      path: "/chat",
      icon: ChatBubbleLeftRightIcon,
      badge: { count: 5, type: "success" },
    },
    {
      id: "bitacora",
      name: "Bitácora",
      path: "/bitacora",
      icon: ClipboardDocumentListIcon,
      badge: null,
    },
    {
      id: "versiones",
      name: "Versiones",
      path: "/versiones",
      icon: ArchiveBoxIcon,
      badge: null,
    },
    {
      id: "notificaciones",
      name: "Notificaciones",
      path: "/notificaciones",
      icon: BellIcon,
      badge: noLeidas > 0 ? { count: noLeidas, type: "success" } : null,
    },
    {
      id: "reportes",
      name: "Reportes",
      path: "/reportes",
      icon: ChartBarIcon,
      badge: null,
    },
  ];

  const isActiveItem = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isActiveSubItem = (path) => {
    return location.pathname === path;
  };

  const toggleSubmenu = (itemId) => {
    if (isCollapsed) return; // No expandir en modo colapsado
    setExpandedMenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleNavigation = (path, item = null) => {
    // Manejo especial para Nueva Auditoria
    if (item && item.action === 'nueva') {
      // Navegar a la página de auditorías y el componente se encargará del modal
      navigate('/auditorias?action=nueva');
      if (isMobile) {
        onClose();
      }
      return;
    }
    
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleCollapse = () => {
    onCollapse(!isCollapsed);
    // Cerrar todos los submenús cuando colapsamos
    if (!isCollapsed) {
      setExpandedMenus({});
    }
  };

  const renderBadge = (badge, isCollapsedMode = false) => {
    if (!badge) return null;

    // Unificar todos los badges al color verde (success)
    const badgeClass =
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";

    // Tamaño diferente para modo colapsado
    const sizeClass = isCollapsedMode
      ? "px-1.5 py-0.5 text-xs min-w-[1rem] h-4"
      : "px-2 py-0.5 text-xs min-w-[1.25rem] h-5";

    return (
      <span
        className={`inline-flex items-center justify-center font-medium rounded-full ${sizeClass} ${badgeClass}`}
      >
        {badge.count}
      </span>
    );
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-30 ${sidebarWidth} transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } bg-[#1a1f36] shadow-lg`}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center justify-between h-16 px-4 border-b border-gray-700 relative"
          style={{ flexShrink: 0 }}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-sm font-semibold">Portal Auditorías</h1>
                <p className="text-xs text-gray-300">Técnicas</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="flex items-center justify-center w-full relative">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
              
              {/* Collapse Toggle Button para modo colapsado - DENTRO del header colapsado */}
              {!isMobile && (
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                  <button
                    onClick={toggleCollapse}
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700/50 transition-all duration-200 focus:outline-none"
                    title="Expandir sidebar"
                  >
                    <div className="flex flex-col space-y-0.5">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Collapse Toggle Button - DENTRO del header solo cuando está expandido */}
          {!isMobile && !isCollapsed && (
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
              <button
                onClick={toggleCollapse}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700/50 transition-all duration-200 focus:outline-none"
                title="Colapsar sidebar"
              >
                <div className="flex flex-col space-y-0.5">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </button>
            </div>
          )}

          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 text-gray-300 transition-colors rounded-md hover:text-white hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div
          className="px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-gray-500"
          style={{
            flex: 1,
            paddingBottom: "120px", // Espacio optimizado para el footer
            marginBottom: "0",
          }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item.path);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus[item.id] && !isCollapsed;

            return (
              <div key={item.id}>
                {/* Main Menu Item */}
                <div
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 relative ${
                    isActive
                      ? "bg-blue-500/20 text-white border-l-4 border-blue-400"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                  onClick={() => {
                    if (hasSubItems && !isCollapsed) {
                      toggleSubmenu(item.id);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  title={isCollapsed ? item.name : ""}
                >
                  <Icon
                    className={`flex-shrink-0 w-5 h-5 ${
                      isCollapsed ? "" : "mr-3"
                    } ${isActive ? "text-blue-300" : ""}`}
                  />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 min-w-0 truncate">
                        {item.name}
                      </span>

                      <div className="flex items-center ml-auto space-x-2">
                        {renderBadge(item.badge, false)}
                        {hasSubItems && (
                          <svg
                            className={`h-4 w-4 transform transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </>
                  )}

                  {isCollapsed && item.badge && (
                    <div className="absolute z-10 -top-1 -right-1">
                      {renderBadge(item.badge, true)}
                    </div>
                  )}
                </div>

                {/* Submenu Items */}
                {hasSubItems && isExpanded && !isCollapsed && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = isActiveSubItem(subItem.path);
                      return (
                        <div
                          key={subItem.path}
                          className={`group flex items-center pl-7 pr-3 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 relative ${
                            isSubActive
                              ? "bg-blue-500/20 text-white border-l-4 border-blue-400"
                              : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                          }`}
                          onClick={() => handleNavigation(subItem.path, subItem)}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-3 opacity-70 ${
                            isSubActive ? "bg-blue-300" : "bg-current"
                          }`} />
                          <span className="flex-1 min-w-0 truncate">
                            {subItem.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer - REALMENTE Fixed at bottom */}
        <div
          className="border-t border-gray-700/60 bg-[#1a1f36] backdrop-blur-sm"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            minHeight: "110px",
          }}
        >
          {/* Divider visual mejorado */}
          <div className="h-px mt-1 mb-3 bg-gradient-to-r from-transparent via-gray-500/60 to-transparent"></div>

          <div className={`px-3 pb-3 space-y-1.5 ${isCollapsed ? "space-y-2" : ""}`}>
            <button
              onClick={() => handleNavigation("/configuracion")}
              className={`flex items-center w-full text-sm font-medium text-gray-300 transition-all duration-200 rounded-md group hover:bg-gray-700/60 hover:text-white ${
                isCollapsed ? "justify-center p-2.5" : "px-3 py-2"
              } ${location.pathname === '/configuracion' ? 'bg-blue-500/20 text-white border-l-2 border-blue-400' : ''}`}
              title={isCollapsed ? "Configuración" : ""}
            >
              <Cog6ToothIcon
                className={`w-4 h-4 ${isCollapsed ? "" : "mr-3"} transition-transform group-hover:rotate-45`}
              />
              {!isCollapsed && "Configuración"}
            </button>

            <button
              onClick={handleLogout}
              className={`flex items-center w-full text-sm font-medium text-gray-300 transition-all duration-200 rounded-md group hover:bg-red-600/80 hover:text-white transform hover:scale-105 ${
                isCollapsed ? "justify-center p-2.5" : "px-3 py-2"
              }`}
              title={isCollapsed ? "Cerrar Sesión" : ""}
            >
              <PowerIcon className={`w-4 h-4 ${isCollapsed ? "" : "mr-3"} transition-transform group-hover:rotate-12`} />
              {!isCollapsed && "Cerrar Sesión"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;