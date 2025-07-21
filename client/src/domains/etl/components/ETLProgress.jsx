import React, { useEffect, useState } from 'react';

const ETLProgress = ({ 
  jobId, 
  isProcessing, 
  onStatusUpdate,
  onComplete,
  onError 
}) => {
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);

  const stages = [
    { id: 'PARSING', name: 'Analizando archivo', icon: '📄', color: 'var(--info)' },
    { id: 'FIELD_DETECTION', name: 'Detectando campos', icon: '🔍', color: 'var(--info)' },
    { id: 'NORMALIZATION', name: 'Normalizando datos', icon: '⚙️', color: 'var(--warning)' },
    { id: 'VALIDATION', name: 'Validando reglas', icon: '✅', color: 'var(--warning)' },
    { id: 'SCORING', name: 'Calculando scores', icon: '📊', color: 'var(--accent-primary)' },
    { id: 'PERSISTENCE', name: 'Guardando resultados', icon: '💾', color: 'var(--success)' },
    { id: 'COMPLETED', name: 'Procesamiento completado', icon: '🎉', color: 'var(--success)' }
  ];

  useEffect(() => {
    let interval;
    let timeInterval;

    if (isProcessing && jobId) {
      // Simular progreso (en implementación real, consultaría el backend)
      interval = setInterval(async () => {
        try {
          // En implementación real:
          // const response = await api.get(`/etl/jobs/${jobId}/status`);
          // const statusData = response.data;
          
          // Simulación del progreso
          setProgress(prev => {
            const newProgress = Math.min(prev + Math.random() * 15, 100);
            
            // Actualizar etapa según progreso
            if (newProgress < 15) {
              setCurrentStage('PARSING');
            } else if (newProgress < 30) {
              setCurrentStage('FIELD_DETECTION');
            } else if (newProgress < 50) {
              setCurrentStage('NORMALIZATION');
            } else if (newProgress < 70) {
              setCurrentStage('VALIDATION');
            } else if (newProgress < 85) {
              setCurrentStage('SCORING');
            } else if (newProgress < 100) {
              setCurrentStage('PERSISTENCE');
            } else {
              setCurrentStage('COMPLETED');
              clearInterval(interval);
              onComplete?.();
            }
            
            return newProgress;
          });
        } catch (error) {
          console.error('Error checking ETL status:', error);
          onError?.(error);
          clearInterval(interval);
        }
      }, 1000);

      // Timer para tiempo transcurrido
      timeInterval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [isProcessing, jobId, onComplete, onError]);

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.id === currentStage);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getProgressPercentage = () => {
    const stageIndex = getCurrentStageIndex();
    const stageProgress = (progress % (100 / stages.length)) / (100 / stages.length) * 100;
    return ((stageIndex / stages.length) * 100) + (stageProgress / stages.length);
  };

  if (!isProcessing && progress === 0) {
    return null;
  }

  return (
    <div 
      className="border rounded-xl p-6"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-lg font-semibold flex items-center space-x-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <span>🔄</span>
          <span>Progreso de Procesamiento ETL</span>
        </h3>
        
        <div className="text-right text-sm">
          <div 
            className="font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {Math.round(progress)}%
          </div>
          <div 
            style={{ color: 'var(--text-secondary)' }}
          >
            {timeElapsed > 0 && `⏱️ ${formatTime(timeElapsed)}`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div 
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))`
            }}
          />
        </div>
      </div>

      {/* Current Stage */}
      {currentStage && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--info-bg)',
            borderColor: 'var(--info)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {stages.find(s => s.id === currentStage)?.icon}
            </div>
            <div>
              <div 
                className="font-medium"
                style={{ color: 'var(--info)' }}
              >
                {stages.find(s => s.id === currentStage)?.name}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--info)' }}
              >
                Procesando datos del parque informático...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stages Timeline */}
      <div className="space-y-3">
        <h4 
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          📋 Etapas del Procesamiento
        </h4>
        
        <div className="space-y-2">
          {stages.map((stage, index) => {
            const isCompleted = getCurrentStageIndex() > index;
            const isCurrent = stage.id === currentStage;
            const isPending = getCurrentStageIndex() < index;

            return (
              <div 
                key={stage.id}
                className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300"
                style={{
                  backgroundColor: isCurrent 
                    ? 'rgba(123, 104, 238, 0.1)' 
                    : isCompleted 
                      ? 'var(--success-bg)' 
                      : 'var(--bg-secondary)',
                  borderLeft: `3px solid ${
                    isCurrent 
                      ? 'var(--accent-primary)' 
                      : isCompleted 
                        ? 'var(--success)' 
                        : 'var(--border-primary)'
                  }`
                }}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                    isCurrent ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: isCurrent 
                      ? 'var(--accent-primary)' 
                      : isCompleted 
                        ? 'var(--success)' 
                        : 'var(--bg-tertiary)',
                    color: isCurrent || isCompleted ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  {isCompleted ? '✓' : isCurrent ? stage.icon : index + 1}
                </div>
                
                <div className="flex-1">
                  <div 
                    className={`text-sm font-medium ${isCurrent ? 'font-semibold' : ''}`}
                    style={{
                      color: isCurrent 
                        ? 'var(--accent-primary)' 
                        : isCompleted 
                          ? 'var(--success)' 
                          : 'var(--text-secondary)'
                    }}
                  >
                    {stage.name}
                  </div>
                  
                  {isCurrent && (
                    <div 
                      className="text-xs mt-1"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      En progreso...
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div 
                      className="text-xs mt-1"
                      style={{ color: 'var(--success)' }}
                    >
                      Completado
                    </div>
                  )}
                </div>
                
                <div className="text-lg">
                  {stage.icon}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processing Stats */}
      {isProcessing && progress > 20 && (
        <div 
          className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {Math.floor(progress * 2.45)}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Registros procesados
            </div>
          </div>
          
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--success)' }}
            >
              {Math.floor(progress * 2.2)}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Válidos
            </div>
          </div>
          
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--warning)' }}
            >
              {Math.floor(progress * 0.15)}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Advertencias
            </div>
          </div>
          
          <div className="text-center">
            <div 
              className="text-lg font-bold"
              style={{ color: 'var(--error)' }}
            >
              {Math.floor(progress * 0.05)}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Errores
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {progress >= 100 && (
        <div 
          className="mt-6 p-4 rounded-lg text-center"
          style={{
            backgroundColor: 'var(--success-bg)',
            borderColor: 'var(--success)'
          }}
        >
          <div className="text-2xl mb-2">🎉</div>
          <div 
            className="font-semibold"
            style={{ color: 'var(--success)' }}
          >
            ¡Procesamiento Completado Exitosamente!
          </div>
          <div 
            className="text-sm mt-1"
            style={{ color: 'var(--success)' }}
          >
            Los datos del parque informático han sido procesados y están listos para análisis
          </div>
        </div>
      )}
    </div>
  );
};

export default ETLProgress;