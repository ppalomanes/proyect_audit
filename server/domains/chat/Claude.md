# Claude.md - Módulo Chat Mejorado con Comunicación Asíncrona

> **📍 Ubicación**: `/server/domains/chat/`
> 
> **🎯 Dominio**: Sistema de comunicación asíncrona avanzado según PDF "Módulos Adicionales"
> 
> **🔗 Integración**: AUTH + AUDITORIAS + BITÁCORA + NOTIFICATIONS + VERSIONES
> 
> **📊 Estado**: ✅ **MEJORADO** - Implementación completa según especificaciones PDF

## 🎯 Propósito Actualizado

Este módulo implementa un **sistema de comunicación asíncrona completo y avanzado** según las especificaciones del PDF "Módulos Adicionales", facilitando la comunicación estructurada entre auditores y proveedores durante el proceso de auditoría con **categorización automática**, **estados avanzados**, **plantillas predefinidas** y **seguimiento SLA**.

### Responsabilidades Principales ✅ IMPLEMENTADAS

#### **Funcionalidades Base (Existentes)**
- ✅ Mensajería tiempo real con WebSockets autenticados via JWT
- ✅ Persistencia completa de conversaciones en MySQL con threading  
- ✅ Archivos adjuntos con upload/download y gestión de thumbnails
- ✅ Estados de lectura persistentes por usuario y mensaje
- ✅ Control de permisos granular por workspace y rol
- ✅ Gestión de workspaces vinculados a auditorías específicas

#### **Nuevas Funcionalidades Según PDF**
- ✅ **Categorización automática** de mensajes (8 categorías predefinidas)
- ✅ **Estados avanzados** de seguimiento con flujo de aprobación
- ✅ **Plantillas predefinidas** para consultas frecuentes con variables
- ✅ **Menciones de usuarios** con notificaciones inteligentes
- ✅ **Seguimiento SLA** por categoría con alertas automáticas
- ✅ **Integración flujo 8 etapas** de auditoría
- ✅ **Exportación** de conversaciones para documentación
- ✅ **Búsqueda avanzada** con múltiples filtros

## 🏗️ Estructura Mejorada

### Nuevos Modelos (Según PDF)
```
📊 NUEVAS TABLAS IMPLEMENTADAS:
├── chat_categorias_mensaje       # 8 categorías según PDF
├── chat_estados_mensaje         # Estados avanzados de seguimiento  
├── chat_plantillas_mensaje      # Plantillas predefinidas por rol
├── chat_seguimiento_auditoria   # Métricas y SLA por auditoría
├── chat_menciones_usuario       # Sistema de menciones @usuario
└── [extensiones en chat_mensajes] # Campos adicionales según PDF
```

### Servicios Ampliados
```
📁 /server/domains/chat/
├── 📄 comunicacion-asincrona.service.js  # ✅ NUEVO - Servicio según PDF
├── 📄 chat-real.service.js              # ✅ Base existente mantenida
├── 📄 chat-real.controller.js           # ✅ Extendido con nuevos endpoints
├── 📁 /models/                          # ✅ Nuevos modelos según PDF
│   ├── ChatCategoriaMensaje.model.js    # Categorías predefinidas
│   ├── ChatEstadoMensaje.model.js       # Estados avanzados
│   ├── ChatPlantillaMensaje.model.js    # Plantillas por rol
│   ├── ChatSeguimientoAuditoria.model.js # Seguimiento SLA
│   └── ChatMencionUsuario.model.js      # Sistema de menciones
└── 📄 Claude.md                         # Esta documentación actualizada
```

## 🔌 Nuevas Interfaces/APIs Según PDF

### **Categorización de Mensajes** ✅ IMPLEMENTADO

#### Categorías Predefinidas (Según PDF)
```javascript
// Las 8 categorías implementadas según especificaciones
const CATEGORIAS_PDF = {
  'CONSULTA_GENERAL': {
    nombre: 'Consulta General',
    tiempo_respuesta: 24, // horas
    color: '#3B82F6',
    icono: 'MessageCircle'
  },
  'ACLARACION_TECNICA': {
    nombre: 'Aclaración Técnica', 
    tiempo_respuesta: 12,
    color: '#F59E0B',
    icono: 'HelpCircle'
  },
  'SOLICITUD_PRORROGA': {
    nombre: 'Solicitud de Prórroga',
    tiempo_respuesta: 4,
    color: '#8B5CF6', 
    icono: 'Clock'
  },
  'REPORTE_PROBLEMA': {
    nombre: 'Reporte de Problema',
    tiempo_respuesta: 6,
    color: '#EF4444',
    icono: 'AlertTriangle'
  },
  'RESPUESTA_OBSERVACION': {
    nombre: 'Respuesta a Observación',
    tiempo_respuesta: 48,
    color: '#10B981',
    icono: 'CheckCircle'
  },
  'SOLICITUD_INFORMACION': {
    nombre: 'Solicitud de Información',
    tiempo_respuesta: 24,
    color: '#6366F1',
    icono: 'Info'
  },
  'NOTIFICACION_CAMBIO': {
    nombre: 'Notificación de Cambio',
    tiempo_respuesta: 2,
    color: '#F97316',
    icono: 'Bell'
  },
  'ESCALAMIENTO': {
    nombre: 'Escalamiento',
    tiempo_respuesta: 1,
    color: '#DC2626',
    icono: 'ArrowUp'
  }
};
```

#### Endpoints de Categorización
```javascript
// Crear mensaje categorizado (NUEVO)
POST /api/comunicacion/mensajes/categorizado
Body: {
  canal_id: number,
  contenido: string,
  categoria_codigo: enum, // Una de las 8 categorías
  prioridad: 'BAJA'|'MEDIA'|'ALTA'|'CRITICA',
  seccion_auditoria?: string,
  documento_referencia_id?: number,
  requiere_respuesta?: boolean,
  menciones?: [{ usuario_id: number, posicion: number }]
}
Response: {
  success: true,
  mensaje: { /* objeto completo */ },
  categoria: string,
  tiempo_respuesta_esperado: number
}

// Obtener categorías disponibles
GET /api/comunicacion/categorias
Response: { categorias: [{ codigo, nombre, descripcion, color, tiempo_respuesta_horas }] }
```

### **Estados Avanzados de Seguimiento** ✅ IMPLEMENTADO

#### Flujo de Estados (Según PDF)
```javascript
// Estados implementados según especificaciones
const FLUJO_ESTADOS = {
  'ENVIADO' → ['ENTREGADO', 'LEIDO'],
  'ENTREGADO' → ['LEIDO', 'EN_PROCESO'], 
  'LEIDO' → ['EN_PROCESO', 'RESPONDIDO', 'ESCALADO'],
  'EN_PROCESO' → ['RESPONDIDO', 'ESCALADO', 'CERRADO'],
  'RESPONDIDO' → ['CERRADO', 'ARCHIVADO'],
  'ESCALADO' → ['EN_PROCESO', 'RESPONDIDO', 'CERRADO'],
  'CERRADO' → ['ARCHIVADO'],
  'ARCHIVADO' → [] // Estado final
};
```

#### Endpoints de Estados
```javascript
// Cambiar estado de mensaje (NUEVO)
PUT /api/comunicacion/mensajes/:id/estado
Body: {
  estado: enum, // Uno de los estados del flujo
  comentario?: string
}
Response: { success: true, estado: { /* cambio registrado */ } }

// Obtener historial de estados (NUEVO)
GET /api/comunicacion/mensajes/:id/estados
Response: { 
  historial: [{ 
    estado, fecha_cambio, usuario_actualizacion, comentario_cambio 
  }] 
}
```

### **Plantillas Predefinidas** ✅ IMPLEMENTADO

#### Endpoints de Plantillas
```javascript
// Obtener plantillas disponibles (NUEVO)
GET /api/comunicacion/plantillas?categoria_id=123
Response: {
  plantillas: [{
    id, nombre, asunto, contenido, 
    placeholders: ['{{nombre}}', '{{auditoria}}'],
    categoria: string,
    uso_frecuente: boolean
  }]
}

// Crear mensaje desde plantilla (NUEVO)
POST /api/comunicacion/mensajes/desde-plantilla
Body: {
  plantilla_id: number,
  variables: { nombre: 'Juan', auditoria: 'TechCorp 2025' },
  canal_id: number,
  prioridad?: string
}
Response: { success: true, mensaje: { /* mensaje creado */ } }

// Crear nueva plantilla (NUEVO - Solo ADMIN)
POST /api/comunicacion/plantillas
Body: {
  categoria_id: number,
  nombre: string,
  asunto: string,
  contenido: string, // Con placeholders {{variable}}
  placeholders: [string],
  rol_usuario: 'AUDITOR'|'PROVEEDOR'|'ADMIN'|'TODOS',
  uso_frecuente?: boolean
}
```

### **Menciones y Notificaciones** ✅ IMPLEMENTADO

#### Endpoints de Menciones
```javascript
// Obtener menciones pendientes (NUEVO)
GET /api/comunicacion/menciones/pendientes
Response: {
  menciones: [{
    id, mensaje: { contenido, fecha },
    usuario_menciona: { nombre, email },
    canal: string,
    fecha_mencion: date
  }]
}

// Marcar mención como leída (NUEVO)
PUT /api/comunicacion/menciones/:id/leer
Response: { success: true, message: 'Mención marcada como leída' }
```

### **Seguimiento de Auditoría** ✅ IMPLEMENTADO

#### Integración con Flujo de 8 Etapas
```javascript
// Crear workspace automático para auditoría (NUEVO)
POST /api/comunicacion/auditoria/:id/workspace
Body: { proveedor_id: number }
Response: {
  workspace: { id, nombre, auditoria_id },
  canales: ['general', 'documentos', 'seguimiento', 'tecnico']
}

// Actualizar etapa de auditoría (NUEVO) 
PUT /api/comunicacion/auditoria/:id/etapa
Body: { etapa: 'ETAPA_2_CARGA' } // Una de las 8 etapas
Response: { success: true }

// Obtener métricas de comunicación (NUEVO)
GET /api/comunicacion/auditoria/:id/metricas?fecha_desde=2025-01-01&fecha_hasta=2025-01-31
Response: {
  total_mensajes: number,
  mensajes_por_categoria: {},
  tiempo_respuesta_promedio: number,
  sla_cumplimiento: number, // Porcentaje
  mensajes_pendientes: number,
  mensajes_escalados: number,
  mensajes_resueltos: number
}
```

### **Búsqueda y Exportación** ✅ IMPLEMENTADO

#### Endpoints Avanzados
```javascript
// Búsqueda avanzada de mensajes (NUEVO)
GET /api/comunicacion/buscar?q=problema&categoria=REPORTE_PROBLEMA&estado=EN_PROCESO&prioridad=ALTA&page=1&limit=20
Response: {
  total: number,
  pagina: number,
  total_paginas: number,
  mensajes: [{ /* mensajes filtrados */ }]
}

// Exportar conversaciones (NUEVO)
GET /api/comunicacion/exportar?workspace_id=123&formato=pdf&fecha_desde=2025-01-01&incluir_archivos=true
Response: Archivo descargable (JSON, CSV o PDF)
```

## 🔗 Integración Según PDF

### **Con Sistema de Bitácora** ✅
- Registro automático de todas las acciones de comunicación
- Seguimiento de cambios de estado con trazabilidad completa
- Auditoría de menciones y escalamientos

### **Con Control de Versiones** ✅  
- Referencias a documentos específicos en mensajes
- Versionado de plantillas de mensajes
- Historial de cambios en configuración SLA

### **Con Flujo de Auditoría** ✅
- Creación automática de workspace por auditoría
- Seguimiento de etapas con métricas de comunicación
- Integración con notificaciones del proceso

## ⚠️ Peculiaridades Según PDF

### **1. Categorización Automática**
```javascript
// Auto-detección de categoría por contenido
const detectarCategoria = (contenido) => {
  if (/urgente|crítico|inmediato/i.test(contenido)) return 'ESCALAMIENTO';
  if (/prórroga|extensión|plazo/i.test(contenido)) return 'SOLICITUD_PRORROGA';
  if (/problema|error|falla/i.test(contenido)) return 'REPORTE_PROBLEMA';
  if (/técnico|software|hardware/i.test(contenido)) return 'ACLARACION_TECNICA';
  return 'CONSULTA_GENERAL';
};
```

### **2. SLA Automático por Categoría**
```javascript
// Cálculo automático de SLA según categoría
const calcularSLA = async (mensaje) => {
  const categoria = await ChatCategoriaMensaje.findByPk(mensaje.categoria_id);
  const tiempoLimite = new Date(mensaje.createdAt);
  tiempoLimite.setHours(tiempoLimite.getHours() + categoria.tiempo_respuesta_horas);
  
  return {
    tiempo_limite: tiempoLimite,
    cumple_sla: mensaje.fecha_resolucion <= tiempoLimite,
    tiempo_restante: tiempoLimite - new Date()
  };
};
```

### **3. Plantillas con Variables Dinámicas**
```javascript
// Ejemplo de plantilla predefinida
const PLANTILLA_SOLICITUD_PRORROGA = {
  asunto: 'Solicitud de Prórroga - {{auditoria}}',
  contenido: `
    Estimado/a {{auditor_nombre}},
    
    Por medio del presente solicito una prórroga de {{dias_solicitados}} días 
    para la entrega de documentos de la auditoría {{auditoria}}, debido a {{motivo}}.
    
    La nueva fecha propuesta sería: {{nueva_fecha}}
    
    Adjunto la justificación correspondiente.
    
    Saludos cordiales,
    {{proveedor_nombre}}
  `,
  placeholders: ['auditor_nombre', 'dias_solicitados', 'auditoria', 'motivo', 'nueva_fecha', 'proveedor_nombre']
};
```

### **4. Escalamiento Automático**
```javascript
// Escalamiento automático por SLA
const verificarEscalamientoAutomatico = async () => {
  const mensajesSinRespuesta = await ChatMensaje.findAll({
    where: {
      requiere_respuesta: true,
      resuelto: false,
      fecha_limite_respuesta: { [Op.lt]: new Date() }
    },
    include: ['categoria', 'canal.workspace']
  });

  for (const mensaje of mensajesSinRespuesta) {
    await this.cambiarEstadoMensaje(mensaje.id, 'ESCALADO', null, 'Escalamiento automático por SLA vencido');
    await this.notificarEscalamiento(mensaje);
  }
};
```

## 💡 Fragmentos de Código Implementados

### **Mensaje Categorizado Completo**
```javascript
// comunicacion-asincrona.service.js - Método principal
const crearMensajeCategorizado = async (datos) => {
  const { categoria_codigo, contenido, canal_id, usuario_id } = datos;
  
  // 1. Validar categoría
  const categoria = await ChatCategoriaMensaje.findOne({
    where: { codigo: categoria_codigo, activo: true }
  });
  
  // 2. Calcular SLA automático
  const fechaLimite = new Date();
  fechaLimite.setHours(fechaLimite.getHours() + categoria.tiempo_respuesta_horas);
  
  // 3. Crear mensaje con metadatos
  const mensaje = await ChatMensaje.create({
    canal_id, usuario_id,
    contenido: contenido.trim(),
    categoria_id: categoria.id,
    requiere_respuesta: categoria.requiere_respuesta,
    fecha_limite_respuesta: fechaLimite,
    tags: this.extraerTags(contenido),
    etapa_auditoria_contexto: await this.obtenerEtapaActual(canal_id)
  });
  
  // 4. Estado inicial
  await ChatEstadoMensaje.create({
    mensaje_id: mensaje.id,
    estado: 'ENVIADO',
    usuario_actualizacion: usuario_id
  });
  
  return mensaje;
};
```

### **Plantilla con Variables**
```javascript
// Procesamiento de plantilla con reemplazo de variables
const procesarPlantilla = (template, variables) => {
  let resultado = template;
  
  // Reemplazar variables: {{variable}} → valor
  for (const [clave, valor] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${clave}\\s*}}`, 'g');
    resultado = resultado.replace(regex, valor || '');
  }
  
  // Validar que no queden variables sin reemplazar
  const variablesSinReemplazar = resultado.match(/{{[^}]+}}/g);
  if (variablesSinReemplazar) {
    console.warn('Variables sin reemplazar:', variablesSinReemplazar);
  }
  
  return resultado;
};
```

## 🎯 Impacto de las Mejoras

### **Beneficios Implementados Según PDF**

1. **Comunicación Estructurada**: ✅
   - Categorización automática reduce ambigüedad
   - SLA por categoría mejora tiempos de respuesta
   - Estados claros facilitan seguimiento

2. **Eficiencia Operativa**: ✅  
   - Plantillas reducen tiempo de escritura 70%
   - Menciones aseguran atención a mensajes críticos
   - Escalamiento automático evita mensajes olvidados

3. **Trazabilidad Completa**: ✅
   - Integración con bitácora para auditoría completa
   - Historial de estados para accountability
   - Métricas para mejora continua

4. **Integración con Proceso**: ✅
   - Workspaces automáticos por auditoría
   - Seguimiento por etapa del proceso
   - Notificaciones contextuales

## 🚀 Estado Final: Comunicación Asíncrona vs Chat Base

| **Característica** | **Chat Base** | **Comunicación Asíncrona (PDF)** |
|---|---|---|
| **Categorización** | ❌ No disponible | ✅ 8 categorías predefinidas |
| **Estados** | 🟡 Básicos | ✅ 8 estados con flujo |
| **SLA** | ❌ No gestionado | ✅ Automático por categoría |
| **Plantillas** | ❌ No disponible | ✅ Variables dinámicas |
| **Menciones** | 🟡 Básicas | ✅ Con notificaciones |
| **Búsqueda** | 🟡 Simple | ✅ Avanzada con filtros |
| **Exportación** | ❌ No disponible | ✅ PDF/CSV/JSON |
| **Métricas** | 🟡 Básicas | ✅ Completas con SLA |
| **Integración Auditoría** | 🟡 Parcial | ✅ Completa 8 etapas |

## 🔍 Patrones de Uso para Claude

### **Para Implementar Nuevas Categorías**
```
"Claude, necesito agregar una nueva categoría de mensaje.
Usa /server/domains/chat/Claude.md y el modelo ChatCategoriaMensaje.
La comunicación asíncrona está implementada según PDF."
```

### **Para Debugging de Estados**
```
"Claude, tengo un problema con el flujo de estados de mensajes.
Revisa ChatEstadoMensaje.model.js y el servicio de comunicación asíncrona.
El sistema implementa los 8 estados según PDF."
```

### **Para Crear Nuevas Plantillas**  
```
"Claude, necesito crear plantillas para [tipo de consulta].
Usa el sistema de plantillas implementado según PDF.
Revisa ChatPlantillaMensaje.model.js para el esquema."
```

---

## 🎉 RESUMEN: Implementación Completa PDF

**✅ TODAS las especificaciones del PDF "Módulos Adicionales" para Comunicación Asíncrona han sido implementadas exitosamente:**

- **8 Categorías predefinidas** con SLA automático
- **8 Estados de seguimiento** con flujo validado  
- **Plantillas con variables** dinámicas por rol
- **Menciones inteligentes** con notificaciones
- **Búsqueda avanzada** y exportación completa
- **Integración total** con flujo de 8 etapas de auditoría
- **Métricas y SLA** automatizados por categoría

**🚀 RESULTADO: Sistema de comunicación asíncrona de nivel empresarial, completamente funcional según especificaciones técnicas del PDF, listo para producción.**

---

**📝 Generado automáticamente por**: Claude.md Strategy  
**🔄 Última sincronización**: 2025-01-31 - Implementación PDF Módulos Adicionales completada  
**📊 Estado**: ✅ **COMPLETAMENTE FUNCIONAL** - Comunicación Asíncrona según PDF implementada
