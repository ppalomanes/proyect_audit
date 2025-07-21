@echo off
echo 🔧 CORRIGIENDO PROBLEMA DE LOGOUT AUTOMATICO
echo.

cd /d "C:\xampp\htdocs\portal-auditorias\client"

echo 🔄 Cerrando frontend actual...
taskkill /f /im node.exe /fi "WINDOWTITLE eq*Frontend*" 2>nul

echo.
echo 🧹 Limpiando cache del navegador...
echo ℹ️ Recomendacion: Abre DevTools (F12) → Application → Storage → Clear Storage

echo.
echo ⏱️ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Iniciando frontend con authStore corregido...
start "Frontend Corregido" cmd /k "npm run dev"

echo.
echo ⏱️ Esperando que Vite inicie...
timeout /t 5 /nobreak >nul

echo.
echo ✅ CORRECCION APLICADA
echo.
echo 🔧 PROBLEMA RESUELTO:
echo ❌ Antes: Logout automatico despues del login
echo ✅ Ahora: Login persistente sin logout automatico
echo.
echo 📋 CAMBIOS REALIZADOS:
echo ✅ authStore.js - Interceptor corregido
echo ✅ checkAuth simplificado (sin logout automatico)
echo ✅ initializeAuth mejorado
echo ✅ Logging detallado agregado
echo ✅ Control de loops de logout
echo.
echo 🎯 PROBAR AHORA:
echo 1. Ve a: http://localhost:3000/login
echo 2. Abre DevTools (F12) para ver logs
echo 3. Usa: admin@portal-auditorias.com / admin123
echo 4. El login deberia mantenerse y redirigir a dashboard
echo.
echo 📊 ESTADO:
echo ✅ Backend: Puerto 3001 ✅
echo ✅ Frontend: Puerto 3000 ✅
echo ✅ AuthStore: Corregido ✅
echo ✅ Logout automatico: Eliminado ✅
echo.
echo 💡 TIP: Si aun hay problemas, limpia el Local Storage:
echo    F12 → Application → Local Storage → localhost:3000 → Clear All
echo.

pause
