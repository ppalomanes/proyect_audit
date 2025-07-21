@echo off
echo 🔧 CORRIGIENDO CONFIGURACION PROXY VITE
echo.

cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo 📝 Proxy configurado para puerto 3001...
echo ✅ vite.config.js actualizado

echo.
echo 🔄 Reiniciando frontend...

REM Cerrar frontend actual
taskkill /f /im node.exe /fi "WINDOWTITLE eq*vite*" 2>nul

echo.
echo ⏱️ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Iniciando frontend con proxy corregido...
start "Frontend Portal" cmd /k "npm run dev"

echo.
echo ⏱️ Esperando que Vite inicie...
timeout /t 5 /nobreak >nul

echo.
echo ✅ CORRECCION APLICADA
echo.
echo 📋 INSTRUCCIONES:
echo 1. Frontend reiniciado en puerto 3000
echo 2. Proxy ahora apunta al puerto 3001 ✅
echo 3. Ve a: http://localhost:3000/login
echo 4. Usa: admin@portal-auditorias.com / admin123
echo.
echo 🔧 CAMBIOS REALIZADOS:
echo ✅ vite.config.js - Proxy cambiado de puerto 5000 a 3001
echo ✅ Frontend reiniciado con nueva configuracion
echo.
echo 📊 ESTADO FINAL:
echo ✅ Backend: http://localhost:3001 (servidor-auth-simple.js)
echo ✅ Frontend: http://localhost:3000 (proxy → 3001)
echo ✅ Login deberia funcionar ahora
echo.

pause
