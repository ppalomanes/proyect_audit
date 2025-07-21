import React from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { ESTADOS_AUDITORIA, formatearFecha } from '../services/auditoriasService';

const AuditoriasList = ({ 
  auditorias, 
  loading, 
  error, 
  pagination, 
  onPageChange, 
  onViewDetail, 
  onViewWorkflow, 
  onAvanzarEtapa,
  canViewAll 
}) => {
  
  const getEstadoBadge = (estado) => {
    const config = ESTADOS_AUDITORIA[estado] || { label: estado, color: 'gray' };
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      pink: 'bg-pink-100 text-pink-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
        {config.label}
      </span>
    );
  };

  const getEtapaProgress = (etapa_actual) => {
    const etapa = parseInt(etapa_actual) || 0;
    const percentage = (etapa / 8) * 100;
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const canAvanzarEtapa = (auditoria) => {
    return auditoria.etapa_actual < 8 && 
           !['COMPLETADA', 'CANCELADA'].includes(auditoria.estado);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">Error al cargar auditorías</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!auditorias.length) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay auditorías</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron auditorías con los filtros aplicados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Auditorías ({pagination.total})
        </h3>
        <p className="text-sm text-gray-500">
          Página {pagination.page} de {pagination.totalPages}
        </p>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-200">
        {auditorias.map((auditoria) => (
          <div key={auditoria.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {auditoria.codigo_auditoria}
                      </h4>
                      {getEstadoBadge(auditoria.estado)}
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-1" />
                        {auditoria.proveedor?.nombre || 'Sin proveedor'}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatearFecha(auditoria.fecha_programada)}
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs">
                          Etapa {auditoria.etapa_actual}/8
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 flex items-center space-x-3">
                      <div className="flex-1">
                        {getEtapaProgress(auditoria.etapa_actual)}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {Math.round((auditoria.etapa_actual / 8) * 100)}%
                      </span>
                    </div>

                    {/* Auditores */}
                    <div className="mt-2 text-xs text-gray-500">
                      <span>Auditor Principal: </span>
                      <span className="font-medium">
                        {auditoria.auditor_principal?.nombre || 'No asignado'}
                      </span>
                      {auditoria.auditor_secundario && (
                        <>
                          <span className="ml-3">Secundario: </span>
                          <span className="font-medium">
                            {auditoria.auditor_secundario.nombre}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onViewDetail(auditoria)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => onViewWorkflow(auditoria)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Ver workflow"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                </button>

                {canAvanzarEtapa(auditoria) && (
                  <button
                    onClick={() => onAvanzarEtapa(auditoria.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Avanzar etapa"
                  >
                    <PlayIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{pagination.total}</span>{' '}
                  resultados
                </p>
              </div>
              
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1;
                    const isCurrentPage = page === pagination.page;
                    
                    // Show only relevant pages
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= pagination.page - 1 && page <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === pagination.page - 2 ||
                      page === pagination.page + 2
                    ) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriasList;