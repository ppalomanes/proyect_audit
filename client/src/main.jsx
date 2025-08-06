import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router/AppRouter';
import { ThemeProvider } from './contexts/ThemeContext';

// CSS en orden específico - CRUCIAL para el funcionamiento
import './index.css';  // Incluye Tailwind + estilos profesionales
import './styles/header-override.css';  // Override definitivo del header - DEBE SER EL ÚLTIMO

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>,
);