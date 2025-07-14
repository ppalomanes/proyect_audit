@echo off
echo 🔧 Test rápido del frontend corregido...
cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo.
echo 📦 Estado de dependencias:
call npm list react react-dom zustand --depth=0

echo.
echo 🔍 Verificando archivos críticos...
if exist "src\Dashboard.jsx" (
    echo ✅ Dashboard.jsx existe
) else (
    echo ❌ Dashboard.jsx no existe
)

if exist "src\domains\auth\authStore.js" (
    echo ✅ authStore.js existe
) else (
    echo ❌ authStore.js no existe
)

if exist "src\domains\etl\ETLProcessor.jsx" (
    echo ✅ ETLProcessor.jsx existe
) else (
    echo ❌ ETLProcessor.jsx no existe
)

echo.
echo 🚀 Intentando iniciar Vite dev server...
echo ⚠️ Si funciona, presiona Ctrl+C y usa START_PORTAL.bat para abrir ambos servicios
echo.

call npm run dev
