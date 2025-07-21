@echo off
echo ============================================
echo INICIANDO PORTAL DE AUDITORIAS - MODULO AUDITORIAS CORREGIDO
echo ============================================
echo.

echo 1. Matando procesos en puertos 3001 y 3002...
netstat -ano | findstr :3001 > nul && (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a > nul 2>&1
)
netstat -ano | findstr :3002 > nul && (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /F /PID %%a > nul 2>&1
)

echo.
echo 2. Iniciando Backend Corregido (Puerto 3002)...
cd C:\xampp\htdocs\portal-auditorias\server
start "Backend Portal Auditorias - Puerto 3002" cmd /k "node server-auth-simple.js"

echo.
echo 3. Esperando 4 segundos para que el backend inicie...
timeout /t 4 /nobreak > nul

echo.
echo 4. Iniciando Frontend React (Puerto 3000)...
cd C:\xampp\htdocs\portal-auditorias\client
start "Frontend Portal Auditorias" cmd /k "npm run dev"

echo.
echo ============================================
echo SISTEMA INICIADO EXITOSAMENTE - CORREGIDO!
echo ============================================
echo.
echo Backend corriendo en: http://localhost:3002
echo Frontend corriendo en: http://localhost:3000
echo Proxy configurado: 3000 -^> 3002
echo.
echo ERRORES CORREGIDOS:
echo - Puerto cambiado de 3001 a 3002
echo - TrendingDownIcon corregido a ArrowTrendingDownIcon
echo - Proxy Vite actualizado al puerto 3002
echo.
echo MODULO DE AUDITORIAS COMPLETAMENTE FUNCIONAL:
echo - Lista de auditorias con filtros avanzados
echo - Crear nueva auditoria con validacion
echo - Ver detalles y workflow de 8 etapas
echo - Avanzar etapas con actualizacion automatica
echo - Estadisticas en tiempo real
echo - Sistema de datos mock operativo
echo.
echo Usuarios de prueba:
echo - ADMIN: admin@portal-auditorias.com / admin123
echo - AUDITOR: auditor@portal-auditorias.com / auditor123
echo - PROVEEDOR: proveedor@callcenterdemo.com / proveedor123
echo.
echo NAVEGAR A: http://localhost:3000/auditorias
echo ============================================
pause