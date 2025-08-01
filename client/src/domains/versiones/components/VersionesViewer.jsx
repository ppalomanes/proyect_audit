import React, { useEffect, useState } from 'react';
import useVersionesStore from '../VersionesStore';
import { DocumentIcon, ClockIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const VersionesViewer = () => {
  const {
    documentos,
    versiones,
    documentoSeleccionado,
    loading,
    error,
    setDocumentoSeleccionado,
    fetchDocumentos,
    fetchVersionesDocumento,
    descargarVersion
  } = useVersionesStore();

  const [auditoria_id, setAuditoria_id] = useState('');

  useEffect(() => {
    fetchDocumentos();
  }, []);

  const handleSeleccionarDocumento = (documento) => {
    setDocumentoSeleccionado(documento);
    fetchVersionesDocumento(documento.id);
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

  const formatearTamaño = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Control de Versiones</h1>
              <p className="text-gray-600 mt-1">
                Gestión y seguimiento de versiones de documentos
              </p>
            </div>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="ID de Auditoría (opcional)"
                value={auditoria_id}
                onChange={(e) => setAuditoria_id(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                onClick={() => fetchDocumentos(auditoria_id || null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Documentos */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Documentos</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {loading && documentos.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : documentos.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay documentos disponibles
                </div>
              ) : (
                documentos.map((documento) => (
                  <div
                    key={documento.id}
                    onClick={() => handleSeleccionarDocumento(documento)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      documentoSeleccionado?.id === documento.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <DocumentIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {documento.nombre_archivo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {documento.total_versiones} versión(es)
                        </p>
                        <p className="text-xs text-gray-500">
                          Último: {formatearFecha(documento.ultima_actualizacion)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lista de Versiones */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {documentoSeleccionado ? `Versiones de ${documentoSeleccionado.nombre_archivo}` : 'Seleccione un documento'}
              </h3>
            </div>

            {!documentoSeleccionado ? (
              <div className="p-12 text-center text-gray-500">
                <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Seleccione un documento para ver sus versiones</p>
              </div>
            ) : loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : versiones.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay versiones disponibles</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {versiones.map((version, index) => (
                  <div key={version.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-3 ${
                            index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            v{version.numero_version}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mr-3">
                              ACTUAL
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 mb-2">
                          {version.comentarios || 'Sin comentarios'}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatearFecha(version.fecha_creacion)}
                          </span>
                          <span>{formatearTamaño(version.tamaño_archivo || 0)}</span>
                          <span>por {version.usuario_nombre}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => descargarVersion && descargarVersion(version.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Descargar"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionesViewer;
