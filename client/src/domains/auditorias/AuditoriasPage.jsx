import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  FunnelIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../auth/authStore';
import { auditoriasService } from './services/auditoriasService';

// Components
import AuditoriasList from './components/AuditoriasList';
import CreateAuditoriaModal from './components/CreateAuditoriaModal';
import AuditoriaDetail from './components/AuditoriaDetail';
import AuditoriaWorkflow from './components/AuditoriaWorkflow';
import AuditoriasStats from './components/AuditoriasStats';
import FiltersPanel from './components/FiltersPanel';

const AuditoriasPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('lista');
  const [auditorias, setAuditorias] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    estado: '',
    etapa: '',
    auditor: '',
    proveedor: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);

  useEffect(() => {
    loadAuditorias();
    loadStats();
  }, [filters, pagination.page]);

  const loadAuditorias = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await auditoriasService.getAuditorias(params);
      setAuditorias(response.auditorias);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages
      }));
    } catch (err) {
      setError('Error al cargar auditorías: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await auditoriasService.getEstadisticas();
      setStats(statsData);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const handleCreateAuditoria = async (data) => {
    try {
      await auditoriasService.createAuditoria(data);
      setShowCreateModal(false);
      loadAuditorias();
      loadStats();
    } catch (err) {
      setError('Error al crear auditoría: ' + err.message);
    }
  };

  const handleViewDetail = (auditoria) => {
    setSelectedAuditoria(auditoria);
    setShowDetail(true);
  };

  const handleViewWorkflow = (auditoria) => {
    setSelectedAuditoria(auditoria);
    setShowWorkflow(true);
  };

  const handleAvanzarEtapa = async (auditoriaId) => {
    try {
      await auditoriasService.avanzarEtapa(auditoriaId);
      loadAuditorias();
      loadStats();
    } catch (err) {
      setError('Error al avanzar etapa: ' + err.message);
    }
  };

  const tabs = [
    {
      id: 'lista',
      name: 'Lista de Auditorías',
      icon: ClipboardDocumentListIcon,
      count: pagination.total
    },
    {
      id: 'estadisticas',
      name: 'Estadísticas',
      icon: ChartBarIcon,
      count: stats?.total || 0
    }
  ];

  const canCreateAuditoria = ['ADMIN', 'SUPERVISOR'].includes(user?.rol);
  const canViewAllAuditorias = ['ADMIN', 'SUPERVISOR'].includes(user?.rol);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ClipboardDocumentListIcon className="w-8 h-8 mr-3 text-blue-600" />
              Módulo de Auditorías
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión completa del proceso de auditoría técnica con workflow automatizado
            </p>
          </div>
          {canCreateAuditoria && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nueva Auditoría</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">Total Auditorías</div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-yellow-600 text-sm font-medium">En Proceso</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.enProceso}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-sm font-medium">Completadas</div>
              <div className="text-2xl font-bold text-green-900">{stats.completadas}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-red-600 text-sm font-medium">Pendientes</div>
              <div className="text-2xl font-bold text-red-900">{stats.pendientes}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'lista' && (
          <div>
            {/* Filters */}
            <FiltersPanel 
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => setFilters({
                estado: '',
                etapa: '',
                auditor: '',
                proveedor: '',
                fechaDesde: '',
                fechaHasta: ''
              })}
            />

            {/* Lista de Auditorías */}
            <AuditoriasList
              auditorias={auditorias}
              loading={loading}
              error={error}
              pagination={pagination}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              onViewDetail={handleViewDetail}
              onViewWorkflow={handleViewWorkflow}
              onAvanzarEtapa={handleAvanzarEtapa}
              canViewAll={canViewAllAuditorias}
            />
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <AuditoriasStats stats={stats} />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAuditoriaModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAuditoria}
        />
      )}

      {showDetail && selectedAuditoria && (
        <AuditoriaDetail
          auditoria={selectedAuditoria}
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedAuditoria(null);
          }}
          onUpdate={loadAuditorias}
        />
      )}

      {showWorkflow && selectedAuditoria && (
        <AuditoriaWorkflow
          auditoria={selectedAuditoria}
          isOpen={showWorkflow}
          onClose={() => {
            setShowWorkflow(false);
            setSelectedAuditoria(null);
          }}
          onAvanzarEtapa={handleAvanzarEtapa}
        />
      )}
    </div>
  );
};

export default AuditoriasPage;