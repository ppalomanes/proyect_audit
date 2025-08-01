@echo off
echo 🚀 Instalando dependencias para el servidor de autenticacion...

cd /d C:\xampp\htdocs\portal-auditorias\server

echo 📦 Instalando dependencias principales...
npm install express cors jsonwebtoken bcrypt express-validator helmet compression express-rate-limit morgan

echo ✅ Dependencias instaladas

echo 🧪 Iniciando servidor de prueba de autenticacion...
node test-auth-server.js

pause
