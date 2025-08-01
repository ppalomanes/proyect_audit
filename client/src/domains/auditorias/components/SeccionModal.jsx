import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import useAuditoriaStore from '../AuditoriaStore';

const SeccionModal = ({ isOpen, onClose, auditoriaId }) => {
  const {
    seccionActual,
    documentos,
    loading,
    cargarDocumentoSeccion
  } = useAuditoriaStore();

  const [archivo, setArchivo] = useState(null);
  const [fechaRevision, setFechaRevision] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  // Obtener documento existente para esta sección
  const documentoExistente = documentos.find(d => d.seccion_id === seccionActual?.id);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setArchivo(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!archivo) {
      alert('Por favor seleccione un archivo');
      return;
    }

    if (!fechaRevision) {
      alert('Por favor indique la fecha de última revisión');
      return;
    }

    setSubiendo(true);
    
    try {
      const metadatos = {
        fecha_revision: fechaRevision,
        observaciones: observaciones.trim() || null
      };

      await cargarDocumentoSeccion(auditoriaId, seccionActual.id, archivo, metadatos);
      
      // Limpiar formulario y cerrar
      setArchivo(null);
      setFechaRevision('');
      setObservaciones('');
      onClose();
      
    } catch (error) {
      console.error('Error cargando documento:', error);
      alert(`Error cargando documento: ${error.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  const handleClose = () => {
    if (!subiendo) {
      setArchivo(null);
      setFechaRevision('');
      setObservaciones('');
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen || !seccionActual) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {seccionActual.nombre}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {seccionActual.obligatoria ? 'Sección obligatoria' : 'Sección opcional'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={subiendo}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Documento existente */}
            {documentoExistente && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      Documento ya cargado
                    </h4>
                    <p className="text-sm text-green-700">
                      {documentoExistente.nombre_archivo} - {formatFileSize(documentoExistente.tamano)}
                    </p>
                    <p className="text-xs text-green-600">
                      Cargado: {new Date(documentoExistente.fecha_carga).toLocaleDateString()}
                    </p>
                    {documentoExistente.observaciones && (
                      <p className="text-xs text-green-600 italic">
                        "{documentoExistente.observaciones}"
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-green-700">
                  Puede cargar un nuevo archivo para reemplazar el existente.
                </p>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              {/* Zona de drop */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documento *
                </label>
                <div
                  {...getRootProps()}
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
                    isDragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : archivo 
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="space-y-1 text-center">
                    {archivo ? (
                      <>
                        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{archivo.name}</p>
                          <p className="text-xs">{formatFileSize(archivo.size)}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Haga clic o arrastre para cambiar el archivo
                        </p>
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="text-sm text-gray-600">
                          <p>
                            <span className="font-medium text-blue-600 hover:text-blue-500">
                              Haga clic para subir
                            </span>{' '}
                            o arrastre y suelte
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Excel, Word, Imágenes hasta 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <input {...getInputProps()} />
                </div>
              </div>

              {/* Fecha de revisión */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de última revisión *
                </label>
                <input
                  type="date"
                  value={fechaRevision}
                  onChange={(e) => setFechaRevision(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Observaciones */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Agregue observaciones adicionales sobre este documento..."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={subiendo}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!archivo || !fechaRevision || subiendo}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {subiendo ? (
                    <>
                      <ClockIcon className="w-4 h-4 mr-2 animate-spin inline" />
                      Subiendo...
                    </>
                  ) : documentoExistente ? (
                    'Actualizar Documento'
                  ) : (
                    'Cargar Documento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeccionModal;
