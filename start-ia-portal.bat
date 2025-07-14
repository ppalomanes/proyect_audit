@echo off
echo.
echo 🚀 =====================================
echo    PORTAL DE AUDITORIAS TECNICAS
echo    INICIANDO CON IA REAL...
echo =====================================
echo.

echo 📍 Verificando Ollama...
ollama list
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error: Ollama no está disponible.
    echo 💡 Para solucionarlo:
    echo    1. Abrir otra terminal como administrador
    echo    2. Ejecutar: ollama serve
    echo    3. Verificar modelos: ollama list
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Ollama detectado correctamente.
echo 📦 Modelos disponibles: llama3.2:1b, moondream
echo.

echo 🔄 Cambiando al directorio del servidor...
cd /d "C:\xampp\htdocs\portal-auditorias\server"

echo.
echo 🚀 Iniciando servidor Node.js...
echo 🌐 El portal estará disponible en: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/api/health
echo 🤖 IA Health: http://localhost:3001/api/ia/health
echo.
echo 💡 Para probar: abrir otra terminal y ejecutar 'test-ia-portal.bat'
echo ⏹️ Para detener: Ctrl+C
echo.

node server-simple.js

echo.
echo 📋 Servidor detenido.
pause
