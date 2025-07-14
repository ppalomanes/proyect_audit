# Estructura del Monorepo Portal de Auditorías Técnicas

## 🏗️ Arquitectura General Optimizada para Claude.md

```
/portal-auditorias/
├── 📄 PROJECT_OVERVIEW.md              # Claude.md Principal - Entrada única para Claude
├── 📄 .clauderc                        # Configuración de contexto para Claude
├── 📄 package.json                     # Dependencias del workspace
├── 📄 .gitignore                       # Exclusiones de Git
├── 📄 README.md                        # Documentación para desarrolladores
│
├── 📁 /client/                         # Frontend React
│   ├── 📄 Claude.md                    # Resumen del frontend para Claude
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   ├── 📁 /src/
│   │   ├── 📁 /domains/                # 🎯 Separación por Dominios
│   │   │   ├── 📁 /auth/               # Autenticación y autorización
│   │   │   │   ├── 📄 Claude.md        # Contexto específico del dominio
│   │   │   │   ├── 📁 /components/
│   │   │   │   ├── 📁 /services/
│   │   │   │   ├── 📁 /hooks/
│   │   │   │   └── 📁 /types/
│   │   │   │
│   │   │   ├── 📁 /auditorias/         # Gestión del proceso de auditoría
│   │   │   │   ├── 📄 Claude.md
│   │   │   │   ├── 📁 /components/
│   │   │   │   │   ├── AuditoriaWizard.jsx
│   │   │   │   │   ├── EtapaProgress.jsx
│   │   │   │   │   └── DocumentUpload.jsx
│   │   │   │   ├── 📁 /services/
│   │   │   │   └── 📁 /types/
│   │   │   │
│   │   │   ├── 📁 /etl/                # Interface ETL parque informático
│   │   │   │   ├── 📄 Claude.md
│   │   │   │   ├── 📁 /components/
│   │   │   │   │   ├── ETLUploader.jsx
│   │   │   │   │   ├── ExcelValidator.jsx
│   │   │   │   │   └── ETLProgress.jsx
│   │   │   │   └── 📁 /services/
│   │   │   │
│   │   │   ├── 📁 /ia-scoring/         # Interface IA scoring
│   │   │   │   ├── 📄 Claude.md
│   │   │   │   ├── 📁 /components/
│   │   │   │   │   ├── DocumentAnalyzer.jsx
│   │   │   │   │   ├── ImageAnalyzer.jsx
│   │   │   │   │   └── ScoringResults.jsx
│   │   │   │   └── 📁 /services/
│   │   │   │
│   │   │   ├── 📁 /chat/               # Sistema de mensajería
│   │   │   │   ├── 📄 Claude.md
│   │   │   │   ├── 📁 /components/
│   │   │   │   └── 📁 /services/
│   │   │   │
│   │   │   ├── 📁 /dashboards/         # Dashboards y métricas
│   │   │   │   ├── 📄 Claude.md
│   │   │   │   ├── 📁 /components/
│   │   │   │   └── 📁 /charts/
│   │   │   │
│   │   │   └── 📁 /shared/             # Componentes compartidos
│   │   │       ├── 📄 Claude.md
│   │   │       ├── 📁 /components/
│   │   │       ├── 📁 /utils/
│   │   │       └── 📁 /types/
│   │   │
│   │   ├── 📁 /layout/                 # Layout general de la aplicación
│   │   ├── 📁 /router/                 # Configuración de rutas
│   │   └── 📄 main.jsx                 # Punto de entrada
│   │
│   └── 📁 /public/                     # Assets estáticos
│
├── 📁 /server/                         # Backend Node.js
│   ├── 📄 Claude.md                    # Resumen del backend para Claude
│   ├── 📄 package.json
│   ├── 📄 server.js                    # Punto de entrada
│   │
│   ├── 📁 /config/                     # Configuraciones centrales
│   │   ├── 📄 Claude.md
│   │   ├── 📄 database.js              # MySQL config
│   │   ├── 📄 redis.js                 # Redis config
│   │   ├── 📄 ollama.js                # Ollama IA config
│   │   └── 📄 bullmq.js                # Queue config
│   │
│   ├── 📁 /domains/                    # 🎯 Separación por Dominios (Backend)
│   │   ├── 📁 /auth/                   # Autenticación y autorización
│   │   │   ├── 📄 Claude.md            # Contexto específico del dominio
│   │   │   ├── 📄 auth.controller.js
│   │   │   ├── 📄 auth.routes.js
│   │   │   ├── 📄 auth.service.js
│   │   │   ├── 📁 /models/
│   │   │   │   ├── Usuario.model.js
│   │   │   │   └── Rol.model.js
│   │   │   ├── 📁 /middleware/
│   │   │   │   ├── authentication.js
│   │   │   │   └── authorization.js
│   │   │   └── 📁 /validators/
│   │   │
│   │   ├── 📁 /auditorias/             # Gestión proceso auditoría
│   │   │   ├── 📄 Claude.md
│   │   │   ├── 📄 auditorias.controller.js
│   │   │   ├── 📄 auditorias.routes.js
│   │   │   ├── 📄 auditorias.service.js
│   │   │   ├── 📁 /models/
│   │   │   │   ├── Auditoria.model.js
│   │   │   │   ├── Etapa.model.js
│   │   │   │   └── Documento.model.js
│   │   │   ├── 📁 /workflow/
│   │   │   │   ├── etapa1-notificacion.js
│   │   │   │   ├── etapa2-carga.js
│   │   │   │   └── etapa3-validacion.js
│   │   │   └── 📁 /validators/
│   │   │
│   │   ├── 📁 /etl/                    # Motor ETL parque informático
│   │   │   ├── 📄 Claude.md
│   │   │   ├── 📄 etl.controller.js
│   │   │   ├── 📄 etl.service.js
│   │   │   ├── 📁 /parsers/
│   │   │   │   ├── excel-parser.js
│   │   │   │   └── csv-parser.js
│   │   │   ├── 📁 /validators/
│   │   │   │   ├── schema-validator.js
│   │   │   │   └── business-rules.js
│   │   │   ├── 📁 /transformers/
│   │   │   │   ├── field-normalizer.js
│   │   │   │   └── data-enricher.js
│   │   │   └── 📁 /models/
│   │   │       └── ParqueInformatico.model.js
│   │   │
│   │   ├── 📁 /ia/                     # Motor de IA (Ollama)
│   │   │   ├── 📄 Claude.md
│   │   │   ├── 📄 ia.controller.js
│   │   │   ├── 📄 ia.service.js
│   │   │   ├── 📁 /document-analyzer/
│   │   │   │   ├── pdf-analyzer.js
│   │   │   │   └── text-scorer.js
│   │   │   ├── 📁 /image-analyzer/
│   │   │   │   ├── moondream-client.js
│   │   │   │   └── image-scorer.js
│   │   │   ├── 📁 /scoring/
│   │   │   │   ├── scoring-engine.js
│   │   │   │   └── criteria-matcher.js
│   │   │   └── 📁 /prompts/
│   │   │       ├── document-prompts.js
│   │   │       └── image-prompts.js
│   │   │
│   │   ├── 📁 /chat/                   # Sistema mensajería asíncrona
│   │   │   ├── 📄 Claude.md
│   │   │   ├── 📄 chat.controller.js
│   │   │   ├── 📄 chat.service.js
│   │   │   ├── 📁 /models/
│   │   │   │   ├── Mensaje.model.js
│   │   │   │   └── Conversacion.model.js
│   │   │   └── 📁 /websockets/
│   │   │       └── chat-handler.js
│   │   │
│   │   ├── 📁 /notifications/          # Sistema notificaciones
│   │   │   ├── 📄 Claude.md
│   │   │   ├── 📄 notifications.service.js
│   │   │   ├── 📁 /channels/
│   │   │   │   ├── email-channel.js
│   │   │   │   └── websocket-channel.js
│   │   │   └── 📁 /templates/
│   │   │       └── email-templates.js
│   │   │
│   │   ├── 📁 /entities/               # Gestión entidades base
│   │   │   ├── 📄 Claude.md
│   │   │   ├── 📁 /proveedores/
│   │   │   ├── 📁 /sitios/
│   │   │   └── 📁 /usuarios/
│   │   │
│   │   └── 📁 /dashboards/             # Dashboards y métricas
│   │       ├── 📄 Claude.md
│   │       ├── 📄 dashboards.controller.js
│   │       ├── 📄 dashboards.service.js
│   │       └── 📁 /aggregators/
│   │           └── metrics-aggregator.js
│   │
│   ├── 📁 /jobs/                       # Jobs BullMQ asíncronos
│   │   ├── 📄 Claude.md
│   │   ├── 📁 /etl-jobs/
│   │   │   ├── excel-processing.job.js
│   │   │   └── data-validation.job.js
│   │   ├── 📁 /ia-jobs/
│   │   │   ├── document-analysis.job.js
│   │   │   └── image-analysis.job.js
│   │   └── 📁 /notification-jobs/
│   │       └── email-sending.job.js
│   │
│   ├── 📁 /shared/                     # Utilidades compartidas
│   │   ├── 📄 Claude.md
│   │   ├── 📁 /middleware/
│   │   ├── 📁 /utils/
│   │   └── 📁 /constants/
│   │
│   └── 📁 /tests/                      # Tests organizados por dominio
│       ├── 📁 /auth/
│       ├── 📁 /auditorias/
│       └── 📁 /etl/
│
├── 📁 /database/                       # Base de datos y migraciones
│   ├── 📄 Claude.md                    # Contexto de base de datos
│   ├── 📁 /migrations/
│   ├── 📁 /seeds/
│   ├── 📁 /schemas/
│   └── 📄 setup.sql
│
├── 📁 /ollama-models/                  # Configuración IA local
│   ├── 📄 Claude.md
│   ├── 📁 /llama-config/
│   ├── 📁 /moondream-config/
│   └── 📁 /prompts/
│
├── 📁 /docs/                           # Documentación técnica
│   ├── 📄 Claude.md
│   ├── 📁 /api/
│   ├── 📁 /etl/
│   ├── 📁 /ia/
│   └── 📁 /deployment/
│
└── 📁 /scripts/                        # Scripts de automatización
    ├── 📄 Claude.md
    ├── 📄 claude-md-generator.js       # Generador automático Claude.md
    ├── 📄 setup-dev.sh
    └── 📄 deploy.sh
```

## 🎯 Principios de Organización para Claude.md

### 1. **Separación por Dominios de Negocio**
- Cada dominio es autocontenido con su propio `Claude.md`
- Facilita la localización rápida de contexto relevante
- Reduce el ruido al solicitar información específica

### 2. **Jerarquía de Documentación Claude.md**
```
PROJECT_OVERVIEW.md              # Nivel 0: Vista general del sistema
├── /client/Claude.md            # Nivel 1: Resumen frontend
├── /server/Claude.md            # Nivel 1: Resumen backend
├── /database/Claude.md          # Nivel 1: Resumen base de datos
└── /domains/*/Claude.md         # Nivel 2: Contexto específico por dominio
```

### 3. **Nomenclatura Optimizada para Tokenización**
- Uso de comillas invertidas para términos técnicos: `filename.js`, `functionName()`, `/api/endpoint`
- Headers jerárquicos claros (H1, H2, H3)
- Fragmentación semántica para facilitar RAG

### 4. **Modularidad y Escalabilidad**
- Cada módulo puede desarrollarse independientemente
- Fácil adición de nuevos dominios
- Estructura preparada para microservicios futuros

### 5. **Integración CI/CD**
- Scripts automatizados para generar/actualizar Claude.md
- Validación de consistencia en pipeline
- Sincronización automática con cambios de código