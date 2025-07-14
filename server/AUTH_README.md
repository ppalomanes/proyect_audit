# 🔐 Sistema de Autenticación JWT - Portal de Auditorías Técnicas

## ✅ Estado de Implementación

**🎉 COMPLETADO** - Sistema de autenticación JWT completamente funcional e implementado.

### 📋 Componentes Implementados

- ✅ **Servicio de Autenticación** (`auth.service.js`) - Lógica completa JWT con bcrypt
- ✅ **Controlador de Auth** (`auth.controller.js`) - 15+ endpoints funcionales
- ✅ **Middleware de Autenticación** (`authentication.js`) - Verificación JWT y estados
- ✅ **Middleware de Autorización** (`authorization.js`) - Control de roles y permisos
- ✅ **Validadores** (`auth.validators.js`) - Validaciones express-validator
- ✅ **Rutas Configuradas** (`auth.routes.js`) - Endpoints públicos y protegidos
- ✅ **Modelo Usuario** (`Usuario.model.js`) - Esquema completo con hooks bcrypt

## 🚀 Inicio Rápido

### 1. Prerequisitos
```bash
# Asegúrate de que XAMPP esté corriendo (MySQL)
# Node.js 18+ requerido
```

### 2. Iniciar Servidor
```bash
cd server
npm start
# o para desarrollo
npm run dev
```

### 3. Verificar Funcionamiento
```bash
# Health check
curl http://localhost:5000/health

# Información de API
curl http://localhost:5000/api/auth

# Test completo
npm run test:auth
```

## 🔑 Endpoints de Autenticación

### Endpoints Públicos

#### POST /api/auth/login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portal-auditorias.com",
    "password": "admin123"
  }'
```

#### POST /api/auth/register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@ejemplo.com",
    "password": "Password123",
    "nombres": "Nombre",
    "apellidos": "Apellidos",
    "documento": "12345678",
    "telefono": "+57 300 123-4567"
  }'
```

#### POST /api/auth/refresh
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

#### POST /api/auth/forgot-password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com"
  }'
```

### Endpoints Protegidos

#### GET /api/auth/profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer your-access-token"
```

#### PUT /api/auth/profile
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Nuevo Nombre",
    "telefono": "+57 310 987-6543"
  }'
```

#### POST /api/auth/change-password
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Password123",
    "newPassword": "NewPassword123"
  }'
```

#### GET /api/auth/permissions
```bash
curl -X GET http://localhost:5000/api/auth/permissions \
  -H "Authorization: Bearer your-access-token"
```

## 👥 Usuarios de Prueba

| Email | Password | Rol | Estado |
|-------|----------|-----|--------|
| admin@portal-auditorias.com | admin123 | ADMIN | ACTIVO |
| auditor@portal-auditorias.com | auditor123 | AUDITOR | ACTIVO |
| proveedor@callcenterdemo.com | proveedor123 | PROVEEDOR | ACTIVO |

## 🛡️ Roles y Permisos

### ADMIN
- Acceso total al sistema
- Puede crear, editar y eliminar usuarios
- Puede gestionar todas las auditorías
- Acceso a todas las funcionalidades

### SUPERVISOR
- Puede gestionar auditorías
- Puede ver y editar usuarios (limitado)
- Puede generar reportes
- Acceso a dashboards ejecutivos

### AUDITOR
- Puede crear y gestionar auditorías asignadas
- Puede subir y validar documentos
- Puede procesar ETL y usar IA
- Puede ver reportes

### PROVEEDOR
- Solo puede ver sus propias auditorías
- Puede subir documentos propios
- Puede participar en chat
- Puede editar su perfil

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_auditorias_dev
DB_USER=root
DB_PASSWORD=

# Server
PORT=5000
NODE_ENV=development
```

### Política de Contraseñas
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Caracteres especiales (en producción)

### Rate Limiting
- Login: 5 intentos por 15 minutos por IP
- Registro: 3 intentos por hora por IP
- API general: 100 requests por 15 minutos por IP

### Bloqueo de Cuentas
- Máximo 5 intentos fallidos
- Bloqueo automático por 30 minutos
- Auto-desbloqueo tras el tiempo configurado

## 🔒 Seguridad Implementada

### ✅ Autenticación
- JWT con access y refresh tokens
- Tokens con expiración configurable
- Verificación de estado de cuenta
- Verificación de email obligatoria

### ✅ Autorización
- Control basado en roles
- Permisos granulares por funcionalidad
- Middleware de autorización reutilizable
- Verificación de propiedad de recursos

### ✅ Protección
- Rate limiting por endpoint
- Validación y sanitización de datos
- Bloqueo automático de cuentas
- Headers de seguridad con Helmet
- CORS configurado

### ✅ Encriptación
- Contraseñas hasheadas con bcrypt (salt 12)
- Tokens seguros para verificación/reset
- JWT firmado con secret configurable

## 🧪 Testing

### Ejecutar Tests Automáticos
```bash
# Test completo del sistema de auth
npm run test:auth

# Health check
npm run health
```

### Test Manual con curl
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portal-auditorias.com","password":"admin123"}' \
  | jq -r '.data.tokens.access_token')

# 2. Usar token en endpoint protegido
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting

### Error: "Token inválido"
- Verificar formato: `Authorization: Bearer <token>`
- Verificar expiración del token
- Verificar que el JWT_SECRET sea el mismo

### Error: "Usuario no encontrado"
- Verificar que los usuarios de prueba existan
- Ejecutar: `npm run db:seed`

### Error: "Conexión a base de datos"
- Verificar que XAMPP esté corriendo
- Verificar configuración en .env
- Verificar que la BD portal_auditorias_dev exista

### Error: "Puerto en uso"
- Cambiar puerto en .env: `PORT=5001`
- O detener proceso que usa puerto 5000

## 📚 Próximos Pasos

Con el sistema de autenticación completo, los siguientes módulos a implementar son:

1. **🔄 Controladores de Auditorías** - CRUD y workflow de 8 etapas
2. **📊 Motor ETL** - Procesamiento de parque informático  
3. **🤖 Integración Ollama** - IA para análisis de documentos
4. **💬 Sistema de Chat** - Comunicación auditor-proveedor
5. **📈 Dashboards** - Métricas y reportes

## 🎯 Características Destacadas

- **🚀 Listo para Producción**: Seguridad empresarial implementada
- **⚡ Alta Performance**: Middleware optimizado y caching
- **🔧 Fácil Mantenimiento**: Código modular y bien documentado
- **📱 API RESTful**: Estándares de la industria
- **🧪 Completamente Testeable**: Scripts de prueba incluidos
- **📊 Observabilidad**: Logging y métricas integrados

---

**✅ El sistema de autenticación está 100% implementado y listo para usar.**

**🚀 Siguiente fase**: Implementar controladores de auditorías y motor ETL.
