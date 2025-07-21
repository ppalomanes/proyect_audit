import React from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const AuditoriasStats = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <p className="text-gray-500">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Auditorías</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completadas || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingDownIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En Proceso</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.enProceso || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendientes || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Estadísticas Detalladas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Por Estado</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Programadas</span>
                  <span className="text-sm font-medium">{stats.programadas || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">En progreso</span>
                  <span className="text-sm font-medium">{stats.enProgreso || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completadas</span>
                  <span className="text-sm font-medium">{stats.completadas || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Rendimiento</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tiempo promedio</span>
                  <span className="text-sm font-medium">{stats.tiempoPromedio || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tasa de éxito</span>
                  <span className="text-sm font-medium">{stats.tasaExito || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditoriasStats;