@echo off
echo 🔧 Instalando dependencia faltante...
cd /d "C:\xampp\htdocs\portal-auditorias\server"
npm install iconv-lite@^0.6.3

echo.
echo 🚀 Iniciando servidor...
npm start
