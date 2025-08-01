@echo off
echo 🚀 Iniciando Servidor AUTH Rápido - Puerto 3002

cd /d C:\xampp\htdocs\portal-auditorias\server

echo 🔧 Verificando dependencias básicas...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js disponible

echo 📦 Instalando dependencias mínimas si es necesario...
if not exist node_modules\express (
    npm install express cors jsonwebtoken
)

echo 🔥 Iniciando servidor...
echo.
echo ========================================
echo   SERVIDOR AUTH PORTAL AUDITORÍAS
echo ========================================
echo   Puerto: 3002
echo   Frontend: http://localhost:3000
echo   Health: http://localhost:3002/api/health
echo ========================================
echo.

node auth-quick-server.js

pause
