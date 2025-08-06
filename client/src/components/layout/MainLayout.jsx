// components/layout/MainLayout.jsx - VERSIÓN UNIFICADA CON SISTEMA DE TEMAS
import React, { useEffect } from "react";
import useAuthStore from "../../domains/auth/authStore";
import { useNotificacionesStore } from "../../domains/notificaciones/NotificacionesStore";
import { useTheme } from "../../contexts/ThemeContext";
import { useSidebarStore } from "../../stores/sidebarStore";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = ({ children }) => {
  const { user } = useAuthStore();
  const { fetchNotificaciones, iniciarPolling, detenerPolling } = useNotificacionesStore();
  const { theme } = useTheme();
  const { collapsed, showSidebar, setShowSidebar } = useSidebarStore();

  // Inicializar notificaciones cuando el usuario esté autenticado
  useEffect(() => {
    if (user) {
      fetchNotificaciones();
      iniciarPolling(60000); // 60 segundos
      
      return () => {
        detenerPolling();
      };
    }
  }, [user, fetchNotificaciones, iniciarPolling, detenerPolling]);

  // Detectar si es móvil y manejar el estado del sidebar
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      
      if (!isMobile) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setShowSidebar]);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Calcular clases CSS dinámicamente usando sistema unificado
  const sidebarWidth = collapsed ? 'w-16' : 'w-64';
  const mainMargin = collapsed ? 'ml-16' : 'ml-64';

  return (
    <div 
      className="min-h-screen bg-primary transition-theme main-scroll"
      data-theme={theme}
    >
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} transform transition-all duration-300 ease-in-out ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <Sidebar />
      </div>

      {/* Mobile backdrop */}
      {showSidebar && (
        <div 
          className="mobile-backdrop show lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main content area - Desktop */}
      <div className={`${mainMargin} transition-all duration-300 hidden lg:block`}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-secondary border-b border-primary transition-theme">
          <Header 
            onToggleSidebar={toggleSidebar}
            isMobile={false}
            sidebarOpen={showSidebar}
            sidebarCollapsed={collapsed}
          />
        </div>

        {/* Main content */}
        <main className="p-6 bg-primary min-h-screen transition-theme">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-secondary border-b border-primary transition-theme">
          <Header 
            onToggleSidebar={toggleSidebar}
            isMobile={true}
            sidebarOpen={showSidebar}
            sidebarCollapsed={collapsed}
          />
        </div>

        {/* Mobile content */}
        <main className="p-4 bg-primary min-h-screen transition-theme">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;