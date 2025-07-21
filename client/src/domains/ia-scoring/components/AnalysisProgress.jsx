import React, { useState, useEffect } from 'react';

const AnalysisProgress = ({ analysisType, analysisData, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const analysisSteps = {
    document: [
      { id: 'upload', name: 'Carga de Archivos', icon: '📤', duration: 2000 },
      { id: 'extract', name: 'Extracción de Texto', icon: '📄', duration: 3000 },
      { id: 'preprocess', name: 'Preprocesamiento', icon: '⚙️', duration: 2000 },
      { id: 'analyze', name: 'Análisis con LLaMA 3.2', icon: '🤖', duration: 5000 },
      { id: 'score', name: 'Cálculo de Scoring', icon: '📊', duration: 2000 },
      { id: 'report', name: 'Generación de Reporte', icon: '📋', duration: 2000 }
    ],
    image: [
      { id: 'upload', name: 'Carga de Imágenes', icon: '📤', duration: 2000 },
      { id: 'convert', name: 'Conversión Base64', icon: '🔄', duration: 1500 },
      { id: 'preprocess', name: 'Preprocesamiento Visual', icon: '🖼️', duration: 2000 },
      { id: 'analyze', name: 'Análisis con Moondream', icon: '🌙', duration: 6000 },
      { id: 'detect', name: 'Detección de Objetos', icon: '🔍', duration: 3000 },
      { id: 'score', name: 'Evaluación Visual', icon: '📊', duration: 2500 },
      { id: 'report', name: 'Reporte de Resultados', icon: '📋', duration: 2000 }
    ],
    batch: [
      { id: 'queue', name: 'Encolado de Jobs', icon: '📦', duration: 1000 },
      { id: 'distribute', name: 'Distribución Paralela', icon: '🔄', duration: 2000 },
      { id: 'process', name: 'Procesamiento Batch', icon: '⚡', duration: 8000 },
      { id: 'consolidate', name: 'Consolidación', icon: '📊', duration: 3000 },
      { id: 'report', name: 'Reporte Consolidado', icon: '📋', duration: 2000 }
    ]
  };

  const steps = analysisSteps[analysisType] || analysisSteps.document;

  useEffect(() => {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    setEstimatedTime(totalDuration / 1000);
    
    // Iniciar el proceso de análisis simulado
    simulateAnalysis();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const simulateAnalysis = async () => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStep(i);
      
      addLog(`Iniciando: ${step.name}`, 'info');
      
      // Simular progreso del paso actual
      const stepProgress = (i / steps.length) * 100;
      for (let p = 0; p <= 100; p += 5) {
        await new Promise(resolve => setTimeout(resolve, step.duration / 20));
        setProgress(stepProgress + (p / 100) * (100 / steps.length));
      }
      
      addLog(`Completado: ${step.name}`, 'success');
      
      // Simular logs específicos según el tipo de análisis
      if (analysisType === 'document') {
        if (step.id === 'extract') {
          addLog(`Texto extraído: ${Math.floor(Math.random() * 5000 + 1000)} caracteres`, 'info');
        } else if (step.id === 'analyze') {
          addLog('LLaMA 3.2:1b procesando contenido...', 'info');
          addLog('Análisis semántico completado', 'success');
        }
      } else if (analysisType === 'image') {
        if (step.id === 'convert') {
          addLog(`Imágenes convertidas: ${analysisData.images?.length || 1}`, 'info');
        } else if (step.id === 'analyze') {
          addLog('Moondream analizando contenido visual...', 'info');
          addLog('Objetos detectados correctamente', 'success');
        }
      }
    }

    // Completar análisis
    setProgress(100);
    setCurrentStep(steps.length);
    addLog('Análisis completado exitosamente', 'success');
    
    // Simular resultados después de un breve delay
    setTimeout(() => {
      const mockResults = generateMockResults();
      onComplete(mockResults);
    }, 1000);
  };

  const generateMockResults = () => {
    const baseScore = Math.floor(Math.random() * 30 + 70); // 70-100
    
    if (analysisType === 'document') {
      return {
        analisis_id: `doc_${Date.now()}`,
        score_final: baseScore,
        detalle_scoring: {
          completeness: Math.floor(Math.random() * 20 + 80),
          accuracy: Math.floor(Math.random() * 20 + 75),
          compliance: Math.floor(Math.random() * 25 + 70),
          clarity: Math.floor(Math.random() * 15 + 85)
        },
        recomendaciones: [
          'Mejorar la estructuración de secciones técnicas',
          'Incluir más detalles en especificaciones de seguridad',
          'Actualizar referencias normativas a versiones más recientes'
        ],
        metadatos: {
          palabras_analizadas: Math.floor(Math.random() * 2000 + 1000),
          tiempo_procesamiento: `${timeElapsed}s`,
          modelo_usado: 'LLaMA 3.2:1b'
        }
      };
    } else {
      return {
        analisis_id: `img_${Date.now()}`,
        score_final: baseScore,
        detalle_scoring: {
          technical_compliance: Math.floor(Math.random() * 20 + 75),
          organization: Math.floor(Math.random() * 25 + 70),
          safety: Math.floor(Math.random() * 15 + 80),
          equipment_state: Math.floor(Math.random() * 20 + 75)
        },
        objetos_detectados: [
          { objeto: 'Monitor', confianza: 0.95, ubicacion: 'Centro' },
          { objeto: 'Teclado', confianza: 0.88, ubicacion: 'Inferior' },
          { objeto: 'Cables', confianza: 0.76, ubicacion: 'Múltiple' }
        ],
        recomendaciones: [
          'Organizar mejor el cableado para reducir riesgos',
          'Mejorar la iluminación del área de trabajo',
          'Verificar etiquetado de equipos de red'
        ],
        metadatos: {
          imagenes_analizadas: analysisData.images?.length || 1,
          tiempo_procesamiento: `${timeElapsed}s`,
          modelo_usado: 'Moondream'
        }
      };
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div 
        className="card rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 4px 12px var(--shadow-light)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            🤖 Análisis en Progreso
          </h2>
          <div 
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: progress < 100 ? 'var(--warning-bg)' : 'var(--success-bg)',
              color: progress < 100 ? 'var(--warning)' : 'var(--success)'
            }}
          >
            {progress < 100 ? 'Procesando...' : 'Completado'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'var(--text-secondary)' }}>
              Progreso General
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div 
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div 
              className="h-full transition-all duration-500 rounded-full"
              style={{
                backgroundColor: progress < 100 ? 'var(--accent-primary)' : 'var(--success)',
                width: `${progress}%`
              }}
            />
          </div>
        </div>

        {/* Time Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatTime(timeElapsed)}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tiempo Transcurrido
            </div>
          </div>
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatTime(Math.max(0, estimatedTime - timeElapsed))}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tiempo Restante
            </div>
          </div>
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentStep}/{steps.length}
            </div>
            <div 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Pasos Completados
            </div>
          </div>
        </div>
      </div>

      {/* Steps Progress */}
      <div 
        className="card rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 4px 12px var(--shadow-light)'
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          📋 Etapas del Proceso
        </h3>
        
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 ${
                  isCurrent ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: isCompleted ? 'var(--success-bg)' : 
                                   isCurrent ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                  borderColor: isCompleted ? 'var(--success)' : 
                              isCurrent ? 'var(--accent-primary)' : 'var(--border-primary)',
                  ringColor: 'var(--accent-primary)'
                }}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isCurrent ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: isCompleted ? 'var(--success)' : 
                                     isCurrent ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: isCompleted || isCurrent ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  {isCompleted ? '✓' : isCurrent ? step.icon : index + 1}
                </div>
                
                <div className="flex-1">
                  <div 
                    className="font-medium"
                    style={{ 
                      color: isCompleted ? 'var(--success)' : 
                             isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    {step.name}
                  </div>
                  {isCurrent && (
                    <div 
                      className="text-sm"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      Procesando...
                    </div>
                  )}
                </div>
                
                <div 
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {isCompleted ? '✅' : isCurrent ? '⏳' : '⏸️'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Logs */}
      <div 
        className="card rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 4px 12px var(--shadow-light)'
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          📜 Log en Tiempo Real
        </h3>
        
        <div 
          className="h-64 overflow-y-auto p-3 rounded-lg font-mono text-sm"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          {logs.map((log, index) => (
            <div 
              key={index}
              className="flex items-start space-x-2 mb-1"
            >
              <span className="text-xs opacity-75">
                {getLogIcon(log.type)}
              </span>
              <span 
                className="text-xs opacity-75"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {log.timestamp}
              </span>
              <span 
                className="flex-1"
                style={{ 
                  color: log.type === 'success' ? 'var(--success)' : 
                         log.type === 'error' ? 'var(--error)' : 
                         log.type === 'warning' ? 'var(--warning)' : 'var(--text-secondary)'
                }}
              >
                {log.message}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div 
              className="text-center py-8"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Esperando inicio del análisis...
            </div>
          )}
        </div>
      </div>

      {/* Cancel Button */}
      {progress < 100 && (
        <div className="text-center">
          <button 
            onClick={() => {
              addLog('Análisis cancelado por el usuario', 'warning');
            }}
            className="px-6 py-2 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: 'var(--error)',
              color: 'white'
            }}
          >
            ❌ Cancelar Análisis
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisProgress;