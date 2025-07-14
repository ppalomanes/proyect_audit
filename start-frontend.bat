@echo off
echo 🔧 Verificando y arreglando frontend...
cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo.
echo 📦 Verificando dependencias...
call npm list --depth=0

echo.
echo 🚀 Iniciando servidor de desarrollo...
call npm run dev
