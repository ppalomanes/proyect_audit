/**
 * Theme Context Provider
 * Portal de Auditorías Técnicas
 * 
 * Maneja el tema global de la aplicación (claro/oscuro)
 * con persistencia en localStorage
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Inicializar desde localStorage o por defecto tema oscuro
    const savedTheme = localStorage.getItem('portal-auditorias-theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // Aplicar tema al DOM cuando cambie
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    
    // Guardar en localStorage
    localStorage.setItem('portal-auditorias-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
