# 🚀 Portal de Auditorías Técnicas - Backend

Backend del Portal de Auditorías Técnicas desarrollado con Node.js, Express, MySQL, Redis y Ollama (IA local).

## ✅ Estado de Implementación

### 🟢 **COMPLETO - Configuraciones Base**

- ✅ Estructura de proyecto con separación por dominios
- ✅ Configuración de base de datos MySQL
- ✅ Configuración de Redis para cache y jobs
- ✅ Configuración de Ollama para IA local
- ✅ Configuración de BullMQ para jobs asíncronos
- ✅ Middleware de seguridad, logging y manejo de errores

### 🟢 **COMPLETO - Modelos de Datos**

- ✅ Usuario (autenticación y roles)
- ✅ Proveedor (entidades del call center)
- ✅ Auditoria (proceso de 8 etapas)
- ✅ Documento (gestión de archivos)
- ✅ ParqueInformatico (datos ETL normalizados)
- ✅ Relaciones entre modelos configuradas

### 🟡 **PARCIAL - API Endpoints**

- ✅ Rutas de autenticación (placeholders implementados)
- ⏳ Controladores de autenticación (pendiente)
- ⏳ Rutas de auditorías (pendiente)
- ⏳ Rutas de ETL (pendiente)
- ⏳ Rutas de IA (pendiente)

### 🔴 **PENDIENTE - Funcionalidades Avanzadas**

- ⏳ Motor ETL completo
- ⏳ Integración con Ollama
- ⏳ Sistema de notificaciones
- ⏳ WebSockets para tiempo real
- ⏳ Jobs asíncronos específicos

## 🛠️ Instalación y Configuración

### Prerequisitos

1. **Node.js 18+** y **npm 9+**
2. **MySQL 8.0+**
3. **Redis** (opcional pero recomendado)
4. **Ollama** (opcional para funcionalidades de IA)

### Instalación

```bash
# 1. Navegar al directorio del servidor
cd server

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración específica

# 4. Crear base de datos
# En MySQL: CREATE DATABASE portal_auditorias_dev;

# 5. Sincronizar modelos con la base de datos
npm run db:sync

# 6. (Opcional) Verificar salud del sistema
npm run health
```

### Configuración de Servicios

#### MySQL

```sql
-- Crear base de datos
CREATE DATABASE portal_auditorias_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario (opcional)
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON portal_auditorias_dev.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Redis (Opcional)

```bash
# Instalar Redis
# Windows: https://redis.io/download
# macOS: brew install redis
# Ubuntu: sudo apt install redis-server

# Iniciar Redis
redis-server
```

#### Ollama (Opcional)

```bash
# Instalar Ollama: https://ollama.ai/download

# Descargar modelos necesarios
ollama pull llama3.2:1b
ollama pull moondream

# Verificar instalación
ollama list
```

## 🚀 Ejecución

### Desarrollo

```bash
# Iniciar en modo desarrollo (con hot reload)
npm run dev

# El servidor estará disponible en http://localhost:3001
```

### Producción

```bash
# Iniciar en modo producción
npm start
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor con hot reload
npm run db:sync          # Sincronizar base de datos
npm run db:sync -- --force  # Recrear tablas (⚠️ elimina datos)
npm run health           # Verificar estado del sistema

# Testing
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura

# Calidad de código
npm run lint             # Verificar código
npm run lint:fix         # Corregir problemas automáticamente
```

## 📡 API Endpoints

### Información General

- `GET /` - Información del servidor
- `GET /health` - Estado de salud del sistema
- `GET /info` - Información básica del servidor

### Autenticación (`/api/auth`)

```bash
# Públicos
POST /api/auth/login              # Iniciar sesión
POST /api/auth/register           # Registrar usuario
POST /api/auth/refresh            # Renovar token
POST /api/auth/forgot-password    # Recuperar contraseña
POST /api/auth/reset-password     # Resetear contraseña
POST /api/auth/verify-email       # Verificar email

# Protegidos (requieren autenticación)
GET  /api/auth/profile            # Obtener perfil
PUT  /api/auth/profile            # Actualizar perfil
POST /api/auth/change-password    # Cambiar contraseña
POST /api/auth/logout             # Cerrar sesión
GET  /api/auth/sessions           # Sesiones activas
DELETE /api/auth/sessions/:id     # Cerrar sesión específica
```

### Auditorías (`/api/auditorias`) - ⏳ Pendiente

### ETL (`/api/etl`) - ⏳ Pendiente

### IA (`/api/ia`) - ⏳ Pendiente

## 🏗️ Arquitectura

### Estructura de Directorios

```text
server/
├── config/              # Configuraciones (DB, Redis, Ollama, BullMQ)
├── domains/             # Módulos por dominio de negocio
│   ├── auth/            # Autenticación y autorización
│   ├── auditorias/      # Gestión de auditorías
│   ├── etl/             # Motor ETL
│   ├── ia/              # Motor de IA
│   ├── chat/            # Sistema de mensajería
│   ├── notifications/   # Sistema de notificaciones
│   ├── entities/        # Entidades base (proveedores, usuarios)
│   └── dashboards/      # Dashboards y métricas
├── models/              # Configuración de modelos y relaciones
├── shared/              # Utilidades y middleware compartido
├── scripts/             # Scripts de utilidad
└── server.js            # Punto de entrada principal
```

### Patrones de Diseño

- **Separación por Dominios**: Cada módulo es autocontenido
- **Controller-Service Pattern**: Lógica separada en capas
- **Middleware Pipeline**: Procesamiento secuencial de requests
- **Event-Driven**: Jobs asíncronos con BullMQ
- **Error Handling**: Manejo centralizado de errores

## 🔧 Configuración Avanzada

### Variables de Entorno Clave

```bash
# Base de datos
DB_HOST=localhost
DB_NAME=portal_auditorias_dev
DB_USER=root
DB_PASSWORD=

# Seguridad
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# IA Local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3.2:1b
OLLAMA_IMAGE_MODEL=moondream

# Archivos
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_PATH=./uploads
```

### Configuración de Producción

```bash
# Variables adicionales para producción
NODE_ENV=production
DB_SSL=true
REDIS_TLS=true
CLUSTER_WORKERS=4
RATE_LIMIT_MAX_REQUESTS=50
```

## 🧪 Testing

### Estructura de Tests

```bash
server/tests/
├── auth/                # Tests de autenticación
├── auditorias/          # Tests de auditorías
├── etl/                 # Tests del motor ETL
└── shared/              # Tests de utilidades compartidas
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm test -- --grep "auth"
npm test -- --grep "ETL"

# Coverage
npm run test:coverage
```

## 📊 Monitoreo y Logging

### Health Check

```bash
# Verificar estado del sistema
curl http://localhost:3001/health

# Respuesta esperada:
{
  "status": "healthy",
  "services": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "ollama": { "status": "up" },
    "bullmq": { "status": "up" }
  }
}
```

### Logs

- **Requests**: `logs/requests.log`
- **Errores**: `logs/error.log`
- **Aplicación**: `logs/server.log`

## 🚨 Troubleshooting

### Problemas Comunes

#### Base de datos no conecta

```bash
# Verificar MySQL
sudo service mysql status

# Verificar configuración
node scripts/health-check.js
```

#### Redis no disponible

```bash
# Verificar Redis
redis-cli ping

# Iniciar Redis
redis-server
```

#### Ollama no responde

```bash
# Verificar Ollama
ollama list

# Iniciar Ollama
ollama serve
```

#### Puerto en uso

```bash
# Encontrar proceso usando puerto 3001
lsof -i :3001

# Cambiar puerto en .env
PORT=3002
```

## 🔐 Seguridad

### Medidas Implementadas

- **Helmet.js**: Headers de seguridad
- **CORS**: Control de origenes
- **Rate Limiting**: Límite de requests
- **JWT**: Autenticación stateless
- **Bcrypt**: Encriptación de contraseñas
- **Input Validation**: Validación de datos de entrada

### Recomendaciones de Producción

1. Cambiar todos los secretos en `.env`
2. Configurar HTTPS
3. Implementar WAF (Web Application Firewall)
4. Configurar backup automático de DB
5. Implementar monitoring con alertas

## 🤝 Contribución

### Próximos Pasos de Desarrollo

1. **Implementar Controladores de Autenticación**

   - JWT generation/validation
   - Password reset flow
   - Email verification

2. **Desarrollar Motor ETL**

   - Excel/CSV parsing
   - Data normalization
   - Business rules validation

3. **Integrar Ollama para IA**

   - Document analysis
   - Image processing
   - Automated scoring

4. **Sistema de Notificaciones**
   - Email notifications
   - WebSocket real-time updates
   - Automated reminders

### Guías de Desarrollo

- Seguir patrones de separación por dominios
- Implementar tests para nuevas funcionalidades
- Actualizar documentación Claude.md
- Mantener compatibilidad con la estrategia Claude.md

## 📞 Soporte

Para problemas o preguntas:

1. Verificar logs en `logs/`
2. Ejecutar `npm run health`
3. Consultar documentación Claude.md específica
4. Crear issue en el repositorio

---

**🎯 El backend está listo para desarrollo con una base sólida de configuraciones, modelos y estructura. Los próximos pasos involucran implementar la lógica de negocio específica de cada dominio.**
