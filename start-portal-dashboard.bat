@echo off
echo ====================================
echo  PORTAL DE AUDITORIAS TECNICAS
echo  Dashboard Principal Implementado
echo ====================================
echo.

REM Cambiar al directorio del proyecto
cd /d "C:\xampp\htdocs\portal-auditorias"

echo [1/3] Verificando estructura del proyecto...
if not exist "client\src\domains\dashboards\DashboardsPage.jsx" (
    echo ERROR: Dashboard Principal no encontrado
    pause
    exit /b 1
)

echo [2/3] Iniciando backend en puerto 3002...
start "Backend Portal Auditorias" cmd /k "cd server && node server-auth-simple.js"

echo [3/3] Esperando 3 segundos antes de iniciar frontend...
timeout /t 3 /nobreak > nul

echo Iniciando frontend en puerto 3000...
start "Frontend Portal Auditorias" cmd /k "cd client && npm run dev"

echo.
echo ====================================
echo  SERVICIOS INICIADOS CORRECTAMENTE
echo ====================================
echo.
echo Backend:   http://localhost:3002
echo Frontend:  http://localhost:3000
echo Dashboard: http://localhost:3000/dashboard
echo.
echo CREDENCIALES DE PRUEBA:
echo - admin@portal-auditorias.com / admin123
echo - auditor@portal-auditorias.com / auditor123
echo.
echo MODULOS DISPONIBLES:
echo [✅] Dashboard Principal - Metricas y vision general
echo [✅] Sistema Autenticacion - Login/logout/roles
echo [✅] Modulo Auditorias - Gestion completa auditorias
echo [⚙️] Modulo ETL - Interface carga archivos
echo [⚙️] Modulo IA - Analisis documentos Ollama
echo [⚙️] Sistema Chat - Mensajeria asincrona
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause > nul

echo Abriendo navegador en Dashboard Principal...
start http://localhost:3000/dashboard

echo.
echo ====================================
echo  PORTAL INICIADO EXITOSAMENTE
echo ====================================
echo.
echo Para detener los servicios, cierra las ventanas
echo de cmd que se abrieron automaticamente.
echo.
pause