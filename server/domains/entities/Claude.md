# Claude.md - Módulo Entities

> **📍 Ubicación**: `/server/domains/entities/`
> 
> **🎯 Dominio**: Gestión de entidades base del sistema (proveedores, sitios, usuarios)
> 
> **🔗 Integración**: AUTH (usuarios) + AUDITORIAS (relaciones) + ETL (contexto)

## 🎯 Propósito

Este módulo implementará la **gestión de entidades fundamentales** del sistema de auditorías, proporcionando CRUD completo y relaciones entre proveedores, sitios de trabajo y usuarios del sistema.

### Responsabilidades Principales (Planificadas)
- **Gestión de proveedores** con información corporativa y contactos
- **Administración de sitios** de trabajo por proveedor con ubicaciones
- **Gestión avanzada de usuarios** con roles y permisos granulares
- **Relaciones complejas** entre entidades con integridad referencial
- **Validaciones de negocio** específicas por tipo de entidad
- **Historial de cambios** para auditoría de modificaciones

## 🏗️ Estructura Preparada

### Arquitectura Propuesta
```
/server/domains/entities/
├── 📄 entities.controller.js         # Controller principal de entidades
├── 📄 entities.service.js            # Servicios transversales
├── 📄 entities.routes.js             # Rutas protegidas por entidad
├── 📁 /proveedores/
│   ├── proveedores.controller.js     # CRUD proveedores
│   ├── proveedores.service.js        # Lógica de negocio proveedores
│   ├── proveedores.routes.js         # Rutas específicas
│   ├── Proveedor.model.js            # Modelo Sequelize proveedor
│   └── proveedores.validators.js     # Validaciones específicas
├── 📁 /sitios/
│   ├── sitios.controller.js          # CRUD sitios de trabajo
│   ├── sitios.service.js             # Lógica de negocio sitios
│   ├── sitios.routes.js              # Rutas específicas
│   ├── Sitio.model.js                # Modelo Sequelize sitio
│   └── sitios.validators.js          # Validaciones específicas
├── 📁 /usuarios/
│   ├── usuarios.controller.js        # CRUD usuarios extendido
│   ├── usuarios.service.js           # Lógica de negocio usuarios
│   ├── usuarios.routes.js            # Rutas específicas
│   ├── Usuario.model.js              # Modelo Sequelize usuario
│   └── usuarios.validators.js        # Validaciones específicas
├── 📁 /validators/
│   └── entities.validators.js        # Validaciones comunes
└── 📄 Claude.md                      # Esta documentación
```

## 🔌 Interfaces/APIs Planificadas

### Endpoints Proveedores
```javascript
// CRUD básico
GET    /api/entities/proveedores           // Listar con filtros
POST   /api/entities/proveedores           // Crear proveedor
GET    /api/entities/proveedores/:id       // Obtener específico
PUT    /api/entities/proveedores/:id       // Actualizar
DELETE /api/entities/proveedores/:id       // Eliminar (soft delete)

// Endpoints especializados
GET    /api/entities/proveedores/:id/sitios      // Sitios del proveedor
GET    /api/entities/proveedores/:id/auditorias  // Auditorías del proveedor
GET    /api/entities/proveedores/:id/usuarios    // Usuarios del proveedor
POST   /api/entities/proveedores/:id/contacto    // Agregar contacto
GET    /api/entities/proveedores/stats           // Estadísticas generales
```

### Endpoints Sitios
```javascript
// CRUD básico
GET    /api/entities/sitios               // Listar con filtros
POST   /api/entities/sitios               // Crear sitio
GET    /api/entities/sitios/:id           // Obtener específico
PUT    /api/entities/sitios/:id           // Actualizar
DELETE /api/entities/sitios/:id           // Eliminar

// Endpoints especializados
GET    /api/entities/sitios/:id/auditorias       // Auditorías del sitio
GET    /api/entities/sitios/:id/parque           // Parque informático
POST   /api/entities/sitios/:id/coordenadas     // Actualizar ubicación
GET    /api/entities/sitios/por-region          // Agrupar por región
```

### Endpoints Usuarios
```javascript
// CRUD extendido (complementa módulo AUTH)
GET    /api/entities/usuarios             // Listar con filtros avanzados
PUT    /api/entities/usuarios/:id/perfil  // Actualizar perfil completo
POST   /api/entities/usuarios/:id/avatar  // Subir avatar
GET    /api/entities/usuarios/:id/actividad     // Historial de actividad

// Gestión de relaciones
PUT    /api/entities/usuarios/:id/proveedor     // Asignar a proveedor
POST   /api/entities/usuarios/:id/permisos     // Gestionar permisos granulares
GET    /api/entities/usuarios/auditores        // Listar auditores disponibles
```

## 🔗 Dependencias Planificadas

### Dependencias Internas
- **`../auth/models/Usuario.model.js`**: Extensión del modelo básico de usuario
- **`../auditorias/models/Auditoria.model.js`**: Relaciones con auditorías
- **`../../shared/middleware/validation.js`**: Validaciones comunes
- **`../../shared/utils/geo-utils.js`**: Utilidades de geolocalización

### Dependencias Externas
- **`sequelize`**: ORM para relaciones complejas y queries avanzadas
- **`express-validator`**: Validación exhaustiva de entidades
- **`multer`**: Upload de avatares y documentos corporativos
- **`bcrypt`**: Hash de passwords para usuarios (si se extiende AUTH)

## 💡 Características Técnicas Propuestas

### 1. **Modelo de Proveedor Completo**
```javascript
const ProveedorSchema = {
  // Información básica
  id: { type: 'uuid', primaryKey: true },
  razon_social: { type: 'string', required: true, unique: true },
  nit: { type: 'string', required: true, unique: true },
  codigo_proveedor: { type: 'string', required: true, unique: true },
  
  // Información corporativa
  sector_economico: { type: 'enum', values: ['telecomunicaciones', 'bpo', 'tecnologia'] },
  tamano_empresa: { type: 'enum', values: ['micro', 'pequena', 'mediana', 'grande'] },
  anos_operacion: { type: 'integer', min: 0 },
  
  // Contacto principal
  email_principal: { type: 'email', required: true },
  telefono_principal: { type: 'string', required: true },
  direccion_principal: { type: 'text', required: true },
  ciudad: { type: 'string', required: true },
  pais: { type: 'string', default: 'Colombia' },
  
  // Información técnica
  tipo_servicios: { type: 'array', items: 'string' }, // ['inbound', 'outbound', 'chat', 'email']
  capacidad_agentes: { type: 'integer', min: 1 },
  tecnologias_usadas: { type: 'array', items: 'string' },
  
  // Estado y fechas
  estado: { type: 'enum', values: ['activo', 'inactivo', 'suspendido'], default: 'activo' },
  fecha_registro: { type: 'date', default: 'now' },
  fecha_ultimo_contrato: { type: 'date' },
  
  // Metadata
  created_at: { type: 'date', default: 'now' },
  updated_at: { type: 'date', default: 'now' },
  deleted_at: { type: 'date', default: null } // Soft delete
};
```

### 2. **Modelo de Sitio con Geolocalización**
```javascript
const SitioSchema = {
  // Identificación
  id: { type: 'uuid', primaryKey: true },
  proveedor_id: { type: 'uuid', references: 'Proveedor', required: true },
  codigo_sitio: { type: 'string', required: true, unique: true },
  nombre_sitio: { type: 'string', required: true },
  
  // Ubicación
  direccion_completa: { type: 'text', required: true },
  ciudad: { type: 'string', required: true },
  departamento: { type: 'string', required: true },
  codigo_postal: { type: 'string' },
  coordenadas_lat: { type: 'decimal', precision: [10, 8] },
  coordenadas_lng: { type: 'decimal', precision: [11, 8] },
  
  // Información operativa
  tipo_sitio: { type: 'enum', values: ['principal', 'secundario', 'temporal'] },
  servicios_ofrecidos: { type: 'array', items: 'string' },
  horario_operacion: { type: 'json' }, // { lunes: '8:00-18:00', ... }
  numero_agentes: { type: 'integer', min: 1 },
  numero_supervisores: { type: 'integer', min: 1 },
  
  // Infraestructura
  area_total_m2: { type: 'decimal', precision: [8, 2] },
  numero_puestos: { type: 'integer', min: 1 },
  tipo_conectividad: { type: 'enum', values: ['fibra', 'cable', 'satelital'] },
  velocidad_internet_mbps: { type: 'integer', min: 1 },
  
  // Estado
  estado: { type: 'enum', values: ['activo', 'inactivo', 'mantenimiento'], default: 'activo' },
  fecha_apertura: { type: 'date' },
  ultima_auditoria: { type: 'date' }
};
```

### 3. **Relaciones Complejas**
```javascript
// Definición de relaciones entre entidades
const defineRelations = () => {
  // Proveedor → Sitios (1:N)
  Proveedor.hasMany(Sitio, { foreignKey: 'proveedor_id', as: 'sitios' });
  Sitio.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
  
  // Proveedor → Usuarios (1:N)
  Proveedor.hasMany(Usuario, { foreignKey: 'proveedor_id', as: 'usuarios' });
  Usuario.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
  
  // Sitio → Auditorías (1:N)
  Sitio.hasMany(Auditoria, { foreignKey: 'sitio_id', as: 'auditorias' });
  Auditoria.belongsTo(Sitio, { foreignKey: 'sitio_id', as: 'sitio' });
  
  // Usuario → Auditorías como auditor (1:N)
  Usuario.hasMany(Auditoria, { foreignKey: 'auditor_principal_id', as: 'auditorias_principal' });
  Usuario.hasMany(Auditoria, { foreignKey: 'auditor_secundario_id', as: 'auditorias_secundario' });
};
```

### 4. **Validaciones de Negocio Avanzadas**
```javascript
const validacionesProveedorCompletas = [
  // NIT debe ser válido para Colombia
  body('nit').custom(async (value) => {
    if (!validarNITColombia(value)) {
      throw new Error('NIT debe ser válido para Colombia');
    }
    
    // Verificar que no exista otro proveedor con el mismo NIT
    const existente = await Proveedor.findOne({ where: { nit: value } });
    if (existente) {
      throw new Error('Ya existe un proveedor con este NIT');
    }
  }),
  
  // Capacidad de agentes debe ser coherente con número de sitios
  body('capacidad_agentes').custom(async (value, { req }) => {
    if (req.sitios && req.sitios.length > 0) {
      const totalPuestosSitios = req.sitios.reduce(
        (total, sitio) => total + sitio.numero_puestos, 0
      );
      
      if (value > totalPuestosSitios * 1.2) {
        throw new Error('Capacidad de agentes excede puestos disponibles en sitios');
      }
    }
  }),
  
  // Email debe ser corporativo (no gmail, hotmail, etc.)
  body('email_principal').custom(async (value) => {
    const dominiosPersonales = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
    const dominio = value.split('@')[1];
    
    if (dominiosPersonales.includes(dominio)) {
      throw new Error('Debe usar email corporativo, no personal');
    }
  })
];
```

## ⚠️ Estado Actual: 📋 PENDIENTE DE IMPLEMENTACIÓN

### 🔨 Por Implementar
- [ ] **Modelos Sequelize**: Proveedor, Sitio, Usuario extendido con relaciones
- [ ] **Controladores CRUD**: Operaciones completas para cada entidad
- [ ] **Validaciones avanzadas**: Reglas de negocio específicas por entidad
- [ ] **Gestión de archivos**: Upload de avatares y documentos corporativos
- [ ] **Reportes y estadísticas**: Dashboards por entidad
- [ ] **Historial de cambios**: Auditoría de modificaciones

### 📁 Estructura Existente
- ✅ **Directorio base**: `/server/domains/entities/` creado
- ✅ **Subdirectorios**: `/proveedores/`, `/sitios/`, `/usuarios/` preparados
- ✅ **Claude.md**: Arquitectura y modelos de datos completos

### 🎯 Próximos Pasos
1. **Crear modelos**: Definir esquemas Sequelize con relaciones
2. **Implementar validaciones**: Reglas de negocio específicas
3. **Desarrollar CRUD**: Controladores para cada entidad
4. **Configurar relaciones**: Integridad referencial entre entidades
5. **Testing**: Validar operaciones y relaciones

## 🚀 Plan de Implementación

### Fase 1: Modelos y Relaciones
```javascript
// Crear Proveedor.model.js, Sitio.model.js, Usuario.model.js
// Definir relaciones Sequelize
// Configurar constraints e índices
```

### Fase 2: CRUD Básico
```javascript
// Implementar controladores básicos
// Configurar rutas protegidas
// Validaciones express-validator
```

### Fase 3: Funcionalidades Avanzadas
```javascript
// Gestión de archivos y avatares
// Reportes y estadísticas
// Historial de cambios
```

---

## 🎯 Patrones de Uso para Claude

### Para Implementar Entidades
```
"Claude, necesito crear el CRUD de proveedores. 
Usa el esquema definido en entities/Claude.md como base."
```

### Para Configurar Relaciones
```
"Claude, ayúdame a definir las relaciones Sequelize entre entidades. 
Consulta la sección de relaciones en entities/Claude.md."
```

---

**📝 Generado automáticamente por**: Claude.md Strategy  
**🔄 Última sincronización**: Planificación completa del módulo  
**📊 Estado**: 📋 **PENDIENTE DE IMPLEMENTACIÓN** - Modelos y arquitectura definidos