import React, { useState, useEffect } from 'react';
import { useETLStore } from './etlStore';
import { ETLUploader, ETLProgress, ExcelValidator } from './components';

const ETLProcessor = () => {
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload', 'processing', 'results'
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [options, setOptions] = useState({
    strict_mode: false,
    auto_fix: true,
    skip_validation: []
  });

  const {
    processing,
    processResult,
    statistics,
    configuration,
    error,
    uploadAndProcess,
    getConfiguration,
    getStatistics,
    clearError,
    clearResults
  } = useETLStore();

  const auditoriaId = 'demo-audit-id'; // En implementación real, esto vendría de contexto

  useEffect(() => {
    getConfiguration();
  }, []);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    clearError();
    clearResults();
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setCurrentStep('upload');
    clearError();
    clearResults();
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setCurrentStep('processing');
    const newJobId = `etl_job_${Date.now()}`;
    setJobId(newJobId);

    const result = await uploadAndProcess(selectedFile, auditoriaId, options);
    
    if (result.success) {
      // Obtener estadísticas después del procesamiento
      await getStatistics(auditoriaId);
      setCurrentStep('results');
    } else {
      setCurrentStep('upload');
    }
  };

  const handleProcessingComplete = () => {
    setCurrentStep('results');
  };

  const handleProcessingError = (error) => {
    console.error('Error en procesamiento:', error);
    setCurrentStep('upload');
  };

  const handleClear = () => {
    setSelectedFile(null);
    setJobId(null);
    setCurrentStep('upload');
    clearResults();
    clearError();
  };

  const handleNewProcess = () => {
    handleClear();
  };

  const stepIndicators = [
    { 
      id: 'upload', 
      name: 'Cargar Archivo', 
      icon: '📁', 
      description: 'Seleccionar archivo Excel/CSV',
      completed: selectedFile !== null,
      active: currentStep === 'upload'
    },
    { 
      id: 'processing', 
      name: 'Procesamiento', 
      icon: '⚙️', 
      description: 'Análisis y validación ETL',
      completed: processResult !== null,
      active: currentStep === 'processing'
    },
    { 
      id: 'results', 
      name: 'Resultados', 
      icon: '📊', 
      description: 'Revisión de resultados',
      completed: processResult !== null && currentStep === 'results',
      active: currentStep === 'results'
    }
  ];

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            🔄 Procesador ETL - Parque Informático
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Carga, procesa y valida archivos Excel/CSV del inventario tecnológico con IA integrada
          </p>
        </div>

        {/* Step Indicators */}
        <div 
          className="card rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 2px 8px var(--shadow-light)'
          }}
        >
          <div className="flex items-center justify-between">
            {stepIndicators.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center text-center">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                      step.active ? 'animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor: step.completed 
                        ? 'var(--success)' 
                        : step.active 
                          ? 'var(--accent-primary)' 
                          : 'var(--bg-tertiary)',
                      color: step.completed || step.active ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {step.completed ? '✓' : step.icon}
                  </div>
                  <div className="mt-2">
                    <div 
                      className={`text-sm font-medium ${step.active ? 'font-semibold' : ''}`}
                      style={{
                        color: step.completed 
                          ? 'var(--success)' 
                          : step.active 
                            ? 'var(--accent-primary)' 
                            : 'var(--text-secondary)'
                      }}
                    >
                      {step.name}
                    </div>
                    <div 
                      className="text-xs mt-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < stepIndicators.length - 1 && (
                  <div 
                    className="flex-1 h-0.5 mx-4"
                    style={{
                      backgroundColor: stepIndicators[index + 1].completed 
                        ? 'var(--success)' 
                        : 'var(--border-primary)'
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div 
            className="border rounded-lg p-4"
            style={{
              backgroundColor: 'var(--error-bg)',
              borderColor: 'var(--error)'
            }}
          >
            <div className="flex">
              <div style={{ color: 'var(--error)' }}>⚠️</div>
              <div className="ml-3">
                <h3 
                  className="text-sm font-medium"
                  style={{ color: 'var(--error)' }}
                >
                  Error de Procesamiento
                </h3>
                <p 
                  className="mt-1 text-sm"
                  style={{ color: 'var(--error)' }}
                >
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            {currentStep === 'upload' && (
              <div 
                className="card rounded-xl p-6"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  boxShadow: '0 2px 8px var(--shadow-light)'
                }}
              >
                <h2 
                  className="text-xl font-semibold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  📁 Cargar Archivo de Parque Informático
                </h2>
                
                <ETLUploader
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  processing={processing}
                />

                {selectedFile && (
                  <div className="mt-6">
                    <div 
                      className="border-t pt-6"
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <h3 
                        className="text-sm font-medium mb-3"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        ⚙️ Opciones de Procesamiento
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={options.strict_mode}
                            onChange={(e) => setOptions({...options, strict_mode: e.target.checked})}
                            className="rounded focus:ring-2"
                            style={{
                              borderColor: 'var(--border-primary)',
                              accentColor: 'var(--accent-primary)'
                            }}
                          />
                          <span 
                            className="ml-2 text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Modo estricto (solo registros 100% válidos)
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={options.auto_fix}
                            onChange={(e) => setOptions({...options, auto_fix: e.target.checked})}
                            className="rounded focus:ring-2"
                            style={{
                              borderColor: 'var(--border-primary)',
                              accentColor: 'var(--accent-primary)'
                            }}
                          />
                          <span 
                            className="ml-2 text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Correcciones automáticas
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex space-x-4 mt-6">
                      <button
                        onClick={handleProcess}
                        disabled={!selectedFile || processing}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? '🔄 Procesando...' : '🚀 Procesar Archivo'}
                      </button>
                      
                      <button
                        onClick={handleClear}
                        className="btn-secondary"
                      >
                        🗑️ Limpiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Processing Section */}
            {currentStep === 'processing' && (
              <ETLProgress
                jobId={jobId}
                isProcessing={processing}
                onStatusUpdate={(status) => console.log('Status update:', status)}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            )}

            {/* Results Section */}
            {currentStep === 'results' && processResult && (
              <div 
                className="card rounded-xl p-6"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  boxShadow: '0 2px 8px var(--shadow-light)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    📊 Resultados del Procesamiento ETL
                  </h2>
                  
                  <button
                    onClick={handleNewProcess}
                    className="btn-primary text-sm"
                  >
                    🆕 Nuevo Procesamiento
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: 'var(--success-bg)',
                      borderColor: 'var(--success)'
                    }}
                  >
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--success)' }}
                    >
                      {processResult.registros_procesados || 0}
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: 'var(--success)' }}
                    >
                      Registros Procesados
                    </div>
                  </div>
                  
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: 'var(--info-bg)',
                      borderColor: 'var(--info)'
                    }}
                  >
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--info)' }}
                    >
                      {processResult.registros_originales || 0}
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: 'var(--info)' }}
                    >
                      Registros Originales
                    </div>
                  </div>
                  
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: 'rgba(123, 104, 238, 0.1)',
                      borderColor: 'var(--accent-primary)'
                    }}
                  >
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {processResult.validaciones?.scoreValidacion || 0}%
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      Score Validación
                    </div>
                  </div>

                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: 'var(--warning-bg)',
                      borderColor: 'var(--warning)'
                    }}
                  >
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--warning)' }}
                    >
                      {(processResult.validaciones?.errores?.length || 0) + (processResult.validaciones?.advertencias?.length || 0)}
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: 'var(--warning)' }}
                    >
                      Issues Detectados
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => {
                      console.log('Descargar resultados procesados');
                    }}
                  >
                    📥 Descargar Datos Procesados
                  </button>
                  
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => {
                      console.log('Exportar reporte de validación');
                    }}
                  >
                    📋 Exportar Reporte
                  </button>
                  
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => {
                      console.log('Enviar a análisis IA');
                    }}
                  >
                    🤖 Enviar a Análisis IA
                  </button>
                </div>

                {/* Processing Summary */}
                {processResult.validaciones && (
                  <div 
                    className="border-t pt-4"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <h3 
                      className="text-lg font-medium mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      📈 Resumen de Procesamiento
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {processResult.validaciones.errores?.length > 0 && (
                        <div 
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: 'var(--error-bg)',
                            borderColor: 'var(--error)'
                          }}
                        >
                          <div 
                            className="text-sm font-medium mb-1"
                            style={{ color: 'var(--error)' }}
                          >
                            ❌ Errores Críticos ({processResult.validaciones.errores.length})
                          </div>
                          <div 
                            className="text-xs"
                            style={{ color: 'var(--error)' }}
                          >
                            Requieren corrección manual
                          </div>
                        </div>
                      )}

                      {processResult.validaciones.advertencias?.length > 0 && (
                        <div 
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: 'var(--warning-bg)',
                            borderColor: 'var(--warning)'
                          }}
                        >
                          <div 
                            className="text-sm font-medium mb-1"
                            style={{ color: 'var(--warning)' }}
                          >
                            ⚠️ Advertencias ({processResult.validaciones.advertencias.length})
                          </div>
                          <div 
                            className="text-xs"
                            style={{ color: 'var(--warning)' }}
                          >
                            Recomendaciones de mejora
                          </div>
                        </div>
                      )}

                      {processResult.validaciones.informacion?.length > 0 && (
                        <div 
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: 'var(--info-bg)',
                            borderColor: 'var(--info)'
                          }}
                        >
                          <div 
                            className="text-sm font-medium mb-1"
                            style={{ color: 'var(--info)' }}
                          >
                            ℹ️ Información ({processResult.validaciones.informacion.length})
                          </div>
                          <div 
                            className="text-xs"
                            style={{ color: 'var(--info)' }}
                          >
                            Observaciones adicionales
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Validator & Configuration */}
          <div className="space-y-6">
            <ExcelValidator
              validationResults={processResult?.validaciones}
              configuration={configuration}
              onConfigurationChange={(newConfig) => {
                console.log('Nueva configuración:', newConfig);
              }}
            />

            {/* Statistics */}
            {statistics && (
              <div 
                className="card rounded-xl p-6"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  boxShadow: '0 2px 8px var(--shadow-light)'
                }}
              >
                <h2 
                  className="text-xl font-semibold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  📈 Estadísticas de Auditoría
                </h2>
                
                {statistics.mensaje ? (
                  <p style={{ color: 'var(--text-secondary)' }}>{statistics.mensaje}</p>
                ) : (
                  <div className="space-y-4">
                    {/* Hardware Stats */}
                    {statistics.hardware_stats && (
                      <div>
                        <h3 
                          className="text-sm font-medium mb-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          💻 Hardware
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div 
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              borderColor: 'var(--border-primary)'
                            }}
                          >
                            <div 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              RAM Promedio: {statistics.hardware_stats.ram_promedio} GB
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Distribution */}
                    {statistics.distribucion_por_sitio && Object.keys(statistics.distribucion_por_sitio).length > 0 && (
                      <div>
                        <h3 
                          className="text-sm font-medium mb-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          📍 Por Sitio
                        </h3>
                        <div 
                          className="p-3 rounded-lg max-h-32 overflow-y-auto"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-primary)'
                          }}
                        >
                          {Object.entries(statistics.distribucion_por_sitio).map(([sitio, count]) => (
                            <div key={sitio} className="flex justify-between text-sm py-1">
                              <span style={{ color: 'var(--text-secondary)' }}>{sitio}</span>
                              <span 
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Help & Tips */}
            <div 
              className="card rounded-xl p-6"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
                boxShadow: '0 2px 8px var(--shadow-light)'
              }}
            >
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                💡 Consejos y Ayuda
              </h3>
              
              <div className="space-y-3 text-sm">
                <div 
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--info-bg)',
                    borderColor: 'var(--info)'
                  }}
                >
                  <div 
                    className="font-medium mb-1"
                    style={{ color: 'var(--info)' }}
                  >
                    📊 Formato Recomendado
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: 'var(--info)' }}
                  >
                    Excel con headers en primera fila y datos normalizados (ej: "8 GB" para RAM)
                  </div>
                </div>
                
                <div 
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--success-bg)',
                    borderColor: 'var(--success)'
                  }}
                >
                  <div 
                    className="font-medium mb-1"
                    style={{ color: 'var(--success)' }}
                  >
                    ✅ Campos Críticos
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: 'var(--success)' }}
                  >
                    Asegúrate de incluir: CPU, RAM, SO, Antivirus y datos del proveedor
                  </div>
                </div>
                
                <div 
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--warning-bg)',
                    borderColor: 'var(--warning)'
                  }}
                >
                  <div 
                    className="font-medium mb-1"
                    style={{ color: 'var(--warning)' }}
                  >
                    🤖 IA Integrada
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: 'var(--warning)' }}
                  >
                    El sistema usa Ollama local para análisis inteligente de datos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ETLProcessor;