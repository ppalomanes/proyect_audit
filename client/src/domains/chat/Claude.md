# Claude.md - Módulo Chat Frontend

> **📍 Ubicación**: `/client/src/domains/chat/`
> 
> **🎯 Dominio**: Sistema de mensajería en tiempo real - Frontend React

## 🎯 Propósito

Este módulo implementa la **interfaz de usuario completa** del sistema de chat en tiempo real para comunicación auditor-proveedor, integrando WebSockets, gestión de conversaciones y experiencia de usuario moderna con soporte completo para tema oscuro/claro.

### Responsabilidades Principales
- **Interface de chat en tiempo real** con WebSockets
- **Gestión visual de conversaciones** con filtros y búsqueda
- **Indicadores de estado** (conectado, escribiendo, leído)
- **Integración MainLayout** para consistencia UX
- **Soporte temas** oscuro/claro completo
- **Notificaciones visuales** y configuración de preferencias

## 🏗️ Componentes Clave

### Página Principal
- **`ChatPage.jsx`**: Contenedor principal integrado con MainLayout, navegación entre vistas
- **Router Integration**: Ruta `/chat` protegida por roles con MainLayout wrapper

### Componentes Core
- **`ChatInterface.jsx`**: Interface principal de mensajería con WebSockets
- **`ConversationManager.jsx`**: Gestión avanzada de conversaciones con filtros
- **`ChatStatusBar.jsx`**: Barra de estado con conexión y usuarios online

### Características Avanzadas
- **WebSocket Integration**: Cliente Socket.IO para tiempo real
- **Responsive Design**: Móvil-first con breakpoints adaptativos
- **Theme Support**: Variables CSS completas para modo oscuro/claro
- **State Management**: React hooks para estado local y WebSocket

## 🔌 Interfaces/APIs

### Props ChatPage
```javascript
// ChatPage.jsx - Integrado con MainLayout
const ChatPage = () => {
  // Estados principales
  const [viewMode, setViewMode] = useState('interface'); // 'interface' | 'manager'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Configuración usuario
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
};
```

### Props ChatInterface
```javascript
// ChatInterface.jsx - Mensajería principal
const ChatInterface = ({ selectedConversation = null }) => {
  // WebSocket state
  const [socket, setSocket] = useState(null);
  const [usuariosConectados, setUsuariosConectados] = useState([]);
  const [usuariosEscribiendo, setUsuariosEscribiendo] = useState([]);
  
  // Chat state
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
};
```

### Props ConversationManager
```javascript
// ConversationManager.jsx - Gestión conversaciones
const ConversationManager = ({ 
  onSelectConversation, 
  selectedConversationId = null 
}) => {
  // Filtros y búsqueda
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Datos
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(false);
};
```

## 🎨 Sistema de Temas

### Variables CSS Utilizadas
```css
/* Tema principal - definido en index.css */
.bg-white dark:bg-gray-800                    /* Backgrounds principales */
.text-gray-900 dark:text-white                /* Texto principal */
.border-gray-200 dark:border-gray-700         /* Bordes */
.bg-gray-50 dark:bg-gray-900                  /* Backgrounds secundarios */

/* Acentos específicos chat */
.border-purple-500 .text-purple-600           /* Tabs activos */
.bg-purple-500 hover:bg-purple-600            /* Botones acción */
.text-green-500                               /* Estados conectado */
.text-red-500                                 /* Estados desconectado */
```

## 🔗 Integración MainLayout

### IMPORTANTE: Layout Integration (Fixed)
```jsx
// AppRouter.jsx - Ruta corregida
<Route 
  path="/chat" 
  element={
    <ProtectedRoute requiredRoles={['ADMIN', 'AUDITOR', 'SUPERVISOR', 'PROVEEDOR']}>
      <MainLayout>
        <ChatPage />
      </MainLayout>
    </ProtectedRoute>
  } 
/>
```

### Estructura Adaptada MainLayout
```jsx
// ChatPage.jsx - Adaptado para MainLayout
return (
  <div className="flex flex-col h-full">
    {/* Header con título */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Sistema de Chat
      </h1>
      {/* Navigation tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tabs content */}
      </div>
    </div>

    {/* Main content - ajustado para MainLayout */}
    <div className="flex-1 min-h-0">
      <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Chat content */}
      </div>
    </div>

    {/* Status bar */}
    <div className="mt-4">
      <ChatStatusBar />
    </div>
  </div>
);
```

## 💡 Fragmentos de Código Ilustrativos

### WebSocket Integration
```javascript
// chat/components/ChatInterface.jsx
useEffect(() => {
  const socket = io('http://localhost:3002/chat', {
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('connect', () => setIsConnected(true));
  socket.on('message_received', handleNewMessage);
  socket.on('user_typing_start', handleTypingStart);
  socket.on('user_typing_stop', handleTypingStop);

  setSocket(socket);
  
  return () => {
    socket.disconnect();
  };
}, []);

const handleSendMessage = () => {
  if (!nuevoMensaje.trim() || !selectedConversacion || !socket) return;
  
  const mensaje = {
    conversacion_id: selectedConversacion.id,
    contenido: nuevoMensaje.trim(),
    timestamp: new Date().toISOString()
  };
  
  socket.emit('send_message', mensaje);
  setNuevoMensaje('');
};
```

### Mobile-First Responsive Design
```javascript
// chat/ChatPage.jsx - Responsive layout
return (
  <div className="flex flex-col h-full">
    {/* Header - collapsa en móvil */}
    <div className="mb-4 sm:mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Sistema de Chat
      </h1>
      
      {/* Tabs - stack en móvil */}
      <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
        <button className="pb-2 text-sm font-medium border-b-2 transition-colors">
          💬 Chat Interface
        </button>
        <button className="pb-2 text-sm font-medium border-b-2 transition-colors">
          📋 Gestionar Conversaciones
        </button>
      </nav>
    </div>

    {/* Main content - altura adaptativa */}
    <div className="flex-1 min-h-0">
      <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Content adapts to parent height */}
      </div>
    </div>
  </div>
);
```

## 🧪 Testing y Desarrollo

### Datos Mock para Desarrollo
```javascript
// Mock data para testing sin backend
const mockConversaciones = [
  {
    id: 1,
    titulo: 'Auditoría Proveedor XYZ - Q1 2025',
    auditoria_id: 123,
    tipo: 'AUDITORIA',
    estado: 'ACTIVA',
    mensajes_no_leidos: 3,
    ultimo_mensaje_fecha: new Date(),
    participantes: [
      { id: 1, nombre: 'Ana García', rol: 'AUDITOR', online: true },
      { id: 2, nombre: 'Carlos Ruiz', rol: 'PROVEEDOR', online: false }
    ]
  }
];
```

---

## 🔍 Patrones de Uso para Claude

### Desarrollo en este Módulo
1. **Consultar** este `Claude.md` para entender arquitectura chat
2. **Verificar** integración con MainLayout en AppRouter.jsx
3. **Examinar** WebSocket client setup en ChatInterface.jsx
4. **Revisar** responsive breakpoints y theme variables

### Debugging Común
- **Layout no aparece**: Verificar MainLayout wrapper en AppRouter.jsx
- **WebSockets fallan**: Verificar URL y auth token en Socket.IO client
- **Temas inconsistentes**: Verificar variables CSS en index.css
- **Mobile responsive**: Verificar breakpoints sm:, md:, lg:

### Extensión del Módulo
- **Nuevas funcionalidades chat**: Agregar en ChatInterface.jsx
- **Nuevos filtros**: Configurar en ConversationManager.jsx
- **Nuevo estado conexión**: Actualizar ChatStatusBar.jsx
- **Nuevos temas**: Actualizar variables CSS en index.css

---

**📝 Generado automáticamente por**: Claude.md Strategy  
**🔄 Última actualización**: Layout Integration Fix - Chat ahora usa MainLayout  
**📊 Estado**: ✅ Completo - Chat integrado con sidebar y navbar  
**🎯 Siguiente**: Testing integration y performance optimization