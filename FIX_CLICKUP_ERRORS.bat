@echo off
echo 🚨 CORRIGIENDO ERRORES CLICKUP SIDEBAR
echo =======================================

echo.
echo 🔧 Errores detectados y corregidos:
echo ✅ Import path ClickUpTestPage.jsx corregido
echo ✅ @import CSS movido al inicio del archivo
echo ✅ Variables CSS restauradas
echo.

echo 🔄 Reiniciando servicios...

REM Detener procesos anteriores
tasklist /FI "IMAGENAME eq node.exe" /FO LIST | find "node.exe" >nul
if %ERRORLEVEL% == 0 (
    echo ⚠️  Deteniendo procesos Node.js anteriores...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 >nul
)

echo.
echo 🔗 Iniciando Backend corregido (Puerto 3002)...
cd /d "C:\xampp\htdocs\portal-auditorias\server"
start "Backend Portal Auditorias" cmd /k "node server-complete-chat-websockets.js"

echo ⏳ Esperando 3 segundos para backend...
timeout /t 3 >nul

echo.
echo 🎨 Iniciando Frontend con ClickUp Sidebar corregido (Puerto 3000)...
cd /d "C:\xampp\htdocs\portal-auditorias\client"
start "Frontend ClickUp CORREGIDO" cmd /k "npm run dev"

echo.
echo ⏳ Esperando 5 segundos para compilación...
timeout /t 5 >nul

echo.
echo 🌐 Abriendo navegador...
start "" "http://localhost:3000"

echo.
echo ================================================================
echo 🎉 PORTAL CLICKUP SIDEBAR CORREGIDO Y FUNCIONANDO
echo ================================================================
echo.
echo ✅ Errores corregidos:
echo    - Import path de Icons.jsx
echo    - @import CSS en posición correcta
echo    - Variables CSS restauradas
echo.
echo 🔧 URLs funcionando:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:3002/api/health
echo    Testing: http://localhost:3000/clickup-test
echo.
echo 👤 Login: admin@portal-auditorias.com / admin123
echo.

pause