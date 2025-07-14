# 🔧 Guía de Resolución de Problemas - Portal de Auditorías

## 🚨 Problemas Comunes y Soluciones

### 1. Error: "Unknown database 'portal_auditorias_dev'"

**Síntoma**: Base de datos no existe

```text
❌ Error conectando a MySQL: Unknown database 'portal_auditorias_dev'
```

**Solución**:

```bash
# Opción 1: Usar el script de setup automático
cd server
npm run setup

# Opción 2: Crear manualmente via MySQL
mysql -u root -p
CREATE DATABASE portal_auditorias_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Opción 3: Sincronizar BD directamente
npm run db:sync
```

### 2. Error: "connect ECONNREFUSED 127.0.0.1:6379" (Redis)

**Síntoma**: Redis no está ejecutándose

```text
❌ Error Redis: connect ECONNREFUSED 127.0.0.1:6379
```

**Solución**:

```bash
# Opción 1: Instalar y ejecutar Redis (Recomendado)
# Windows: Descargar Redis desde https://redis.io/download
# Linux/Mac: sudo apt install redis-server || brew install redis

# Opción 2: Continuar sin Redis (modo degradado)
# El sistema funcionará automáticamente sin Redis
# Las funcionalidades de cache estarán deshabilitadas
```

**Verificación**:

```bash
# Verificar que Redis funciona
redis-cli ping
# Respuesta esperada: PONG
```

### 3. Error: "Ignoring invalid configuration option passed to Connection: collate"

**Síntoma**: Warning de configuración MySQL

```text
Ignoring invalid configuration option passed to Connection: collate
```

**Solución**: ✅ Ya corregido en la nueva configuración de `database.js`

### 4. Error: Ollama no disponible

**Síntoma**: Funcionalidades de IA limitadas

```text
⚠️ Ollama no disponible - funcionalidades de IA limitadas
```

**Solución**:

```bash
# Instalar Ollama
# 1. Descargar desde: https://ollama.ai/download
# 2. Instalar modelos necesarios:
ollama pull llama3.2:1b
ollama pull moondream:latest

# Verificar instalación
ollama list
```

### 5. Error: "npm WARN deprecated" durante instalación

**Síntoma**: Warnings durante `npm install`

**Solución**:

```bash
# Limpiar cache y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 6. Error: Puerto 5000 ya en uso

**Síntoma**: `EADDRINUSE: address already in use :::5000`

**Solución**:

```bash
# Opción 1: Cambiar puerto en .env
PORT=5001

# Opción 2: Matar proceso en puerto 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### 7. Error: Permisos de archivos (Linux/Mac)

**Síntoma**: `EACCES: permission denied`

**Solución**:

```bash
# Dar permisos a scripts
chmod +x scripts/*.js

# Crear directorios necesarios
mkdir -p uploads logs

# Ajustar permisos de directorios
chmod 755 uploads logs
```

### 8. Error: Modelos no sincronizados

**Síntoma**: Errores de tablas no encontradas

**Solución**:

```bash
# Forzar resincronización completa
npm run db:reset

# O sincronización normal
npm run db:sync
```

## 🔍 Comandos de Diagnóstico

### Health Check Completo

```bash
npm run health
```

### Verificar Servicios Individuales

```bash
# MySQL
mysql -u root -p -e "SELECT 1"

# Redis
redis-cli ping

# Ollama
ollama list

# Node.js
node --version
```

### Logs de Depuración

```bash
# Ejecutar con logs detallados
npm run dev:debug

# Verificar logs de aplicación
tail -f logs/app.log
```

## 🛠️ Scripts de Utilidad

### Setup Completo desde Cero

```bash
cd server
npm run setup
```

### Reinstalación Limpia

```bash
npm run reinstall
```

### Verificación Rápida

```bash
npm run check:services
```

### Limpiar Logs

```bash
npm run logs:clear
```

## 📊 Estados de Servicios

### ✅ Estado Saludable

- **Database**: Conectado a MySQL
- **Redis**: Opcional - puede estar deshabilitado
- **Ollama**: Opcional - funcionalidades de IA
- **BullMQ**: Dependiente de Redis

### ⚠️ Estado Degradado (Aceptable)

- **Database**: ✅ Conectado
- **Redis**: ❌ Desconectado (modo mock activo)
- **Ollama**: ❌ No disponible
- **BullMQ**: ❌ Modo mock activo

### ❌ Estado Crítico

- **Database**: ❌ Desconectado
- Sistema no puede funcionar sin base de datos

## 🔄 Flujo de Solución de Problemas

1. **Ejecutar Health Check**

   ```bash
   npm run health
   ```

2. **Identificar Servicios Down**
   - Database: Crítico - debe resolverse
   - Redis: Opcional - puede continuar
   - Ollama: Opcional - puede continuar

3. **Aplicar Soluciones Específicas**
   - Seguir las soluciones por cada error
   - Usar scripts de setup automático cuando sea posible

4. **Verificar Resolución**

   ```bash
   npm run check:services
   ```

5. **Iniciar Desarrollo**

   ```bash
   npm run dev
   ```

## 📞 Soporte Adicional

### Información del Sistema

```bash
# Versiones instaladas
node --version
npm --version
mysql --version

# Estado de procesos
npm run health

# Logs recientes
tail -20 logs/app.log
```

### Reportar Issues

1. Ejecutar `npm run health`
2. Capturar output completo
3. Incluir versiones de Node.js, MySQL, OS
4. Describir pasos para reproducir el error

---

**💡 Tip**: La mayoría de problemas se resuelven con `npm run setup` que configura todo automáticamente.

**🎯 Objetivo**: El sistema debe funcionar con solo MySQL corriendo. Redis y Ollama son opcionales para desarrollo.
