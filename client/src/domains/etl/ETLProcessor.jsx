import React, { useState, useEffect } from 'react';
import useETLStore from './etlStore';
import { ETLUploader, ETLProgress, ExcelValidator } from './components';
import {
  DocumentArrowUpIcon,
  CogIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CpuChipIcon,
  PlayIcon,
  ArrowPathIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  BoltIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

const ETLProcessor = () => {
  const [currentStep, setCurrentStep] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [processingConfig, setProcessingConfig] = useState({
    strict_mode: false,
    auto_fix: true,
    skip_validation: [],
    scoring_ia: true,
    notificaciones: true
  });

  const {
    uploadState,
    currentJob,
    metrics,
    validationRules,
    processFile,
    validateFile,
    fetchMetrics,
    fetchValidationRules,
    clearUploadState,
    clearCurrentJob
  } = useETLStore();

  const auditoriaId = 'demo-audit-2025';

  // Cargar configuración inicial
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchValidationRules();
        await fetchMetrics();
      } catch (error) {
        console.warn('No se pudo cargar configuración inicial:', error);
      }
    };
    
    loadInitialData();
  }, [fetchValidationRules, fetchMetrics]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    clearUploadState();
    setCurrentStep('upload');
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    clearUploadState();
    clearCurrentJob();
    setCurrentStep('upload');
  };

  const handleValidateOnly = async () => {
    if (!selectedFile) return;

    try {
      setCurrentStep('processing');
      const results = await validateFile(selectedFile, auditoriaId);
      setCurrentStep('validation-results');
    } catch (error) {
      console.error('Error validando archivo:', error);
      setCurrentStep('upload');
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    try {
      setCurrentStep('processing');
      const result = await processFile(selectedFile, auditoriaId, processingConfig);
      setCurrentStep('results');
    } catch (error) {
      console.error('Error procesando archivo:', error);
      setCurrentStep('upload');
    }
  };

  const handleStartNew = () => {
    setSelectedFile(null);
    clearUploadState();
    clearCurrentJob();
    setCurrentStep('upload');
  };

  // Estadísticas mock para demo
  const mockStats = {
    hardware_stats: {
      ram_promedio: 8.4,
      cpu_promedio: 2.8,
      ssd_porcentaje: 78
    },
    distribucion_por_sitio: {
      'Sede Principal': 89,
      'Sucursal Norte': 67,
      'Sucursal Sur': 45,
      'Centro Operativo': 44
    },
    os_distribution: {
      'Windows 10': 156,
      'Windows 11': 89
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          Procesamiento ETL - Parque Informático
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sube un archivo Excel o CSV con los datos del parque informático
        </p>
      </div>

      <ETLUploader
        auditoriaId={auditoriaId}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onProcessingComplete={() => setCurrentStep('results')}
      />

      {selectedFile && (
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleValidateOnly}
            disabled={uploadState.isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Solo Validar
          </button>
          <button
            onClick={handleProcessFile}
            disabled={uploadState.isUploading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <BoltIcon className="w-4 h-4" />
            Procesar Completo
          </button>
        </div>
      )}

      {/* Configuración de procesamiento */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <CogIcon className="w-4 h-4" />
          Configuración de Procesamiento
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={processingConfig.strict_mode}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                strict_mode: e.target.checked
              }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Modo estricto</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={processingConfig.auto_fix}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                auto_fix: e.target.checked
              }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-corrección</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={processingConfig.scoring_ia}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                scoring_ia: e.target.checked
              }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Scoring IA</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={processingConfig.notificaciones}
              onChange={(e) => setProcessingConfig(prev => ({
                ...prev,
                notificaciones: e.target.checked
              }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Notificaciones</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ArrowPathIcon className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          Procesando Archivo ETL
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Normalizando campos y aplicando reglas de validación...
        </p>
      </div>

      <ETLProgress jobId={currentJob?.job_id} />
      
      {currentJob && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Estado del Procesamiento
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">Job ID:</span>
              <span className="font-mono text-blue-800 dark:text-blue-200">{currentJob.job_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">Estado:</span>
              <span className="font-medium text-blue-800 dark:text-blue-200">{currentJob.estado}</span>
            </div>
            {currentJob.estimacion_tiempo && (
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Tiempo estimado:</span>
                <span className="text-blue-800 dark:text-blue-200">{currentJob.estimacion_tiempo}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          Procesamiento Completado
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          El archivo ha sido procesado exitosamente
        </p>
      </div>

      {/* Resumen de procesamiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-green-600" />
            <h4 className="text-sm font-medium text-green-900 dark:text-green-300">
              Registros Procesados
            </h4>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">245</p>
          <p className="text-xs text-green-700 dark:text-green-500">de 250 originales</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Score de Calidad
            </h4>
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">94%</p>
          <p className="text-xs text-blue-700 dark:text-blue-500">Excelente calidad</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
              Validaciones
            </h4>
          </div>
          <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">7</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-500">advertencias menores</p>
        </div>
      </div>

      {/* Estadísticas detalladas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Estadísticas del Parque Informático
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hardware Promedio</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>RAM:</span>
                <span className="font-medium">{mockStats.hardware_stats.ram_promedio} GB</span>
              </div>
              <div className="flex justify-between">
                <span>CPU:</span>
                <span className="font-medium">{mockStats.hardware_stats.cpu_promedio} GHz</span>
              </div>
              <div className="flex justify-between">
                <span>SSD:</span>
                <span className="font-medium">{mockStats.hardware_stats.ssd_porcentaje}%</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Distribución por Sitio</h5>
            <div className="space-y-2 text-sm">
              {Object.entries(mockStats.distribucion_por_sitio).map(([sitio, cantidad]) => (
                <div key={sitio} className="flex justify-between">
                  <span>{sitio}:</span>
                  <span className="font-medium">{cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={handleStartNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Procesar Nuevo Archivo
        </button>
        <button
          onClick={() => setCurrentStep('upload')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <CircleStackIcon className="w-8 h-8 text-blue-600" />
          Procesamiento ETL - Parque Informático
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Normalización y validación automática de inventario tecnológico
        </p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {[
            { key: 'upload', label: 'Subir Archivo', icon: DocumentArrowUpIcon },
            { key: 'processing', label: 'Procesando', icon: CogIcon },
            { key: 'results', label: 'Resultados', icon: CheckCircleIcon }
          ].map(({ key, label, icon: Icon }, index) => (
            <div key={key} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${currentStep === key 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : index < ['upload', 'processing', 'results'].indexOf(currentStep)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                }
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {label}
              </span>
              {index < 2 && (
                <div className={`ml-4 h-0.5 w-16 ${
                  index < ['upload', 'processing', 'results'].indexOf(currentStep)
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'processing' && renderProcessingStep()}
        {currentStep === 'results' && renderResultsStep()}
        {currentStep === 'validation-results' && renderResultsStep()}
      </div>
    </div>
  );
};

export default ETLProcessor;