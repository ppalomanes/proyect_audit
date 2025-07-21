# Claude.md - Módulo Chat

> **📍 Ubicación**: `/server/domains/chat/`
> 
> **🎯 Dominio**: Sistema de mensajería asíncrona entre auditores y proveedores
> 
> **🔗 Integración**: AUTH (permisos) + AUDITORIAS (contexto) + NOTIFICATIONS (alertas)

## 🎯 Propósito

Este módulo implementará un **sistema de mensajería asíncrona** para facilitar la comunicación entre auditores y proveedores durante el proceso de auditoría, con soporte para WebSockets en tiempo real y historial persistente.

### Responsabilidades Principales (Planificadas)
- **Mensajería tiempo real** con WebSockets para comunicación instantánea
- **Historial persistente** de conversaciones por auditoría
- **Notificaciones inteligentes** de mensajes no leídos
- **Control de permisos** granular por rol y auditoría
- **Archivos adjuntos** para compartir documentos y capturas
- **Estados de mensaje** (enviado, entregado, leído)

## 🏗️ Estructura Preparada

### Arquitectura Propuesta
```
/server/domains/chat/
├── 📄 chat.controller.js        # Endpoints REST para mensajería
├── 📄 chat.service.js           # Lógica de negocio de chat
├── 📄 chat.routes.js            # Rutas protegidas con auth
├── 📁 /models/
│   ├── Mensaje.model.js         # Esquema de mensajes
│   ├── Conversacion.model.js    # Esquema de conversaciones
│   └── ParticipanteChat.model.js # Participantes por chat
├── 📁 /websockets/
│   ├── chat-handler.js          # Manejo de eventos WebSocket
│   ├── room-manager.js          # Gestión de salas por auditoría
│   └── socket-auth.js           # Autenticación WebSocket
├── 📁 /validators/
│   └── chat.validators.js       # Validaciones express-validator
└── 📄 Claude.md                 # Esta documentación
```

## 🔌 Interfaces/APIs Planificadas

### Endpoints REST
```javascript
// Gestión de conversaciones
GET    /api/chat/conversaciones           // Listar conversaciones del usuario
POST   /api/chat/conversaciones           // Crear nueva conversación
GET    /api/chat/conversaciones/:id       // Obtener conversación específica

// Mensajes
GET    /api/chat/conversaciones/:id/mensajes  // Historial de mensajes
POST   /api/chat/conversaciones/:id/mensajes  // Enviar mensaje
PUT    /api/chat/mensajes/:id/leido           // Marcar como leído

// Archivos adjuntos
POST   /api/chat/mensajes/:id/archivos    // Subir archivo adjunto
GET    /api/chat/archivos/:id             // Descargar archivo
```

### Eventos WebSocket
```javascript
// Cliente → Servidor
socket.emit('join_conversation', { conversacion_id, auditoria_id });
socket.emit('send_message', { conversacion_id, contenido, tipo });
socket.emit('typing_start', { conversacion_id });
socket.emit('typing_stop', { conversacion_id });
socket.emit('mark_read', { mensaje_id });

// Servidor → Cliente
socket.emit('message_received', { mensaje, conversacion_id });
socket.emit('user_typing', { usuario, conversacion_id });
socket.emit('message_read', { mensaje_id, usuario_id });
socket.emit('conversation_updated', { conversacion });
```

## 🔗 Dependencias Planificadas

### Dependencias Internas
- **`../auth/middleware/authentication.js`**: Autenticación JWT para endpoints
- **`../auth/middleware/socket-auth.js`**: Autenticación para WebSockets
- **`../auditorias/auditorias.service.js`**: Contexto de auditoría para permisos
- **`../notifications/notifications.service.js`**: Notificaciones de mensajes

### Dependencias Externas
- **`socket.io`**: WebSockets para comunicación tiempo real
- **`multer`**: Upload de archivos adjuntos
- **`express-validator`**: Validación de mensajes y parámetros
- **`sequelize`**: ORM para persistencia de mensajes

## 💡 Características Técnicas Propuestas

### 1. **Sistema de Salas por Auditoría**
```javascript
// Usuarios se unen automáticamente a salas por auditoría
const joinUserToAuditoryRoom = (socket, usuario, auditoria_id) => {
  const roomName = `auditoria_${auditoria_id}`;
  
  // Verificar permisos de acceso a la auditoría
  if (canAccessAuditoria(usuario, auditoria_id)) {
    socket.join(roomName);
    socket.auditoria_id = auditoria_id;
  }
};
```

### 2. **Estados de Mensaje Inteligentes**
```javascript
const estadosMensaje = {
  ENVIADO: 'enviado',      // Mensaje guardado en BD
  ENTREGADO: 'entregado',  // Destinatario conectado
  LEIDO: 'leido'           // Destinatario abrió conversación
};
```

### 3. **Control de Permisos Granular**
```javascript
const verificarPermisosMensajeria = (usuario, auditoria_id) => {
  // AUDITOR: Puede mensajear en auditorías donde participa
  // PROVEEDOR: Solo en auditorías de su empresa
  // ADMIN: Acceso completo como moderador
};
```

## ⚠️ Estado Actual: 📋 PENDIENTE DE IMPLEMENTACIÓN

### 🔨 Por Implementar
- [ ] **Controladores y rutas**: Endpoints REST para mensajería
- [ ] **Modelos Sequelize**: Mensaje, Conversacion, ParticipanteChat
- [ ] **WebSocket handlers**: Eventos tiempo real con Socket.IO
- [ ] **Validadores**: Express-validator para mensajes
- [ ] **Gestión de archivos**: Upload y download de adjuntos
- [ ] **Testing**: Tests unitarios e integración

### 📁 Estructura Existente
- ✅ **Directorio base**: `/server/domains/chat/` creado
- ✅ **Subdirectorios**: `/models/`, `/websockets/` preparados
- ✅ **Claude.md**: Documentación y planificación completa

### 🎯 Próximos Pasos
1. **Crear modelos**: Definir esquemas Sequelize para mensajería
2. **Implementar WebSockets**: Configurar Socket.IO con autenticación
3. **Desarrollar controladores**: Endpoints REST para gestión de chat
4. **Integrar con AUTH**: Verificación de permisos por auditoría
5. **Testing**: Validar funcionalidad en tiempo real

## 🚀 Plan de Implementación

### Fase 1: Modelos y Persistencia
```javascript
// Crear Mensaje.model.js, Conversacion.model.js, ParticipanteChat.model.js
// Relaciones: Usuario → Mensaje, Auditoría → Conversación
```

### Fase 2: WebSockets y Tiempo Real
```javascript
// Configurar Socket.IO server
// Implementar autenticación WebSocket
// Crear handlers para eventos de chat
```

### Fase 3: API REST
```javascript
// Controladores para CRUD de conversaciones
// Endpoints para historial de mensajes
// Gestión de archivos adjuntos
```

### Fase 4: Integración
```javascript
// Conectar con módulo AUTH para permisos
// Integrar con NOTIFICATIONS para alertas
// Vincular con AUDITORIAS para contexto
```

---

## 🎯 Patrones de Uso para Claude

### Para Implementar el Módulo Chat
```
"Claude, necesito implementar el sistema de mensajería. 
Usa este Claude.md como guía y comienza con los modelos Sequelize."
```

### Para Debugging WebSockets
```
"Claude, tengo problemas con la conexión WebSocket. 
Revisa la arquitectura planificada en chat/Claude.md."
```

### Para Integración con Otros Módulos
```
"Claude, ¿cómo integro el chat con el módulo de auditorías? 
Consulta las dependencias en chat/Claude.md."
```

---

**📝 Generado automáticamente por**: Claude.md Strategy  
**🔄 Última sincronización**: Planificación completa del módulo  
**📊 Estado**: 📋 **PENDIENTE DE IMPLEMENTACIÓN** - Documentación y arquitectura completas
