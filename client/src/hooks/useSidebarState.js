/**
 * Hook para manejar el estado del sidebar
 * Portal de Auditorías Técnicas
 */

import { useState, useEffect } from 'react';

export const useSidebarState = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Auto-colapsar en móvil
      if (isMobileView) {
        setIsCollapsed(true);
      }
    };

    // Verificar tamaño inicial
    handleResize();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persistir estado del sidebar en localStorage (solo en desktop)
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

  return { 
    isCollapsed, 
    setIsCollapsed, 
    isMobile 
  };
};
