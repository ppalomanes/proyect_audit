@echo off
title Portal de Auditorias Tecnicas - Modulo ETL
color 0A

echo.
echo ================================================================
echo    PORTAL DE AUDITORIAS TECNICAS - MODULO ETL
echo    Testing y Validacion Automatizada
echo ================================================================
echo.

:: Verificar Node.js
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no encontrado. Instale Node.js 18+ desde https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js encontrado: 
node --version

:: Verificar npm
echo.
echo [2/6] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no encontrado
    pause
    exit /b 1
)
echo ✓ npm encontrado: 
npm --version

:: Verificar servidor principal
echo.
echo [3/6] Verificando servidor principal...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Servidor principal no responde en puerto 3001
    echo.
    echo ¿Desea iniciar el servidor automáticamente? (y/n):
    set /p startServer=
    if /i "%startServer%"=="y" (
        echo Iniciando servidor...
        start "Servidor Portal Auditorias" cmd /k "node server-simple.js"
        echo Esperando servidor...
        timeout /t 5 /nobreak >nul
    ) else (
        echo Por favor inicie el servidor manualmente con: node server-simple.js
        pause
        exit /b 1
    )
)
echo ✓ Servidor principal respondiendo en puerto 3001

:: Verificar modulo ETL específicamente
echo.
echo [4/6] Verificando modulo ETL...
curl -s http://localhost:3001/api/etl/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Modulo ETL no responde
    echo Verificando integración...
    
    :: Verificar que las rutas ETL estén integradas
    echo Comprobando integración de rutas ETL en server-simple.js...
    findstr /C:"etl" ../../../server-simple.js >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo ================================================================
        echo ACCION REQUERIDA: Integrar módulo ETL en server-simple.js
        echo ================================================================
        echo.
        echo Agregue estas líneas a server-simple.js:
        echo.
        echo // Importar rutas ETL
        echo const etlRoutes = require('./domains/etl/etl.routes');
        echo.
        echo // Registrar rutas ETL
        echo app.use('/api/etl', etlRoutes);
        echo.
        echo Luego reinicie el servidor
        echo ================================================================
        pause
        exit /b 1
    )
    
    echo Integración detectada, pero endpoint no responde
    pause
    exit /b 1
)
echo ✓ Modulo ETL respondiendo correctamente

:: Verificar dependencias
echo.
echo [5/6] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fallo instalacion de dependencias
        pause
        exit /b 1
    )
)
echo ✓ Dependencias verificadas

:: Crear directorio de uploads si no existe
if not exist "../../../uploads/etl" (
    echo Creando directorio uploads...
    mkdir "../../../uploads/etl"
)

echo.
echo [6/6] Iniciando testing automatizado del modulo ETL...
echo.
echo ================================================================
echo                    TESTING AUTOMATIZADO ETL
echo ================================================================
echo.

:: Ejecutar tests
node test-etl-portal.js

:: Verificar resultado del testing
if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo    ✓ TESTING COMPLETADO EXITOSAMENTE
    echo    Modulo ETL funcionando correctamente
    echo ================================================================
    
    echo.
    echo Opciones disponibles:
    echo.
    echo [1] Ejecutar tests nuevamente
    echo [2] Ver reporte detallado (etl-test-report.json)
    echo [3] Testing manual con ejemplos curl
    echo [4] Ver documentación del módulo
    echo [5] Salir
    echo.
    
    :menu
    set /p choice="Seleccione una opcion (1-5): "
    
    if "%choice%"=="1" (
        echo.
        echo Ejecutando tests nuevamente...
        node test-etl-portal.js
        goto menu
    )
    
    if "%choice%"=="2" (
        if exist "etl-test-report.json" (
            echo.
            echo Abriendo reporte de testing...
            start notepad etl-test-report.json
        ) else (
            echo ERROR: Reporte no encontrado
        )
        goto menu
    )
    
    if "%choice%"=="3" (
        echo.
        echo ================================================================
        echo                 TESTING MANUAL - ENDPOINTS ETL
        echo ================================================================
        echo.
        echo Servidor corriendo en: http://localhost:3001
        echo.
        echo Endpoints principales:
        echo   GET  /api/etl/health           - Health check
        echo   GET  /api/etl/version          - Version del modulo
        echo   GET  /api/etl/schema           - Esquema normalizado 28 campos
        echo   GET  /api/etl/validation-rules - Reglas de validación
        echo   GET  /api/etl/metrics          - Métricas de procesamiento
        echo   GET  /api/etl/jobs             - Listar jobs ETL
        echo   GET  /api/etl/quality-dashboard - Dashboard de calidad
        echo.
        echo Ejemplos con curl:
        echo   curl http://localhost:3001/api/etl/health
        echo   curl http://localhost:3001/api/etl/version
        echo   curl http://localhost:3001/api/etl/schema
        echo   curl http://localhost:3001/api/etl/jobs
        echo   curl http://localhost:3001/api/etl/metrics
        echo.
        echo Ejemplo POST (requiere archivo):
        echo   curl -X POST -F "archivo=@parque.xlsx" http://localhost:3001/api/etl/process
        echo.
        pause
        goto menu
    )
    
    if "%choice%"=="4" (
        echo.
        echo ================================================================
        echo                    DOCUMENTACION MODULO ETL
        echo ================================================================
        echo.
        if exist "Claude.md" (
            echo Abriendo documentación Claude.md...
            start notepad Claude.md
        ) else (
            echo WARNING: Claude.md no encontrado
        )
        echo.
        echo Documentación técnica disponible:
        echo   - Claude.md: Documentación completa del módulo
        echo   - etl.controller.js: Lógica de endpoints
        echo   - etl.routes.js: Definición de rutas
        echo   - validators/etl.validators.js: Validadores
        echo.
        echo Arquitectura del módulo:
        echo   📁 /validators/ - Validación de requests
        echo   📁 /models/ - Modelos de datos (Sequelize)
        echo   📁 /parsers/ - Procesamiento Excel/CSV
        echo   📁 /transformers/ - Normalización de datos
        echo.
        pause
        goto menu
    )
    
    if "%choice%"=="5" (
        echo.
        echo Saliendo...
        exit /b 0
    )
    
    echo Opcion invalida. Intente nuevamente.
    goto menu
    
) else (
    echo.
    echo ================================================================
    echo    ✗ TESTING FALLO
    echo    Revisar errores en la implementación
    echo ================================================================
    echo.
    
    if exist "etl-test-report.json" (
        echo Ver detalles en: etl-test-report.json
        echo.
        set /p viewReport="Ver reporte de errores? (y/n): "
        if /i "%viewReport%"=="y" (
            start notepad etl-test-report.json
        )
    )
    
    echo.
    echo Acciones recomendadas:
    echo 1. Verificar que el servidor principal este corriendo
    echo 2. Comprobar integración del modulo ETL en server-simple.js
    echo 3. Revisar logs de errores en consola del servidor
    echo 4. Validar que las rutas ETL esten registradas
    echo 5. Verificar dependencias npm
    echo.
    pause
    exit /b 1
)
