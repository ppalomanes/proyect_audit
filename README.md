# 🚀 Portal de Auditorías Técnicas - Configuración Base del Servidor

## Estado Actual del Proyecto

✅ **COMPLETADO** - Configuraciones base del servidor implementadas exitosamente:

### 🏗️ Configuraciones Implementadas

1. **✅ Configuración MySQL** (`/server/config/database.js`)
   - Pool de conexiones optimizado para alta concurrencia
   - Configuración para desarrollo y producción
   - Timezone Colombia, charset UTF8MB4
   - Retry automático y logging detallado

2. **✅ Configuración Redis** (`/server/config/redis.js`)
   - 4 clientes especializados (principal, cache, session, queue)
   - Utilidades de cache con TTL inteligente
   - Gestión de sesiones JWT
   - Event listeners para monitoreo

3. **✅ Configuración Ollama IA** (`/server/config/ollama.js`)
   - Configuración LLaMA 3.2:1b para análisis de documentos
   - Configuración Moondream para análisis de imágenes
   - Health checks y fallbacks automáticos
   - Prompts optimizados para auditorías técnicas

4. **✅ Configuración BullMQ** (`/server/config/bullmq.js`)
   - Colas especializadas (ETL, IA, notificaciones, mantenimiento)
   - Workers con concurrencia optimizada
   - Jobs programados y limpieza automática
   - Estadísticas y monitoreo en tiempo real

5. **✅ Modelos Sequelize** 
   - `AnalisisIA.model.js` - Almacena resultados de análisis IA
   - `CriterioScoring.model.js` - Criterios personalizables de scoring
   - Relaciones, validaciones y métodos de instancia
   - Índices optimizados para consultas frecuentes

6. **✅ Servidor Principal** (`/server/server.js`)
   - Configuración Express con middlewares de seguridad
   - Rate limiting y CORS configurado
   - Registro automático de rutas por dominios
   - Health check completo y shutdown graceful

7. **✅ Middleware Compartido**
   - `authentication.js` - JWT, roles y permisos
   - `error-handler.js` - Manejo global de errores
   - `request-logger.js` - Logging detallado de requests

8. **✅ Rutas IA Actualizadas** (`/server/domains/ia/ia.routes.js`)
   - Integración con middleware de autenticación
   - Validaciones con express-validator
   - Manejo de errores con asyncHandler

### 📦 Dependencias y Configuración

- **✅ package.json** - Todas las dependencias necesarias
- **✅ .env.example** - Variables de entorno documentadas
- **✅ setup.sql** - Script de inicialización de base de datos

## 🚀 Próximos Pasos

### Fase Inmediata (Siguiente)
1. **Instalar dependencias y configurar entorno**
2. **Ejecutar script de base de datos**
3. **Configurar Ollama con modelos requeridos**
4. **Probar integración completa**

### Fases Siguientes
1. **Implementar módulos faltantes** (auth, auditorias, ETL básico)
2. **Crear frontend React** con integración al backend
3. **Testing y optimización**
4. **Despliegue y documentación final**

---

## 📋 Guía de Instalación

### 1. Prerequisitos

```bash
# Node.js 18+ y npm 8+
node --version  # ≥ 18.0.0
npm --version   # ≥ 8.0.0

# XAMPP ejecutándose (MySQL)
# Redis (opcional para desarrollo)
# Ollama instalado
```

### 2. Configuración del Proyecto

```bash
# 1. Navegar al directorio del servidor
cd C:\xampp\htdocs\portal-auditorias\server

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración específica
```

### 3. Configuración de Base de Datos

```bash
# 1. Iniciar XAMPP (Apache + MySQL)
# 2. Abrir phpMyAdmin: http://localhost/phpmyadmin
# 3. Ejecutar script de inicialización
# Copiar contenido de /database/setup.sql y ejecutar en phpMyAdmin
```

### 4. Configuración de Ollama (IA Local)

```bash
# 1. Instalar Ollama (https://ollama.ai)
# 2. Iniciar servicio Ollama
ollama serve

# 3. En otra terminal, instalar modelos
ollama pull llama3.2:1b
ollama pull moondream

# 4. Verificar modelos instalados
ollama list
```

### 5. Configuración de Redis (Opcional)

```bash
# Opción A: Docker (recomendado)
docker run -d -p 6379:6379 --name redis redis:alpine

# Opción B: Instalación local
# Descargar Redis para Windows o usar WSL
```

### 6. Iniciar el Servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

### 7. Verificar Instalación

```bash
# Health check del sistema
curl http://localhost:3001/api/health

# Debería retornar:
{
  "status": "ok",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ollama": "healthy"
  }
}
```

---

## 🔧 Configuración Detallada

### Variables de Entorno Críticas

```env
# Base de datos
DB_HOST=localhost
DB_NAME=portal_auditorias
DB_USER=root
DB_PASSWORD=tu_password

# JWT (CAMBIAR en producción)
JWT_SECRET=tu-clave-super-secreta-de-produccion

# Ollama
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
```

### Estructura de Directorios Importante

```
/server/
├── config/          # Configuraciones centrales
├── domains/         # Módulos por dominio de negocio
│   └── ia/         # Módulo IA completamente implementado
├── shared/         # Middleware y utilidades compartidas
├── uploads/        # Archivos subidos (se crea automáticamente)
└── server.js       # Punto de entrada principal
```

### Endpoints Principales Disponibles

```
GET  /api/health              # Estado del sistema
POST /api/ia/analyze/document # Análisis de documentos
POST /api/ia/analyze/image    # Análisis de imágenes
GET  /api/ia/metrics          # Métricas de IA
GET  /api/ia/health           # Estado de Ollama
```

---

## 🧪 Testing

### Test de Conectividad

```bash
# Test MySQL
node -e "require('./config/database').testConnection()"

# Test Redis
node -e "require('./config/redis').testConnections()"

# Test Ollama
node -e "require('./config/ollama').checkOllamaHealth().then(console.log)"
```

### Test de Endpoints

```bash
# Health check
curl -X GET http://localhost:3001/api/health

# Test IA health (requiere autenticación)
curl -X GET http://localhost:3001/api/ia/health \
  -H "Authorization: Bearer tu_jwt_token"
```

---

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión MySQL**
   ```
   ❌ Error conectando a MySQL: ECONNREFUSED
   💡 Solución: Verificar que XAMPP esté ejecutándose
   ```

2. **Error Ollama no disponible**
   ```
   ❌ Ollama no está disponible
   💡 Solución: Ejecutar 'ollama serve' en terminal
   ```

3. **Error modelos IA faltantes**
   ```
   ⚠️  Modelos faltantes: llama3.2:1b, moondream
   💡 Solución: ollama pull llama3.2:1b && ollama pull moondream
   ```

4. **Puerto en uso**
   ```
   ❌ Port 3001 is already in use
   💡 Solución: Cambiar PORT en .env o matar proceso
   ```

### Logs y Debugging

```bash
# Ver logs detallados
NODE_ENV=development npm run dev

# Verificar configuración
node -e "console.log(require('./config/database').config)"
```

---

## 📊 Monitoreo y Métricas

### Dashboard de Estado

El endpoint `/api/health` proporciona información completa:

```json
{
  "status": "ok",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "database": "connected",
    "redis": "connected", 
    "ollama": "healthy"
  }
}
```

### Métricas de Performance

- **Tiempo respuesta API**: <500ms promedio
- **Análisis IA**: 30s-3min según complejidad
- **Procesamiento ETL**: <5min por archivo Excel
- **Uptime objetivo**: 99.9%

---

## 🎯 Estado del Desarrollo

### ✅ Completado
- [x] Configuraciones base del servidor
- [x] Modelos de base de datos IA
- [x] Middleware de autenticación y errores
- [x] Integración Ollama completa
- [x] Sistema de colas BullMQ
- [x] Documentación de instalación

### 🔄 En Progreso
- [ ] Módulos auth, auditorias, ETL
- [ ] Frontend React
- [ ] Testing automatizado

### 📋 Pendiente
- [ ] Despliegue en producción
- [ ] Monitoreo avanzado
- [ ] Documentación de usuario final

---

**🎉 El Portal de Auditorías Técnicas está listo para continuar el desarrollo con una base sólida y escalable implementada siguiendo la Estrategia Claude.md.**
