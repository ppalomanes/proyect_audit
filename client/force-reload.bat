@echo off
echo ===================================
echo   FORZAR RECARGA COMPLETA
echo ===================================

cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo [1/3] Deteniendo servidor si esta corriendo...
taskkill /f /im node.exe 2>nul

echo [2/3] Limpiando cache completamente...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist ".vite" rmdir /s /q ".vite"
if exist "dist" rmdir /s /q "dist"

echo [3/3] Iniciando con rebuild forzado...
echo.
echo ===================================
echo   PRESIONA CTRL+F5 en el navegador
echo   para limpiar cache del navegador
echo ===================================
echo.
npm run dev -- --force --host

pause
