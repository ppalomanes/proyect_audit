// contexts/ThemeContext.jsx - VERSIÓN CORREGIDA SIN DUPLICACIONES
import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Store de tema con Zustand
const useThemeStoreInternal = create()(
  persist(
    (set, get) => ({
      theme: 'dark', // Default dark como imagen 4
      
      setTheme: (newTheme) => {
        if (!['light', 'dark', 'corporate'].includes(newTheme)) return;
        
        // Prevenir flash durante cambio
        document.documentElement.classList.add('theme-transitioning');
        
        requestAnimationFrame(() => {
          document.documentElement.setAttribute('data-theme', newTheme);
          set({ theme: newTheme });
          
          setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
          }, 200);
        });
      },
      
      toggleTheme: () => {
        const themes = ['light', 'dark', 'corporate'];
        const currentIndex = themes.indexOf(get().theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        get().setTheme(themes[nextIndex]);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Context para compatibilidad con componentes existentes
const ThemeContext = createContext();

export const useTheme = () => {
  const store = useThemeStoreInternal();
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  
  return {
    ...store,
    // Propiedades computed para compatibilidad
    isDarkMode: store.theme === 'dark',
    isLightMode: store.theme === 'light',
    isCorporateMode: store.theme === 'corporate',
  };
};

export const ThemeProvider = ({ children }) => {
  const { theme, setTheme } = useThemeStoreInternal();

  // Aplicar tema inicial sin flash
  useEffect(() => {
    // Obtener tema preferido sin flash
    const getInitialTheme = () => {
      const stored = localStorage.getItem('theme-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state?.theme && ['light', 'dark', 'corporate'].includes(parsed.state.theme)) {
            return parsed.state.theme;
          }
        } catch (e) {
          console.warn('Error parsing stored theme:', e);
        }
      }
      
      // Fallback a preferencia del sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const initialTheme = getInitialTheme();
    
    // Aplicar inmediatamente sin transición
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    // Sync con store si es diferente
    if (theme !== initialTheme) {
      setTheme(initialTheme);
    }
  }, []);

  // Escuchar cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Solo auto-cambiar si no hay preferencia guardada
      const hasStoredPreference = localStorage.getItem('theme-storage');
      if (!hasStoredPreference) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  const value = {
    theme,
    setTheme,
    toggleTheme: useThemeStoreInternal.getState().toggleTheme,
    isDarkMode: theme === 'dark',
    isLightMode: theme === 'light',
    isCorporateMode: theme === 'corporate',
    availableThemes: ['light', 'dark', 'corporate'],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook para acceso directo al store (más performante)
export const useThemeStore = () => useThemeStoreInternal();

// Utilidad para obtener tema actual sin hook
export const getCurrentTheme = () => useThemeStoreInternal.getState().theme;