import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router/AppRouter';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import './clickup-sidebar.css';
import './dark-theme-patch.css';
import './force-dark-theme.css';
import './nuclear-dark-theme.css';

// 🧹 Limpieza automática de storage corrupto en desarrollo (DESHABILITADA TEMPORALMENTE)
// if (import.meta.env.DEV) {
//   import('./utils/storageUtils.js').then(({ devCleanStorage }) => {
//     devCleanStorage();
//   });
// }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>,
);
