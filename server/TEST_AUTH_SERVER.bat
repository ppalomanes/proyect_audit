@echo off
echo 🧪 Probando servidor AUTH en puerto 3002...

echo.
echo 1. Probando Health Check...
curl -s http://localhost:3002/api/health
echo.
echo.

echo 2. Probando Info Auth...
curl -s http://localhost:3002/api/auth
echo.
echo.

echo 3. Probando Login...
curl -s -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"test123\"}"
echo.
echo.

echo 4. Probando Validate (sin token - debe fallar)...
curl -s http://localhost:3002/api/auth/validate
echo.
echo.

echo ✅ Pruebas completadas
echo.
echo 💡 Si ves respuestas JSON, el servidor funciona correctamente
echo 💡 El frontend debería poder conectarse ahora
echo.
pause
