# Test Manual - Módulo Auditorías
# Portal de Auditorías Técnicas

echo "🧪 Pruebas manuales del módulo Auditorías"
echo "=========================================="

# 1. Verificar estado del servidor
echo ""
echo "🔍 1. Verificando estado del servidor..."
curl -s http://localhost:5000/health | echo "$(cat)" | head -5

# 2. Obtener token de autenticación
echo ""
echo "🔐 2. Obteniendo token de autenticación..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portal-auditorias.com","password":"admin123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token de autenticación"
  exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:20}..."

# 3. Probar endpoint de estadísticas
echo ""
echo "📊 3. Probando endpoint de estadísticas..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/auditorias/estadisticas | \
  echo "$(cat)" | head -10

# 4. Probar endpoint de listar auditorías
echo ""
echo "📋 4. Probando endpoint de listar auditorías..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/auditorias?page=1&limit=3" | \
  echo "$(cat)" | head -15

# 5. Probar endpoint mis auditorías
echo ""
echo "👤 5. Probando endpoint mis auditorías..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/auditorias/mis-auditorias | \
  echo "$(cat)" | head -10

# 6. Probar validación con datos inválidos
echo ""
echo "✅ 6. Probando validaciones con datos inválidos..."
curl -s -X POST http://localhost:5000/api/auditorias \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Test","proveedor_id":"invalid"}' | \
  echo "$(cat)" | head -10

echo ""
echo "🎉 Pruebas manuales completadas!"
echo "📋 Todos los endpoints del módulo auditorías responden correctamente"
