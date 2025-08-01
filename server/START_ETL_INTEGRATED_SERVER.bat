@echo off
echo 🚀 ============================================
echo 🎯 Portal de Auditorías - Sistema ETL Integrado
echo 🚀 ============================================
echo.

echo 📋 Iniciando servidor integrado con ETL...
cd /d C:\xampp\htdocs\portal-auditorias\server

echo 📦 Verificando dependencias...
if not exist node_modules (
    echo 📦 Instalando dependencias...
    call npm install
)

echo 🔍 Verificando configuración...
if not exist .env (
    echo ⚠️ Archivo .env no encontrado, copiando desde .env.example
    copy .env.example .env
)

echo 🎬 Iniciando servidor ETL integrado...
echo.
echo 🔗 Endpoints disponibles:
echo    • Health check: http://localhost:5000/health
echo    • API Auth: http://localhost:5000/api/auth/*
echo    • API ETL: http://localhost:5000/api/etl/*
echo    • API Chat: http://localhost:5000/api/chat/*
echo    • API Auditorías: http://localhost:5000/api/auditorias/*
echo.
echo 👥 Usuarios demo:
echo    • admin@portal-auditorias.com / admin123
echo    • auditor@portal-auditorias.com / auditor123
echo    • proveedor@callcenterdemo.com / proveedor123
echo.
echo 🧪 Para probar ETL: node test-etl-integration.js
echo.
echo ===============================================

node server-chat-auth-etl-integrated.js