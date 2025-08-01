import React, { useEffect } from 'react';
import useNotificacionesStore from '../NotificacionesStore';
import { BellIcon, CheckIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const NotificacionesCenter = () => {
  const {
    notificaciones,
    noLeidas,
    loading,
    error,
    fetchNotificaciones
  } = useNotificacionesStore();

  useEffect(() => {
    fetchNotificaciones();
    // Configurar polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'alta':
        return 'border-l-red-500 bg-red-50';
      case 'media':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'baja':
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Centro de Notificaciones</h1>
                <p className="text-gray-600 mt-1">
                  {noLeidas > 0 ? `${noLeidas} notificación(es) sin leer` : 'Todas las notificaciones están al día'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchNotificaciones}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-red-600 mb-2">❌ Error</div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay notificaciones</p>
            </div>
          ) : (
            notificaciones.map((notificacion) => (
              <div
                key={notificacion.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${getPrioridadColor(notificacion.prioridad)} ${
                  !notificacion.leida ? 'ring-2 ring-blue-100' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="flex-shrink-0 mr-4">
                        {getIconoTipo(notificacion.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {notificacion.titulo}
                          </h3>
                          {!notificacion.leida && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Nuevo
                            </span>
                          )}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notificacion.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                            notificacion.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notificacion.prioridad}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2">
                          {notificacion.mensaje}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 mt-3">
                          <span>{formatearFecha(notificacion.fecha_creacion)}</span>
                          {notificacion.remitente && (
                            <>
                              <span className="mx-2">•</span>
                              <span>De: {notificacion.remitente}</span>
                            </>
                          )}
                          {notificacion.enlace && (
                            <>
                              <span className="mx-2">•</span>
                              <a
                                href={notificacion.enlace}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Ver detalles
                              </a>
                            </>
                          )}
                        </div>
                        {notificacion.metadatos && Object.keys(notificacion.metadatos).length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                              <strong>Información adicional:</strong>
                              <pre className="mt-1 text-xs whitespace-pre-wrap">
                                {JSON.stringify(notificacion.metadatos, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificacionesCenter;
