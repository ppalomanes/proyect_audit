import React, { useState, useEffect } from 'react';
import useAuthStore from './domains/auth/authStore';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentCheckIcon,
  CogIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PlusIcon,
  EyeIcon,
  BoltIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAuditorias: 12,
    completadas: 8,
    enProceso: 3,
    pendientes: 1,
    etlProcesados: 156,
    iaAnalisis: 89,
    usuariosActivos: 24,
  });

  const [recentActivities] = useState([
    {
      id: 1,
      type: 'auditoria',
      title: 'Auditoría TechCorp completada',
      description: 'Proceso de 8 etapas finalizado exitosamente',
      timestamp: '2 horas ago',
      status: 'completed',
      icon: CheckCircleIcon,
    },
    {
      id: 2,
      type: 'etl',
      title: 'ETL CallCenter Solutions procesado',
      description: '245 equipos validados y normalizados',
      timestamp: '4 horas ago',
      status: 'success',
      icon: CogIcon,
    },
    {
      id: 3,
      type: 'ia',
      title: 'Análisis IA completado',
      description: '23 documentos procesados con IA local',
      timestamp: '6 horas ago',
      status: 'success',
      icon: BeakerIcon,
    },
    {
      id: 4,
      type: 'chat',
      title: 'Nueva conversación',
      description: 'Proveedor ContactPlus requiere clarificaciones',
      timestamp: '1 día ago',
      status: 'pending',
      icon: ChatBubbleLeftRightIcon,
    },
  ]);

  const quickActions = [
    {
      title: 'Nueva Auditoría',
      description: 'Iniciar proceso de auditoría técnica',
      icon: DocumentCheckIcon,
      gradient: 'bg-gradient-blue',
      onClick: () => navigate('/auditorias/nueva'),
      available: true,
    },
    {
      title: 'Procesar ETL',
      description: 'Cargar y validar parque informático',
      icon: CogIcon,
      gradient: 'bg-gradient-purple',
      onClick: () => navigate('/etl'),
      available: true,
    },
    {
      title: 'Análisis IA',
      description: 'Evaluar documentos con IA local',
      icon: BeakerIcon,
      gradient: 'bg-gradient-green',
      onClick: () => navigate('/ia-scoring'),
      available: true,
    },
    {
      title: 'Chat Colaborativo',
      description: 'Comunicación con proveedores',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'bg-gradient-pink',
      onClick: () => navigate('/chat'),
      available: true,
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Buenos días';
    if (hour < 18) return '☀️ Buenas tardes';
    return '🌙 Buenas noches';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-500',
      success: 'text-blue-500',
      pending: 'text-yellow-500',
      error: 'text-red-500',
    };
    return colors[status] || 'text-gray-500';
  };

  const getStatusBg = (status) => {
    const colors = {
      completed: 'bg-green-500',
      success: 'bg-blue-500', 
      pending: 'bg-yellow-500',
      error: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <div className="bg-card hover-bg-card border border-primary rounded-xl p-6 transition-all duration-300 hover:transform hover:scale-105 card-shadow-lg interactive-card group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-20 group-hover:bg-opacity-30 transition-all ${colorClass}`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ action }) => (
    <div
      onClick={action.onClick}
      className={`relative overflow-hidden ${action.gradient} rounded-xl p-6 text-white cursor-pointer transition-all duration-300 hover:transform hover:scale-105 card-shadow-lg interactive-card ${
        action.available ? '' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="relative z-10">
        <action.icon className="w-8 h-8 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
        <p className="text-sm text-white opacity-90">{action.description}</p>
      </div>
      <div className="absolute -top-4 -right-4 opacity-10">
        <action.icon className="w-24 h-24" />
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const Icon = activity.icon;
    return (
      <div className="flex items-start space-x-4 p-4 rounded-lg hover-bg-card transition-all duration-200">
        <div className={`p-2 rounded-lg bg-opacity-20 ${getStatusBg(activity.status)}`}>
          <Icon className={`w-5 h-5 ${getStatusColor(activity.status)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">{activity.title}</p>
          <p className="text-xs text-muted mt-1">{activity.description}</p>
          <div className="flex items-center mt-2">
            <ClockIcon className="w-3 h-3 text-muted mr-1" />
            <span className="text-xs text-muted">{activity.timestamp}</span>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${getStatusBg(activity.status)}`} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-primary p-6 transition-theme">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2 transition-theme">
                {getGreeting()}, {user?.nombres || 'Usuario'}! 👋
              </h1>
              <p className="text-secondary transition-theme">
                Bienvenido al Portal de Auditorías Técnicas
              </p>
              <div className="flex items-center mt-2">
                <span className="px-3 py-1 text-xs font-medium badge-info rounded-full">
                  {user?.rol || 'Usuario'}
                </span>
                <span className="mx-2 text-muted">•</span>
                <span className="text-sm text-muted">
                  Última conexión: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/auditorias/nueva')}
                className="flex items-center px-4 py-2 bg-gradient-blue text-white rounded-lg hover:transform hover:scale-105 transition-all duration-300 card-shadow"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Auditoría
              </button>
              <button className="flex items-center px-4 py-2 bg-secondary border border-primary text-secondary rounded-lg hover-bg-card transition-all duration-300">
                <EyeIcon className="w-4 h-4 mr-2" />
                Ver Todo
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Auditorías"
            value={stats.totalAuditorias}
            icon={DocumentCheckIcon}
            trend="+12% este mes"
            colorClass="bg-blue-500"
          />
          <StatCard
            title="ETL Procesados"
            value={stats.etlProcesados}
            icon={CogIcon}
            trend="+8% esta semana"
            colorClass="bg-purple-500"
          />
          <StatCard
            title="Análisis IA"
            value={stats.iaAnalisis}
            icon={BeakerIcon}
            trend="+24% este mes"
            colorClass="bg-green-500"
          />
          <StatCard
            title="Usuarios Activos"
            value={stats.usuariosActivos}
            icon={UserGroupIcon}
            trend="+3 nuevos"
            colorClass="bg-pink-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary transition-theme">⚡ Acciones Rápidas</h2>
              <BoltIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <QuickActionCard key={index} action={action} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-xl p-6 transition-theme">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary transition-theme">🕐 Actividad Reciente</h2>
                <span className="text-xs text-muted px-2 py-1 bg-accent rounded-full">
                  Tiempo real
                </span>
              </div>
              <div className="space-y-1">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-muted hover:text-primary transition-colors">
                Ver toda la actividad →
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="glass-effect rounded-xl p-6 mb-8 transition-theme">
          <h2 className="text-xl font-semibold text-primary mb-6 flex items-center transition-theme">
            📊 Progreso del Sistema
            <span className="ml-2 text-xs badge-success px-2 py-1 rounded-full">
              Operativo
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-card rounded-lg transition-theme">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-lg font-semibold text-primary mb-1 transition-theme">Backend</div>
              <div className="text-sm text-muted transition-theme">100% Funcional</div>
              <div className="w-full bg-accent rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full w-full transition-all"></div>
              </div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg transition-theme">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-lg font-semibold text-primary mb-1 transition-theme">ETL Engine</div>
              <div className="text-sm text-muted transition-theme">Operativo</div>
              <div className="w-full bg-accent rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full w-full transition-all"></div>
              </div>
            </div>
            <div className="text-center p-4 bg-card rounded-lg transition-theme">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-lg font-semibold text-primary mb-1 transition-theme">IA Local</div>
              <div className="text-sm text-muted transition-theme">Ollama Ready</div>
              <div className="w-full bg-accent rounded-full h-2 mt-2">
                <div className="bg-purple-500 h-2 rounded-full w-4/5 transition-all"></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-effect rounded-xl p-6 transition-theme">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center transition-theme">
              <CpuChipIcon className="w-5 h-5 mr-2 text-blue-500" />
              Estado del Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">API Backend</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-500">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">Base de Datos</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-500">Conectada</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">Ollama IA</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-500">Disponible</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">ETL Processor</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-500">Operativo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6 transition-theme">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center transition-theme">
              <ChartBarIcon className="w-5 h-5 mr-2 text-purple-500" />
              Métricas Rápidas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">Auditorías Completadas</span>
                <span className="text-sm font-medium text-primary transition-theme">{stats.completadas}/{stats.totalAuditorias}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">Tasa de Éxito ETL</span>
                <span className="text-sm font-medium text-green-500">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">Tiempo Prom. Proceso</span>
                <span className="text-sm font-medium text-blue-500">3.4 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary transition-theme">Uptime del Sistema</span>
                <span className="text-sm font-medium text-green-500">99.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="glass-effect rounded-xl p-4 transition-theme">
            <div className="text-sm text-muted transition-theme">
              Portal de Auditorías Técnicas v1.0.0 • 
              Desarrollado con React + Node.js + MySQL + Ollama IA • 
              <span className="text-green-500">Sistema 100% Operativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;