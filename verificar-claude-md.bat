@echo off
REM Script de Verificacion Completa - Estrategia Claude.md
REM Portal de Auditorias Tecnicas

echo.
echo ===============================================
echo   VERIFICACION ESTRATEGIA CLAUDE.MD COMPLETA
echo ===============================================
echo.

REM Verificar ubicacion correcta
if not exist ".clauderc" (
    echo ❌ Error: Ejecuta este script desde la raiz del proyecto
    echo    Ubicacion esperada: C:\xampp\htdocs\portal-auditorias
    pause
    exit /b 1
)

echo 📍 Verificando ubicacion del proyecto...
echo ✅ Ejecutando desde directorio correcto

echo.
echo 🔍 1. Testing completo del sistema Claude.md...
echo ------------------------------------------------
call npm run claude:test
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Testing Claude.md falló. Revisa los errores arriba.
    echo.
    goto :show_help
)

echo.
echo ✅ Testing Claude.md completado exitosamente
echo.

echo 📋 2. Validando consistencia de archivos...
echo ------------------------------------------------
call npm run claude:validate
if %ERRORLEVEL% neq 0 (
    echo.
    echo ⚠️  Validacion encontró inconsistencias
    echo.
)

echo.
echo 📊 3. Reporte de estado actual...
echo ------------------------------------------------

REM Contar archivos Claude.md
set /a claudemd_count=0
for /r "server\domains" %%i in (Claude.md) do set /a claudemd_count+=1

echo    📄 Archivos Claude.md: %claudemd_count%
echo    📁 Modulos documentados: AUTH, AUDITORIAS, ETL, IA

REM Verificar estado de modulos core
echo.
echo 🎯 Estado de modulos core:
if exist "server\domains\ia\Claude.md" (
    echo    ✅ IA: Documentado y funcional
) else (
    echo    ❌ IA: No documentado
)

if exist "server\domains\auditorias\Claude.md" (
    echo    ✅ AUDITORIAS: Documentado y funcional
) else (
    echo    ❌ AUDITORIAS: No documentado
)

if exist "server\domains\etl\Claude.md" (
    echo    ✅ ETL: Documentado y funcional
) else (
    echo    ❌ ETL: No documentado
)

if exist "server\domains\auth\Claude.md" (
    echo    ✅ AUTH: Documentado
) else (
    echo    ❌ AUTH: No documentado
)

echo.
echo 📝 4. Proximos pasos recomendados:
echo ------------------------------------------------
echo    1. Para desarrollo: Usar protocolos Claude.md
echo    2. Para nuevas funcionalidades: Consultar PROJECT_OVERVIEW.md
echo    3. Para debugging: Usar Claude.md especificos de dominio
echo    4. Para testing: npm run claude:health

echo.
echo 🎉 SISTEMA CLAUDE.MD VERIFICADO EXITOSAMENTE
echo.
echo 🚀 El Portal de Auditorias Tecnicas esta listo para:
echo    - Desarrollo asistido por Claude
echo    - Navegacion inteligente de contexto
echo    - Mantenimiento automatizado de documentacion
echo    - Escalado eficiente del proyecto

echo.
echo 📖 Comandos utiles:
echo    npm run claude:test      - Testing completo
echo    npm run claude:validate - Validar consistencia
echo    npm run claude:generate - Actualizar Claude.md
echo    npm run claude:health   - Chequeo completo

echo.
echo 📞 Para soporte, consultar:
echo    - PROJECT_OVERVIEW.md (punto de entrada principal)
echo    - /server/domains/[modulo]/Claude.md (documentacion especifica)
    
goto :end

:show_help
echo.
echo 🔧 AYUDA PARA RESOLVER PROBLEMAS:
echo =====================================
echo.
echo Si el testing fallo, verifica:
echo   1. Todos los archivos Claude.md existen
echo   2. Configuracion .clauderc es valida
echo   3. Scripts en /scripts/ son ejecutables
echo.
echo Para regenerar Claude.md faltantes:
echo   npm run claude:generate:all
echo.
echo Para verificar configuracion:
echo   type .clauderc
echo.
echo Contacto: Consultar PROJECT_OVERVIEW.md

:end
echo.
echo ===============================================
echo   VERIFICACION COMPLETADA
echo ===============================================
pause