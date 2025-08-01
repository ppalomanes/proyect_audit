// client/src/components/layout/MainLayout.jsx
import { useState, useEffect } from "react";
import useAuthStore from "../../domains/auth/authStore";
import { useNotificacionesStore } from "../../domains/notificaciones/NotificacionesStore";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuthStore();
  const { fetchNotificaciones, iniciarPolling, detenerPolling } = useNotificacionesStore();

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setSidebarCollapsed(false); // En móvil no hay colapso, solo open/close
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Inicializar notificaciones cuando el usuario esté autenticado
  useEffect(() => {
    if (user) {
      // Cargar notificaciones iniciales
      fetchNotificaciones();
      // Iniciar polling cada 30 segundos
      iniciarPolling(30000);
      
      // Cleanup al desmontar
      return () => {
        detenerPolling();
      };
    }
  }, [user, fetchNotificaciones, iniciarPolling, detenerPolling]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Calcular el margen izquierdo dinámicamente
  const getMainContentMargin = () => {
    if (isMobile) {
      return "ml-0"; // En móvil siempre 0
    }
    
    if (!sidebarOpen) {
      return "ml-0"; // Sidebar cerrado
    }
    
    return sidebarCollapsed ? "md:ml-16" : "md:ml-64"; // Sidebar abierto (colapsado o expandido)
  };

  // Calcular el margen del header dinámicamente  
  const getHeaderMargin = () => {
    if (isMobile) {
      return "left-0"; // En móvil siempre full width
    }
    
    if (!sidebarOpen) {
      return "left-0"; // Sidebar cerrado
    }
    
    return sidebarCollapsed ? "md:left-16" : "md:left-64"; // Sidebar abierto (colapsado o expandido)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        isCollapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />

      {/* Header */}
      <div className={`fixed top-0 right-0 ${getHeaderMargin()} bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 z-30 h-16 transition-all duration-300 ease-in-out`}>
        <Header 
          user={user} 
          onToggleSidebar={toggleSidebar} 
          onLogout={logout} 
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ease-in-out ${getMainContentMargin()} pt-16`}
      >
        {/* Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;