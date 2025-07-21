# Claude.md - Módulo Dashboard Principal

> **📍 Ubicación**: `/client/src/domains/dashboards/`
> 
> **🎯 Dominio**: Dashboard Principal - Visión general del sistema de auditorías técnicas

## 🎯 Propósito

Este módulo implementa el **Dashboard Principal Interactivo** del Portal de Auditorías Técnicas, proporcionando una visión consolidada de métricas clave, estados de auditorías, y tendencias del sistema. Diseñado siguiendo estrictamente los lineamientos de `Maquetacion_frontend.md` para mantener consistencia visual y experiencia de usuario óptima.

### Responsabilidades Principales
- **Visualización de métricas clave**: Total auditorías, proveedores activos, tiempos promedio, scores
- **Estados de auditorías**: Distribución visual de auditorías por estado con porcentajes
- **Auditorías recientes**: Lista interactiva de las últimas auditorías procesadas  
- **Sistema de alertas**: Notificaciones de auditorías retrasadas, pendientes y mejoras
- **Filtros temporales**: Selección de rangos de tiempo (7d, 30d, 90d, 1y)
- **Integración con autenticación**: Respeta roles y permisos de usuario

## 🏗️ Componentes Clave

### Componente Principal
- **`DashboardPrincipal.jsx`**: Componente principal que orquesta todo el dashboard
- **`DashboardsPage.jsx`**: Wrapper de página que integra con el sistema de routing

### Componentes Especializados (Internos)
- **`MetricCard`**: Tarjeta de métrica con animaciones de entrada y cambios de tendencia
- **`AuditStatusCard`**: Tarjeta de estado con barras de progreso animadas
- **`RecentAuditItem`**: Item de auditoría reciente con badges de etapa y estado

### Servicios
- **`dashboardService.js`**: Servicio completo con soporte mock/real para datos del dashboard

## 🎨 Diseño y Maquetación

### Paleta de Colores Implementada
```javascript
const colorClasses = {
  blue: 'from-blue-500 to-blue-600',      // Métricas principales
  green: 'from-green-500 to-green-600',   // Indicadores positivos
  yellow: 'from-yellow-500 to-yellow-600', // Tiempo/Performance
  red: 'from-red-500 to-red-600',         // Alertas críticas
  purple: 'from-purple-500 to-purple-600', // Scores/Calidad
  indigo: 'from-indigo-500 to-indigo-600' // Adicionales
};
```

### Estados de Auditoría con Colores Semánticos
- **En Progreso**: `bg-blue-50 text-blue-700 border-blue-200`
- **Completadas**: `bg-green-50 text-green-700 border-green-200`  
- **Pendientes**: `bg-yellow-50 text-yellow-700 border-yellow-200`
- **En Revisión**: `bg-red-50 text-red-700 border-red-200`

### Etapas con Progresión Visual
```javascript
const getEtapaColor = (etapa) => {
  1: 'bg-red-100 text-red-800',      // Inicio
  2: 'bg-orange-100 text-orange-800', // Carga  
  3: 'bg-yellow-100 text-yellow-800', // Validación
  4: 'bg-blue-100 text-blue-800',     // Análisis
  5: 'bg-indigo-100 text-indigo-800', // Evaluación
  6: 'bg-purple-100 text-purple-800', // Revisión
  7: 'bg-pink-100 text-pink-800',     // Informe
  8: 'bg-green-100 text-green-800'    // Completada
};
```

## 🔌 Interfaces/APIs

### Estructura de Datos Dashboard
```javascript
const dashboardData = {
  metricas: {
    totalAuditorias: number,
    auditorias30d: number, 
    changeAuditorias: string,    // "+12%"
    changeType: string,          // "positive" | "negative"
    
    proveedoresActivos: number,
    changeProveedores: string,
    
    tiempoPromedio: number,      // días
    changeTiempo: string,
    
    scorePromedio: number,       // porcentaje
    changeScore: string
  },
  
  estadosAuditorias: [
    {
      status: string,            // "En Progreso", "Completadas", etc.
      count: number,
      percentage: number,
      color: string             // "blue", "green", "yellow", "red"
    }
  ],
  
  auditoriasRecientes: [
    {
      id: number,
      proveedor: string,
      sitio: string,
      etapa: number,            // 1-8
      status: string,
      fecha: string,           // ISO date
      auditor: string,
      score: number | null
    }
  ]
};
```

### Métodos del Servicio
```javascript
// Obtener datos completos del dashboard
dashboardService.getDashboardData(timeRange = '30d')

// Obtener auditorías recientes específicamente  
dashboardService.getAuditoriasRecientes(limit = 5)
```

## 🔗 Dependencias

### Dependencias Internas
- **`../auth/`**: Integración con sistema de autenticación para tokens JWT
- **`../shared/`**: Componentes compartidos y utilidades comunes
- **`../../layout/`**: Layout principal de la aplicación
- **`../../router/`**: Sistema de routing de React Router

### Dependencias Externas
- **`@heroicons/react/24/outline`**: Iconografía consistente con Heroicons v2
- **`react`**: Hooks useState, useEffect para gestión de estado
- **`tailwindcss`**: Sistema completo de diseño y responsive

## ⚙️ Funcionalidades Implementadas

### 1. **Métricas Principales con Animaciones**
```javascript
// Animación de entrada escalonada para métricas
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  setIsVisible(true);
}, []);

// Clases de transición suave
className={`
  transform transition-all duration-500 ease-out
  ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
  hover:shadow-md hover:-translate-y-1
`}
```

### 2. **Estados Loading con Skeletons**
```javascript
// Skeleton consistente durante carga de datos
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {[1,2,3,4].map(i => (
    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
    </div>
  ))}
</div>
```

### 3. **Sistema de Filtros Temporales**
```javascript
const [timeRange, setTimeRange] = useState('30d');

// Select con opciones predefinidas
<select 
  value={timeRange}
  onChange={(e) => setTimeRange(e.target.value)}
  className="border border-gray-300 rounded-lg px-3 py-2 text-sm 
             focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="7d">Últimos 7 días</option>
  <option value="30d">Últimos 30 días</option>
  <option value="90d">Últimos 90 días</option>  
  <option value="1y">Último año</option>
</select>
```

### 4. **Sistema de Alertas Categorizado**
```javascript
// Alertas con colores semánticos y iconos apropiados
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Alerta Crítica */}
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
    <h4 className="text-sm font-medium text-red-800">Auditorías Retrasadas</h4>
  </div>
  
  {/* Alerta Warning */}
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <ClockIcon className="h-5 w-5 text-yellow-400" />
    <h4 className="text-sm font-medium text-yellow-800">Pendientes de Revisión</h4>
  </div>
  
  {/* Alerta Positiva */}
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <CheckCircleIcon className="h-5 w-5 text-green-400" />
    <h4 className="text-sm font-medium text-green-800">Score Mejorado</h4>
  </div>
</div>
```

## 🔄 Integración con Sistema Existente

### Integración con Autenticación
```javascript
// Headers con JWT token para llamadas API reales
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

### Consistencia con Módulo Auditorías
- **Paleta de colores**: Reutiliza los mismos colores de estados del módulo auditorías
- **Componentes badges**: Usa el mismo sistema de badges para etapas y estados
- **Iconografía**: Mantiene coherencia con Heroicons v2 
- **Espaciado**: Aplica el mismo sistema de espaciado Tailwind

### Sistema Mock Data
```javascript
export const USE_MOCK_DATA = true;

// Simular delay de red realista
const simulateNetworkDelay = (min = 500, max = 1500) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};
```

## ⚠️ Peculiaridades y Consideraciones

### 1. **Responsive Design Mobile-First**
- Grid adaptativo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Breakpoints: móvil (1 col), tablet (2 cols), desktop (4 cols)
- Espaciado consistente en todos los dispositivos

### 2. **Performance y Optimización**
- Lazy loading de componentes pesados
- Debounce en filtros temporales 
- Memoización de cálculos de porcentajes
- Skeleton loaders para UX fluida

### 3. **Accesibilidad (A11y)**
- Navegación por teclado completa
- Contraste WCAG AA en todos los elementos
- Screen reader friendly con aria-labels
- Focus visible en elementos interactivos

### 4. **Estados de Error**
```javascript
// Manejo robusto de errores de API
try {
  const data = await dashboardService.getDashboardData(timeRange);
  setDashboardData(data);
} catch (error) {
  console.error('Error loading dashboard:', error);
  // Fallback a datos locales o mostrar mensaje de error
  setError('No se pudieron cargar los datos del dashboard');
}
```

## 💡 Fragmentos de Código Ilustrativos

### Métrica con Tendencia Animada
```javascript
const MetricCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6
                    transform transition-all duration-500 ease-out
                    hover:shadow-md hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          
          <div className="flex items-center mt-2">
            {changeType === 'positive' ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </span>
          </div>
        </div>
        
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]}
                        flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};
```

### Barra de Progreso Animada
```javascript
const AuditStatusCard = ({ status, count, percentage, color }) => {
  return (
    <div className={`rounded-lg border p-4 flex items-center justify-between
                    transition-all duration-200 hover:shadow-sm`}>
      <div>
        <p className="font-medium">{status}</p>
        <p className="text-2xl font-bold mt-1">{count}</p>
      </div>
      <div className="text-right">
        <div className="text-sm opacity-75">{percentage}%</div>
        <div className="w-16 h-2 bg-white bg-opacity-50 rounded-full mt-1 overflow-hidden">
          <div 
            className="h-full bg-current rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
```

---

## 🔍 Patrones de Uso para Claude

### Desarrollo en este Módulo
1. **Consultar** este `Claude.md` para entender la estructura del dashboard
2. **Revisar** `Maquetacion_frontend.md` para mantener consistencia visual
3. **Examinar** `/domains/auditorias/` para reutilizar patrones de diseño
4. **Verificar** integración con sistema de autenticación existente

### Debugging Común
- **Datos no cargan**: Verificar `USE_MOCK_DATA = true` en `dashboardService.js`
- **Estilos inconsistentes**: Revisar paleta de colores en `Maquetacion_frontend.md`
- **Animaciones lentas**: Ajustar `duration-500` en clases de transición
- **Responsive issues**: Verificar breakpoints `md:` y `lg:` en grid

### Extensión del Módulo
- **Nuevas métricas**: Agregar en `mockDashboardData.metricas`
- **Nuevos filtros**: Extender opciones en select de `timeRange`
- **Gráficos**: Integrar biblioteca como Recharts para visualizaciones
- **Exportación**: Agregar funcionalidad de export PDF/Excel

---

**📝 Generado automáticamente por**: Claude.md Strategy
**🔄 Última sincronización**: Implementación Dashboard Principal
**📊 Estado**: ✅ Completo y Funcional - Siguiendo Maquetacion_frontend.md