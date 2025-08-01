@echo off
echo 🔧 ========================================
echo 🛠️ Reiniciando servidor ETL corregido
echo 🔧 ========================================
echo.

echo 🔄 Deteniendo procesos previos...
taskkill /f /im node.exe >nul 2>&1

echo 📦 Verificando dependencias...
cd /d C:\xampp\htdocs\portal-auditorias\server

echo 🎬 Iniciando servidor ETL integrado...
echo.
echo 🔗 Endpoints disponibles:
echo    • Health check: http://localhost:5000/health
echo    • API ETL: http://localhost:5000/api/etl/*
echo    • API Auth: http://localhost:5000/api/auth/*
echo.
echo 🧪 Para probar: npm run etl:test
echo.
echo ===============================================

node server-chat-auth-etl-integrated.js