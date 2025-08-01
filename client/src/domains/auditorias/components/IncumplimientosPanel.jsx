import React, { useState } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Eye,
  Cpu,
  HardDrive,
  Monitor,
  Wifi,
  X
} from 'lucide-react';
import { useAuditoriaStore } from '../AuditoriaStore';

const IncumplimientosPanel = ({ auditoriaId, isOpen = true, onToggle }) => {
  const { auditoriaActual, incumplimientos } = useAuditoriaStore();
  
  // Estados locales
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Obtener incumplimientos de la auditoria actual
  const getIncumplimientos = () => {
    if (!auditoriaActual?.id) return [];
    return incumplimientos[auditoriaActual.id] || [];
  };

  // Filtrar incumplimientos
  const incumplimientosFiltrados = () => {
    let items = getIncumplimientos();

    if (filtroTipo !== 'todos') {
      items = items.filter(item => {
        if (filtroTipo === 'criticos') return item.severidad === 'error';
        if (filtroTipo === 'advertencias') return item.severidad === 'warning';
        return true;
      });
    }

    if (filtroCategoria !== 'todos') {
      items = items.filter(item => item.categoria === filtroCategoria);
    }

    if (busqueda) {
      items = items.filter(item => 
        item.hostname?.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.problema?.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.campo?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    return items;
  };

  // Agrupar incumplimientos por categoría
  const agruparPorCategoria = () => {
    const items = incumplimientosFiltrados();
    const grupos = { hardware: [], software: [], conectividad: [], otros: [] };

    items.forEach(item => {
      const categoria = item.categoria || 'otros';
      if (grupos[categoria]) {
        grupos[categoria].push(item);
      } else {
        grupos.otros.push(item);
      }
    });

    return grupos;
  };

  const toggleExpansion = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (categoria) => {
    switch (categoria) {
      case 'hardware': return Cpu;
      case 'software': return Monitor;
      case 'conectividad': return Wifi;
      default: return HardDrive;
    }
  };

  const getSeverityColor = (severidad) => {
    switch (severidad) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const calcularStats = () => {
    const items = getIncumplimientos();
    return {
      total: items.length,
      criticos: items.filter(i => i.severidad === 'error').length,
      advertencias: items.filter(i => i.severidad === 'warning').length,
      info: items.filter(i => i.severidad === 'info').length
    };
  };

  const stats = calcularStats();
  const grupos = agruparPorCategoria();
  const totalFiltrados = incumplimientosFiltrados().length;

  if (!isOpen) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
        <button
          onClick={onToggle}
          className={`bg-white rounded-l-lg shadow-lg border border-r-0 p-3 transition-colors ${
            stats.total > 0 ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center space-y-1">
            <AlertTriangle size={20} />
            {stats.total > 0 && (
              <span className="text-xs font-bold">{stats.total}</span>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="bg-red-50 border-b border-red-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="font-semibold text-red-800">Incumplimientos</h3>
          </div>
          <button onClick={onToggle} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-red-100 p-2 rounded text-center">
            <div className="font-bold text-red-700">{stats.criticos}</div>
            <div className="text-red-600">Críticos</div>
          </div>
          <div className="bg-yellow-100 p-2 rounded text-center">
            <div className="font-bold text-yellow-700">{stats.advertencias}</div>
            <div className="text-yellow-600">Advertencias</div>
          </div>
          <div className="bg-blue-100 p-2 rounded text-center">
            <div className="font-bold text-blue-700">{stats.info}</div>
            <div className="text-blue-600">Información</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por hostname o problema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Filter className="absolute left-2 top-2.5 text-gray-400" size={16} />
          </div>

          <div className="flex space-x-2">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los tipos</option>
              <option value="criticos">Solo críticos</option>
              <option value="advertencias">Solo advertencias</option>
            </select>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas las categorías</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="conectividad">Conectividad</option>
            </select>
          </div>

          <div className="text-xs text-gray-600 text-center">
            Mostrando {totalFiltrados} de {stats.total} incumplimientos
          </div>
        </div>
      </div>

      {/* Lista de incumplimientos */}
      <div className="flex-1 overflow-y-auto">
        {totalFiltrados === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              {stats.total === 0 
                ? 'No hay incumplimientos registrados'
                : 'No hay incumplimientos que coincidan con los filtros'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {Object.entries(grupos).map(([categoria, items]) => {
              if (items.length === 0) return null;
              
              const IconComponent = getCategoryIcon(categoria);
              const categoriaId = `categoria-${categoria}`;
              const isExpanded = expandedItems.has(categoriaId);

              return (
                <div key={categoria} className="space-y-2">
                  <button
                    onClick={() => toggleExpansion(categoriaId)}
                    className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent size={16} className="text-gray-600" />
                      <span className="font-medium text-gray-800 capitalize">{categoria}</span>
                      <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">{items.length}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 ml-4">
                      {items.map((item, index) => {
                        const itemId = `${categoria}-${index}`;
                        const isItemExpanded = expandedItems.has(itemId);
                        const severityColor = getSeverityColor(item.severidad);

                        return (
                          <div
                            key={itemId}
                            className={`border rounded-lg overflow-hidden ${
                              severityColor === 'red' ? 'border-red-200 bg-red-50' :
                              severityColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                              'border-blue-200 bg-blue-50'
                            }`}
                          >
                            <button
                              onClick={() => toggleExpansion(itemId)}
                              className="w-full p-3 text-left hover:bg-white hover:bg-opacity-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    {severityColor === 'red' ? (
                                      <XCircle size={16} className="text-red-500" />
                                    ) : severityColor === 'yellow' ? (
                                      <AlertTriangle size={16} className="text-yellow-500" />
                                    ) : (
                                      <AlertCircle size={16} className="text-blue-500" />
                                    )}
                                    <span className={`font-medium text-sm ${
                                      severityColor === 'red' ? 'text-red-800' :
                                      severityColor === 'yellow' ? 'text-yellow-800' :
                                      'text-blue-800'
                                    }`}>
                                      {item.hostname || `Equipo ${index + 1}`}
                                    </span>
                                  </div>
                                  <p className={`text-xs ${
                                    severityColor === 'red' ? 'text-red-700' :
                                    severityColor === 'yellow' ? 'text-yellow-700' :
                                    'text-blue-700'
                                  }`}>
                                    {item.problema || item.mensaje}
                                  </p>
                                </div>
                                {isItemExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </div>
                            </button>

                            {isItemExpanded && (
                              <div className="px-3 pb-3 border-t border-white border-opacity-50">
                                <div className="mt-2 space-y-2 text-xs">
                                  {item.campo && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Campo:</span>
                                      <span className="font-medium">{item.campo}</span>
                                    </div>
                                  )}
                                  {item.valor_actual && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Valor actual:</span>
                                      <span className="font-medium">{item.valor_actual}</span>
                                    </div>
                                  )}
                                  {item.valor_requerido && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Requerido:</span>
                                      <span className="font-medium text-green-600">{item.valor_requerido}</span>
                                    </div>
                                  )}
                                  {item.recomendacion && (
                                    <div className="mt-2 p-2 bg-white bg-opacity-50 rounded">
                                      <span className="text-gray-600">Recomendación:</span>
                                      <p className="mt-1 text-gray-700">{item.recomendacion}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      {stats.total > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`/api/auditorias/${auditoriaId}/incumplimientos/export`, '_blank')}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Exportar</span>
            </button>
            <button
              onClick={() => window.open(`/auditorias/${auditoriaId}/incumplimientos/detalle`, '_blank')}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <Eye size={16} />
              <span>Ver Detalle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncumplimientosPanel;
