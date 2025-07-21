import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  CalendarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

// Componente de Métrica con animación
const MetricCard = ({ title, value, change, changeType, icon: Icon, color = 'blue' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600', 
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-200 p-6
      transform transition-all duration-500 ease-out
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      hover:shadow-md hover:-translate-y-1
    `}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          
          {change && (
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
              <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        
        <div className={`
          w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]}
          flex items-center justify-center
        `}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Componente de Estado de Auditoría
const AuditStatusCard = ({ status, count, percentage, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  return (
    <div className={`
      ${colorClasses[color]} 
      rounded-lg border p-4 flex items-center justify-between
      transition-all duration-200 hover:shadow-sm
    `}>
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

// Componente de Auditoría Reciente
const RecentAuditItem = ({ audit }) => {
  const getStatusColor = (status) => {
    const colors = {
      'En Progreso': 'bg-blue-100 text-blue-800',
      'Completada': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Revisión': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getEtapaColor = (etapa) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-indigo-100 text-indigo-800',
      6: 'bg-purple-100 text-purple-800',
      7: 'bg-pink-100 text-pink-800',
      8: 'bg-green-100 text-green-800'
    };
    return colors[etapa] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-150">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{audit.proveedor}</p>
            <p className="text-sm text-gray-500">{audit.sitio}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEtapaColor(audit.etapa)}`}>
          Etapa {audit.etapa}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
          {audit.status}
        </span>
      </div>
    </div>
  );
};

// Componente Principal del Dashboard
const DashboardPrincipal = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  // Datos mock para el dashboard
  const [dashboardData] = useState({
    metricas: {
      totalAuditorias: 156,
      auditorias30d: 24,
      changeAuditorias: '+12%',
      changeType: 'positive',
      
      proveedoresActivos: 89,
      changeProveedores: '+5%',
      
      tiempoPromedio: '14.5',
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
      { id: 1, proveedor: 'CallCenter Solutions', sitio: 'BOG-001', etapa: 3, status: 'En Progreso', fecha: '2025-01-15' },
      { id: 2, proveedor: 'TechSupport Pro', sitio: 'MED-002', etapa: 7, status: 'Revisión', fecha: '2025-01-14' },
      { id: 3, proveedor: 'Contact Express', sitio: 'CAL-003', etapa: 8, status: 'Completada', fecha: '2025-01-13' },
      { id: 4, proveedor: 'Service Direct', sitio: 'BAR-004', etapa: 2, status: 'En Progreso', fecha: '2025-01-12' },
      { id: 5, proveedor: 'Global Connect', sitio: 'CTG-005', etapa: 1, status: 'Pendiente', fecha: '2025-01-11' }
    ]
  });

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          
          {/* Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Principal</h1>
              <p className="text-gray-600 mt-1">
                Visión general del sistema de auditorías técnicas
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
              
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
                <EyeIcon className="h-4 w-4" />
                <span>Ver Reportes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Auditorías"
            value={dashboardData.metricas.totalAuditorias}
            change={dashboardData.metricas.changeAuditorias}
            changeType={dashboardData.metricas.changeType}
            icon={DocumentTextIcon}
            color="blue"
          />
          
          <MetricCard
            title="Proveedores Activos"
            value={dashboardData.metricas.proveedoresActivos}
            change={dashboardData.metricas.changeProveedores}
            changeType="positive"
            icon={UserGroupIcon}
            color="green"
          />
          
          <MetricCard
            title="Tiempo Promedio (días)"
            value={dashboardData.metricas.tiempoPromedio}
            change={dashboardData.metricas.changeTiempo}
            changeType="positive"
            icon={ClockIcon}
            color="yellow"
          />
          
          <MetricCard
            title="Score Promedio"
            value={`${dashboardData.metricas.scorePromedio}%`}
            change={dashboardData.metricas.changeScore}
            changeType="positive"
            icon={ChartBarIcon}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Estados de Auditorías */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Estados de Auditorías</h3>
                <InformationCircleIcon className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {dashboardData.estadosAuditorias.map((estado, index) => (
                  <AuditStatusCard key={index} {...estado} />
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold text-gray-900">
                    {dashboardData.estadosAuditorias.reduce((sum, estado) => sum + estado.count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Auditorías Recientes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Auditorías Recientes</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200">
                  Ver todas
                </button>
              </div>
              
              <div className="space-y-1">
                {dashboardData.auditoriasRecientes.map((audit) => (
                  <RecentAuditItem key={audit.id} audit={audit} />
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Última actualización: hace 5 minutos
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas y Notificaciones */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Auditorías Retrasadas</h4>
                  <p className="text-sm text-red-700 mt-1">3 auditorías exceden el tiempo límite</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Pendientes de Revisión</h4>
                  <p className="text-sm text-yellow-700 mt-1">7 auditorías esperan aprobación</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Score Mejorado</h4>
                  <p className="text-sm text-green-700 mt-1">+3% en calificaciones promedio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPrincipal;