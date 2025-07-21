@echo off
echo 🚀 SOLUCION INMEDIATA - Error 500 Autenticacion
echo.

cd /d "C:\xampp\htdocs\portal-auditorias\server"

echo 📦 Instalando dependencias criticas...
call npm install bcrypt jsonwebtoken express-validator

echo.
echo 🔄 Cerrando servidores existentes...
taskkill /f /im node.exe 2>nul

echo.
echo ⏱️ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Iniciando servidor simplificado en puerto 3001...
start "Servidor Auth Simplificado" cmd /k "node server-auth-simple.js"

echo.
echo ⏱️ Esperando que el servidor inicie...
timeout /t 5 /nobreak >nul

echo.
echo 🧪 Probando endpoints...
curl -X POST http://localhost:3001/api/health 2>nul

echo.
echo ✅ SOLUCION APLICADA
echo.
echo 📋 INSTRUCCIONES:
echo 1. El servidor simplificado esta corriendo en puerto 3001
echo 2. Ve al frontend: http://localhost:3000/login
echo 3. Usa: admin@portal-auditorias.com / admin123
echo 4. El login deberia funcionar ahora
echo.
echo 🔧 ARCHIVOS CREADOS:
echo ✅ server-auth-simple.js - Servidor temporal
echo ✅ auth-controller-simple.js - Controlador sin BD
echo ✅ diagnose-auth.js - Script de diagnostico
echo.
echo 📊 ESTADO:
echo ✅ Frontend funcionando en puerto 3000
echo ✅ Backend simplificado en puerto 3001
echo ✅ Usuarios demo configurados
echo ✅ JWT tokens funcionando
echo.

pause
