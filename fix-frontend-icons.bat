@echo off
echo ============================================
echo REINICIANDO FRONTEND - ICONOS CORREGIDOS
echo ============================================
echo.

echo 1. Matando proceso del frontend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a > nul 2>&1

echo.
echo 2. Esperando 2 segundos...
timeout /t 2 /nobreak > nul

echo.
echo 3. Reiniciando Frontend con iconos corregidos...
cd C:\xampp\htdocs\portal-auditorias\client
start "Frontend Portal Auditorias - CORREGIDO" cmd /k "npm run dev"

echo.
echo ============================================
echo ICONOS HEROICONS CORREGIDOS:
echo ============================================
echo.
echo ANTES:
echo - TrendingUpIcon (NO EXISTE)
echo - TrendingDownIcon (NO EXISTE)
echo.
echo DESPUES:
echo - ArrowTrendingUpIcon (CORRECTO)
echo - ArrowTrendingDownIcon (CORRECTO)
echo.
echo El frontend deberia cargar sin errores ahora.
echo Navega a: http://localhost:3000/auditorias
echo.
echo Si el backend no esta corriendo:
echo cd C:\xampp\htdocs\portal-auditorias\server
echo node server-auth-simple.js
echo ============================================
pause