// EtapaProgress.jsx - Componente de visualización de progreso de las 8 etapas
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

const EtapaProgress = ({ etapas, etapaActual, etapasCompletadas = [] }) => {
  const getEstadoEtapa = (numeroEtapa) => {
    if (etapasCompletadas.includes(numeroEtapa)) {
      return 'completada';
    }
    if (numeroEtapa === etapaActual) {
      return 'actual';
    }
    if (numeroEtapa < etapaActual) {
      return 'pasada';
    }
    return 'futura';
  };

  const getColorClasses = (estado) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-500 text-white border-green-500';
      case 'actual':
        return 'bg-blue-500 text-white border-blue-500 animate-pulse';
      case 'pasada':
        return 'bg-orange-500 text-white border-orange-500';
      case 'futura':
        return 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600';
      default:
        return '';
    }
  };

  const getLineColorClass = (numeroEtapa) => {
    const estado = getEstadoEtapa(numeroEtapa);
    if (estado === 'completada' || estado === 'pasada') {
      return 'bg-green-500';
    }
    return 'bg-gray-300 dark:bg-gray-600';
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {etapas.map((etapa, index) => {
          const estado = getEstadoEtapa(etapa.numero);
          const colorClasses = getColorClasses(estado);
          const Icono = etapa.icono;
          
          return (
            <React.Fragment key={etapa.numero}>
              {/* Línea conectora */}
              {index > 0 && (
                <div className="flex-1 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`h-1 w-full ${getLineColorClass(etapa.numero)}`}></div>
                  </div>
                </div>
              )}
              
              {/* Círculo de etapa */}
              <div className="relative flex flex-col items-center group">
                {/* Círculo con número o check */}
                <div
                  className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center
                    transition-all duration-300 cursor-pointer
                    ${colorClasses}
                    ${estado === 'actual' ? 'ring-4 ring-blue-200 dark:ring-blue-800' : ''}
                    hover:scale-110
                  `}
                >
                  {estado === 'completada' ? (
                    <CheckIcon className="w-6 h-6" />
                  ) : (
                    <span className="font-bold text-sm">{etapa.numero}</span>
                  )}
                </div>
                
                {/* Tooltip con información */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                    <div className="font-semibold">{etapa.nombre}</div>
                    <div className="text-gray-300 text-[10px] mt-1">{etapa.descripcion}</div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 
                                  w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
                
                {/* Nombre de etapa (solo en desktop) */}
                <div className="hidden md:block mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    estado === 'futura' ? 'text-gray-500 dark:text-gray-400' : 'text-primary'
                  }`}>
                    {etapa.nombre}
                  </p>
                </div>
                
                {/* Indicador de etapa actual */}
                {estado === 'actual' && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Actual
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Nombres en móvil */}
      <div className="md:hidden mt-4 flex justify-between text-xs">
        {etapas.map((etapa) => {
          const estado = getEstadoEtapa(etapa.numero);
          return (
            <div key={etapa.numero} className="flex-1 text-center">
              <p className={`font-medium ${
                estado === 'futura' ? 'text-gray-500 dark:text-gray-400' : 'text-primary'
              }`}>
                {etapa.numero}
              </p>
            </div>
          );
        })}
      </div>
      
      {/* Barra de progreso general */}
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">Progreso general</span>
          <span className="text-primary font-medium">
            {Math.round((etapasCompletadas.length / 8) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(etapasCompletadas.length / 8) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default EtapaProgress;
