import React from 'react';
import { useAuthStore } from './domains/auth/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();

  const navigateToETL = () => {
    window.location.href = '/etl';
  };

  const features = [
    {
      title: '🔄 Procesador ETL',
      description: 'Procesa archivos Excel/CSV del parque informático con validación automática',
      action: 'Ir al ETL',
      onClick: navigateToETL,
      available: true
    },
    {
      title: '🤖 Análisis IA',
      description: 'Análisis de documentos e imágenes con IA local (Ollama)',
      action: 'Próximamente',
      onClick: null,
      available: false
    },
    {
      title: '📋 Gestión Auditorías',
      description: 'Administrar el proceso completo de auditorías técnicas',
      action: 'Próximamente',
      onClick: null,
      available: false
    },
    {
      title: '💬 Chat Colaborativo',
      description: 'Sistema de mensajería entre auditores y proveedores',
      action: 'Próximamente',
      onClick: null,
      available: false
    },
    {
      title: '📊 Dashboards',
      description: 'Métricas y reportes ejecutivos de auditorías',
      action: 'Próximamente',
      onClick: null,
      available: false
    },
    {
      title: '👥 Gestión Usuarios',
      description: 'Administración de usuarios, roles y permisos',
      action: 'Próximamente',
      onClick: null,
      available: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏢 Portal de Auditorías Técnicas
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Bienvenido, <span className="font-semibold">{user?.nombres} {user?.apellidos}</span>
        </p>
        <div className="badge badge-info">
          {user?.rol}
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <div className="text-blue-400 text-2xl mr-4">🚀</div>
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Estado de Desarrollo</h2>
            <div className="text-blue-800 space-y-1">
              <div>✅ <strong>ETL Service:</strong> Completamente implementado y funcional</div>
              <div>✅ <strong>Autenticación:</strong> Sistema JWT con roles implementado</div>
              <div>✅ <strong>Base de datos:</strong> Modelos Sequelize completos</div>
              <div>🔄 <strong>IA Service:</strong> Próxima implementación</div>
              <div>📋 <strong>Gestión Auditorías:</strong> En roadmap</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div key={index} className={`card transition-all duration-200 ${feature.available ? 'hover:shadow-md cursor-pointer' : 'opacity-60'}`}>
            <div className="text-2xl mb-3">{feature.title.split(' ')[0]}</div>
            <h3 className="text-lg font-semibold mb-2">{feature.title.substring(2)}</h3>
            <p className="text-gray-600 mb-4 text-sm">{feature.description}</p>
            
            <button
              onClick={feature.onClick}
              disabled={!feature.available}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                feature.available 
                  ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {feature.action}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-12 card">
        <h2 className="text-xl font-semibold mb-4">⚡ Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={navigateToETL}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <div className="text-lg mb-1">📁 Procesar Archivo ETL</div>
            <div className="text-sm text-gray-600">Subir y procesar parque informático</div>
          </button>
          
          <button 
            disabled
            className="p-4 text-left border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
          >
            <div className="text-lg mb-1">📋 Nueva Auditoría</div>
            <div className="text-sm text-gray-600">Crear proceso de auditoría</div>
          </button>
          
          <button 
            disabled
            className="p-4 text-left border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
          >
            <div className="text-lg mb-1">📊 Ver Reportes</div>
            <div className="text-sm text-gray-600">Generar reportes ejecutivos</div>
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <div>Portal de Auditorías Técnicas v1.0.0</div>
        <div>Desarrollado con React + Node.js + MySQL + Ollama</div>
        <div className="mt-2">
          <span className="badge badge-success mr-2">Backend: Operativo</span>
          <span className="badge badge-success mr-2">ETL: Funcional</span>
          <span className="badge badge-warning">IA: En desarrollo</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
