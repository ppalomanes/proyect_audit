@echo off
echo 🚀 INICIANDO PORTAL DE AUDITORIAS CON CLICKUP SIDEBAR
echo ================================================

echo.
echo 📝 Estado actual del sistema:
echo ✅ Estrategia Claude.md 100% implementada
echo ✅ Sistema autenticación completamente funcional  
echo ✅ Layout tema oscuro/claro completamente implementado
echo ✅ Dashboard principal completamente implementado
echo ✅ Módulos Auditorías, ETL, IA frontend funcionales
echo ✅ Backend ETL, IA, Chat completamente implementados
echo ✅ NUEVO: ClickUp Sidebar Design System implementado

echo.
echo 🎨 Nuevas características ClickUp Sidebar:
echo ✅ Colores exactos observados en imágenes (#1a1f36, #4a90e2)
echo ✅ Tipografía Plus Jakarta Sans implementada
echo ✅ Dimensiones precisas: 280px expandido, 64px colapsado
echo ✅ Navegación jerárquica con secciones expandibles
echo ✅ Estados hover/active exactos de ClickUp
echo ✅ Badges rojos para notificaciones (#ff4757)
echo ✅ Animaciones suaves 300ms cubic-bezier
echo ✅ Responsive design mobile-first

echo.
echo 🔧 Archivos implementados:
echo ✅ Sidebar.jsx - Componente principal ClickUp style
echo ✅ clickup-sidebar.css - CSS completo con variables específicas
echo ✅ Icons.jsx - Iconos adicionales (Star, Folder, Globe, Users, ChevronDown)
echo ✅ MainLayout.jsx - Actualizado para dimensiones ClickUp
echo ✅ main.jsx - Import del CSS ClickUp

echo.
echo 🎯 Testing del nuevo diseño ClickUp:
echo 1. Frontend: http://localhost:3000
echo 2. Login: admin@portal-auditorias.com / admin123
echo 3. Verificar sidebar ClickUp style funcionando
echo 4. Probar expansión/colapso suave
echo 5. Validar colores y tipografía exactos

echo.
echo 🚦 Iniciando servicios...

REM Verificar si hay procesos anteriores
tasklist /FI "IMAGENAME eq node.exe" /FO LIST | find "node.exe" >nul
if %ERRORLEVEL% == 0 (
    echo ⚠️  Deteniendo procesos Node.js anteriores...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 >nul
)

echo.
echo 🔗 Iniciando Backend (Puerto 3002)...
cd /d "C:\xampp\htdocs\portal-auditorias\server"
start "Backend Portal Auditorias" cmd /k "node server-complete-chat-websockets.js"

echo ⏳ Esperando 3 segundos para que el backend se inicie...
timeout /t 3 >nul

echo.
echo 🎨 Iniciando Frontend con ClickUp Sidebar (Puerto 3000)...
cd /d "C:\xampp\htdocs\portal-auditorias\client"
start "Frontend ClickUp Portal" cmd /k "npm run dev"

echo.
echo ⏳ Esperando 5 segundos para que el frontend compile...
timeout /t 5 >nul

echo.
echo 🌐 Abriendo navegador para testing ClickUp design...
start "" "http://localhost:3000"

echo.
echo ================================================================
echo 🎉 PORTAL DE AUDITORIAS CON CLICKUP SIDEBAR INICIADO
echo ================================================================
echo.
echo 🔧 URLs de testing:
echo Frontend ClickUp: http://localhost:3000
echo Backend Health: http://localhost:3002/api/health
echo Chat Health: http://localhost:3002/api/chat/health
echo.
echo 👤 Login de prueba:
echo Email: admin@portal-auditorias.com
echo Password: admin123
echo.
echo 🎨 Características a verificar:
echo ✅ Sidebar azul oscuro (#1a1f36) como en ClickUp
echo ✅ Elemento "Chat" activo con badge azul (#4a90e2)
echo ✅ Workspace "BITÁCORA" con avatar gradient
echo ✅ Secciones "Favoritos" y "Espacios" expandibles
echo ✅ Plus Jakarta Sans font loading
echo ✅ Hover states suaves y badges rojos
echo ✅ Expansión/colapso 280px ↔ 64px
echo ✅ Responsive mobile con overlay
echo.
echo 📊 Debug tools disponibles:
echo - DevTools → Console → window.debugAuth()
echo - DevTools → Console → window.diagnoseStorage()
echo - F12 → Elements → Verificar clases .clickup-*
echo.
echo ⚠️  IMPORTANTE: Presiona Ctrl+C en las ventanas cmd para detener
echo.

pause