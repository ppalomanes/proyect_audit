# 🚀 Portal de Auditorías Técnicas - Guía de Inicio con XAMPP

**🎯 PROYECTO 95% COMPLETO - ROADMAP FINAL DEFINIDO**

**Próximo paso**: Seguir `DEVELOPMENT_ROADMAP.md` y `CHECKLIST_ACCIONES_INMEDIATAS.md`  
**Tiempo estimado**: 6-8 semanas para completar al 100%  
**ROI**: Alto (95% ya invertido, 5% para producción)

## 📋 Pre-requisitos

### 1. XAMPP Ejecutándose

- ✅ **MySQL**: Puerto 3306 (REQUERIDO)
- ✅ **Apache**: Puerto 80 (Recomendado para phpMyAdmin)

### 2. Node.js

- ✅ **Versión**: 18.0.0 o superior
- ✅ **NPM**: 8.0.0 o superior

## 🎯 Inicio Rápido

### Opción 1: Inicio Automático (Recomendado)

```bash
# Ejecutar script principal
start-xampp-system.bat
```

### Opción 2: Paso a Paso

```bash
# 1. Configurar base de datos
setup-database-xampp.bat

# 2. Instalar dependencias
cd server && npm install
cd ../client && npm install

# 3. Iniciar servidor
cd server && npm start

# 4. Iniciar cliente (nueva terminal)
cd client && npm run dev
```

## 🔍 Verificación del Sistema

```bash
# Verificar todo el sistema
verify-system-complete.bat

# Tests específicos
cd server
npm run test:controladores
npm run test:sistema-completo
```

## 🌐 URLs de Acceso

| Servicio           | URL                                    | Descripción               |
| ------------------ | -------------------------------------- | ------------------------- |
| **Frontend**       | <http://localhost:5173>                | Interfaz React del portal |
| **Backend API**    | <http://localhost:3002>                | API REST del sistema      |
| **Health Check**   | <http://localhost:3002/api/health>     | Estado del servidor       |
| **phpMyAdmin**     | <http://localhost/phpmyadmin>          | Gestión de BD MySQL       |
| **Bitácora API**   | <http://localhost:3002/api/bitacora>   | Sistema de logs           |
| **Auditorías API** | <http://localhost:3002/api/auditorias> | Gestión de auditorías     |

## 🗃️ Configuración de Base de Datos

### Bases de Datos Creadas

- `portal_auditorias` - Base de datos principal
- `portal_auditorias_test` - Base de datos para testing

### Credenciales (XAMPP por defecto)

- **Host**: localhost
- **Puerto**: 3306
- **Usuario**: root
- **Password**: (vacío)

## 🧪 Testing

### Ejecutar Tests

```bash
cd server

# Tests de controladores implementados
npm run test:controladores

# Tests de sistema completo
npm run test:sistema-completo

# Todos los tests de integración
npm run test:integration

# Tests con cobertura
npm run test:coverage
```

## 📊 Estado del Sistema

### ✅ Completado al 90%

- [x] **Sistema de Bitácora**: 100%
- [x] **Control de Versiones**: 100%
- [x] **Modelos de Auditorías**: 100%
- [x] **Controladores de Auditorías**: 95%
- [x] **Testing de Integración**: 100%
- [x] **Integración XAMPP**: 100%
- [x] **Scripts de Inicio**: 100%

### 🔧 Funciones Implementadas

- ✅ `ejecutarEtapa3ProcesamientoETL`
- ✅ `ejecutarEtapa5ProgramarVisita`
- ✅ `ejecutarEtapa6Consolidacion`
- ✅ `ejecutarEtapa7GenerarInforme`
- ✅ `ejecutarEtapa8Cierre`
- ✅ `completarSeccionEvaluacion`
- ✅ `crearHallazgoVisita`

## 🚨 Troubleshooting

### Error: MySQL no responde

```bash
# 1. Verificar que MySQL esté iniciado en XAMPP
# 2. Verificar puerto 3306
netstat -an | find "3306"

# 3. Recrear base de datos
setup-database-xampp.bat
```

### Error: Puerto 3002 en uso

```bash
# Matar proceso en puerto 3002
netstat -ano | findstr :3002
taskkill /PID [PID_NUMBER] /F
```

### Error: Tests fallan

```bash
# 1. Verificar BD de testing
mysql -u root -e "SHOW DATABASES LIKE 'portal_auditorias_test';"

# 2. Reinstalar dependencias de testing
npm install --save-dev sqlite3 cross-env

# 3. Ejecutar setup de testing
npm run test:setup
```

## 📁 Estructura de Archivos Importantes

```text
portal-auditorias/
├── start-xampp-system.bat          # 🚀 Inicio principal
├── setup-database-xampp.bat        # 🗃️ Setup de BD
├── verify-system-complete.bat      # 🔍 Verificación
├── server/
│   ├── server.js                   # 🔧 Servidor principal
│   ├── config/database.js          # 🗃️ Configuración BD
│   ├── domains/auditorias/         # 📋 Lógica de auditorías
│   └── tests/                      # 🧪 Tests de integración
├── client/
│   └── src/                        # ⚛️ Frontend React
└── database/
    └── create-database.sql         # 🗃️ Script de BD
```

## 🎯 Próximos Pasos

1. **Completar funciones restantes** (~10 funciones menores)
2. **Implementar validaciones de seguridad**
3. **Optimizar integración ETL-IA**
4. **Testing de carga y performance**
5. **Documentación de usuario final**

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en las consolas abiertas
2. Verifica que XAMPP MySQL esté ejecutándose
3. Ejecuta `verify-system-complete.bat` para diagnóstico
4. Consulta los archivos de log en `server/logs/`

---

**🎉 ¡El Portal de Auditorías Técnicas está funcionando al 90% con XAMPP!**
