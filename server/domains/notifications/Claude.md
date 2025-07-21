# Claude.md - Módulo Notifications

> **📍 Ubicación**: `/server/domains/notifications/`
> 
> **🎯 Dominio**: Sistema de notificaciones multicanal para auditorías
> 
> **🔗 Integración**: AUTH (usuarios) + AUDITORIAS (eventos) + CHAT (mensajes)

## 🎯 Propósito

Este módulo implementará un **sistema de notificaciones multicanal** para mantener informados a auditores y proveedores sobre eventos importantes del proceso de auditoría mediante email, WebSockets y notificaciones push.

### Responsabilidades Principales (Planificadas)
- **Notificaciones automáticas** por cambios de etapa en auditorías
- **Alertas personalizadas** por vencimiento de plazos y tareas pendientes
- **Múltiples canales** de entrega (email, WebSocket, push)
- **Plantillas customizables** por tipo de notificación y rol
- **Cola de envío asíncrona** con reintentos y fallback
- **Historial y tracking** de notificaciones enviadas

## 🏗️ Estructura Preparada

### Arquitectura Propuesta
```
/server/domains/notifications/
├── 📄 notifications.controller.js    # Endpoints para gestión de notificaciones
├── 📄 notifications.service.js       # Orquestador de notificaciones
├── 📄 notifications.routes.js        # Rutas para configuración usuario
├── 📁 /models/
│   ├── Notificacion.model.js         # Historial de notificaciones
│   ├── PlantillaNotificacion.model.js # Plantillas por tipo
│   └── PreferenciaUsuario.model.js   # Preferencias por usuario
├── 📁 /channels/
│   ├── email-channel.js              # Canal de email con SMTP
│   ├── websocket-channel.js          # Canal WebSocket tiempo real
│   ├── push-channel.js               # Canal push notifications
│   └── sms-channel.js                # Canal SMS (futuro)
├── 📁 /templates/
│   ├── email-templates.js            # Templates HTML email
│   ├── push-templates.js             # Templates notificaciones push
│   └── template-engine.js            # Motor de templates dinámicos
├── 📁 /queue/
│   ├── notification-queue.js         # Cola BullMQ para envío
│   ├── retry-handler.js              # Lógica de reintentos
│   └── priority-manager.js           # Gestión de prioridades
├── 📁 /validators/
│   └── notifications.validators.js   # Validaciones
└── 📄 Claude.md                      # Esta documentación
```

## 🔌 Interfaces/APIs Planificadas

### Endpoints REST
```javascript
// Configuración de usuario
GET    /api/notifications/preferences      // Obtener preferencias usuario
PUT    /api/notifications/preferences      // Actualizar preferencias
POST   /api/notifications/test             // Enviar notificación de prueba

// Gestión de notificaciones
GET    /api/notifications/history          // Historial del usuario
PUT    /api/notifications/:id/read         // Marcar como leída
DELETE /api/notifications/:id              // Eliminar notificación

// Administración (ADMIN only)
GET    /api/notifications/templates        // Listar plantillas disponibles
PUT    /api/notifications/templates/:id    // Actualizar plantilla
POST   /api/notifications/send/broadcast   // Envío masivo
GET    /api/notifications/stats            // Estadísticas de envío
```

### 4. **Canal de Email Inteligente**
```javascript
class EmailChannel {
  async send(notificacion, usuario, datos) {
    // 1. Verificar preferencias usuario
    if (!usuario.preferencias.email_enabled) return;
    
    // 2. Aplicar horario no molestar
    if (this.isInQuietHours(usuario)) {
      return this.scheduleForLater(notificacion, usuario);
    }
    
    // 3. Generar contenido desde plantilla
    const contenido = await this.generateFromTemplate(
      notificacion.plantilla, datos
    );
    
    // 4. Enviar con tracking
    const result = await this.smtp.send({
      to: usuario.email,
      subject: contenido.asunto,
      html: contenido.html
    });
    
    // 5. Registrar envío
    await this.logNotification(notificacion, usuario, result);
  }
}
```

## ⚠️ Estado Actual: 📋 PENDIENTE DE IMPLEMENTACIÓN

### 🔨 Por Implementar
- [ ] **Modelos Sequelize**: Notificacion, PlantillaNotificacion, PreferenciaUsuario
- [ ] **Canales de envío**: Email, WebSocket, Push notifications
- [ ] **Sistema de plantillas**: Motor Handlebars con templates dinámicos
- [ ] **Cola de trabajos**: BullMQ para envío asíncrono con reintentos
- [ ] **Preferencias usuario**: CRUD de configuración personal
- [ ] **Dashboard admin**: Estadísticas y gestión de plantillas

### 📁 Estructura Existente
- ✅ **Directorio base**: `/server/domains/notifications/` creado
- ✅ **Subdirectorios**: `/channels/`, `/templates/` preparados
- ✅ **Claude.md**: Arquitectura y planificación completas

---

**📝 Generado automáticamente por**: Claude.md Strategy  
**🔄 Última sincronización**: Planificación completa del módulo  
**📊 Estado**: 📋 **PENDIENTE DE IMPLEMENTACIÓN** - Documentación y arquitectura completas