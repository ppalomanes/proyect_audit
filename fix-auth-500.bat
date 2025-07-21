@echo off
echo 🔧 SOLUCION RAPIDA - Error 500 en Autenticacion
echo.

cd /d "C:\xampp\htdocs\portal-auditorias\server"

echo 📦 Instalando dependencias criticas de autenticacion...
npm install bcrypt jsonwebtoken express-validator

echo.
echo 🔍 Ejecutando diagnostico...
node diagnose-auth.js

echo.
echo 📋 ACCIONES RECOMENDADAS:
echo.
echo 1. Verificar que XAMPP MySQL este ejecutandose
echo 2. Crear base de datos 'portal_auditorias' si no existe
echo 3. Verificar que el archivo .env tenga JWT_SECRET configurado
echo 4. Probar endpoint de diagnostico en:
echo    POST http://localhost:3002/api/auth/login-test
echo.
echo 🧪 Para probar login de diagnostico:
echo    Email: admin@portal-auditorias.com
echo    Password: admin123
echo.

pause
