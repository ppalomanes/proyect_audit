@echo off
echo ===================================
echo   SOLUCION COMPLETA FRONTEND
echo ===================================

cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo [1/5] Instalando todas las dependencias necesarias...
npm install axios zustand @heroicons/react @headlessui/react clsx --save

echo [2/5] Limpiando cache y archivos temporales...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "dist" rmdir /s /q "dist"
if exist "src\.vite" rmdir /s /q "src\.vite"

echo [3/5] Verificando estructura de directorios...
if not exist "src\services" mkdir "src\services"
if not exist "src\components\layout" mkdir "src\components\layout"
if not exist "src\contexts" mkdir "src\contexts"

echo [4/5] Creando archivos faltantes...

REM Crear Dashboard simple fallback
echo // Dashboard fallback > "src\components\Dashboard.jsx"
echo import React from 'react'; >> "src\components\Dashboard.jsx"
echo const Dashboard = () =^> ^<div className="p-6"^>^<h1^>Dashboard^</h1^>^</div^>; >> "src\components\Dashboard.jsx"
echo export default Dashboard; >> "src\components\Dashboard.jsx"

echo [5/5] Iniciando aplicacion con rebuild forzado...
echo.
echo ===================================
echo    INICIANDO FRONTEND
echo ===================================
npm run dev -- --force --host
