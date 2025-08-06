// stores/sidebarStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSidebarStore = create()(
  persist(
    (set, get) => ({
      // Estado del sidebar
      collapsed: false,
      showSidebar: false, // Para mobile
      activeItem: 'dashboard',
      expandedMenus: {},
      
      // Acciones
      toggleCollapsed: () => set((state) => ({ 
        collapsed: !state.collapsed,
        // Cerrar submenús cuando se colapsa
        expandedMenus: state.collapsed ? state.expandedMenus : {}
      })),
      
      toggleShowSidebar: () => set((state) => ({ 
        showSidebar: !state.showSidebar 
      })),
      
      setShowSidebar: (show) => set({ showSidebar: show }),
      
      setActiveItem: (itemId) => set({ activeItem: itemId }),
      
      toggleSubmenu: (itemId) => set((state) => ({
        expandedMenus: {
          ...state.expandedMenus,
          [itemId]: !state.expandedMenus[itemId]
        }
      })),
      
      // Helpers
      isSubmenuExpanded: (itemId) => get().expandedMenus[itemId] || false,
      
      // Mobile helpers
      closeSidebarOnMobile: () => {
        const state = get();
        if (window.innerWidth < 768 && state.showSidebar) {
          set({ showSidebar: false });
        }
      }
    }),
    {
      name: 'sidebar-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        collapsed: state.collapsed,
        activeItem: state.activeItem,
        expandedMenus: state.expandedMenus
      }),
    }
  )
);
