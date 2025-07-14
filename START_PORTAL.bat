@echo off
echo 🚀 INICIANDO PORTAL DE AUDITORIAS TÉCNICAS
echo ==========================================

echo.
echo 🔧 Verificando servicios...

REM Verificar si MySQL está corriendo
echo 📊 Verificando MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MySQL está corriendo
) else (
    echo ⚠️ MySQL no está corriendo - por favor inicia XAMPP
)

echo.
echo 🎯 Iniciando servicios del portal...

REM Crear nuevas ventanas para cada servicio
echo 📡 Iniciando Backend (Puerto 5000)...
start "Portal Backend" cmd /k "cd /d C:\xampp\htdocs\portal-auditorias\server && npm start"

timeout /t 5 /nobreak >nul

echo 🌐 Iniciando Frontend (Puerto 3000)...
start "Portal Frontend" cmd /k "cd /d C:\xampp\htdocs\portal-auditorias\client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo 🎉 Portal de Auditorías Técnicas iniciado!
echo.
echo 📋 URLs de acceso:
echo   🌐 Frontend: http://localhost:3000
echo   📡 Backend:  http://localhost:5000
echo   💚 Health:   http://localhost:5000/health
echo.
echo 👥 Usuarios de prueba:
echo   🔴 admin@portal-auditorias.com / admin123
echo   🔵 auditor@portal-auditorias.com / auditor123
echo   🟢 proveedor@callcenterdemo.com / proveedor123
echo.
echo ⚡ Esperando 10 segundos y abriendo navegador...

timeout /t 10 /nobreak

start http://localhost:3000

echo.
echo ✅ Sistema iniciado completamente!
echo 📝 Presiona cualquier tecla para cerrar esta ventana...
pause >nul
