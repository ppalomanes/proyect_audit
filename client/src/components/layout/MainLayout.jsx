/**
 * Layout principal del Portal de Auditorías Técnicas
 * Integra Sidebar + TopNavbar con tema oscuro
 * 
 * Características:
 * - Layout responsive mobile-first
 * - Sidebar colapsible con persistencia
 * - Integración con sistema de autenticación
 * - Overlay para móvil
 * - Transiciones suaves
 */

import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useSidebarState } from '../../hooks/useSidebarState';

const MainLayout = ({ children }) => {
  const { isCollapsed, setIsCollapsed, isMobile } = useSidebarState();

  // Cerrar sidebar en mobile al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && !isCollapsed) {
        const sidebar = document.getElementById('main-sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          setIsCollapsed(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isCollapsed, setIsCollapsed]);

  // Cerrar dropdowns al cambiar ruta (para navegación por teclado)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        // Cerrar dropdowns abiertos si existen
        const dropdowns = document.querySelectorAll('[data-dropdown]');
        dropdowns.forEach(dropdown => {
          if (dropdown.style.display !== 'none') {
            dropdown.style.display = 'none';
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Configuración de márgenes para el contenido principal
  const contentMargin = isCollapsed ? 'ml-20' : 'ml-64';
  const topNavbarHeight = 'pt-16'; // 64px height del navbar

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div id="main-sidebar">
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isMobile={isMobile} 
        />
      </div>

      {/* Overlay para mobile cuando sidebar está abierto */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Top Navbar */}
      <TopNavbar isCollapsed={isCollapsed} />

      {/* Contenido Principal */}
      <main className={`
        ${topNavbarHeight} transition-all duration-300 ease-out min-h-screen
        ${isMobile ? 'ml-0' : contentMargin}
      `}>
        {/* Wrapper del contenido con padding */}
        <div className="p-6 max-w-none">
          {/* Contenedor para el contenido de las páginas */}
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Botón flotante para abrir sidebar en móvil (cuando está cerrado) */}
      {isMobile && isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="
            fixed bottom-6 left-6 z-50 p-3 bg-[#7B68EE] text-white rounded-full shadow-lg
            hover:bg-[#6A5ACD] transition-all duration-200 hover:scale-110
            focus:outline-none focus:ring-2 focus:ring-[#7B68EE] focus:ring-offset-2
          "
          aria-label="Abrir menú de navegación"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Estilos globales para el layout */}
      <style jsx global>{`
        /* Asegurar que el scroll del contenido principal funcione correctamente */
        html {
          scroll-behavior: smooth;
        }
        
        /* Ocultar scrollbar horizontal del body cuando sidebar está visible */
        body {
          overflow-x: hidden;
        }
        
        /* Estilos para focus visible mejorados */
        .focus\\:ring-2:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }
        
        /* Transiciones mejoradas para elementos interactivos */
        button, a {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Estilos para elementos con animation delays escalonados */
        .stagger-animation {
          animation-delay: calc(var(--index) * 0.1s);
        }
        
        /* Mejoras de accesibilidad */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Optimizaciones para pantallas de alta densidad */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .high-dpi-optimized {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
