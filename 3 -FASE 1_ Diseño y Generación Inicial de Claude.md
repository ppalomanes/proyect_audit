# Claude.md - Módulo ETL

> **📍 Ubicación**: `/server/domains/etl/`
> 
> **🎯 Dominio**: Procesamiento de datos - Motor ETL para Parque Informático

## 🎯 Propósito

Este módulo implementa un **motor ETL robusto** específicamente diseñado para procesar archivos Excel/CSV del **Parque Informático** de proveedores, normalizando 28 campos heterogéneos en un esquema estandarizado con **validación automática** de reglas de negocio y **scoring inteligente**.

### Responsabilidades Principales
- **Parsing inteligente** de Excel/CSV con ExcelJS y detección automática de formato
- **Normalización** de 28 campos de hardware/software a esquema único
- **Validación** de reglas de negocio con JSON-Rules-Engine
- **Procesamiento asíncrono** por lotes con BullMQ + Redis
- **Integración** con módulo IA para scoring automático
- **Reporte detallado** de inconsistencias y sugerencias de corrección

## 🏗️ Componentes Clave

### Controller Layer
- **`etl.controller.js`**: Endpoints para upload, status y resultados ETL
- **`validation.controller.js`**: Endpoints para validación manual y reglas custom

### Service Layer
- **`etl.service.js`**: Orquestador principal del proceso ETL
- **`normalization.service.js`**: Lógica de normalización de campos
- **`validation.service.js`**: Aplicación de reglas de negocio

### Parsers Especializados
- **`/parsers/excel-parser.js`**: Parser Excel con ExcelJS, detección auto-formato
- **`/parsers/csv-parser.js`**: Parser CSV con encoding detection y delimiters
- **`/parsers/field-detector.js`**: Detección automática de campos por contenido

### Validators
- **`/validators/schema-validator.js`**: Validación de esquema base (tipos, formatos)
- **`/validators/business-rules.js`**: Reglas de negocio específicas (ej: RAM mínima)
- **`/validators/completeness-validator.js`**: Validación de completitud por sitio

### Transformers
- **`/transformers/field-normalizer.js`**: Normalización de valores (ej: "8 GB" → 8)
- **`/transformers/data-enricher.js`**: Enriquecimiento con datos externos
- **`/transformers/quality-scorer.js`**: Scoring de calida