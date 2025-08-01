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
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/auditorias/nueva'),
      available: true,
    },
    {
      title: 'Procesar ETL',
      description: 'Cargar y validar parque informático',
      icon: CogIcon,
      color: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/etl'),
      available: true,
    },
    {
      title: 'Análisis IA',
      description: 'Evaluar documentos con IA local',
      icon: BeakerIcon,
      color: 'from-green-500 to-green-600',
      onClick: () => navigate('/ia-scoring'),
      available: true,
    },
    {
      title: 'Chat Colaborativo',
      description: 'Comunicación con proveedores',
      icon: ChatBubbleLeftRightIcon,
      color: 'from-pink-500 to-pink-600',
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
      completed: 'bg-green-500',
      success: 'bg-blue-500',
      pending: 'bg-yellow-500',
      error: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:bg-gray-800/60 hover:transform hover:scale-105 hover:shadow-2xl group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-xs text-green-400">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ action }) => (
    <div
      onClick={action.onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${action.color} rounded-xl p-6 text-white cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl ${
        action.available ? '' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="relative z-10">
        <action.icon className="w-8 h-8 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
        <p className="text-sm text-white/80">{action.description}</p>
      </div>
      <div className="absolute -top-4 -right-4 opacity-10">
        <action.icon className="w-24 h-24" />
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const Icon = activity.icon;
    return (
      <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-800/30 transition-all duration-200">
        <div className={`p-2 rounded-lg ${getStatusColor(activity.status)} bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${getStatusColor(activity.status).replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{activity.title}</p>
          <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
          <div className="flex items-center mt-2">
            <ClockIcon className="w-3 h-3 text-gray-500 mr-1" />
            <span className="text-xs text-gray-500">{activity.timestamp}</span>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {getGreeting()}, {user?.nombres || 'Usuario'}! 👋
              </h1>
              <p className="text-gray-400">
                Bienvenido al Portal de Auditorías Técnicas
              </p>
              <div className="flex items-center mt-2">
                <span className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                  {user?.rol || 'Usuario'}
                </span>
                <span className="mx-2 text-gray-600">•</span>
                <span className="text-sm text-gray-500">
                  Última conexión: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/auditorias/nueva')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:transform hover:scale-105 shadow-lg"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Auditoría
              </button>
              <button className="flex items-center px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-all duration-300">
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
            color="bg-blue-500"
          />
          <StatCard
            title="ETL Procesados"
            value={stats.etlProcesados}
            icon={CogIcon}
            trend="+8% esta semana"
            color="bg-purple-500"
          />
          <StatCard
            title="Análisis IA"
            value={stats.iaAnalisis}
            icon={BeakerIcon}
            trend="+24% este mes"
            color="bg-green-500"
          />
          <StatCard
            title="Usuarios Activos"
            value={stats.usuariosActivos}
            icon={UserGroupIcon}
            trend="+3 nuevos"
            color="bg-pink-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">⚡ Acciones Rápidas</h2>
              <BoltIcon className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <QuickActionCard key={index} action={action} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">🕐 Actividad Reciente</h2>
                <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700/50 rounded-full">
                  Tiempo real
                </span>
              </div>
              <div className="space-y-1">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Ver toda la actividad →
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            📊 Progreso del Sistema
            <span className="ml-2 text-xs text-green-400 px-2 py-1 bg-green-500/20 rounded-full">
              Operativo
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-lg font-semibold text-white mb-1">Backend</div>
              <div className="text-sm text-gray-400">100% Funcional</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-lg font-semibold text-white mb-1">ETL Engine</div>
              <div className="text-sm text-gray-400">Operativo</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-lg font-semibold text-white mb-1">IA Local</div>
              <div className="text-sm text-gray-400">Ollama Ready</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-purple-500 h-2 rounded-full w-4/5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CpuChipIcon className="w-5 h-5 mr-2 text-blue-400" />
              Estado del Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">API Backend</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Base de Datos</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">Conectada</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Ollama IA</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">Disponible</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">ETL Processor</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">Operativo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-purple-400" />
              Métricas Rápidas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Auditorías Completadas</span>
                <span className="text-sm font-medium text-white">{stats.completadas}/{stats.totalAuditorias}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Tasa de Éxito ETL</span>
                <span className="text-sm font-medium text-green-400">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Tiempo Prom. Proceso</span>
                <span className="text-sm font-medium text-blue-400">3.4 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Uptime del Sistema</span>
                <span className="text-sm font-medium text-green-400">99.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="bg-gray-800/20 backdrop-blur-xl border border-gray-700/30 rounded-xl p-4">
            <div className="text-sm text-gray-400">
              Portal de Auditorías Técnicas v1.0.0 • 
              Desarrollado con React + Node.js + MySQL + Ollama IA • 
              <span className="text-green-400">Sistema 100% Operativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;