# Documentación de la Colección de Postman

# Portal de Auditorías Técnicas - Sistema de Autenticación JWT

## Información General

- **Nombre**: Portal de Auditorías Técnicas - Autenticación
- **Versión**: 1.0.0
- **Base URL**: <http://localhost:5000>
- **Tipo**: Colección de testing para API REST
- **Autenticación**: JWT Bearer Token

## Variables de Entorno

La colección utiliza las siguientes variables que se configuran automáticamente:

```text
baseUrl: http://localhost:5000
accessToken: (se llena automáticamente tras login exitoso)
refreshToken: (se llena automáticamente tras login exitoso)
userId: (se llena automáticamente tras login exitoso)
```

## Endpoints Incluidos

### 1. Endpoints de Verificación

- **Health Check**: `GET /health`
  - Propósito: Verificar estado del servidor y servicios
  - Autenticación: No requerida
  - Respuesta esperada: Status DEGRADED/HEALTHY con detalles de servicios

- **API Auth Info**: `GET /api/auth`
  - Propósito: Información sobre endpoints disponibles
  - Autenticación: No requerida
  - Respuesta esperada: Lista de endpoints y configuración

### 2. Endpoints de Autenticación

#### Login (3 variantes)

- **Login Admin**: `POST /api/auth/login`
  - Body: `{"email": "admin@portal-auditorias.com", "password": "admin123"}`
  - Script automatizado: Guarda tokens en variables de entorno
  - Rol esperado: ADMIN

- **Login Auditor**: `POST /api/auth/login`
  - Body: `{"email": "auditor@portal-auditorias.com", "password": "auditor123"}`
  - Rol esperado: AUDITOR

- **Login Proveedor**: `POST /api/auth/login`
  - Body: `{"email": "proveedor@callcenterdemo.com", "password": "proveedor123"}`
  - Rol esperado: PROVEEDOR

#### Registro

- **Registrar Usuario**: `POST /api/auth/register`
  - Body: Incluye email, password, nombres, apellidos, documento, telefono, rol
  - Validaciones: Password segura, email único, documento único
  - Rol por defecto: PROVEEDOR

#### Gestión de Tokens

- **Refresh Token**: `POST /api/auth/refresh`
  - Body: `{"refreshToken": "{{refreshToken}}"}`
  - Propósito: Renovar access token expirado
  - Usa variable automática de refresh token

### 3. Endpoints Protegidos (Requieren Autenticación)

#### Gestión de Perfil

- **Obtener Perfil**: `GET /api/auth/profile`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Respuesta: Datos completos del usuario (sin campos sensibles)

- **Actualizar Perfil**: `PUT /api/auth/profile`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Body: Campos actualizables (nombres, telefono, configuracion)

#### Seguridad

- **Cambiar Contraseña**: `POST /api/auth/change-password`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Body: `{"currentPassword": "actual", "newPassword": "nueva"}`
  - Validación: Contraseña actual debe ser correcta

- **Obtener Permisos**: `GET /api/auth/permissions`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Respuesta: Lista de permisos según rol del usuario

#### Sesiones

- **Validar Token**: `GET /api/auth/validate-token`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Propósito: Verificar si token actual es válido

- **Obtener Sesiones**: `GET /api/auth/sessions`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Respuesta: Lista de sesiones activas del usuario

- **Cerrar Sesión**: `POST /api/auth/logout`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Propósito: Invalidar sesión actual

### 4. Endpoints de Recuperación

- **Solicitar Recuperación Contraseña**: `POST /api/auth/forgot-password`
  - Body: `{"email": "usuario@ejemplo.com"}`
  - Propósito: Enviar token de recuperación por email
  - Respuesta: Siempre exitosa por seguridad

- **Resetear Contraseña**: `POST /api/auth/reset-password`
  - Body: `{"token": "reset-token", "newPassword": "nueva"}`
  - Propósito: Cambiar contraseña con token de recuperación

- **Verificar Email**: `POST /api/auth/verify-email`
  - Body: `{"token": "verification-token"}`
  - Propósito: Activar cuenta tras registro

### 5. Endpoints Administrativos

- **Admin - Crear Usuario**: `POST /api/auth/admin/create-user`
  - Headers: `Authorization: Bearer {{accessToken}}`
  - Restricción: Solo usuarios con rol ADMIN
  - Body: Datos completos de usuario incluyendo rol específico

### 6. Endpoints de Testing/Validación

- **Login Credenciales Incorrectas**: `POST /api/auth/login`
  - Propósito: Probar validación de credenciales
  - Respuesta esperada: 401 Unauthorized

- **Acceso Sin Token**: `GET /api/auth/profile`
  - Propósito: Probar protección de endpoints
  - Respuesta esperada: 401 Unauthorized

- **Token Inválido**: `GET /api/auth/profile`
  - Headers: `Authorization: Bearer token-invalido`
  - Propósito: Probar validación de tokens
  - Respuesta esperada: 401 Unauthorized

## Flujo de Testing Recomendado

### Paso 1: Verificación Básica

1. Ejecutar "Health Check" - verificar servidor funcionando
2. Ejecutar "API Auth Info" - verificar endpoints disponibles

### Paso 2: Autenticación

1. Ejecutar "Login Admin" - obtener tokens de administrador
2. Verificar que variables accessToken y refreshToken se llenan automáticamente

### Paso 3: Endpoints Protegidos

1. Ejecutar "Obtener Perfil" - verificar autenticación funciona
2. Ejecutar "Obtener Permisos" - verificar autorización por roles
3. Ejecutar "Validar Token" - verificar token válido

### Paso 4: Gestión de Perfil

1. Ejecutar "Actualizar Perfil" - probar modificación de datos
2. Ejecutar "Cambiar Contraseña" - probar seguridad

### Paso 5: Testing de Otros Roles

1. Ejecutar "Login Auditor" - cambiar a rol auditor
2. Ejecutar "Obtener Permisos" - comparar permisos diferentes
3. Ejecutar "Login Proveedor" - cambiar a rol proveedor

### Paso 6: Testing de Validaciones

1. Ejecutar "Login Credenciales Incorrectas" - verificar error 401
2. Ejecutar "Acceso Sin Token" - verificar protección
3. Ejecutar "Token Inválido" - verificar validación de tokens

### Paso 7: Funcionalidades Avanzadas

1. Ejecutar "Refresh Token" - probar renovación de tokens
2. Ejecutar "Registrar Usuario" - probar creación de cuentas
3. Ejecutar "Admin - Crear Usuario" - probar funciones administrativas

## Scripts Automatizados

La colección incluye scripts que se ejecutan automáticamente:

### Post-Response Scripts en Login

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  if (response.status === "success" && response.data.tokens) {
    pm.environment.set("accessToken", response.data.tokens.access_token);
    pm.environment.set("refreshToken", response.data.tokens.refresh_token);
    pm.environment.set("userId", response.data.user.id);
  }
}
```

Este script:

- Verifica respuesta exitosa (200)
- Extrae tokens de la respuesta JSON
- Guarda tokens en variables de entorno automáticamente
- Permite usar tokens en requests subsecuentes sin configuración manual

## Códigos de Respuesta Esperados

### Respuestas Exitosas

- **200 OK**: Login exitoso, perfil obtenido, datos actualizados
- **201 Created**: Usuario registrado exitosamente

### Respuestas de Error Cliente

- **400 Bad Request**: Datos faltantes o formato incorrecto
- **401 Unauthorized**: Sin token, token inválido, credenciales incorrectas
- **403 Forbidden**: Token válido pero sin permisos suficientes
- **404 Not Found**: Endpoint no existe
- **409 Conflict**: Email o documento ya registrado
- **429 Too Many Requests**: Rate limiting activado

### Respuestas de Error Servidor

- **500 Internal Server Error**: Error en servidor
- **503 Service Unavailable**: Servicio no disponible

## Usuarios de Prueba Incluidos

La colección está configurada para usar estos usuarios creados automáticamente:

1. **Administrador**
   - Email: <admin@portal-auditorias.com>
   - Password: admin123
   - Rol: ADMIN
   - Permisos: Acceso total al sistema

2. **Auditor**
   - Email: <auditor@portal-auditorias.com>
   - Password: auditor123
   - Rol: AUDITOR
   - Permisos: Gestión de auditorías, documentos, ETL, IA

3. **Proveedor**
   - Email: <proveedor@callcenterdemo.com>
   - Password: proveedor123
   - Rol: PROVEEDOR
   - Permisos: Ver auditorías propias, subir documentos

## Configuración de Entorno

### Variables Requeridas

```text
baseUrl: http://localhost:5000 (modificar si servidor usa otro puerto)
```

### Variables Automáticas (No configurar manualmente)

```text
accessToken: (se llena tras login exitoso)
refreshToken: (se llena tras login exitoso)
userId: (se llena tras login exitoso)
```

## Troubleshooting

### Error de Conexión

- Verificar que servidor esté corriendo en puerto 5000
- Comprobar health check: <http://localhost:5000/health>

### Error 401 en Endpoints Protegidos

- Verificar que se ejecutó login exitosamente
- Confirmar que accessToken tiene valor en variables de entorno
- Token puede haber expirado (24h por defecto) - ejecutar login nuevamente

### Error 403 Forbidden

- Usuario no tiene permisos para la operación
- Verificar rol del usuario logueado
- Para operaciones admin, usar login de administrador

### Rate Limiting

- Si aparece error 429, esperar 15 minutos o reiniciar servidor
- Rate limit: 5 intentos de login por 15 minutos por IP

## Mantenimiento

### Actualizar Colección

Para agregar nuevos endpoints al sistema:

1. Duplicar request similar existente
2. Modificar URL, método y body según necesidad
3. Ajustar scripts si requiere manejo especial de tokens
4. Documentar en esta guía

### Sincronización con Desarrollo

Esta colección debe mantenerse sincronizada con:

- Nuevos endpoints agregados al servidor
- Cambios en estructura de respuestas
- Modificaciones en validaciones
- Actualizaciones de roles y permisos
