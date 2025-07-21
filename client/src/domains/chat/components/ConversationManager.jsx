import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Archive
} from 'lucide-react';

const ConversationManager = ({ onSelectConversation, selectedConversationId }) => {
  const [conversaciones, setConversaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: 'todas', // todas, auditoria, consulta, soporte
    estado: 'activas', // todas, activas, archivadas
    rol: 'todos' // todos, moderador, participante
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Datos mock para desarrollo
  const mockConversaciones = [
    {
      id: 1,
      titulo: 'Auditoría Proveedor XYZ - Q1 2025',
      auditoria_id: 123,
      tipo: 'AUDITORIA',
      estado: 'ACTIVA',
      mensajes_no_leidos: 3,
      ultimo_mensaje_fecha: new Date(),
      ultimo_mensaje: {
        contenido: 'Necesitamos revisar los documentos de infraestructura',
        usuario: 'Ana García'
      },
      mi_rol: 'PARTICIPANTE',
      total_mensajes: 45,
      participantes: [
        { id: 1, nombre: 'Ana García', rol: 'AUDITOR', online: true },
        { id: 2, nombre: 'Carlos Ruiz', rol: 'PROVEEDOR', online: false },
        { id: 3, nombre: 'María López', rol: 'SUPERVISOR', online: true }
      ]
    },
    {
      id: 2,
      titulo: 'Consulta Técnica - Equipos Bogotá',
      auditoria_id: 124,
      tipo: 'CONSULTA',
      estado: 'ACTIVA',
      mensajes_no_leidos: 0,
      ultimo_mensaje_fecha: new Date(Date.now() - 86400000),
      ultimo_mensaje: {
        contenido: 'Documentación aprobada',
        usuario: 'Sistema'
      },
      mi_rol: 'MODERADOR',
      total_mensajes: 12,
      participantes: [
        { id: 1, nombre: 'Ana García', rol: 'AUDITOR', online: true },
        { id: 4, nombre: 'Pedro Sánchez', rol: 'PROVEEDOR', online: true }
      ]
    },
    {
      id: 3,
      titulo: 'Seguimiento Post-Auditoría Q4 2024',
      auditoria_id: 125,
      tipo: 'AUDITORIA',
      estado: 'ARCHIVADA',
      mensajes_no_leidos: 0,
      ultimo_mensaje_fecha: new Date(Date.now() - 172800000),
      ultimo_mensaje: {
        contenido: 'Auditoría completada exitosamente',
        usuario: 'Sistema'
      },
      mi_rol: 'PARTICIPANTE',
      total_mensajes: 89,
      participantes: [
        { id: 1, nombre: 'Ana García', rol: 'AUDITOR', online: false },
        { id: 5, nombre: 'Laura Martín', rol: 'PROVEEDOR', online: false }
      ]
    },
    {
      id: 4,
      titulo: 'Soporte Técnico - Configuración VPN',
      auditoria_id: 126,
      tipo: 'SOPORTE',
      estado: 'ACTIVA',
      mensajes_no_leidos: 1,
      ultimo_mensaje_fecha: new Date(Date.now() - 3600000),
      ultimo_mensaje: {
        contenido: '¿Podrían validar la configuración actual?',
        usuario: 'Roberto Silva'
      },
      mi_rol: 'MODERADOR',
      total_mensajes: 8,
      participantes: [
        { id: 1, nombre: 'Ana García', rol: 'AUDITOR', online: true },
        { id: 6, nombre: 'Roberto Silva', rol: 'PROVEEDOR', online: false }
      ]
    }
  ];

  useEffect(() => {
    // Simular carga de conversaciones
    setIsLoading(true);
    setTimeout(() => {
      setConversaciones(mockConversaciones);
      setIsLoading(false);
    }, 1000);
  }, []);

  const conversacionesFiltradas = conversaciones.filter(conv => {
    // Filtro por búsqueda
    const matchesSearch = conv.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.ultimo_mensaje?.contenido.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tipo
    const matchesTipo = filtros.tipo === 'todas' || conv.tipo.toLowerCase() === filtros.tipo.toLowerCase();
    
    // Filtro por estado
    const matchesEstado = filtros.estado === 'todas' || 
                         (filtros.estado === 'activas' && conv.estado === 'ACTIVA') ||
                         (filtros.estado === 'archivadas' && conv.estado === 'ARCHIVADA');
    
    // Filtro por rol
    const matchesRol = filtros.rol === 'todos' || conv.mi_rol.toLowerCase() === filtros.rol.toLowerCase();
    
    return matchesSearch && matchesTipo && matchesEstado && matchesRol;
  });

  const formatTime = (fecha) => {
    const now = new Date();
    const messageDate = new Date(fecha);
    const diffTime = Math.abs(now - messageDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `${diffDays} días`;
    
    return messageDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'AUDITORIA':
        return <CheckCircle className="w-4 h-4" />;
      case 'CONSULTA':
        return <MessageSquare className="w-4 h-4" />;
      case 'SOPORTE':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'AUDITORIA':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300';
      case 'CONSULTA':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300';
      case 'SOPORTE':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'ACTIVA':
        return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300';
      case 'ARCHIVADA':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const estadisticas = {
    total: conversaciones.length,
    activas: conversaciones.filter(c => c.estado === 'ACTIVA').length,
    no_leidos: conversaciones.reduce((sum, c) => sum + c.mensajes_no_leidos, 0),
    mis_moderadas: conversaciones.filter(c => c.mi_rol === 'MODERADOR').length
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header con estadísticas */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Conversaciones
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg 
                     flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva</span>
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {estadisticas.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {estadisticas.activas}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Activas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {estadisticas.no_leidos}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">No leídos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {estadisticas.mis_moderadas}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Moderando</div>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Filtros */}
        <div className="flex space-x-2">
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            className="flex-1 px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="todas">Todos los tipos</option>
            <option value="auditoria">Auditoría</option>
            <option value="consulta">Consulta</option>
            <option value="soporte">Soporte</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
            className="flex-1 px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="todas">Todos los estados</option>
            <option value="activas">Activas</option>
            <option value="archivadas">Archivadas</option>
          </select>

          <select
            value={filtros.rol}
            onChange={(e) => setFiltros(prev => ({ ...prev, rol: e.target.value }))}
            className="flex-1 px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="todos">Todos los roles</option>
            <option value="moderador">Moderador</option>
            <option value="participante">Participante</option>
          </select>
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando conversaciones...</p>
          </div>
        ) : conversacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No hay conversaciones</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera conversación'}
            </p>
          </div>
        ) : (
          conversacionesFiltradas.map((conversacion) => (
            <div
              key={conversacion.id}
              onClick={() => onSelectConversation(conversacion)}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer 
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedConversationId === conversacion.id 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-r-4 border-r-purple-500' 
                  : ''
              }`}
            >
              {/* Header de la conversación */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1 flex-1">
                  {conversacion.titulo}
                </h3>
                <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                  {conversacion.mensajes_no_leidos > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                      {conversacion.mensajes_no_leidos > 99 ? '99+' : conversacion.mensajes_no_leidos}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(conversacion.ultimo_mensaje_fecha)}
                  </span>
                </div>
              </div>

              {/* Último mensaje */}
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                <span className="font-medium">{conversacion.ultimo_mensaje?.usuario}: </span>
                {conversacion.ultimo_mensaje?.contenido || 'Sin mensajes'}
              </p>

              {/* Metadatos y badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getTipoColor(conversacion.tipo)}`}>
                    {getTipoIcon(conversacion.tipo)}
                    <span>{conversacion.tipo}</span>
                  </span>
                  
                  <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(conversacion.estado)}`}>
                    {conversacion.estado === 'ACTIVA' ? (
                      <Clock className="w-3 h-3 inline mr-1" />
                    ) : (
                      <Archive className="w-3 h-3 inline mr-1" />
                    )}
                    {conversacion.estado}
                  </span>

                  <span className={`px-2 py-1 rounded-full text-xs ${
                    conversacion.mi_rol === 'MODERADOR'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  }`}>
                    {conversacion.mi_rol}
                  </span>
                </div>

                {/* Info adicional */}
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{conversacion.participantes?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{conversacion.total_mensajes}</span>
                  </div>
                  <span>#{conversacion.auditoria_id}</span>
                </div>
              </div>

              {/* Indicador de participantes online */}
              {conversacion.participantes?.some(p => p.online) && (
                <div className="flex items-center space-x-1 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {conversacion.participantes.filter(p => p.online).length} en línea
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal para crear conversación */}
      {showCreateModal && (
        <CreateConversationModal
          onClose={() => setShowCreateModal(false)}
          onConversationCreated={(newConv) => {
            setConversaciones(prev => [newConv, ...prev]);
            setShowCreateModal(false);
            onSelectConversation(newConv);
          }}
        />
      )}
    </div>
  );
};

// Modal para crear nueva conversación
const CreateConversationModal = ({ onClose, onConversationCreated }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'AUDITORIA',
    auditoria_id: '',
    participantes: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simular creación de conversación
    const newConversation = {
      id: Date.now(),
      ...formData,
      estado: 'ACTIVA',
      mensajes_no_leidos: 0,
      ultimo_mensaje_fecha: new Date(),
      ultimo_mensaje: null,
      mi_rol: 'MODERADOR',
      total_mensajes: 0,
      participantes: []
    };

    onConversationCreated(newConversation);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Nueva Conversación
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Auditoría Proveedor ABC - Q1 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="AUDITORIA">Auditoría</option>
              <option value="CONSULTA">Consulta</option>
              <option value="SOPORTE">Soporte</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID de Auditoría
            </label>
            <input
              type="number"
              value={formData.auditoria_id}
              onChange={(e) => setFormData(prev => ({ ...prev, auditoria_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="123"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg 
                       text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
                       transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg 
                       hover:bg-purple-600 transition-colors"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConversationManager;