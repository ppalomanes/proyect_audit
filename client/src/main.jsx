import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router/AppRouter';
import { ThemeProvider } from './contexts/ThemeContext';

// CSS en orden específico - CRUCIAL para el funcionamiento
import './index.css';  // DEBE ser el primero: Tailwind + estilos personalizados

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
