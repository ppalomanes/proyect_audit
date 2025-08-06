/**
 * Corrección de configuración Redis para BullMQ
 * Soluciona el problema de keyPrefix incompatible
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigiendo configuración Redis para BullMQ...');

const redisConfigPath = path.join(__dirname, 'server', 'config', 'redis.js');

// Leer configuración actual
let configContent = fs.readFileSync(redisConfigPath, 'utf8');

// Corregir configuración de keyPrefix
const correctedConfig = configContent.replace(
  /keyPrefix: 'portal:(\w+):'/g,
  'prefix: "portal:$1:"'
);

// También agregar configuración compatible con BullMQ
const bullmqCompatibleConfig = correctedConfig.replace(
  /(\s+// Configuración para BullMQ[\s\S]*?queueConfig: {[\s\S]*?connection: queueClient,)/,
  `$1
    prefix: "portal:queue:",`
);

// Escribir configuración corregida
fs.writeFileSync(redisConfigPath, bullmqCompatibleConfig);

console.log('✅ Configuración Redis corregida');

// Crear script para instalar Redis en Windows
const redisInstallScript = `@echo off
echo ================================================================================
echo 📦 INSTALACION DE REDIS PARA WINDOWS
echo ================================================================================

echo 🔍 Verificando si Redis ya está instalado...
redis-cli --version >nul 2>&1
if not errorlevel 1 (
    echo ✅ Redis ya está instalado
    echo 🚀 Iniciando Redis...
    start "Redis Server" redis-server
    timeout /t 3 /nobreak >nul
    redis-cli ping
    if not errorlevel 1 (
        echo ✅ Redis funcionando correctamente
    ) else (
        echo ❌ Redis no responde
    )
    pause
    exit /b 0
)

echo ❌ Redis no encontrado. Opciones de instalación:
echo.
echo 1️⃣  OPCIÓN 1: Chocolatey (Recomendado)
echo    choco install redis-64
echo.
echo 2️⃣  OPCIÓN 2: Descarga manual
echo    https://github.com/microsoftarchive/redis/releases
echo.
echo 3️⃣  OPCIÓN 3: Docker
echo    docker run -d -p 6379:6379 redis:alpine
echo.
echo 4️⃣  OPCIÓN 4: WSL2 + Ubuntu
echo    wsl --install
echo    sudo apt update && sudo apt install redis-server
echo.

set /p choice="Seleccione opción (1-4): "

if "%choice%"=="1" (
    echo 🍫 Instalando Redis con Chocolatey...
    choco install redis-64 -y
    if not errorlevel 1 (
        echo ✅ Redis instalado correctamente
        echo 🚀 Iniciando Redis...
        redis-server --service-install
        redis-server --service-start
        timeout /t 3 /nobreak >nul
        redis-cli ping
    ) else (
        echo ❌ Error instalando Redis con Chocolatey
        echo 💡 Asegúrese de que Chocolatey esté instalado
    )
) else if "%choice%"=="3" (
    echo 🐳 Iniciando Redis con Docker...
    docker run -d --name redis-portal -p 6379:6379 redis:alpine
    if not errorlevel 1 (
        echo ✅ Redis iniciado en Docker
        timeout /t 5 /nobreak >nul
        redis-cli ping
    ) else (
        echo ❌ Error iniciando Redis con Docker
    )
) else (
    echo 💡 Por favor instale Redis manualmente y ejecute este script nuevamente
    echo 📖 Documentación: https://redis.io/docs/getting-started/installation/
)

pause`;

fs.writeFileSync(path.join(__dirname, 'install-redis.bat'), redisInstallScript);

console.log('✅ Script de instalación de Redis creado: install-redis.bat');

// Crear versión simplificada sin Redis
const noRedisConfig = `@echo off
echo ================================================================================
echo 🎯 PORTAL DE AUDITORIAS - MODO SIN REDIS
echo ================================================================================

echo ⚠️  Iniciando en modo degradado (sin Redis/BullMQ)
echo    - Base de datos MySQL: ✅ Disponible
echo    - Redis/BullMQ: ❌ No disponible
echo    - Funcionalidades básicas: ✅ Operativas
echo.

cd /d "%~dp0server"

echo 🚀 Iniciando servidor...
set REDIS_DISABLED=true
node server.js

pause`;

fs.writeFileSync(path.join(__dirname, 'start-no-redis.bat'), noRedisConfig);

console.log('✅ Script sin Redis creado: start-no-redis.bat');

console.log(`
🎯 CORRECCIONES APLICADAS:

✅ Configuración Redis/BullMQ corregida
✅ Script de instalación Redis creado
✅ Modo sin Redis disponible

📋 PRÓXIMOS PASOS:

1️⃣  Para instalar Redis:
   .\\install-redis.bat

2️⃣  Para ejecutar sin Redis:
   .\\start-no-redis.bat

3️⃣  Para ejecutar con Redis (después de instalarlo):
   .\\start-optimized.bat
`);
