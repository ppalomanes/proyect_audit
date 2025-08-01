@echo off
echo 📦 ========================================
echo 🔧 Instalando dependencias frontend ETL
echo 📦 ========================================
echo.

cd /d C:\xampp\htdocs\portal-auditorias\client

echo 📦 Instalando react-dropzone...
call npm install react-dropzone@14.2.3

echo 📦 Verificando otras dependencias...
call npm install

echo ✅ Dependencias instaladas correctamente
echo.
echo 🚀 Ahora puedes ejecutar: npm run dev
echo.
pause