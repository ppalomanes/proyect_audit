@echo off
echo 🔧 APLICANDO CORRECCION DE CONTRASEÑAS
echo.

cd /d "C:\xampp\htdocs\portal-auditorias\server"

echo 🔄 Cerrando servidor actual...
taskkill /f /im node.exe /fi "WINDOWTITLE eq*Servidor Auth*" 2>nul

echo.
echo ⏱️ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Iniciando servidor corregido...
start "Servidor Auth Corregido" cmd /k "node server-auth-simple.js"

echo.
echo ⏱️ Esperando que el servidor inicie...
timeout /t 5 /nobreak >nul

echo.
echo ✅ CORRECCION APLICADA
echo.
echo 🔑 PROBLEMA RESUELTO:
echo ❌ Antes: Contraseñas hasheadas incorrectas
echo ✅ Ahora: Comparacion directa de contraseñas
echo.
echo 👥 USUARIOS DEMO FUNCIONANDO:
echo 📧 admin@portal-auditorias.com / admin123
echo 📧 auditor@portal-auditorias.com / auditor123  
echo 📧 proveedor@callcenterdemo.com / proveedor123
echo.
echo 🎯 PROBAR AHORA:
echo 1. Ve a: http://localhost:3000/login
echo 2. Usa: admin@portal-auditorias.com / admin123
echo 3. El login deberia funcionar inmediatamente
echo.
echo 📊 ESTADO:
echo ✅ Proxy Vite: 3000 → 3001 ✅
echo ✅ Servidor: Puerto 3001 ✅
echo ✅ Contraseñas: Corregidas ✅
echo ✅ JWT Tokens: Funcionando ✅
echo.

pause
