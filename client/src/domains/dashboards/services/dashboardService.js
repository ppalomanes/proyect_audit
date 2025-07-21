// Mock Data Service para Dashboard
export const USE_MOCK_DATA = true;

// Simular delay de red
const simulateNetworkDelay = (min = 500, max = 1500) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Datos mock del dashboard
const mockDashboardData = {
  metricas: {
    totalAuditorias: 156,
    auditorias30d: 24,
    changeAuditorias: '+12%',
    changeType: 'positive',
    
    proveedoresActivos: 89,
    changeProveedores: '+5%',
    
    tiempoPromedio: 14.5,
    changeTiempo: '-8%',
    
    scorePromedio: 87.3,
    changeScore: '+3%'
  },
  
  estadosAuditorias: [
    { status: 'En Progreso', count: 45, percentage: 28.8, color: 'blue' },
    { status: 'Completadas', count: 78, percentage: 50.0, color: 'green' },
    { status: 'Pendientes', count: 23, percentage: 14.7, color: 'yellow' },
    { status: 'En Revisión', count: 10, percentage: 6.4, color: 'red' }
  ],
  
  auditoriasRecientes: [
    { 
      id: 1, 
      proveedor: 'CallCenter Solutions', 
      sitio: 'BOG-001', 
      etapa: 3, 
      status: 'En Progreso', 
      fecha: '2025-01-15',
      auditor: 'Carlos Mendoza',
      score: 85.2
    },
    { 
      id: 2, 
      proveedor: 'TechSupport Pro', 
      sitio: 'MED-002', 
      etapa: 7, 
      status: 'Revisión', 
      fecha: '2025-01-14',
      auditor: 'Ana García',
      score: 92.1
    },
    { 
      id: 3, 
      proveedor: 'Contact Express', 
      sitio: 'CAL-003', 
      etapa: 8, 
      status: 'Completada', 
      fecha: '2025-01-13',
      auditor: 'Miguel Torres',
      score: 88.7
    },
    { 
      id: 4, 
      proveedor: 'Service Direct', 
      sitio: 'BAR-004', 
      etapa: 2, 
      status: 'En Progreso', 
      fecha: '2025-01-12',
      auditor: 'Laura Jiménez',
      score: 76.4
    },
    { 
      id: 5, 
      proveedor: 'Global Connect', 
      sitio: 'CTG-005', 
      etapa: 1, 
      status: 'Pendiente', 
      fecha: '2025-01-11',
      auditor: 'Roberto Silva',
      score: null
    }
  ],

  alertas: [
    {
      id: 1,
      tipo: 'error',
      titulo: 'Auditorías Retrasadas',
      mensaje: '3 auditorías exceden el tiempo límite',
      count: 3,
      prioridad: 'alta'
    },
    {
      id: 2,
      tipo: 'warning',
      titulo: 'Pendientes de Revisión',
      mensaje: '7 auditorías esperan aprobación',
      count: 7,
      prioridad: 'media'
    },
    {
      id: 3,
      tipo: 'success',
      titulo: 'Score Mejorado',
      mensaje: '+3% en calificaciones promedio',
      count: null,
      prioridad: 'baja'
    }
  ]
};

// Servicio para obtener métricas del dashboard
export const dashboardService = {
  // Obtener todas las métricas del dashboard
  async getDashboardData(timeRange = '30d') {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay();
      
      // Simular variación de datos según timeRange
      const variaciones = {
        '7d': { factor: 0.3, auditorias: 8 },
        '30d': { factor: 1, auditorias: 24 },
        '90d': { factor: 2.8, auditorias: 67 },
        '1y': { factor: 12, auditorias: 288 }
      };
      
      const variacion = variaciones[timeRange] || variaciones['30d'];
      
      return {
        ...mockDashboardData,
        metricas: {
          ...mockDashboardData.metricas,
          auditorias30d: variacion.auditorias,
          totalAuditorias: Math.floor(mockDashboardData.metricas.totalAuditorias * variacion.factor)
        }
      };
    }

    // Implementación real de la API
    try {
      const response = await fetch(`/api/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Obtener auditorías recientes
  async getAuditoriasRecientes(limit = 5) {
    if (USE_MOCK_DATA) {
      await simulateNetworkDelay(300, 700);
      return mockDashboardData.auditoriasRecientes.slice(0, limit);
    }

    try {
      const response = await fetch(`/api/dashboard/auditorias-recientes?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching auditorías recientes:', error);
      throw error;
    }
  }
};

export default dashboardService;