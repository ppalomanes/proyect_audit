# 🚀 Frontend - Portal de Auditorías Técnicas

Frontend React para probar la funcionalidad ETL implementada.

## 🎯 Estado Actual

### ✅ Implementado

- **Autenticación JWT** con login/logout
- **Dashboard principal** con navegación
- **Procesador ETL** completo para testing
- **Responsive design** con Tailwind CSS
- **Estado global** con Zustand

### 🔧 Configuración

#### Dependencias principales

- React 18 + Vite
- Tailwind CSS para estilos
- Axios para API calls
- Zustand para estado global
- React Router para navegación

#### Proxy configurado

- `/api/*` → `http://localhost:5000`

## 📱 Pantallas Implementadas

### 1. Login (`/login`)

- Formulario de autenticación
- Usuarios de prueba precargados
- Validación y manejo de errores
- Redirección automática

### 2. Dashboard (`/dashboard`)

- Vista general del portal
- Estado de desarrollo del proyecto
- Navegación a módulos disponibles
- Información del usuario logueado

### 3. Procesador ETL (`/etl`)

- Upload de archivos Excel/CSV
- Opciones de procesamiento
- Resultados detallados de validación
- Estadísticas de hardware/software
- Configuración de campos ETL

## 🚀 Cómo Probar

### 1. Instalar dependencias

```bash
cd client
npm install
```

### 2. Iniciar desarrollo

```bash
npm run dev
```

### 3. Acceder a

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:5000>

### 4. Credenciales de prueba

- **Admin**: <admin@portal-auditorias.com> / admin123
- **Auditor**: <auditor@portal-auditorias.com> / auditor123
- **Proveedor**: <proveedor@callcenterdemo.com> / proveedor123

## 🔄 Flujo de Testing ETL

1. **Login** con cualquier usuario
2. **Navegar al ETL** desde dashboard
3. **Seleccionar archivo** Excel/CSV (formato parque informático)
4. **Configurar opciones** de procesamiento
5. **Procesar archivo** y ver resultados
6. **Revisar estadísticas** generadas

## 📊 Funcionalidades ETL Disponibles

### Upload y Procesamiento

- ✅ Detección automática de formato
- ✅ Validación de tipos de archivo
- ✅ Opciones modo estricto/correcciones automáticas
- ✅ Feedback en tiempo real

### Resultados

- ✅ Conteo de registros procesados
- ✅ Score de validación
- ✅ Errores y advertencias detalladas
- ✅ Estadísticas de hardware/software
- ✅ Distribución por sitio y atención

### Configuración

- ✅ Lista de campos requeridos/opcionales
- ✅ Formatos soportados
- ✅ Tipos de atención válidos
- ✅ Reglas de validación activas

## 🎨 Diseño

### UI/UX

- **Design System**: Tailwind CSS con componentes custom
- **Responsive**: Optimizado para desktop y mobile
- **Accesibilidad**: Contraste adecuado y navegación por teclado
- **Feedback visual**: Loading states, errores, éxito

### Componentes

- Cards con sombras sutiles
- Badges para estados
- Botones con estados disabled
- Formularios con validación visual
- Tablas responsivas para datos

## ⚠️ Limitaciones Actuales

### Demo Mode

- **Upload real**: No implementado (simula con IDs demo)
- **Archivos**: No se procesan archivos reales aún
- **Persistencia**: Datos no se guardan en BD (demo)

### Próximas mejoras

- 🔄 Upload real de archivos
- 📊 Gráficos y visualizaciones
- 🔍 Filtros y búsqueda
- 📱 PWA capabilities
- 🌙 Dark mode

## 🔗 Integración Backend

### APIs utilizadas

- `POST /api/auth/login` - Autenticación
- `POST /api/etl/procesar` - Procesamiento ETL
- `GET /api/etl/estadisticas/:id` - Estadísticas
- `GET /api/etl/configuracion` - Configuración

### Estado de integración

- ✅ Autenticación funcionando
- ✅ ETL endpoints implementados
- ✅ Manejo de errores robusto
- ✅ Interceptores para tokens JWT

---

**📝 Estado**: ✅ Funcional para testing ETL
**🎯 Propósito**: Demostrar capacidades del ETL implementado
**🚀 Siguiente**: Implementar upload real de archivos
