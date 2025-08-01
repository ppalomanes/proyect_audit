import React, { useEffect, useState } from 'react';
import useBitacoraStore from '../BitacoraStore';
import { 
  CalendarIcon, 
  UserIcon, 
  ComputerDesktopIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const BitacoraViewer = () => {
  const {
    entradas,
    filtros,
    loading,
    error,
    pagination,
    setFiltros,
    fetchEntradas,
    exportarBitacora,
    limpiarFiltros
  } = useBitacoraStore();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    fetchEntradas();
  }, [filtros, pagination.page]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros({ [campo]: valor });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccionColor = (accion) => {
    const colores = {
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'UPLOAD_DOCUMENT': 'bg-blue-100 text-blue-800',
      'UPDATE_DATA': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'CREATE': 'bg-purple-100 text-purple-800',
      'VIEW': 'bg-indigo-100 text-indigo-800'
    };
    return colores[accion] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bitácora del Sistema</h1>
              <p className="text-gray-600 mt-1">
                Registro completo de actividades y cambios en el portal
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filtros
              </button>
              <button
                onClick={() => exportarBitacora('excel')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Filtros */}
        {mostrarFiltros && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio || ''}
                  onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={filtros.usuario}
                  onChange={(e) => handleFiltroChange('usuario', e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Entradas */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">❌ Error</div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : entradas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">📋</div>
              <p className="text-gray-600">No se encontraron entradas de bitácora</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Header de tabla */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Fecha/Hora</div>
                  <div className="col-span-2">Usuario</div>
                  <div className="col-span-2">Acción</div>
                  <div className="col-span-5">Detalles</div>
                </div>
              </div>

              {/* Filas de datos */}
              <div className="divide-y divide-gray-200">
                {entradas.map((entrada, index) => (
                  <div key={entrada.id || index} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatearFecha(entrada.fecha)}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {entrada.usuario_nombre}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccionColor(entrada.accion)}`}>
                          {entrada.accion}
                        </span>
                      </div>
                      <div className="col-span-5">
                        <div className="text-sm text-gray-600 truncate">
                          {entrada.detalles || entrada.descripcion || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BitacoraViewer;
