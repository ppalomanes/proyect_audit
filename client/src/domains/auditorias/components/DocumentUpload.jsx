// DocumentUpload.jsx - Componente para carga de documentos por sección
import React, { useState, useRef } from 'react';
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  TableCellsIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const DocumentUpload = ({ seccion, completado, onUpload, disabled }) => {
  const [archivo, setArchivo] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // Tipos de archivo permitidos por sección
  const getTiposPermitidos = () => {
    switch (seccion.id) {
      case 'CUARTO_TECNOLOGIA':
      case 'FOTOGRAFIAS_VISITA':
        return '.jpg,.jpeg,.png,.pdf';
      case 'PARQUE_INFORMATICO':
      case 'HARDWARE_SOFTWARE':
        return '.xlsx,.xls,.csv';
      default:
        return '.pdf,.jpg,.jpeg,.png';
    }
  };

  const getIconoTipo = () => {
    switch (seccion.id) {
      case 'CUARTO_TECNOLOGIA':
      case 'FOTOGRAFIAS_VISITA':
        return PhotoIcon;
      case 'PARQUE_INFORMATICO':
      case 'HARDWARE_SOFTWARE':
        return TableCellsIcon;
      default:
        return DocumentIcon;
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo excede el tamaño máximo de 50MB');
      return;
    }
    
    setArchivo(file);
  };

  const handleUpload = async () => {
    if (!archivo) return;
    
    setUploading(true);
    try {
      await onUpload(archivo, observaciones);
      setArchivo(null);
      setObservaciones('');
    } catch (error) {
      console.error('Error en upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const eliminarArchivo = () => {
    setArchivo(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const TipoIcono = getIconoTipo();

  return (
    <div className={`
      bg-card rounded-lg p-4 border transition-all
      ${completado 
        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
        : seccion.obligatorio
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
          : 'border-primary hover:border-accent'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}>
      {/* Header de la sección */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-primary flex items-center">
            {seccion.nombre}
            {seccion.obligatorio && (
              <span className="ml-2 text-red-500">*</span>
            )}
            {completado && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
            )}
          </h4>
          <p className="text-sm text-secondary mt-1">
            {seccion.descripcion}
          </p>
        </div>
        <TipoIcono className="w-6 h-6 text-muted flex-shrink-0" />
      </div>

      {/* Estado según completitud */}
      {completado ? (
        <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-3">
          <div className="flex items-center text-green-700 dark:text-green-300">
            <CheckIcon className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Documento cargado</span>
          </div>
        </div>
      ) : (
        <>
          {/* Zona de carga */}
          {!archivo ? (
            <div
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                transition-all
                ${dragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }
                ${disabled ? 'cursor-not-allowed' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !disabled && inputRef.current?.click()}
            >
              <DocumentArrowUpIcon className="w-8 h-8 mx-auto mb-2 text-muted" />
              <p className="text-sm text-secondary mb-1">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted">
                Formatos permitidos: {getTiposPermitidos().replace(/,/g, ', ')}
              </p>
              <p className="text-xs text-muted">
                Tamaño máximo: 50MB
              </p>
              
              <input
                ref={inputRef}
                type="file"
                accept={getTiposPermitidos()}
                onChange={handleChange}
                disabled={disabled}
                className="hidden"
              />
            </div>
          ) : (
            /* Vista previa del archivo */
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <DocumentIcon className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium text-primary truncate">
                    {archivo.name}
                  </span>
                  <span className="text-xs text-muted ml-2 flex-shrink-0">
                    ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={eliminarArchivo}
                  className="ml-2 p-1 hover:bg-card rounded transition-colors"
                  title="Eliminar archivo"
                >
                  <XMarkIcon className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          )}

          {/* Campo de observaciones */}
          {archivo && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-primary mb-1">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Agregue cualquier observación relevante..."
                className="w-full px-3 py-2 bg-card border border-primary rounded-lg 
                         text-primary placeholder-muted focus:outline-none focus:ring-2 
                         focus:ring-blue-500 resize-none transition-all"
                rows="2"
                disabled={disabled || uploading}
              />
            </div>
          )}

          {/* Botón de carga */}
          {archivo && (
            <button
              onClick={handleUpload}
              disabled={disabled || uploading}
              className={`
                mt-3 w-full py-2 px-4 rounded-lg font-medium transition-all
                ${uploading
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cargando...
                </span>
              ) : (
                'Cargar Documento'
              )}
            </button>
          )}
        </>
      )}

      {/* Advertencia para obligatorios */}
      {!completado && seccion.obligatorio && (
        <div className="mt-3 flex items-start text-xs text-yellow-700 dark:text-yellow-300">
          <ExclamationTriangleIcon className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
          <span>Este documento es obligatorio para completar la auditoría</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
