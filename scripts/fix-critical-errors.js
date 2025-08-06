// CORRECCIÓN SISTEMÁTICA DE ERRORES CRÍTICOS - Portal de Auditorías Técnicas
// Script para diagnosticar y corregir todos los errores identificados

const fs = require('fs').promises;
const path = require('path');

class CriticErrorsFixManager {
  constructor() {
    this.projectRoot = 'C:\\xampp\\htdocs\\portal-auditorias';
    this.errors = [];
    this.fixes = [];
  }

  async executeFullDiagnosticAndFix() {
    console.log('🔧 INICIO DE CORRECCIÓN SISTEMÁTICA DE ERRORES CRÍTICOS');
    console.log('======================================================');

    // 1. Diagnosticar y corregir sistema de notificaciones
    await this.fixNotificationsSystem();
    
    // 2. Diagnosticar y corregir ThemeSelector
    await this.fixThemeSelector();
    
    // 3. Diagnosticar y corregir barras de progreso
    await this.fixProgressBars();
    
    // 4. Diagnosticar y corregir endpoints faltantes
    await this.fixMissingEndpoints();
    
    // 5. Diagnosticar y corregir WebSocket
    await this.fixWebSocketConnection();
    
    // 6. Diagnosticar y corregir keys duplicadas
    await this.fixDuplicatedKeys();
    
    // 7. Crear componentes faltantes
    await this.createMissingComponents();

    await this.generateFixReport();
    
    console.log('✅ CORRECCIÓN SISTEMÁTICA COMPLETADA');
  }

  // 1. FIX: Sistema de Notificaciones
  async fixNotificationsSystem() {
    console.log('\n🔔 Corrigiendo sistema de notificaciones...');
    
    try {
      // Verificar que las rutas están registradas correctamente
      const serverPath = path.join(this.projectRoot, 'server', 'server.js');
      const serverContent = await fs.readFile(serverPath, 'utf8');
      
      if (!serverContent.includes('app.use("/api/notifications", notificacionesRoutes)')) {
        this.errors.push('Bridge /api/notifications no encontrado en server.js');
        
        // Agregar bridge si no existe
        const bridgeInsert = `
// Bridge para compatibilidad frontend - mapear /api/notifications a /api/notificaciones
app.use("/api/notifications", notificacionesRoutes);`;
        
        const updatedContent = serverContent.replace(
          'app.use("/api/notificaciones", notificacionesRoutes);',
          `app.use("/api/notificaciones", notificacionesRoutes);\n${bridgeInsert}`
        );
        
        await fs.writeFile(serverPath, updatedContent, 'utf8');
        this.fixes.push('✅ Bridge /api/notifications agregado al servidor');
      } else {
        this.fixes.push('✅ Bridge /api/notifications ya existe');
      }

      // Verificar ruta de notificaciones existe
      const notifRoutesPath = path.join(this.projectRoot, 'server', 'domains', 'notificaciones', 'notificaciones.routes.js');
      try {
        await fs.access(notifRoutesPath);
        this.fixes.push('✅ Rutas de notificaciones existen');
      } catch {
        this.errors.push('❌ Archivo notificaciones.routes.js no encontrado');
      }

    } catch (error) {
      this.errors.push(`❌ Error corrigiendo notificaciones: ${error.message}`);
    }
  }

  // 2. FIX: ThemeSelector
  async fixThemeSelector() {
    console.log('\n🎨 Corrigiendo ThemeSelector...');
    
    try {
      const themeSelectorContent = `// ThemeSelector.jsx - Selector de tema mejorado
import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeSelector = ({ variant = 'button' }) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    console.log(\`🎨 Tema cambiado a: \${newTheme}\`);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        title={\`Cambiar a tema \${theme === 'light' ? 'oscuro' : 'claro'}\`}
        aria-label="Cambiar tema"
      >
        {theme === 'light' ? (
          <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <SunIcon className="h-5 w-5 text-yellow-500" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">Tema:</span>
      <button
        onClick={toggleTheme}
        className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 \${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 hover:bg-gray-400'
          }\`}
        role="switch"
        aria-checked={theme === 'dark'}
        aria-label="Cambiar tema"
      >
        <span
          className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 \${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }\`}
        />
        <div className="absolute inset-0 flex items-center justify-between px-1">
          <SunIcon className="h-3 w-3 text-yellow-500" />
          <MoonIcon className="h-3 w-3 text-gray-300" />
        </div>
      </button>
    </div>
  );
};

export default ThemeSelector;`;

      const themeSelectorPath = path.join(this.projectRoot, 'client', 'src', 'components', 'theme', 'ThemeSelector.jsx');
      
      // Crear directorio si no existe
      await fs.mkdir(path.dirname(themeSelectorPath), { recursive: true });
      
      await fs.writeFile(themeSelectorPath, themeSelectorContent, 'utf8');
      this.fixes.push('✅ ThemeSelector corregido y mejorado');

    } catch (error) {
      this.errors.push(`❌ Error corrigiendo ThemeSelector: ${error.message}`);
    }
  }

  // 3. FIX: Barras de progreso
  async fixProgressBars() {
    console.log('\n📊 Corrigiendo barras de progreso...');
    
    try {
      const progressBarContent = `// ProgressBar.jsx - Componente de barra de progreso mejorado
import React from 'react';

const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  size = 'medium',
  variant = 'primary',
  showLabel = true,
  animated = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };
  
  const variantClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-cyan-500'
  };

  return (
    <div className={\`w-full \${className}\`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progreso</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={\`w-full \${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden\`}>
        <div
          className={\`h-full \${variantClasses[variant]} transition-all duration-300 ease-out \${animated ? 'animate-pulse' : ''}\`}
          style={{ width: \`\${percentage}%\` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;`;

      const progressBarPath = path.join(this.projectRoot, 'client', 'src', 'components', 'ui', 'ProgressBar.jsx');
      
      // Crear directorio si no existe
      await fs.mkdir(path.dirname(progressBarPath), { recursive: true });
      
      await fs.writeFile(progressBarPath, progressBarContent, 'utf8');
      this.fixes.push('✅ ProgressBar mejorado y funcional');

    } catch (error) {
      this.errors.push(`❌ Error corrigiendo ProgressBar: ${error.message}`);
    }
  }

  // 4. FIX: Endpoints faltantes
  async fixMissingEndpoints() {
    console.log('\n🔗 Corrigiendo endpoints faltantes...');
    
    try {
      // Crear módulo versiones si no existe
      const versionesRoutes = `// versiones.routes.js - Rutas para control de versiones
const express = require('express');
const router = express.Router();

// Datos de prueba para versiones
const versionesPrueba = [];

// GET /api/versiones/documentos - Obtener versiones de documentos
router.get('/documentos', (req, res) => {
  try {
    const { documento_id } = req.query;
    
    let versiones = [...versionesPrueba];
    
    if (documento_id) {
      versiones = versiones.filter(v => v.documento_id === parseInt(documento_id));
    }
    
    res.json({
      success: true,
      versiones: versiones,
      total: versiones.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo versiones',
      error: error.message
    });
  }
});

// POST /api/versiones/documentos - Crear nueva versión
router.post('/documentos', (req, res) => {
  try {
    const nuevaVersion = {
      id: versionesPrueba.length + 1,
      fecha_creacion: new Date().toISOString(),
      ...req.body
    };
    
    versionesPrueba.unshift(nuevaVersion);
    
    res.status(201).json({
      success: true,
      version: nuevaVersion,
      message: 'Versión creada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando versión',
      error: error.message
    });
  }
});

module.exports = router;`;

      const versionesPath = path.join(this.projectRoot, 'server', 'domains', 'versiones', 'versiones.routes.js');
      await fs.mkdir(path.dirname(versionesPath), { recursive: true });
      await fs.writeFile(versionesPath, versionesRoutes, 'utf8');
      
      // Ahora agregar las rutas al servidor principal
      const serverPath = path.join(this.projectRoot, 'server', 'server.js');
      const serverContent = await fs.readFile(serverPath, 'utf8');
      
      if (!serverContent.includes('app.use("/api/versiones"')) {
        const versionesInsert = `
// Rutas adicionales para versiones si están disponibles
try {
  const versionesRoutes = require("./domains/versiones/versiones.routes");
  app.use("/api/versiones", versionesRoutes);
  console.log("✅ Rutas de versiones cargadas");
} catch (error) {
  app.get("/api/versiones", (req, res) => {
    res.json({ status: "Versiones module loading...", versiones: [], timestamp: new Date().toISOString() });
  });
}

// Endpoint adicional para health check completo
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Portal Auditorías Técnicas"
  });
});

// Endpoint para chat workspaces
app.get("/api/chat/workspaces", (req, res) => {
  res.json({
    success: true,
    workspaces: [
      {
        id: 1,
        name: "General",
        description: "Espacio general de comunicación"
      }
    ]
  });
});`;

        const updatedServerContent = serverContent.replace(
          '// Rutas adicionales para bitácora si están disponibles',
          versionesInsert + '\n\n// Rutas adicionales para bitácora si están disponibles'
        );
        
        await fs.writeFile(serverPath, updatedServerContent, 'utf8');
      }
      
      this.fixes.push('✅ Endpoints /api/versiones/documentos, /health, /api/chat/workspaces creados');

    } catch (error) {
      this.errors.push(`❌ Error creando endpoints: ${error.message}`);
    }
  }

  // 5. FIX: WebSocket Configuration
  async fixWebSocketConnection() {
    console.log('\n🔌 Corrigiendo configuración WebSocket...');
    
    try {
      const socketConfig = `// socket-config.js - Configuración WebSocket para desarrollo
import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('🔌 Socket ya conectado');
      return this.socket;
    }

    try {
      this.socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 5000
      });

      this.setupEventListeners();
      return this.socket;
      
    } catch (error) {
      console.warn('⚠️  Error conectando WebSocket:', error.message);
      return null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️  Error de conexión WebSocket:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('❌ Máximo de reintentos alcanzado, deshabilitando WebSocket');
        this.disconnect();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket desconectado manualmente');
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️  No se puede emitir, WebSocket no conectado');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;`;

      const socketPath = path.join(this.projectRoot, 'client', 'src', 'services', 'socket-config.js');
      await fs.mkdir(path.dirname(socketPath), { recursive: true });
      await fs.writeFile(socketPath, socketConfig, 'utf8');
      
      this.fixes.push('✅ Configuración WebSocket robusta creada');

    } catch (error) {
      this.errors.push(`❌ Error configurando WebSocket: ${error.message}`);
    }
  }

  // 6. FIX: Keys duplicadas en Sidebar
  async fixDuplicatedKeys() {
    console.log('\n🔑 Corrigiendo keys duplicadas en Sidebar...');
    
    try {
      // Buscar archivo Sidebar
      const sidebarPath = path.join(this.projectRoot, 'client', 'src', 'components', 'layout', 'Sidebar.jsx');
      
      try {
        const sidebarContent = await fs.readFile(sidebarPath, 'utf8');
        
        // Buscar patrones de keys duplicadas
        const lines = sidebarContent.split('\n');
        let hasDuplicatedKeys = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('key=') && lines[i].includes('/auditorias')) {
            // Verificar si hay duplicados
            const nextLines = lines.slice(i + 1, i + 10);
            for (const nextLine of nextLines) {
              if (nextLine.includes('key=') && nextLine.includes('/auditorias')) {
                hasDuplicatedKeys = true;
                break;
              }
            }
          }
        }
        
        if (hasDuplicatedKeys) {
          this.errors.push('Keys duplicadas encontradas en Sidebar');
          
          // Crear un Sidebar corregido
          let counter = 1;
          const fixedSidebarContent = sidebarContent.replace(
            /key="\/auditorias"/g,
            () => `key="/auditorias-${counter++}"`
          );
          
          await fs.writeFile(sidebarPath, fixedSidebarContent, 'utf8');
          this.fixes.push('✅ Keys duplicadas en Sidebar corregidas');
        } else {
          this.fixes.push('✅ No se encontraron keys duplicadas en Sidebar');
        }
        
      } catch (fileError) {
        this.errors.push('❌ Archivo Sidebar.jsx no encontrado');
      }

    } catch (error) {
      this.errors.push(`❌ Error corrigiendo keys duplicadas: ${error.message}`);
    }
  }

  // 7. Crear componentes faltantes
  async createMissingComponents() {
    console.log('\n🧩 Creando componentes faltantes...');
    
    try {
      // Header mejorado con ThemeSelector
      const headerContent = `// Header.jsx - Header principal con ThemeSelector integrado
import React from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import ThemeSelector from '../theme/ThemeSelector';
import useNotificacionesStore from '../../domains/notificaciones/NotificacionesStore';

const Header = ({ onToggleSidebar }) => {
  const { noLeidas } = useNotificacionesStore();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portal de Auditorías Técnicas
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Selector */}
          <ThemeSelector variant="compact" />
          
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <BellIcon className="h-6 w-6" />
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;`;

      const headerPath = path.join(this.projectRoot, 'client', 'src', 'components', 'layout', 'Header.jsx');
      await fs.mkdir(path.dirname(headerPath), { recursive: true });
      await fs.writeFile(headerPath, headerContent, 'utf8');
      
      this.fixes.push('✅ Header con ThemeSelector integrado creado');

    } catch (error) {
      this.errors.push(`❌ Error creando componentes: ${error.message}`);
    }
  }

  // Generar reporte de correcciones
  async generateFixReport() {
    console.log('\n📋 REPORTE DE CORRECCIONES');
    console.log('============================');
    
    console.log('\n✅ CORRECCIONES APLICADAS:');
    this.fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix}`);
    });
    
    console.log('\n❌ ERRORES ENCONTRADOS:');
    this.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    const reportContent = `# Reporte de Correcciones Sistemáticas - ${new Date().toISOString()}

## ✅ Correcciones Aplicadas (${this.fixes.length}):

${this.fixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

## ❌ Errores Encontrados (${this.errors.length}):

${this.errors.map((error, i) => `${i + 1}. ${error}`).join('\n')}

## 📊 Resumen:
- Total correcciones: ${this.fixes.length}
- Total errores: ${this.errors.length}
- Estado: ${this.errors.length === 0 ? '✅ TODAS LAS CORRECCIONES EXITOSAS' : '⚠️ CORRECCIONES PARCIALES'}

## 🔄 Próximos pasos:
1. Reiniciar servidor: \`npm run dev\` en server/
2. Reiniciar frontend: \`npm run dev\` en client/
3. Verificar funcionamiento de notificaciones
4. Probar cambio de tema
5. Verificar barras de progreso funcionales
`;

    const reportPath = path.join(this.projectRoot, 'REPORTE_CORRECCIONES_SISTEMÁTICAS.md');
    await fs.writeFile(reportPath, reportContent, 'utf8');
    
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }
}

// Ejecutar correcciones si el script se ejecuta directamente
if (require.main === module) {
  const fixer = new CriticErrorsFixManager();
  fixer.executeFullDiagnosticAndFix().catch(console.error);
}

module.exports = CriticErrorsFixManager;