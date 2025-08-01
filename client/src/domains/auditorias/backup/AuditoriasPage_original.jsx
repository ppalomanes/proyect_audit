import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const AuditoriasPage = () => {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    busqueda: '',
    periodo: ''
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 20,
    total: 0
  });
  const [mostrarNuevaAuditoria, setMostrarNuevaAuditoria] = useState(false);

  // Cargar auditorías
  const cargarAuditorias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: paginacion.page,
        limit: paginacion.limit,
        ...filtros
      });

      const response = await fetch(`/api/auditorias?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuditorias(data.data);
        setPaginacion(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error cargando auditorías:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAuditorias();
  }, [paginacion.page, filtros]);

  const obtenerColorEstado = (estado) => {
    const colores = {
      'CONFIGURACION': 'bg-gray-100 text-gray-800',
      'NOTIFICACION': 'bg-blue-100 text-blue-800',
      'CARGA_PRESENCIAL': 'bg-yellow-100 text-yellow-800',
      'CARGA_PARQUE': 'bg-orange-100 text-orange-800',
      'VALIDACION_AUTOMATICA': 'bg-purple-100 text-purple-800',
      'REVISION_AUDITOR': 'bg-indigo-100 text-indigo-800',
      'NOTIFICACION_RESULTADOS': 'bg-green-100 text-green-800',
      'COMPLETADA': 'bg-green-200 text-green-900',
      'SUSPENDIDA': 'bg-red-100 text-red-800',
      'CANCELADA': 'bg-red-200 text-red-900'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'SUSPENDIDA':
      case 'CANCELADA':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calcularProgreso = (etapa) => {
    return Math.round((etapa / 8) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Auditorías Técnicas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestión completa del proceso de auditoría técnica
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setMostrarNuevaAuditoria(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Auditoría
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por código, proveedor..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="CONFIGURACION">Configuración</option>
              <option value="CARGA_PRESENCIAL">Carga Presencial</option>
              <option value="CARGA_PARQUE">Carga Parque</option>
              <option value="VALIDACION_AUTOMATICA">Validación</option>
              <option value="REVISION_AUDITOR">Revisión</option>
              <option value="COMPLETADA">Completada</option>
            </select>
          </div>

          {/* Filtro por período */}
          <div>
            <select
              value={filtros.periodo}
              onChange={(e) => setFiltros(prev => ({ ...prev, periodo: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Todos los períodos</option>
              <option value="2025-S1">2025-S1</option>
              <option value="2024-S2">2024-S2</option>
              <option value="2024-S1">2024-S1</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de auditorías */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando auditorías...</span>
          </div>
        ) : auditorias.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay auditorías
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comienza creando una nueva auditoría.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha Límite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Documentos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {auditorias.map((auditoria) => (
                  <tr key={auditoria.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {auditoria.codigo}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {auditoria.periodo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {auditoria.proveedor?.nombre || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(auditoria.estado)}`}>
                        {obtenerIconoEstado(auditoria.estado)}
                        <span className="ml-1">{auditoria.estado.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${calcularProgreso(auditoria.etapa_actual)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {calcularProgreso(auditoria.etapa_actual)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Etapa {auditoria.etapa_actual}/8
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatearFecha(auditoria.fecha_limite)}
                      </div>
                      {/* Indicador de días restantes */}
                      {auditoria.dias_restantes !== undefined && (
                        <div className={`text-xs ${
                          auditoria.dias_restantes < 5 ? 'text-red-500' : 
                          auditoria.dias_restantes < 10 ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {auditoria.dias_restantes > 0 ? 
                            `${auditoria.dias_restantes} días restantes` : 
                            'Vencida'
                          }
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {auditoria.estadisticas?.documentos_cargados || 0}
                        </div>
                        <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.location.href = `/auditorias/${auditoria.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Ver detalles"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {/* ✅ BOTÓN WIZARD INTEGRADO */}
                        {(['CARGA_PRESENCIAL', 'CARGA_PARQUE'].includes(auditoria.estado)) && (
                          <button
                            onClick={() => window.location.href = `/auditorias/${auditoria.id}/wizard`}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Abrir Wizard de Carga"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {paginacion.pages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPaginacion(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={paginacion.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginacion(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={paginacion.page === paginacion.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Mostrando <span className="font-medium">{((paginacion.page - 1) * paginacion.limit) + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(paginacion.page * paginacion.limit, paginacion.total)}
                </span> de{' '}
                <span className="font-medium">{paginacion.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {/* Implementar números de página aquí si es necesario */}
                <button
                  onClick={() => setPaginacion(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={paginacion.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                >
                  Anterior
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
                  {paginacion.page} de {paginacion.pages}
                </span>
                <button
                  onClick={() => setPaginacion(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={paginacion.page === paginacion.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Auditoría */}
      {mostrarNuevaAuditoria && (
        <NuevaAuditoriaModal 
          onClose={() => setMostrarNuevaAuditoria(false)}
          onSuccess={() => {
            setMostrarNuevaAuditoria(false);
            cargarAuditorias();
          }}
        />
      )}
    </div>
  );
};

// Componente modal para nueva auditoría (simplificado)
const NuevaAuditoriaModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    proveedor_id: '',
    auditor_principal_id: '',
    fecha_programada: '',
    alcance: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auditorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        console.error('Error creando auditoría');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Nueva Auditoría
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alcance
              </label>
              <textarea
                value={formData.alcance}
                onChange={(e) => setFormData(prev => ({ ...prev, alcance: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha Programada
              </label>
              <input
                type="date"
                value={formData.fecha_programada}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_programada: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Auditoría'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuditoriasPage;