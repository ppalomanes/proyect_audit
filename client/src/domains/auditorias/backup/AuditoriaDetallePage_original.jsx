import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const AuditoriaDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auditoria, setAuditoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    cargarAuditoria();
    cargarDocumentos();
  }, [id]);

  const cargarAuditoria = async () => {
    try {
      const response = await fetch(`/api/auditorias/${id}?incluir_timeline=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuditoria(data.data);
      }
    } catch (error) {
      console.error('Error cargando auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDocumentos = async () => {
    try {
      const response = await fetch(`/api/auditorias/${id}/documentos?solo_actuales=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data.data.secciones);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
    }
  };

  const avanzarEtapa = async () => {
    try {
      const response = await fetch(`/api/auditorias/${id}/avanzar-etapa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        await cargarAuditoria();
      }
    } catch (error) {
      console.error('Error avanzando etapa:', error);
    }
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      'CONFIGURACION': 'bg-gray-100 text-gray-800 border-gray-200',
      'NOTIFICACION': 'bg-blue-100 text-blue-800 border-blue-200',
      'CARGA_PRESENCIAL': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CARGA_PARQUE': 'bg-orange-100 text-orange-800 border-orange-200',
      'VALIDACION_AUTOMATICA': 'bg-purple-100 text-purple-800 border-purple-200',
      'REVISION_AUDITOR': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'NOTIFICACION_RESULTADOS': 'bg-green-100 text-green-800 border-green-200',
      'COMPLETADA': 'bg-green-200 text-green-900 border-green-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!auditoria) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Auditoría no encontrada
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {auditoria.codigo}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {auditoria.proveedor?.nombre} • {auditoria.periodo}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* ✅ BOTÓN WIZARD INTEGRADO */}
          {(['CARGA_PRESENCIAL', 'CARGA_PARQUE'].includes(auditoria.estado)) && (
            <button
              onClick={() => navigate(`/auditorias/${id}/wizard`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <PencilSquareIcon className="w-4 h-4 mr-2" />
              Abrir Wizard de Carga
            </button>
          )}
          
          {auditoria.puede_avanzar_etapa && (
            <button
              onClick={avanzarEtapa}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
              <PlayIcon className="w-4 h-4 mr-2" />
              Avanzar Etapa
            </button>
          )}
        </div>
      </div>

      {/* Estado y progreso */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorEstado(auditoria.estado)}`}>
              {auditoria.estado.replace('_', ' ')}
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Etapa {auditoria.etapa_actual} de 8
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <div className="flex-1 mr-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${auditoria.progreso?.progreso_porcentaje || 0}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {auditoria.progreso?.progreso_porcentaje || 0}%
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Progreso general
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Fecha límite</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {formatearFecha(auditoria.fecha_limite)}
            </p>
            {auditoria.resumen?.dias_restantes !== undefined && (
              <p className={`text-sm ${
                auditoria.resumen.dias_restantes < 5 ? 'text-red-500' : 
                auditoria.resumen.dias_restantes < 10 ? 'text-yellow-500' : 
                'text-green-500'
              }`}>
                {auditoria.resumen.dias_restantes > 0 ? 
                  `${auditoria.resumen.dias_restantes} días restantes` : 
                  'Vencida'
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Estado del Workflow
        </h3>
        <div className="space-y-4">
          {[
            { etapa: 1, nombre: 'Configuración', estado: 'CONFIGURACION' },
            { etapa: 2, nombre: 'Notificación', estado: 'NOTIFICACION' },
            { etapa: 3, nombre: 'Carga Presencial', estado: 'CARGA_PRESENCIAL' },
            { etapa: 4, nombre: 'Carga Parque', estado: 'CARGA_PARQUE' },
            { etapa: 5, nombre: 'Validación Automática', estado: 'VALIDACION_AUTOMATICA' },
            { etapa: 6, nombre: 'Revisión Auditor', estado: 'REVISION_AUDITOR' },
            { etapa: 7, nombre: 'Notificación Resultados', estado: 'NOTIFICACION_RESULTADOS' },
            { etapa: 8, nombre: 'Completada', estado: 'COMPLETADA' }
          ].map((step) => {
            const isActive = auditoria.etapa_actual === step.etapa;
            const isCompleted = auditoria.etapa_actual > step.etapa;
            const isPending = auditoria.etapa_actual < step.etapa;

            return (
              <div key={step.etapa} className="flex items-center">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted ? 'bg-green-100 text-green-800' :
                  isActive ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    step.etapa
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-900 dark:text-blue-300' :
                    isCompleted ? 'text-green-900 dark:text-green-300' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.nombre}
                  </p>
                  {isActive && auditoria.progreso?.razon_bloqueo && (
                    <p className="text-xs text-red-500 mt-1">
                      {auditoria.progreso.razon_bloqueo}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isActive && (
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                  )}
                  {isCompleted && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Resumen', icon: ChartBarIcon },
              { id: 'documentos', name: 'Documentos', icon: DocumentTextIcon },
              { id: 'timeline', name: 'Timeline', icon: ClockIcon },
              { id: 'chat', name: 'Comunicación', icon: ChatBubbleLeftRightIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documentos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {auditoria.resumen?.documentos?.total_cargados || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Validaciones</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {auditoria.resumen?.validaciones?.exitosas || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ChartBarIcon className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {auditoria.score_general ? `${auditoria.score_general}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="w-8 h-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Días</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {auditoria.resumen?.dias_transcurridos || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información general */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Información General
                </h4>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Alcance</dt>
                    <dd className="text-sm text-gray-900 dark:text-white mt-1">{auditoria.alcance}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Fecha de inicio</dt>
                    <dd className="text-sm text-gray-900 dark:text-white mt-1">
                      {formatearFecha(auditoria.fecha_inicio)}
                    </dd>
                  </div>
                  {auditoria.observaciones && (
                    <div className="md:col-span-2">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Observaciones</dt>
                      <dd className="text-sm text-gray-900 dark:text-white mt-1">{auditoria.observaciones}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Documentos de Auditoría
                </h4>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                  <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                  Cargar Documento
                </button>
              </div>
              
              <div className="grid gap-4">
                {documentos.map((seccion) => (
                  <div key={seccion.seccion} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {seccion.nombre}
                          {seccion.obligatorio && (
                            <span className="ml-2 text-xs text-red-500">*Obligatorio</span>
                          )}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {seccion.descripcion}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {seccion.version_actual ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Cargado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {seccion.version_actual && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          Archivo: {seccion.version_actual.nombre_original} 
                          ({seccion.version_actual.tamaño_humano})
                        </p>
                        <p>
                          Versión: {seccion.version_actual.version} • 
                          Cargado: {formatearFecha(seccion.version_actual.fecha_carga)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Timeline de Eventos
              </h4>
              
              {auditoria.timeline && auditoria.timeline.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {auditoria.timeline.map((evento, index) => (
                      <li key={evento.id}>
                        <div className="relative pb-8">
                          {index !== auditoria.timeline.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className="relative flex space-x-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                              <ClockIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {evento.descripcion}
                                </p>
                                {evento.seccion && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Sección: {evento.seccion}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {formatearFecha(evento.fecha)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No hay eventos registrados aún.
                </p>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Sistema de comunicación
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                La funcionalidad de chat estará disponible próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditoriaDetallePage;