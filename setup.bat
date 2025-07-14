@echo off
echo 🚀 Configurando Portal de Auditorías Técnicas
echo ==============================================

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 18 o superior.
    pause
    exit /b 1
)

echo ✅ Node.js versión:
node --version

REM Verificar npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no está disponible
    pause
    exit /b 1
)

echo ✅ npm versión:
npm --version

REM Instalar dependencias del servidor
echo.
echo 📦 Instalando dependencias del servidor...
cd server
npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del servidor
    pause
    exit /b 1
)

REM Verificar archivo .env
if not exist ".env" (
    echo ⚙️ Creando archivo .env desde .env.example...
    copy .env.example .env
    echo ✅ Archivo .env creado. Por favor configura las variables de entorno si es necesario.
)

REM Instalar dependencias del cliente
echo.
echo 📦 Instalando dependencias del cliente...
cd ..\client
npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del cliente
    pause
    exit /b 1
)

echo.
echo 🎉 Instalación completada!
echo.
echo Para iniciar el proyecto:
echo   Backend:  cd server ^&^& npm start
echo   Frontend: cd client ^&^& npm run dev
echo.
echo URLs de acceso:
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo   Health:   http://localhost:5000/health
echo.
echo Usuarios de prueba:
echo   Admin:     admin@portal-auditorias.com / admin123
echo   Auditor:   auditor@portal-auditorias.com / auditor123
echo   Proveedor: proveedor@callcenterdemo.com / proveedor123
echo.
pause
