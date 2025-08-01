// ETLProgress.jsx - Componente para mostrar progreso de procesamiento ETL
// Portal de Auditorías Técnicas

import React, { useEffect } from 'react';
import { 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import useETLStore from '../etlStore';
import etlService from '../services/etlService';

const ETLProgress = ({ jobId, onComplete }) => {
  const {
    currentJob,
    fetchJobStatus,
    stopJobPolling
  } = useETLStore();

  useEffect(() => {
    if (jobId && !currentJob) {
      // Iniciar seguimiento del job
      const interval = setInterval(async () => {
        try {
          await fetchJobStatus(jobId);
        } catch (error) {
          console.error('Error fetching job status:', error);
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [jobId, currentJob, fetchJobStatus]);

  useEffect(() => {
    if (currentJob && ['COMPLETADO', 'ERROR', 'CANCELADO'].includes(currentJob.estado)) {
      stopJobPolling();
      if (onComplete) {
        onComplete(currentJob);
      }
    }
  }, [currentJob, stopJobPolling, onComplete]);

  if (!currentJob) {
    return (
      <div className="flex items-center justify-center p-8">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-600">Cargando estado del procesamiento...</span>
      </div>
    );
  }

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'COMPLETADO':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'ERROR':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'CANCELADO':
        return <ExclamationCircleIcon className="w-6 h-6 text-gray-600" />;
      default:
        return <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (estado) => {
    return etlService.getStatusColor(estado);
  };

  const getProgressSteps = () => {
    const steps = [
      { key: 'INICIADO', label: 'Iniciado', icon: DocumentTextIcon },
      { key: 'PARSEANDO', label: 'Analizando archivo', icon: DocumentTextIcon },
      { key: 'NORMALIZANDO', label: 'Normalizando datos', icon: ArrowPathIcon },
      { key: 'VALIDANDO', label: 'Validando reglas', icon: CheckCircleIcon },
      { key: 'SCORING', label: 'Calculando scoring', icon: ChartBarIcon },
      { key: 'COMPLETADO', label: 'Completado', icon: CheckCircleIcon }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentJob.estado);
    
    return steps.map((step, index) => ({
      ...step,
      status: index < currentStepIndex ? 'completed' : 
              index === currentStepIndex ? 'current' : 'pending'
    }));
  };

  const steps = getProgressSteps();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header con estado actual */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(currentJob.estado)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Procesamiento ETL
              </h3>
              <p className="text-sm text-gray-600">
                Job ID: {currentJob.job_id || jobId}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentJob.estado)}`}>
              {currentJob.estado}
            </span>
          </div>
        </div>

        {/* Barra de progreso general */}
        {currentJob.progreso && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso General</span>
              <span>{currentJob.progreso.porcentaje || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${currentJob.progreso.porcentaje || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Pasos del proceso */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Proceso de ETL</h4>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center space-x-4 relative">
                {/* Icono del paso */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'current' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                
                {/* Información del paso */}
                <div className="flex-grow">
                  <p className={`font-medium ${
                    step.status === 'completed' ? 'text-green-800' :
                    step.status === 'current' ? 'text-blue-800' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  
                  {/* Mostrar detalles si es el paso actual */}
                  {step.status === 'current' && currentJob.progreso && (
                    <div className="mt-1 text-sm text-gray-600">
                      {currentJob.progreso.registros_procesados && (
                        <span>
                          {currentJob.progreso.registros_procesados} de {currentJob.progreso.registros_total || '?'} registros
                        </span>
                      )}
                      {currentJob.progreso.tiempo_transcurrido && (
                        <span className="ml-3">
                          Tiempo: {currentJob.progreso.tiempo_transcurrido}
                        </span>
                      )}
                      {currentJob.progreso.tiempo_estimado_restante && (
                        <span className="ml-3">
                          Restante: {currentJob.progreso.tiempo_estimado_restante}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Línea conectora */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute w-0.5 h-4 ${
                      step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`} 
                    style={{ left: '15px', top: '32px' }} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Estadísticas del procesamiento */}
      {currentJob.estadisticas && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Estadísticas</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentJob.estadisticas.registros_validos || 0}
              </div>
              <div className="text-sm text-gray-600">Registros Válidos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {currentJob.estadisticas.registros_con_advertencias || 0}
              </div>
              <div className="text-sm text-gray-600">Con Advertencias</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {currentJob.estadisticas.registros_con_errores || 0}
              </div>
              <div className="text-sm text-gray-600">Con Errores</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentJob.estadisticas.score_calidad_promedio || 0}%
              </div>
              <div className="text-sm text-gray-600">Score Promedio</div>
            </div>
          </div>
        </div>
      )}

      {/* Información del archivo */}
      {currentJob.archivo && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                📁 {currentJob.archivo.nombre}
              </span>
              <span>
                📊 {currentJob.archivo.tipo}
              </span>
              {currentJob.archivo.tamaño_mb && (
                <span>
                  💾 {currentJob.archivo.tamaño_mb} MB
                </span>
              )}
            </div>
            
            {currentJob.progreso?.tiempo_transcurrido && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>{currentJob.progreso.tiempo_transcurrido}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acciones según el estado */}
      {['COMPLETADO', 'ERROR'].includes(currentJob.estado) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-semibold text-gray-900">
                {currentJob.estado === 'COMPLETADO' ? '¡Procesamiento Completado!' : 'Error en Procesamiento'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {currentJob.estado === 'COMPLETADO' 
                  ? 'Los datos han sido procesados y están listos para revisión'
                  : 'Ocurrió un error durante el procesamiento. Revisa los detalles.'
                }
              </p>
            </div>
            
            <div className="flex space-x-3">
              {currentJob.estado === 'COMPLETADO' && (
                <button
                  onClick={() => onComplete && onComplete(currentJob)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Resultados
                </button>
              )}
              
              {currentJob.estado === 'ERROR' && (
                <button
                  onClick={() => {
                    // Lógica para reintentar o ver detalles del error
                    console.log('Ver detalles del error');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ver Detalles del Error
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ETLProgress;