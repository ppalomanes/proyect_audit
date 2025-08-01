# Claude.md - Módulo Bitácora

> **📍 Ubicación**: `/server/domains/bitacora/`
> 
> **🎯 Dominio**: Sistema de bitácora y control de cambios

## 🎯 Propósito

Este módulo implementa un **sistema de bitácora automática** que registra todas las acciones, notificaciones y cambios realizados en el Portal de Auditorías Técnicas, proporcionando trazabilidad completa según los requerimientos del flujo de auditoría.

### Responsabilidades Principales
- **Registro automático** de todas las acciones del sistema
- **Captura de metadatos** completos (usuario, acción, fecha/hora, IP, sección)
- **Control de cambios** con registro antes/después
- **Interfaz de consulta** con búsquedas y filtros avanzados
- **Integración transparente** con todos los módulos del sistema
- **Auditoría de cumplimiento** para requisitos regulatorios

## 🏗️ Componentes Clave

### Middleware de Registro
- **`bitacora.middleware.js`**: Middleware automático para captura de eventos
- **`audit-logger.js`**: Logger especializado para eventos de auditoría

### Service Layer
- **`bitacora.service.js`**: Lógica de negocio para gestión de bitácora
- **`change-tracker.service.js`**: Seguimiento de cambios en datos críticos

### Models
- **`BitacoraEntry.model.js`**: Registro individual de bitácora
- **`ChangeLog.model.js`**: Log de cambios en datos específicos

## 🔌 Interfaces/APIs

### Endpoints de Consulta
```javascript
// Obtener entradas de bitácora con filtros avanzados
GET /api/bitacora?usuario={id}&accion={tipo}&fecha_desde={date}&fecha_hasta={date}

// Obtener bitácora específica de una auditoría
GET /api/bitacora/auditoria/{id}

// Exportar bitácora para compliance
GET /api/bitacora/export?formato={pdf|excel}&filtros={json}
```

### Eventos Automáticos Registrados
- Login/logout de usuarios
- Carga y modificación de documentos
- Cambios de estado en auditorías
- Evaluaciones realizadas por auditores
- Notificaciones enviadas y leídas
- Accesos a dashboards e información crítica

## 🔗 Integración con Sistema Principal

Según el flujo de auditoría documentado:

### Formulario de Auditoría
- Registra cada carga y modificación de documentos
- Captura cambios en metadatos de auditoría

### Validación Automática
- Registra resultados de validaciones ETL
- Log de reglas aplicadas y excepciones

### Evaluación por Auditores
- Registra cambios de estado y comentarios
- Tracking de asignaciones y reasignaciones

### Dashboard
- Registra consultas de información crítica
- Auditoría de accesos a datos sensibles

---

**📝 Generado automáticamente por**: Claude.md Strategy
**🔄 Última sincronización**: Integración módulos adicionales
**📊 Estado**: ✅ Documentación completa
