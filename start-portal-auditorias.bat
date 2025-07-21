@echo off
echo ============================================
echo INICIANDO PORTAL DE AUDITORIAS CON MODULO AUDITORIAS FRONTEND
echo ============================================
echo.

echo 1. Iniciando Backend Simple (Puerto 3001)...
cd C:\xampp\htdocs\portal-auditorias\server
start "Backend Portal Auditorias" cmd /k "node server-auth-simple.js"

echo.
echo 2. Esperando 3 segundos para que el backend inicie...
timeout /t 3 /nobreak > nul

echo.
echo 3. Iniciando Frontend React (Puerto 3000)...
cd C:\xampp\htdocs\portal-auditorias\client
start "Frontend Portal Auditorias" cmd /k "npm run dev"

echo.
echo ============================================
echo SISTEMA INICIADO EXITOSAMENTE!
echo ============================================
echo.
echo Backend corriendo en: http://localhost:3001
echo Frontend corriendo en: http://localhost:3000
echo.
echo MODULO DE AUDITORIAS IMPLEMENTADO:
echo - Lista de auditorias con filtros
echo - Crear nueva auditoria
echo - Ver detalles y workflow
echo - Avanzar etapas
echo - Estadisticas en tiempo real
echo - Datos mock para testing
echo.
echo Usuarios de prueba:
echo - ADMIN: admin@portal-auditorias.com / admin123
echo - AUDITOR: auditor@portal-auditorias.com / auditor123
echo - PROVEEDOR: proveedor@callcenterdemo.com / proveedor123
echo.
echo Navega a: http://localhost:3000/auditorias
echo ============================================
pause