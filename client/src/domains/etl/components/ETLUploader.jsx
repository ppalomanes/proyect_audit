// ETLUploader.jsx - Componente principal para upload y procesamiento ETL
// Portal de Auditorías Técnicas

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  DocumentCheckIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import useETLStore from '../etlStore';
import etlService from '../services/etlService';

const ETLUploader = ({ auditoriaId, onProcessingComplete }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [processingConfig, setProcessingConfig] = useState({
    strict_mode: false,
    auto_fix: true,
    skip_validation: [],
    scoring_ia: true,
    notificaciones: true
  });

  const {
    uploadState,
    setUploadFile,
    validateFile,
    processFile,
    clearUploadState
  } = useETLStore();

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Validar tipo de archivo
    if (!etlService.validateFileType(file)) {
      alert('Tipo de archivo no soportado. Use archivos .xlsx, .xls o .csv');
      return;
    }

    // Validar tamaño (50MB máximo)
    if (file.size > 50 * 1024 * 1024) {
      alert('Archivo demasiado grande. Máximo 50MB permitido.');
      return;
    }

    setUploadFile(file);

    // Auto-validar el archivo
    try {
      await validateFile(file, auditoriaId);
    } catch (error) {
      console.error('Error validando archivo:', error);
      alert('Error validando archivo: ' + error.message);
    }
  }, [auditoriaId, setUploadFile, validateFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: uploadState.isUploading
  });

  const handleProcess = async () => {
    if (!uploadState.file || !auditoriaId) return;

    try {
      const result = await processFile(uploadState.file, auditoriaId, processingConfig);
      
      if (onProcessingComplete) {
        onProcessingComplete(result);
      }
    } catch (error) {
      console.error('Error procesando archivo:', error);
      alert('Error procesando archivo: ' + error.message);
    }
  };

  const handleClear = () => {
    clearUploadState();
    setShowConfig(false);
  };

  const renderValidationResults = () => {
    const { validationResults } = uploadState;
    if (!validationResults) return null;

    return (
      <div className="mt-4 space-y-4">
        {/* Resumen de validación */}
        <div className={`p-4 rounded-lg border ${
          validationResults.archivo_valido 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            {validationResults.archivo_valido ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            )}
            <span className={`font-medium ${
              validationResults.archivo_valido ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {validationResults.archivo_valido 
                ? 'Archivo válido para procesamiento' 
                : 'Archivo con problemas detectados'
              }
            </span>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            {validationResults.total_registros} registros encontrados
          </div>
        </div>

        {/* Problemas detectados */}
        {validationResults.problemas_detectados?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Problemas Detectados:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {validationResults.problemas_detectados.map((problema, index) => (
                <li key={index}>• {problema}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sugerencias */}
        {validationResults.sugerencias_mejora?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Sugerencias de Mejora:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {validationResults.sugerencias_mejora.map((sugerencia, index) => (
                <li key={index}>• {sugerencia}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Campos encontrados */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">Campos Detectados:</h4>
          <div className="flex flex-wrap gap-2">
            {validationResults.campos_encontrados?.map((campo, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
              >
                {campo}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderConfigPanel = () => {
    if (!showConfig) return null;

    return (
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-4">Configuración de Procesamiento</h4>
        
        <div className="space-y-4">
          {/* Modo estricto */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Modo Estricto</label>
              <p className="text-xs text-gray-500">Detener procesamiento ante cualquier error</p>
            </div>
            <input
              type="checkbox"
              checked={processingConfig.strict_mode}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                strict_mode: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Auto-corrección */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-corrección</label>
              <p className="text-xs text-gray-500">Aplicar correcciones automáticas cuando sea posible</p>
            </div>
            <input
              type="checkbox"
              checked={processingConfig.auto_fix}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                auto_fix: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Scoring IA */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Scoring con IA</label>
              <p className="text-xs text-gray-500">Activar análisis inteligente post-procesamiento</p>
            </div>
            <input
              type="checkbox"
              checked={processingConfig.scoring_ia}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                scoring_ia: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Notificaciones */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Notificaciones</label>
              <p className="text-xs text-gray-500">Enviar notificaciones de progreso y completado</p>
            </div>
            <input
              type="checkbox"
              checked={processingConfig.notificaciones}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                notificaciones: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Área de upload */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadState.file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${uploadState.isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        
        {!uploadState.file ? (
          <div className="space-y-4">
            <CloudArrowUpIcon className="mx-auto w-12 h-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra el archivo de parque informático'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                o <span className="text-blue-600">haz clic para seleccionar</span>
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Formatos soportados: .xlsx, .xls, .csv (máximo 50MB)
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DocumentCheckIcon className="mx-auto w-12 h-12 text-green-500" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {etlService.getFileIcon(uploadState.file.name)} {uploadState.file.name}
              </p>
              <p className="text-sm text-gray-500">
                {etlService.formatFileSize(uploadState.file.size)}
              </p>
            </div>
            
            {/* Barra de progreso */}
            {uploadState.isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Botón para limpiar */}
        {uploadState.file && !uploadState.isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Resultados de validación */}
      {renderValidationResults()}

      {/* Botones de acción */}
      {uploadState.file && !uploadState.isUploading && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <CogIcon className="w-4 h-4" />
              <span>Configuración</span>
            </button>

            {uploadState.validationResults && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <InformationCircleIcon className="w-4 h-4" />
                <span>
                  {uploadState.validationResults.archivo_valido 
                    ? 'Listo para procesar' 
                    : 'Revisar problemas detectados'
                  }
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleProcess}
              disabled={!auditoriaId || (uploadState.validationResults && !uploadState.validationResults.archivo_valido)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Procesar Archivo
            </button>
          </div>
        </div>
      )}

      {/* Panel de configuración */}
      {renderConfigPanel()}

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Qué hace el procesamiento ETL?</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Analiza y normaliza automáticamente 28 campos de hardware y software</li>
              <li>• Valida datos contra reglas de negocio configurables</li>
              <li>• Calcula scoring de calidad automático por categorías</li>
              <li>• Detecta y corrige inconsistencias cuando es posible</li>
              <li>• Genera reportes detallados de errores y sugerencias</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ETLUploader;