import React, { useState, useEffect } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ESTADOS_AUDITORIA, auditoriasService } from '../services/auditoriasService';

const FiltersPanel = ({ filters, onFiltersChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [auditores, setAuditores] = useState([]);

  useEffect(() => {
    loadProveedores();
    loadAuditores();
  }, []);

  const loadProveedores = async () => {
    try {
      const data = await auditoriasService.getProveedores();
      setProveedores(data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const loadAuditores = async () => {
    try {
      const data = await auditoriasService.getAuditores();
      setAuditores(data);
    } catch (error) {
      console.error('Error al cargar auditores:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const etapas = [
    { value: '0', label: 'Programada' },
    { value: '1', label: 'Etapa 1: Notificación' },
    { value: '2', label: 'Etapa 2: Carga de Documentos' },
    { value: '3', label: 'Etapa 3: Validación de Documentos' },
    { value: '4', label: 'Etapa 4: Análisis de Parque' },
    { value: '5', label: 'Etapa 5: Visita Presencial' },
    { value: '6', label: 'Etapa 6: Informe Preliminar' },
    { value: '7', label: 'Etapa 7: Revisión de Observaciones' },
    { value: '8', label: 'Etapa 8: Informe Final' }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
            hasActiveFilters 
              ? 'border-blue-300 bg-blue-50 text-blue-700' 
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Activos
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(ESTADOS_AUDITORIA).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select
                value={filters.etapa}
                onChange={(e) => handleFilterChange('etapa', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todas las etapas</option>
                {etapas.map((etapa) => (
                  <option key={etapa.value} value={etapa.value}>{etapa.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <select
                value={filters.proveedor}
                onChange={(e) => handleFilterChange('proveedor', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auditor</label>
              <select
                value={filters.auditor}
                onChange={(e) => handleFilterChange('auditor', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todos los auditores</option>
                {auditores.map((auditor) => (
                  <option key={auditor.id} value={auditor.id}>{auditor.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Filtros activos:</span>
                
                {filters.estado && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Estado: {ESTADOS_AUDITORIA[filters.estado]?.label}
                    <button onClick={() => handleFilterChange('estado', '')} className="ml-1 text-blue-600 hover:text-blue-800">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.etapa && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Etapa: {etapas.find(e => e.value === filters.etapa)?.label}
                    <button onClick={() => handleFilterChange('etapa', '')} className="ml-1 text-blue-600 hover:text-blue-800">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.proveedor && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Proveedor: {proveedores.find(p => p.id.toString() === filters.proveedor)?.nombre}
                    <button onClick={() => handleFilterChange('proveedor', '')} className="ml-1 text-blue-600 hover:text-blue-800">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.auditor && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Auditor: {auditores.find(a => a.id.toString() === filters.auditor)?.nombre}
                    <button onClick={() => handleFilterChange('auditor', '')} className="ml-1 text-blue-600 hover:text-blue-800">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.fechaDesde && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Desde: {new Date(filters.fechaDesde).toLocaleDateString('es-ES')}
                    <button onClick={() => handleFilterChange('fechaDesde', '')} className="ml-1 text-blue-600 hover:text-blue-800">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.fechaHasta && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Hasta: {new Date(filters.fechaHasta).toLocaleDateString('es-ES')}
                    <button onClick={() => handleFilterChange('fechaHasta', '')} className="ml-1 text-blue-600 hover:text-blue-800">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;