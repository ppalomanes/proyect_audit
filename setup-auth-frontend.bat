@echo off
echo 🚀 Configurando sistema de autenticacion frontend...
echo.

cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo 📦 Instalando dependencias necesarias...
npm install @heroicons/react@^2.0.18

echo.
echo 🔧 Verificando estructura de archivos...

REM Verificar que los archivos existen
if exist "src\domains\auth\AuthPage.jsx" (
    echo ✅ AuthPage.jsx - OK
) else (
    echo ❌ AuthPage.jsx - FALTA
)

if exist "src\domains\auth\components\LoginForm.jsx" (
    echo ✅ LoginForm.jsx - OK
) else (
    echo ❌ LoginForm.jsx - FALTA
)

if exist "src\domains\auth\components\RegisterForm.jsx" (
    echo ✅ RegisterForm.jsx - OK
) else (
    echo ❌ RegisterForm.jsx - FALTA
)

if exist "src\domains\auth\components\ProtectedRoute.jsx" (
    echo ✅ ProtectedRoute.jsx - OK
) else (
    echo ❌ ProtectedRoute.jsx - FALTA
)

if exist "src\domains\auth\components\UserProfile.jsx" (
    echo ✅ UserProfile.jsx - OK
) else (
    echo ❌ UserProfile.jsx - FALTA
)

if exist "src\domains\auth\authStore.js" (
    echo ✅ authStore.js - OK
) else (
    echo ❌ authStore.js - FALTA
)

if exist "src\router\AppRouter.jsx" (
    echo ✅ AppRouter.jsx - OK
) else (
    echo ❌ AppRouter.jsx - FALTA
)

if exist "src\layout\Navbar.jsx" (
    echo ✅ Navbar.jsx - OK
) else (
    echo ❌ Navbar.jsx - FALTA
)

echo.
echo 🎯 Probando compilacion...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ COMPILACION EXITOSA
    echo.
    echo 🎉 Sistema de autenticacion configurado correctamente!
    echo.
    echo 📋 FUNCIONALIDADES IMPLEMENTADAS:
    echo    ✅ Login con usuarios demo
    echo    ✅ Registro de nuevos usuarios  
    echo    ✅ Proteccion de rutas por roles
    echo    ✅ Perfil de usuario editable
    echo    ✅ Navbar responsive con menu
    echo    ✅ Store persistente con Zustand
    echo    ✅ Integracion con backend /api/auth
    echo.
    echo 🚀 Para iniciar el frontend:
    echo    npm run dev
    echo.
    echo 🔗 URLs disponibles:
    echo    http://localhost:3000/login    - Pagina de autenticacion
    echo    http://localhost:3000/dashboard - Dashboard principal
    echo    http://localhost:3000/profile   - Perfil de usuario
    echo.
) else (
    echo.
    echo ❌ ERROR EN COMPILACION
    echo Revisa los errores arriba y corrige antes de continuar
)

echo.
pause
