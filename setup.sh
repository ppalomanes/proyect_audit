#!/bin/bash

echo "🚀 Configurando Portal de Auditorías Técnicas"
echo "=============================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
fi

echo "✅ Node.js versión: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está disponible"
    exit 1
fi

echo "✅ npm versión: $(npm --version)"

# Installar dependencias del servidor
echo ""
echo "📦 Instalando dependencias del servidor..."
cd server
npm install

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "⚙️ Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "✅ Archivo .env creado. Por favor configura las variables de entorno si es necesario."
fi

# Instalar dependencias del cliente
echo ""
echo "📦 Instalando dependencias del cliente..."
cd ../client
npm install

echo ""
echo "🎉 Instalación completada!"
echo ""
echo "Para iniciar el proyecto:"
echo "  Backend:  cd server && npm start"
echo "  Frontend: cd client && npm run dev"
echo ""
echo "URLs de acceso:"
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:3000"
echo "  Health:   http://localhost:5000/health"
echo ""
echo "Usuarios de prueba:"
echo "  Admin:     admin@portal-auditorias.com / admin123"
echo "  Auditor:   auditor@portal-auditorias.com / auditor123"
echo "  Proveedor: proveedor@callcenterdemo.com / proveedor123"
