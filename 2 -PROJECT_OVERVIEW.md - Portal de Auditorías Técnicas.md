# PROJECT_OVERVIEW.md - Portal de Auditorías Técnicas

> **📌 ESTE ES EL CLAUDE.MD PRINCIPAL DEL PROYECTO**
> 
> Claude: Este documento es tu punto de entrada único para comprender y navegar el Portal de Auditorías Técnicas. Utilízalo para identificar rápidamente qué módulos y archivos `Claude.md` específicos necesitas consultar para cualquier tarea.

## 🎯 Visión General del Sistema

### Propósito
Portal web para **automatizar auditorías técnicas** de proveedores de servicios de call center, implementando un proceso de **8 etapas estructuradas** con **IA local** para evaluación automática de documentos y **ETL robusto** para procesamiento de parque informático.

### Arquitectura de Alto Nivel
```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                     │
│                                                                 │
│  🔐 Auth │ 📋 Auditorías │ 🔄 ETL │ 🤖 IA │ 💬 Chat │ 📊 Dashboards │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API + WebSockets
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                  │
│                                                                 │
│    📁 /domains/ - Separación por Dominios de Negocio          │
│    ├── auth/ ├── auditorias/ ├── etl/ ├── ia/                 │
│    ├── chat/ ├── notifications/ ├── entities/ ├── dashboards/ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
            ┌──────────┐ ┌──────────┐ ┌─────────────┐
            │  MySQL   │ │  Redis   │ │ Ollama (IA) │
            │Principal │ │Cache/Jobs│ │    Local    │
            └──────────┘ └──────────┘ └─────────────┘
```

## 🔄 Flujo de Datos: Proceso de Auditoría (8 Etapas)

### ETAPA 1-2: Preparación y Carga
```
[Auditor] → `auditorias/workflow/etapa1-notificacion.js`
    ↓
[Proveedor] → `auditorias/workflow/etapa2-carga.js` → 13 tipos de documentos
    ↓
[ETL Engine] → `etl/parsers/` → Procesamiento automático Excel/CSV
    ↓
[IA Engine] → `ia/document-analyzer/` → Análisis con LLaMA 3.2:1b
```

### ETAPA 3-8: Validación y Evaluación
```
[Validación Automática] → `etl/validators/` + `ia/scoring/`
    ↓
[Auditor Review] → `auditorias/workflow/etapa3-validacion.js`
    ↓
[Visita Presencial] → `auditorias/workflow/etapa4-visita.js`
    ↓
[Informe Final] → `dashboards/aggregators/` → Métricas y reportes
```

## 📁 Mapeo de Relevancia: Funcionalidades → Módulos

### 🔐 **Gestión de Usuarios y Autenticación**
- **Módulos Relevantes**: `auth/`, `entities/usuarios/`
- **Claude.md Específicos**: `/server/domains/auth/Claude.md`, `/client/domains/auth/Claude.md`
- **Casos de Uso**: Login, registro, roles (Auditor/Proveedor/Admin), permisos

### 📋 **Proceso de Auditoría**
- **Módulos Relevantes**: `auditorias/`, `notifications/`
- **Claude.md Específicos**: `/server/domains/auditorias/Claude.md`
- **Casos de Uso**: Crear auditoría, workflow 8 etapas, notificaciones automáticas

### 📄 **Carga y Gestión de Documentos**
- **Módulos Relevantes**: `auditorias/models/Documento.model.js`, `shared/utils/file-utils/`
- **Claude.md Específicos**: `/server/domains/auditorias/Claude.md`
- **Casos de Uso**: Upload 13 tipos docs, validación formato, versionado

### 🔄 **ETL Parque Informático**
- **Módulos Relevantes**: `etl/`
- **Claude.md Específicos**: `/server/domains/etl/Claude.md`, `/client/domains/etl/Claude.md`
- **Casos de Uso**: Parser Excel, normalización 28 campos, validación reglas negocio

### 🤖 **IA y Scoring Automático**
- **Módulos Relevantes**: `ia/`
- **Claude.md Específicos**: `/server/domains/ia/Claude.md`, `/client/domains/ia-scoring/Claude.md`
- **Casos de Uso**: Análisis PDF/texto (LLaMA), análisis imágenes (Moondream), scoring automático

### 💬 **Comunicación Asíncrona**
- **Módulos Relevantes**: `chat/`, `notifications/`
- **Claude.md Específicos**: `/server/domains/chat/Claude.md`, `/client/domains/chat/Claude.md`
- **Casos de Uso**: Mensajería auditor-proveedor, notificaciones tiempo real, WebSockets

### 📊 **Dashboards y Métricas**
- **Módulos Relevantes**: `dashboards/`
- **Claude.md Específicos**: `/server/domains/dashboards/Claude.md`, `/client/domains/dashboards/Claude.md`
- **Casos de Uso**: KPIs auditoría, reportes ejecutivos, métricas comparativas

### ⚙️ **Jobs Asíncronos**
- **Módulos Relevantes**: `jobs/`
- **Claude.md Específicos**: `/server/jobs/Claude.md`
- **Casos de Uso**: Procesamiento ETL background, análisis IA batch, envío emails

## 🏗️ Principios de Diseño Clave

### 1. **Separación por Dominios**
- Cada dominio (`auth`, `auditorias`, `etl`, `ia`, etc.) es autocontenido
- Business logic encapsulada en `/domains/[dominio]/[dominio].service.js`
- Modelos específicos en `/domains/[dominio]/models/`

### 2. **Arquitectura Modular**
- **Controller**: Manejo HTTP requests (`[dominio].controller.js`)
- **Service**: Lógica de negocio (`[dominio].service.js`)
- **Models**: Esquemas Sequelize (`[dominio]/models/`)
- **Routes**: Definición endpoints (`[dominio].routes.js`)

### 3. **Autenticación JWT**
- Middleware global: `/server/domains/auth/middleware/authentication.js`
- Autorización por roles: `/server/domains/auth/middleware/authorization.js`
- Tokens con expiración configurable

### 4. **Processing Asíncrono**
- **BullMQ + Redis** para jobs pesados (ETL, IA)
- **WebSockets** para comunicación tiempo real
- **Caching** inteligente para optimización

### 5. **IA Local (Ollama)**
- **LLaMA 3.2:1b**: Análisis texto/documentos
- **Moondream**: Análisis imágenes
- **Sin dependencias cloud**: 100% local, datos seguros

### 6. **ETL Robusto**
- **ExcelJS**: Parser Excel nativo
- **JSON-Rules-Engine**: Validación reglas negocio
- **Normalización**: 28 campos estandarizados

## 🗺️ Guía de Navegación para Claude

### 📋 Para Tareas de Desarrollo

#### "Necesito implementar [funcionalidad]"
1. **Consultar** este `PROJECT_OVERVIEW.md` para identificar módulos relevantes
2. **Leer** el `Claude.md` específico del dominio: `/server/domains/[dominio]/Claude.md`
3. **Examinar** modelos relacionados en `/server/domains/[dominio]/models/`
4. **Revisar** frontend correlacionado en `/client/domains/[dominio]/Claude.md`

#### "Necesito depurar [bug/comportamiento]"
1. **Identificar** el flujo de datos involucrado en la sección "Flujo de Datos"
2. **Localizar** el módulo específico usando "Mapeo de Relevancia"
3. **Consultar** el `Claude.md` del dominio para entender la lógica
4. **Examinar** tests relacionados en `/server/tests/[dominio]/`

#### "Necesito agregar [nueva característica]"
1. **Determinar** si requiere nuevo dominio o extensión de existente
2. **Revisar** principios de diseño para mantener consistencia
3. **Consultar** `Claude.md` de dominios similares como referencia
4. **Planificar** impacto en frontend usando `/client/domains/[dominio]/Claude.md`

### 🎯 Contexto Dirigido por Tarea

| **Tipo de Tarea** | **Claude.md Primarios** | **Archivos Clave** |
|---|---|---|
| **Auth/Usuarios** | `auth/Claude.md`, `entities/usuarios/Claude.md` | `Usuario.model.js`, `authentication.js` |
| **Proceso Auditoría** | `auditorias/Claude.md` | `workflow/etapa*.js`, `Auditoria.model.js` |
| **ETL Parque** | `etl/Claude.md` | `excel-parser.js`, `ParqueInformatico.model.js` |
| **IA Scoring** | `ia/Claude.md` | `document-analyzer/`, `scoring-engine.js` |
| **Chat/Mensajería** | `chat/Claude.md` | `chat-handler.js`, `Mensaje.model.js` |
| **Dashboards** | `dashboards/Claude.md` | `metrics-aggregator.js`, `dashboards.service.js` |
| **Jobs Async** | `jobs/Claude.md` | `excel-processing.job.js`, `document-analysis.job.js` |

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + **Vite** + **Tailwind CSS**
- **Zustand** para estado global
- **React Query** para data fetching
- **WebSockets** para tiempo real

### Backend
- **Node.js 22.12.0** + **Express.js**
- **Sequelize ORM** + **MySQL**
- **BullMQ** + **Redis** para jobs asíncronos
- **JWT** para autenticación

### IA Local
- **Ollama** como runtime
- **LLaMA 3.2:1b** para análisis texto
- **Moondream** para análisis imágenes

### ETL y Processing
- **ExcelJS** para parsing Excel
- **JSON-Rules-Engine** para validación
- **Multer** para upload archivos

## ⚙️ Configuración .clauderc

```json
{
  "name": "Portal Auditorías Técnicas",
  "version": "1.0.0",
  "context": {
    "entry_point": "PROJECT_OVERVIEW.md",
    "max_context_files": 5,
    "priority_domains": [
      "auditorias", 
      "etl", 
      "ia", 
      "auth"
    ]
  },
  "claude_md": {
    "auto_update": true,
    "validation": true,
    "fragment_size": 1000,
    "overlap": 200
  },
  "development": {
    "mode": "domain-driven",
    "test_coverage": true,
    "documentation_sync": true
  }
}
```

## 📋 Instrucciones para Mantenimiento Claude.md

### Actualización Automática
- **Trigger**: Cambios en archivos `.js`, `.jsx`, nuevos endpoints, nuevos modelos
- **Script**: `/scripts/claude-md-generator.js`
- **CI/CD**: GitHub Actions ejecuta actualización en cada PR

### Validación de Consistencia
```bash
# Ejecutar validación manual
npm run claude:validate

# Regenerar Claude.md específico
npm run claude:generate -- --domain=auditorias

# Regenerar todo el sistema Claude.md
npm run claude:rebuild
```

### Reglas de Fragmentación para RAG
- **Tamaño fragmento**: 1000 tokens
- **Overlap**: 200 tokens
- **Separadores**: Headers H2/H3, bloques de código
- **Metadatos**: Dominio, tipo (código/docs), versión

## 📊 KPIs y Métricas del Proyecto

### Métricas de Desarrollo
- **Cobertura Claude.md**: 95%+ archivos documentados
- **Tiempo respuesta Claude**: <2s para consultas simples
- **Precisión contexto**: 90%+ relevancia en respuestas
- **Actualización docs**: <24h tras cambios código

### Métricas de Sistema
- **Tiempo procesamiento ETL**: <5min por archivo Excel
- **Precisión IA scoring**: 85%+ accuracy vs auditor humano
- **Disponibilidad**: 99.9% uptime
- **Performance**: <500ms response time API

### Métricas de Negocio
- **Reducción tiempo auditoría**: 60-80%
- **Mejora consistencia**: 50-70%
- **ROI**: Positivo en 3-6 meses
- **Satisfacción usuario**: >4.5/5

## 🔍 Patrones de Uso Comunes para Claude

### Desarrollo de Nueva Funcionalidad
```
1. Claude, consulta PROJECT_OVERVIEW.md
2. Identifica módulos relevantes para [funcionalidad]
3. Lee /server/domains/[dominio]/Claude.md
4. Examina modelos y servicios existentes
5. Genera código siguiendo patrones establecidos
```

### Debugging y Resolución de Problemas
```
1. Claude, analiza el flujo de datos para [problema]
2. Localiza módulo responsable en PROJECT_OVERVIEW.md
3. Revisa /server/domains/[dominio]/Claude.md
4. Examina logs en /server/tests/[dominio]/
5. Propón solución manteniendo consistencia
```

### Refactoring y Optimización
```
1. Claude, evalúa arquitectura actual del módulo [X]
2. Consulta principios de diseño en PROJECT_OVERVIEW.md
3. Analiza dependencies entre dominios
4. Propón mejoras manteniendo separación por dominios
```

---

## 📌 IMPORTANTE: Protocolo de Interacción con Claude

### 🎯 Para Desarrolladores
1. **Siempre iniciar** consultando este `PROJECT_OVERVIEW.md`
2. **Especificar claramente** la tarea: desarrollo, debugging, refactoring
3. **Mencionar módulo/dominio** si es conocido
4. **Solicitar activación** de Modo Plan para tareas complejas
5. **Pedir Pensamiento Extendido** para refactorizaciones grandes

### 🤖 Para Claude
1. **Leer PROJECT_OVERVIEW.md** antes de cualquier respuesta técnica
2. **Identificar módulos relevantes** usando "Mapeo de Relevancia"
3. **Consultar Claude.md específicos** solo cuando sea necesario
4. **Mantener contexto mínimo** - no cargar archivos irrelevantes
5. **Validar coherencia** con principios de diseño establecidos

---

**📝 Última actualización**: Generado automáticamente
**🔄 Sincronización**: CI/CD Pipeline
**📊 Estado**: ✅ Completo y Validado