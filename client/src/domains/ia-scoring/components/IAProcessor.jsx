import React, { useState, useEffect } from 'react';
import DocumentAnalyzer from './DocumentAnalyzer';
import ImageAnalyzer from './ImageAnalyzer';
import ScoringResults from './ScoringResults';
import AnalysisProgress from './AnalysisProgress';
import CriteriaConfig from './CriteriaConfig';
import {
  CpuChipIcon,
  DocumentTextIcon,
  PhotoIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  EyeIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BeakerIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';

const IAProcessor = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisType, setAnalysisType] = useState('document'); // 'document', 'image', 'batch'
  const [criteria, setCriteria] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState('connected');

  // Mock criterios por defecto
  useEffect(() => {
    setCriteria([
      { id: 'cumplimiento', name: 'Cumplimiento normativo', weight: 0.4, enabled: true },
      { id: 'tecnico', name: 'Aspectos técnicos', weight: 0.3, enabled: true },
      { id: 'seguridad', name: 'Seguridad', weight: 0.3, enabled: true },
    ]);
  }, []);

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
      setOllamaStatus('connected'); // Mock para demo
    }
  };

  const steps = [
    { number: 1, title: 'Configuración', description: 'Seleccionar tipo y criterios de análisis', icon: CogIcon },
    { number: 2, title: 'Análisis', description: 'Subir documentos o imágenes para analizar', icon: BeakerIcon },
    { number: 3, title: 'Resultados', description: 'Ver scoring y recomendaciones', icon: CheckCircleIcon }
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
  };

  const getStatusInfo = () => {
    switch (ollamaStatus) {
      case 'connected':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          icon: CheckCircleIcon,
          text: 'Ollama Conectado',
          subtext: 'LLaMA 3.2 + Moondream'
        };
      case 'checking':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          icon: ClockIcon,
          text: 'Verificando...',
          subtext: 'Conectando con Ollama'
        };
      default:
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          icon: ExclamationTriangleIcon,
          text: 'Ollama Desconectado',
          subtext: 'Verificar configuración'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const StepIndicator = ({ step, index, isLast }) => {
    const Icon = step.icon;
    const isActive = currentStep === step.number;
    const isCompleted = currentStep > step.number;
    
    return (
      <div className="flex items-center">
        <div 
          className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
            isActive || isCompleted ? 'opacity-100' : 'opacity-50'
          }`}
          onClick={() => handleStepChange(step.number)}
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
            ${isCompleted 
              ? 'bg-green-500 text-white shadow-lg' 
              : isActive 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-400'
            }
          `}>
            {isCompleted ? (
              <CheckCircleIcon className="w-6 h-6" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
          </div>
          <div className="mt-3 text-center">
            <div className={`text-sm font-medium ${
              isCompleted 
                ? 'text-green-400' 
                : isActive 
                  ? 'text-blue-400' 
                  : 'text-gray-400'
            }`}>
              {step.title}
            </div>
            <div className="text-xs text-gray-500 mt-1 max-w-32">
              {step.description}
            </div>
          </div>
        </div>
        
        {!isLast && (
          <div className={`
            flex-1 h-0.5 mx-6 transition-colors duration-300
            ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-700'}
          `} />
        )}
      </div>
    );
  };

  const AnalysisTypeCard = ({ type, isSelected, onClick }) => (
    <div 
      className={`
        p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:transform hover:scale-105
        ${isSelected 
          ? 'border-blue-500 bg-blue-500/10 shadow-lg' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div className={`
          p-3 rounded-lg
          ${isSelected ? 'bg-blue-500/20' : 'bg-gray-700/50'}
        `}>
          <type.icon className={`w-6 h-6 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${isSelected ? 'text-blue-400' : 'text-white'}`}>
            {type.title}
          </h4>
          <p className="text-sm text-gray-400 mb-3">
            {type.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {type.features.map((feature, idx) => (
              <span 
                key={idx}
                className={`
                  text-xs px-3 py-1 rounded-full
                  ${isSelected 
                    ? 'bg-blue-500/20 text-blue-300' 
                    : 'bg-gray-700/50 text-gray-400'
                  }
                `}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const analysisTypes = [
    { 
      id: 'document', 
      icon: DocumentTextIcon, 
      title: 'Documentos PDF', 
      description: 'Análisis de texto con LLaMA 3.2:1b',
      features: ['Extracción de texto', 'Scoring automático', 'Cumplimiento normativo']
    },
    { 
      id: 'image', 
      icon: PhotoIcon, 
      title: 'Imágenes', 
      description: 'Análisis visual con Moondream',
      features: ['Reconocimiento de objetos', 'Evaluación técnica', 'Verificación de seguridad']
    },
    { 
      id: 'batch', 
      icon: CpuChipIcon, 
      title: 'Análisis Batch', 
      description: 'Procesamiento múltiple asíncrono',
      features: ['Múltiples archivos', 'Procesamiento paralelo', 'Reportes consolidados']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <SparklesIcon className="w-8 h-8 mr-3 text-purple-400" />
                Análisis IA con Ollama
              </h1>
              <p className="text-gray-400">
                Análisis automático de documentos e imágenes con LLaMA 3.2:1b y Moondream
              </p>
            </div>
            
            {/* Status Ollama */}
            <div className={`
              flex items-center space-x-3 px-4 py-3 rounded-xl border
              ${statusInfo.bgColor} ${statusInfo.borderColor}
            `}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  ollamaStatus === 'connected' ? 'bg-green-500' : 
                  ollamaStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`} />
                <WifiIcon className={`w-5 h-5 ${statusInfo.color}`} />
              </div>
              <div>
                <div className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </div>
                <div className="text-xs text-gray-500">
                  {statusInfo.subtext}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <StepIndicator 
                  key={step.number} 
                  step={step} 
                  index={index} 
                  isLast={index === steps.length - 1} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          {/* Step 1: Configuración */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Selección de Tipo de Análisis */}
              <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <BeakerIcon className="w-6 h-6 mr-3 text-purple-400" />
                  Tipo de Análisis
                </h3>
                
                <div className="space-y-4">
                  {analysisTypes.map((type) => (
                    <AnalysisTypeCard
                      key={type.id}
                      type={type}
                      isSelected={analysisType === type.id}
                      onClick={() => setAnalysisType(type.id)}
                    />
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
                <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CpuChipIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Análisis Batch
                  </h3>
                  <p className="text-gray-400 text-lg mb-6">
                    Próximamente disponible para procesamiento de múltiples archivos
                  </p>
                  <div className="flex justify-center space-x-4">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <span className="text-sm text-purple-400">Procesamiento Paralelo</span>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <span className="text-sm text-blue-400">Reportes Consolidados</span>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <span className="text-sm text-green-400">Alta Eficiencia</span>
                    </div>
                  </div>
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
                <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ClockIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Esperando Análisis
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Complete los pasos anteriores para ver los resultados del análisis con IA
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
            className="flex items-center px-6 py-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:text-white transition-all duration-300"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Reiniciar Proceso
          </button>
          
          <div className="flex space-x-4">
            {currentStep > 1 && (
              <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center px-6 py-3 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:text-white transition-all duration-300"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Anterior
              </button>
            )}
            
            {currentStep < 3 && !isAnalyzing && (
              <button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && (!analysisType || criteria.length === 0)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 hover:transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Siguiente
                <ChevronRightIcon className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IAProcessor;