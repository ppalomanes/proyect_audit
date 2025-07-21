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

// Componente de Métrica con animación y variables CSS refinadas
const MetricCard = ({ title, value, change, changeType, icon: Icon, color = 'blue' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getGradientClasses = (color) => {
    const gradients = {
      blue: 'from-[var(--accent-tertiary)] to-[var(--accent-primary)]',
      green: 'from-[var(--success)] to-green-600',
      yellow: 'from-[var(--warning)] to-yellow-600',
      purple: 'from-[var(--accent-primary)] to-[var(--accent-secondary)]'
    };
    return gradients[color] || gradients.blue;
  };

  return (
    <div 
      className={`
        card rounded-xl p-6 transform transition-all duration-500 ease-out interactive
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
        boxShadow: '0 2px 8px var(--shadow-light)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p 
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {title}
          </p>
          <p 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </p>
          
          {change && (
            <div className="flex items-center mt-2">
              {changeType === 'positive' ? (
                <ArrowTrendingUpIcon 
                  className="h-4 w-4 mr-1" 
                  style={{ color: 'var(--success)' }}
                />
              ) : (
                <ArrowTrendingDownIcon 
                  className="h-4 w-4 mr-1" 
                  style={{ color: 'var(--error)' }}
                />
              )}
              <span 
                className="text-sm font-medium"
                style={{ 
                  color: changeType === 'positive' ? 'var(--success)' : 'var(--error)' 
                }}
              >
                {change}
              </span>
              <span 
                className="text-sm ml-1"
                style={{ color: 'var(--text-muted)' }}
              >
                vs mes anterior
              </span>
            </div>
          )}
        </div>
        
        <div className={`
          w-12 h-12 rounded-lg bg-gradient-to-br ${getGradientClasses(color)}
          flex items-center justify-center shadow-lg
        `}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Componente de Estado de Auditoría con variables CSS refinadas
const AuditStatusCard = ({ status, count, percentage, color }) => {
  const getColorStyles = (color) => {
    const styles = {
      blue: {
        backgroundColor: 'var(--info-bg)',
        color: 'var(--info)',
        borderColor: 'var(--info)'
      },
      green: {
        backgroundColor: 'var(--success-bg)',
        color: 'var(--success)',
        borderColor: 'var(--success)'
      },
      yellow: {
        backgroundColor: 'var(--warning-bg)',
        color: 'var(--warning)',
        borderColor: 'var(--warning)'
      },
      red: {
        backgroundColor: 'var(--error-bg)',
        color: 'var(--error)',
        borderColor: 'var(--error)'
      }
    };
    return styles[color] || styles.blue;
  };

  const colorStyles = getColorStyles(color);

  return (
    <div 
      className="rounded-lg border p-4 flex items-center justify-between transition-all duration-200 interactive"
      style={{
        backgroundColor: colorStyles.backgroundColor,
        color: colorStyles.color,
        borderColor: colorStyles.borderColor
      }}
    >
      <div>
        <p className="font-medium">{status}</p>
        <p className="text-2xl font-bold mt-1">{count}</p>
      </div>
      <div className="text-right">
        <div className="text-sm opacity-75">{percentage}%</div>
        <div 
          className="w-16 h-2 rounded-full mt-1 overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: 'currentColor'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Componente de Auditoría Reciente con variables CSS refinadas
const RecentAuditItem = ({ audit }) => {
  const getStatusBadge = (status) => {
    const badges = {
      'En Progreso': 'badge-info',
      'Completada': 'badge-success',
      'Pendiente': 'badge-warning',
      'Revisión': 'badge-error'
    };
    return badges[status] || 'badge-info';
  };

  const getEtapaBadge = (etapa) => {
    if (etapa <= 2) return 'badge-error';
    if (etapa <= 4) return 'badge-warning';
    if (etapa <= 6) return 'badge-info';
    return 'badge-success';
  };

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg transition-all duration-200 interactive"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <BuildingOfficeIcon 
              className="h-8 w-8" 
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
          <div>
            <p 
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {audit.proveedor}
            </p>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {audit.sitio}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <span className={`badge ${getEtapaBadge(audit.etapa)}`}>
          Etapa {audit.etapa}
        </span>
        <span className={`badge ${getStatusBadge(audit.status)}`}>
          {audit.status}
        </span>
      </div>
    </div>
  );
};

// Componente Principal del Dashboard con variables CSS refinadas
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
      <div 
        className="min-h-screen p-6"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="skeleton h-8 rounded w-64 mb-2"></div>
            <div className="skeleton h-4 rounded w-96"></div>
          </div>
          
          {/* Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div 
                key={i} 
                className="rounded-xl border p-6"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="skeleton h-4 rounded w-24 mb-2"></div>
                    <div className="skeleton h-8 rounded w-16 mb-2"></div>
                    <div className="skeleton h-4 rounded w-32"></div>
                  </div>
                  <div className="skeleton w-12 h-12 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Dashboard Principal
              </h1>
              <p 
                className="mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Visión general del sistema de auditorías técnicas
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus-visible"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="7d" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Últimos 7 días</option>
                <option value="30d" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Últimos 30 días</option>
                <option value="90d" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Últimos 90 días</option>
                <option value="1y" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Último año</option>
              </select>
              
              <button className="btn-primary flex items-center space-x-2">
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
            <div 
              className="card rounded-xl p-6"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
                boxShadow: '0 2px 8px var(--shadow-light)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Estados de Auditorías
                </h3>
                <InformationCircleIcon 
                  className="h-5 w-5" 
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
              
              <div className="space-y-4">
                {dashboardData.estadosAuditorias.map((estado, index) => (
                  <AuditStatusCard key={index} {...estado} />
                ))}
              </div>
              
              <div 
                className="mt-6 pt-4 border-t"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                  <span 
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {dashboardData.estadosAuditorias.reduce((sum, estado) => sum + estado.count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Auditorías Recientes */}
          <div className="lg:col-span-2">
            <div 
              className="card rounded-xl p-6"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
                boxShadow: '0 2px 8px var(--shadow-light)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Auditorías Recientes
                </h3>
                <button 
                  className="text-sm font-medium transition-colors duration-200 interactive"
                  style={{ color: 'var(--accent-primary)' }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--accent-primary)';
                  }}
                >
                  Ver todas
                </button>
              </div>
              
              <div className="space-y-1">
                {dashboardData.auditoriasRecientes.map((audit) => (
                  <RecentAuditItem key={audit.id} audit={audit} />
                ))}
              </div>
              
              <div 
                className="mt-6 pt-4 border-t"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <div className="flex items-center justify-between text-sm">
                  <div 
                    className="flex items-center"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Última actualización: hace 5 minutos
                  </div>
                  <button 
                    className="font-medium transition-colors duration-200 interactive"
                    style={{ color: 'var(--accent-primary)' }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--accent-primary)';
                    }}
                  >
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
            <div 
              className="rounded-lg border p-4"
              style={{
                backgroundColor: 'var(--error-bg)',
                borderColor: 'var(--error)',
                color: 'var(--error)'
              }}
            >
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium">Auditorías Retrasadas</h4>
                  <p className="text-sm mt-1 opacity-90">3 auditorías exceden el tiempo límite</p>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-lg border p-4"
              style={{
                backgroundColor: 'var(--warning-bg)',
                borderColor: 'var(--warning)',
                color: 'var(--warning)'
              }}
            >
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium">Pendientes de Revisión</h4>
                  <p className="text-sm mt-1 opacity-90">7 auditorías esperan aprobación</p>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-lg border p-4"
              style={{
                backgroundColor: 'var(--success-bg)',
                borderColor: 'var(--success)',
                color: 'var(--success)'
              }}
            >
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium">Score Mejorado</h4>
                  <p className="text-sm mt-1 opacity-90">+3% en calificaciones promedio</p>
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