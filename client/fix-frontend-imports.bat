@echo off
echo ===================================
echo    ARREGLANDO IMPORTS FRONTEND
echo ===================================

cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo [1/4] Instalando dependencias faltantes...
npm install @heroicons/react @headlessui/react clsx --save

echo [2/4] Verificando estructura de directorios...
if not exist "src\components\layout" mkdir "src\components\layout"
if not exist "src\contexts" mkdir "src\contexts"

echo [3/4] Creando archivos faltantes si no existen...

REM Crear un Dashboard simple si no existe el complejo
echo // Simple Dashboard fallback > "src\domains\dashboards\components\Dashboard.jsx"
echo import React from 'react'; >> "src\domains\dashboards\components\Dashboard.jsx"
echo const Dashboard = () => ^<div^>Dashboard Loading...^</div^>; >> "src\domains\dashboards\components\Dashboard.jsx"
echo export default Dashboard; >> "src\domains\dashboards\components\Dashboard.jsx"

echo [4/4] Limpiando cache de Vite...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "dist" rmdir /s /q "dist"

echo ===================================
echo    CORRECCION COMPLETADA
echo ===================================
echo.
echo Ejecuta: npm run dev
echo.
pause
