import React from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Eye, 
  MapPin, 
  FileCheck, 
  Send, 
  Archive,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useAuditoriaStore } from '../AuditoriaStore';

const StepsNavigation = ({ auditoriaId, currentStep = 1, userRole = 'proveedor' }) => {
  const { auditoriaActual } = useAuditoriaStore();

  // Configuración de las 8 etapas del proceso
  const steps = [
    {
      id: 1,
      title: 'Notificación',
      description: 'Periodo de auditoría iniciado',
      icon: FileText,
      roles: ['admin', 'auditor'],
      color: 'blue',
      duration: '1-2 días'
    },
    {
      id: 2,
      title: 'Carga de Información',
      description: 'Documentos y parque informático',
      icon: Upload,
      roles: ['proveedor'],
      color: 'purple',
      duration: '7-15 días'
    },
    {
      id: 3,
      title: 'Validación Automática',
      description: 'Procesamiento ETL e IA',
      icon: CheckCircle,
      roles: ['sistema'],
      color: 'green',
      duration: '1-2 horas'
    },
    {
      id: 4,
      title: 'Evaluación',
      description: 'Revisión por auditores',
      icon: Eye,
      roles: ['auditor'],
      color: 'orange',
      duration: '3-5 días'
    },
    {
      id: 5,
      title: 'Visita Presencial',
      description: 'Verificación in-situ',
      icon: MapPin,
      roles: ['auditor'],
      color: 'red',
      duration: '1 día'
    },
    {
      id: 6,
      title: 'Consolidación',
      description: 'Análisis de hallazgos',
      icon: FileCheck,
      roles: ['auditor'],
      color: 'indigo',
      duration: '2-3 días'
    },
    {
      id: 7,
      title: 'Informe Final',
      description: 'Entrega de resultados',
      icon: Send,
      roles: ['auditor', 'admin'],
      color: 'teal',
      duration: '1-2 días'
    },
    {
      id: 8,
      title: 'Cierre',
      description: 'Auditoría completada',
      icon: Archive,
      roles: ['admin'],
      color: 'gray',
      duration: '1 día'
    }
  ];

  // Obtener estado de cada step basado en la auditoría actual
  const getStepStatus = (stepId) => {
    if (!auditoriaActual) return 'pending';
    
    const auditoria = auditoriaActual;
    const etapa = auditoria.etapa_actual || 1;
    
    if (stepId < etapa) return 'completed';
    if (stepId === etapa) return 'current';
    return 'pending';
  };

  // Obtener color basado en estado
  const getStatusColor = (status, baseColor) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'current':
        return baseColor;
      case 'pending':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Verificar si el step es interactivo para el usuario actual
  const isStepInteractive = (step) => {
    if (userRole === 'admin') return true;
    return step.roles.includes(userRole) || step.roles.includes('sistema');
  };

  // Obtener fecha estimada para cada etapa
  const getEstimatedDate = (stepId) => {
    if (!auditoriaActual?.fecha_inicio) return null;
    
    const fechaInicio = new Date(auditoriaActual.fecha_inicio);
    const diasOffset = {
      1: 0,
      2: 2,
      3: 17,
      4: 17,
      5: 22,
      6: 23,
      7: 26,
      8: 28
    };
    
    const fechaEtapa = new Date(fechaInicio);
    fechaEtapa.setDate(fechaInicio.getDate() + diasOffset[stepId]);
    
    return fechaEtapa.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  // Verificar si una etapa está en riesgo de retraso
  const isStepAtRisk = (stepId, status) => {
    if (status !== 'current') return false;
    
    if (!auditoriaActual?.fecha_limite) return false;

    const ahora = new Date();
    const fechaLimite = new Date(auditoriaActual.fecha_limite);
    const diasRestantes = Math.ceil((fechaLimite - ahora) / (1000 * 60 * 60 * 24));
    
    // Etapa 2 (carga) es crítica
    if (stepId === 2 && diasRestantes <= 3) return true;

    return false;
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: 'text-blue-600'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: 'text-purple-600'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: 'text-green-600'
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: 'text-red-600'
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: 'text-indigo-600'
    },
    teal: {
      bg: 'bg-teal-100',
      text: 'text-teal-700',
      border: 'border-teal-200',
      icon: 'text-teal-600'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: 'text-gray-600'
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Proceso de Auditoría - 8 Etapas
        </h3>
        <p className="text-sm text-gray-600">
          {userRole === 'proveedor' 
            ? 'Etapas del proceso donde tu participación es requerida'
            : 'Flujo completo del proceso de auditoría técnica'
          }
        </p>
      </div>

      {/* Timeline vertical para móvil, horizontal para desktop */}
      <div className="space-y-4 md:space-y-0 md:flex md:space-x-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const color = getStatusColor(status, step.color);
          const isInteractive = isStepInteractive(step);
          const estimatedDate = getEstimatedDate(step.id);
          const isAtRisk = isStepAtRisk(step.id, status);
          const stepColors = colorClasses[color];
          
          const IconComponent = step.icon;

          return (
            <div key={step.id} className="flex md:flex-col md:flex-1">
              {/* Step content */}
              <div 
                className={`
                  relative flex-1 p-4 rounded-lg border-2 transition-all duration-200
                  ${stepColors.bg} ${stepColors.border}
                  ${status === 'current' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  ${isInteractive ? 'cursor-pointer hover:shadow-md' : ''}
                  ${!isInteractive ? 'opacity-60' : ''}
                `}
              >
                {/* Indicador de riesgo */}
                {isAtRisk && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-red-500 text-white rounded-full p-1">
                      <AlertCircle size={16} />
                    </div>
                  </div>
                )}

                {/* Header del step */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${stepColors.bg} border ${stepColors.border}`}>
                      <IconComponent className={stepColors.icon} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${stepColors.text}`}>
                          {step.id}. {step.title}
                        </h4>
                        {status === 'completed' && (
                          <CheckCircle className="text-green-500" size={16} />
                        )}
                        {status === 'current' && (
                          <Clock className="text-blue-500 animate-pulse" size={16} />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-2">
                  {/* Duración estimada */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Duración:</span>
                    <span className={stepColors.text}>{step.duration}</span>
                  </div>

                  {/* Fecha estimada */}
                  {estimatedDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Fecha est.:</span>
                      <span className={stepColors.text}>{estimatedDate}</span>
                    </div>
                  )}

                  {/* Roles responsables */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Responsable:</span>
                    <div className="flex space-x-1">
                      {step.roles.map(role => (
                        <span 
                          key={role}
                          className={`
                            px-2 py-1 rounded text-xs font-medium
                            ${role === userRole 
                              ? `${stepColors.bg} ${stepColors.text} border ${stepColors.border}`
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}
                        >
                          {{
                            admin: 'Admin',
                            auditor: 'Auditor',
                            proveedor: 'Proveedor',
                            sistema: 'Sistema'
                          }[role]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Estado actual con detalles */}
                  {status === 'current' && auditoriaActual && (
                    <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                      {step.id === 2 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Secciones completadas:</span>
                            <span className="font-medium">
                              {auditoriaActual.secciones_completadas || 0}/11
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Parque informático:</span>
                            <span className={`font-medium ${
                              auditoriaActual.parque_informatico_cargado 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {auditoriaActual.parque_informatico_cargado ? 'Cargado' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {step.id === 4 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Progreso evaluación:</span>
                            <span className="font-medium">
                              {auditoriaActual.progreso_evaluacion || 0}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alertas específicas */}
                  {isAtRisk && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <div className="flex items-center space-x-1 text-red-700">
                        <AlertCircle size={12} />
                        <span className="font-medium">Atención requerida</span>
                      </div>
                      <p className="text-red-600 mt-1">
                        Quedan pocos días para completar esta etapa
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Conector (solo visible en desktop y no en el último elemento) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center mx-2">
                  <ChevronRight 
                    className={`${
                      status === 'completed' ? 'text-green-500' : 'text-gray-400'
                    }`} 
                    size={20} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>En progreso</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Pendiente</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-500" size={12} />
            <span>Requiere atención</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepsNavigation;
