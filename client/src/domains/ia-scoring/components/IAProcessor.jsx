import React, { useState, useEffect } from 'react';
import DocumentAnalyzer from './DocumentAnalyzer';
import ImageAnalyzer from './ImageAnalyzer';
import ScoringResults from './ScoringResults';
import AnalysisProgress from './AnalysisProgress';
import CriteriaConfig from './CriteriaConfig';

const IAProcessor = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisType, setAnalysisType] = useState('document'); // 'document', 'image', 'batch'
  const [criteria, setCriteria] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState('checking');

  // Verificar estado de Ollama al cargar
  useEffect(() => {
    checkOllamaHealth();
  }, []);

  const checkOllamaHealth = async () => {
    try {
      const response = await fetch('/api/ia/health');
      const data = await response.json();
      setOllamaStatus(data.ollama_connected ? 'connected' : 'disconnected');
    } catch (error) {
      setOllamaStatus('disconnected');
    }
  };

  const steps = [
    { number: 1, title: 'Configuración', description: 'Seleccionar tipo y criterios de análisis' },
    { number: 2, title: 'Análisis', description: 'Subir documentos o imágenes para analizar' },
    { number: 3, title: 'Resultados', description: 'Ver scoring y recomendaciones' }
  ];

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  const handleAnalysisStart = (data) => {
    setAnalysisData(data);
    setIsAnalyzing(true);
    setCurrentStep(3);
  };

  const handleAnalysisComplete = (resultData) => {
    setResults(resultData);
    setIsAnalyzing(false);
  };

  const resetProcess = () => {
    setCurrentStep(1);
    setAnalysisData(null);
    setIsAnalyzing(false);
    setResults(null);
    setAnalysisType('document');
    setCriteria([]);
  };

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header con Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                🤖 Análisis IA con Ollama
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Análisis automático de documentos e imágenes con LLaMA 3.2 y Moondream
              </p>
            </div>
            
            {/* Status Ollama */}
            <div 
              className="flex items-center space-x-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: ollamaStatus === 'connected' ? 'var(--success-bg)' : 'var(--error-bg)',
                borderColor: ollamaStatus === 'connected' ? 'var(--success)' : 'var(--error)'
              }}
            >
              <div 
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus === 'connected' ? '' : ollamaStatus === 'checking' ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: ollamaStatus === 'connected' ? 'var(--success)' : 
                                  ollamaStatus === 'checking' ? 'var(--warning)' : 'var(--error)'
                }}
              />
              <span 
                className="text-sm font-medium"
                style={{
                  color: ollamaStatus === 'connected' ? 'var(--success)' : 
                         ollamaStatus === 'checking' ? 'var(--warning)' : 'var(--error)'
                }}
              >
                {ollamaStatus === 'connected' ? 'Ollama Conectado' : 
                 ollamaStatus === 'checking' ? 'Verificando...' : 'Ollama Desconectado'}
              </span>
            </div>
          </div>

          {/* Progress Steps */}
          <div 
            className="flex items-center justify-center space-x-8 py-6 rounded-xl"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div 
                  className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                    currentStep >= step.number ? 'opacity-100' : 'opacity-50'
                  }`}
                  onClick={() => handleStepChange(step.number)}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all duration-300 ${
                      currentStep >= step.number 
                        ? 'text-white border-transparent'
                        : 'border-2'
                    }`}
                    style={{
                      backgroundColor: currentStep >= step.number ? 'var(--accent-primary)' : 'transparent',
                      borderColor: currentStep >= step.number ? 'var(--accent-primary)' : 'var(--border-primary)',
                      color: currentStep >= step.number ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="text-center mt-2">
                    <div 
                      className="text-sm font-medium"
                      style={{ color: currentStep >= step.number ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {step.title}
                    </div>
                    <div 
                      className="text-xs mt-1"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div 
                    className="w-16 h-0.5 mx-4"
                    style={{
                      backgroundColor: currentStep > step.number ? 'var(--accent-primary)' : 'var(--border-primary)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Step 1: Configuración */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Selección de Tipo de Análisis */}
              <div 
                className="card rounded-xl p-6"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  boxShadow: '0 4px 12px var(--shadow-light)'
                }}
              >
                <h3 
                  className="text-xl font-semibold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  📋 Tipo de Análisis
                </h3>
                
                <div className="space-y-3">
                  {[
                    { 
                      id: 'document', 
                      icon: '📄', 
                      title: 'Documentos PDF', 
                      desc: 'Análisis de texto con LLaMA 3.2',
                      features: ['Extracción de texto', 'Scoring automático', 'Cumplimiento normativo']
                    },
                    { 
                      id: 'image', 
                      icon: '🖼️', 
                      title: 'Imágenes', 
                      desc: 'Análisis visual con Moondream',
                      features: ['Reconocimiento de objetos', 'Evaluación técnica', 'Verificación de seguridad']
                    },
                    { 
                      id: 'batch', 
                      icon: '📦', 
                      title: 'Análisis Batch', 
                      desc: 'Procesamiento múltiple asíncrono',
                      features: ['Múltiples archivos', 'Procesamiento paralelo', 'Reportes consolidados']
                    }
                  ].map((type) => (
                    <div 
                      key={type.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        analysisType === type.id ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: analysisType === type.id ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
                        borderColor: analysisType === type.id ? 'var(--accent-primary)' : 'var(--border-primary)',
                        ringColor: 'var(--accent-primary)'
                      }}
                      onClick={() => setAnalysisType(type.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <h4 
                            className="font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {type.title}
                          </h4>
                          <p 
                            className="text-sm mt-1"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {type.desc}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {type.features.map((feature, idx) => (
                              <span 
                                key={idx}
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  color: 'var(--text-tertiary)'
                                }}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuración de Criterios */}
              <CriteriaConfig 
                criteria={criteria}
                setCriteria={setCriteria}
                analysisType={analysisType}
              />
            </div>
          )}

          {/* Step 2: Análisis */}
          {currentStep === 2 && (
            <div>
              {analysisType === 'document' && (
                <DocumentAnalyzer 
                  criteria={criteria}
                  onAnalysisStart={handleAnalysisStart}
                  ollamaStatus={ollamaStatus}
                />
              )}
              {analysisType === 'image' && (
                <ImageAnalyzer 
                  criteria={criteria}
                  onAnalysisStart={handleAnalysisStart}
                  ollamaStatus={ollamaStatus}
                />
              )}
              {analysisType === 'batch' && (
                <div 
                  className="card rounded-xl p-8 text-center"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    🚧 Análisis Batch
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Próximamente disponible para procesamiento de múltiples archivos
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Resultados */}
          {currentStep === 3 && (
            <div>
              {isAnalyzing ? (
                <AnalysisProgress 
                  analysisType={analysisType}
                  analysisData={analysisData}
                  onComplete={handleAnalysisComplete}
                />
              ) : results ? (
                <ScoringResults 
                  results={results}
                  analysisType={analysisType}
                  onReset={resetProcess}
                />
              ) : (
                <div 
                  className="card rounded-xl p-8 text-center"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    ⏳ Esperando Análisis
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Complete los pasos anteriores para ver los resultados
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button 
            onClick={resetProcess}
            className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)'
            }}
          >
            🔄 Reiniciar Proceso
          </button>
          
          <div className="flex space-x-4">
            {currentStep > 1 && (
              <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                ← Anterior
              </button>
            )}
            
            {currentStep < 3 && !isAnalyzing && (
              <button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && (!analysisType || criteria.length === 0)}
                className="px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white'
                }}
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IAProcessor;