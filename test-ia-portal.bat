@echo off
echo 🧪 Testing Portal de Auditorias - Modulo IA...
echo.

echo 📍 Verificando servidor...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Servidor no disponible en puerto 3001
    echo 💡 Sugerencia: Ejecutar 'start-ia-portal.bat' primero
    pause
    exit /b 1
)

echo ✅ Servidor detectado. Ejecutando tests...
echo.

cd /d "C:\xampp\htdocs\portal-auditorias\server"
node quick-test.js

echo.
echo 📋 Tests completados. Presiona cualquier tecla para continuar...
pause
