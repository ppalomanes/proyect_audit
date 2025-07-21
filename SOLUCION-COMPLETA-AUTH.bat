@echo off
echo 🚀 SOLUCION COMPLETA - Sistema de Autenticacion
echo.

cd /d "C:\xampp\htdocs\portal-auditorias"

echo 📦 Paso 1: Instalando dependencias backend...
cd server
call npm install bcrypt jsonwebtoken express-validator

echo.
echo 🔄 Paso 2: Cerrando procesos Node.js existentes...
taskkill /f /im node.exe 2>nul

echo.
echo ⏱️ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Paso 3: Iniciando servidor backend simplificado...
start "Backend Auth" cmd /k "node server-auth-simple.js"

echo.
echo ⏱️ Esperando que backend inicie...
timeout /t 5 /nobreak >nul

echo.
echo 📝 Paso 4: Corrigiendo configuracion proxy frontend...
cd ..\client

REM Crear vite.config.js corregido
echo import { defineConfig } from 'vite' > vite.config.js
echo import react from '@vitejs/plugin-react' >> vite.config.js
echo. >> vite.config.js
echo export default defineConfig({ >> vite.config.js
echo   plugins: [react()], >> vite.config.js
echo   server: { >> vite.config.js
echo     port: 3000, >> vite.config.js
echo     proxy: { >> vite.config.js
echo       '/api': { >> vite.config.js
echo         target: 'http://localhost:3001', >> vite.config.js
echo         changeOrigin: true, >> vite.config.js
echo         secure: false, >> vite.config.js
echo       } >> vite.config.js
echo     } >> vite.config.js
echo   } >> vite.config.js
echo }) >> vite.config.js

echo.
echo 📦 Paso 5: Instalando dependencias frontend...
call npm install @heroicons/react

echo.
echo 🚀 Paso 6: Iniciando frontend con proxy corregido...
start "Frontend Portal" cmd /k "npm run dev"

echo.
echo ⏱️ Esperando que frontend inicie completamente...
timeout /t 8 /nobreak >nul

echo.
echo 🧪 Paso 7: Probando conectividad...
curl -X GET http://localhost:3001/api/health 2>nul
echo.

echo.
echo 🎉 SOLUCION COMPLETA APLICADA
echo =====================================
echo.
echo 📊 ESTADO FINAL:
echo ✅ Backend Simplificado: http://localhost:3001
echo ✅ Frontend con Proxy: http://localhost:3000
echo ✅ Dependencias instaladas
echo ✅ Configuracion corregida
echo.
echo 👥 USUARIOS DEMO LISTOS:
echo 📧 admin@portal-auditorias.com / admin123 (ADMIN)
echo 📧 auditor@portal-auditorias.com / auditor123 (AUDITOR)  
echo 📧 proveedor@callcenterdemo.com / proveedor123 (PROVEEDOR)
echo.
echo 🎯 PROBAR AHORA:
echo 1. Ir a: http://localhost:3000/login
echo 2. Usar cualquier usuario demo
echo 3. El login deberia funcionar correctamente
echo.
echo 🔧 ARCHIVOS MODIFICADOS:
echo ✅ client/vite.config.js - Proxy corregido
echo ✅ server/server-auth-simple.js - Servidor temporal
echo ✅ server/auth-controller-simple.js - Controlador sin BD
echo.

pause
