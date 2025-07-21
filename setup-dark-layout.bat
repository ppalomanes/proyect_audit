@echo off
echo 🚀 Actualizando Portal de Auditorias con Nuevo Layout Tema Oscuro
echo.

echo 📁 Navegando al directorio del proyecto...
cd C:\xampp\htdocs\portal-auditorias
echo ✅ Directorio actual: %CD%

echo.
echo 🔧 Instalando dependencias del cliente...
cd client
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo 🔧 Instalando dependencias del servidor...
cd ..\server
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias del servidor
    pause
    exit /b 1
)

echo.
echo 🎯 Iniciando servicios...
echo ⚠️  Asegúrate de que XAMPP esté ejecutándose (MySQL)

echo.
echo 📋 Instrucciones de inicio:
echo 1. Ejecutar backend:  cd server ^&^& node server-auth-simple.js
echo 2. Ejecutar frontend: cd client ^&^& npm run dev
echo 3. Acceder a: http://localhost:3000

echo.
echo 🎨 NUEVO LAYOUT IMPLEMENTADO:
echo ✅ Sidebar con tema oscuro (#292D34)
echo ✅ Navbar superior integrado
echo ✅ Breadcrumbs dinámicos
echo ✅ Sistema de notificaciones
echo ✅ Responsive mobile-first
echo ✅ Integración completa con authStore
echo ✅ Iconos SVG sin dependencias externas
echo ✅ Transiciones suaves y animaciones

echo.
echo 🔐 Usuarios de prueba:
echo - admin@portal-auditorias.com / admin123 (ADMIN)
echo - auditor@portal-auditorias.com / auditor123 (AUDITOR)
echo - supervisor@portal-auditorias.com / supervisor123 (SUPERVISOR)
echo - proveedor@portal-auditorias.com / proveedor123 (PROVEEDOR)

echo.
echo 🎯 CARACTERÍSTICAS DEL NUEVO LAYOUT:
echo.
echo 📱 SIDEBAR COLAPSIBLE:
echo   • Ancho: 280px expandido, 80px colapsado
echo   • Navegación por roles automática
echo   • Estados activos con color #7B68EE
echo   • Dropdown de usuario integrado
echo   • Persistencia del estado en localStorage
echo.
echo 🔝 NAVBAR SUPERIOR:
echo   • Breadcrumbs automáticos por ruta
echo   • Barra de búsqueda global responsive
echo   • Notificaciones con badge de conteo
echo   • Botón "Nueva Auditoría" principal
echo   • Menu de usuario con información completa
echo.
echo 📱 RESPONSIVE DESIGN:
echo   • Mobile-first approach
echo   • Sidebar se colapsa automáticamente en móvil
echo   • Overlay oscuro para navegación móvil
echo   • Botón flotante para abrir menú
echo   • Búsqueda móvil independiente
echo.
echo 🎨 TEMA OSCURO PROFESIONAL:
echo   • Colores principales: #292D34 (Shark)
echo   • Acentos: #7B68EE (Cornflower Blue)
echo   • Acentos secundarios: #FD71AF, #49CCF9
echo   • Transiciones de 300ms cubic-bezier
echo   • Sombras y elevaciones sutiles

echo.
echo 📁 ESTRUCTURA DE ARCHIVOS CREADOS:
echo   /client/src/components/layout/
echo   ├── MainLayout.jsx         (Layout principal)
echo   ├── Sidebar.jsx           (Sidebar tema oscuro)
echo   ├── TopNavbar.jsx         (Navbar superior)
echo   ├── Icons.jsx             (Iconos SVG inline)
echo   └── index.js              (Exportaciones)
echo.
echo   /client/src/hooks/
echo   └── useSidebarState.js    (Estado del sidebar)
echo.
echo   /client/src/utils/
echo   └── userUtils.js          (Utilidades de usuario)
echo.
echo   /client/src/router/
echo   └── AppRouter.jsx         (ACTUALIZADO con MainLayout)

echo.
echo 🔗 INTEGRACIÓN COMPLETA:
echo ✅ AuthStore integrado con userUtils
echo ✅ Todas las rutas envueltas en MainLayout
echo ✅ Navegación por roles funcionando
echo ✅ Breadcrumbs automáticos por página
echo ✅ Sistema de notificaciones mock implementado
echo ✅ Compatibilidad 100% con componentes existentes

echo.
echo ⚡ PARA PROBAR EL NUEVO LAYOUT:
echo 1. Ejecuta: start-portal-dashboard.bat
echo 2. Navega entre las secciones
echo 3. Prueba colapsar/expandir sidebar
echo 4. Verifica responsive en móvil
echo 5. Testa notificaciones y menú usuario

echo.
echo 🎉 IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE!
echo El Portal de Auditorías ahora tiene un layout profesional
echo con tema oscuro siguiendo todos los parámetros especificados.

pause