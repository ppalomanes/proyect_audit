import React from 'react';
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ESTADOS_AUDITORIA } from '../AuditoriaStore';

const AuditoriaHeader = ({ auditoria, progreso, onComunicaciones }) => {
  const getEstadoBadgeClass = (estado) => {
    const classes = {
      'CONFIGURACION': 'bg-gray-100 text-gray-800',
      'NOTIFICACION': 'bg-blue-100 text-blue-800',
      'CARGA_PRESENCIAL': 'bg-yellow-100 text-yellow-800',
      'CARGA_PARQUE': 'bg-orange-100 text-orange-800',
      'VALIDACION_AUTOMATICA': 'bg-purple-100 text-purple-800',
      'REVISION_AUDITOR': 'bg-indigo-100 text-indigo-800',
      'NOTIFICACION_RESULTADOS': 'bg-pink-100 text-pink-800',
      'COMPLETADA': 'bg-green-100 text-green-800',
      'SUSPENDIDA': 'bg-red-100 text-red-800',
      'CANCELADA': 'bg-red-100 text-red-800'
    };
    return classes[estado] || 'bg-gray-100 text-gray-800';
  };

  const getProgresoColor = (progreso) => {
    if (progreso >= 80) return 'bg-green-500';
    if (progreso >= 50) return 'bg-yellow-500';
    if (progreso >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDiasRestantes = () => {
    if (!auditoria.fecha_limite) return null;
    
    const hoy = new Date();
    const fechaLimite = new Date(auditoria.fecha_limite);
    const diffTime = fechaLimite - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const diasRestantes = getDiasRestantes();

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4">
        {/* Header principal */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {auditoria.codigo}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeClass(auditoria.estado)}`}>
                {ESTADOS_AUDITORIA[auditoria.estado] || auditoria.estado}
              </span>
            </div>
            
            <p className="text-gray-600 mb-3">{auditoria.alcance}</p>
            
            {/* Información de fechas y plazos */}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                <span>Programada: {formatearFecha(auditoria.fecha_programada)}</span>
              </div>
              
              {auditoria.fecha_limite && (
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span className={diasRestantes <= 3 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    Límite: {formatearFecha(auditoria.fecha_limite)}
                    {diasRestantes !== null && (
                      <span className="ml-1">
                        ({diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onComunicaciones}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Comunicaciones
            </button>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                Progreso General
              </div>
              <div className="text-xs text-gray-500">
                {progreso}% completado
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progreso de carga</span>
            <span className="font-medium">{progreso}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgresoColor(progreso)}`}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Información de actores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
          {/* Proveedor */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Proveedor
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {auditoria.Proveedor?.razon_social || auditoria.Proveedor?.nombre_comercial || 'No asignado'}
              </p>
              {auditoria.Proveedor?.nit && (
                <p className="text-xs text-gray-500">
                  NIT: {auditoria.Proveedor.nit}
                </p>
              )}
            </div>
          </div>

          {/* Auditor Principal */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Auditor Principal
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {auditoria.AuditorPrincipal ? 
                  `${auditoria.AuditorPrincipal.nombres} ${auditoria.AuditorPrincipal.apellidos}` : 
                  'No asignado'
                }
              </p>
              {auditoria.AuditorPrincipal?.email && (
                <p className="text-xs text-gray-500 truncate">
                  {auditoria.AuditorPrincipal.email}
                </p>
              )}
            </div>
          </div>

          {/* Auditor Secundario */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Auditor Secundario
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {auditoria.AuditorSecundario ? 
                  `${auditoria.AuditorSecundario.nombres} ${auditoria.AuditorSecundario.apellidos}` : 
                  'No asignado'
                }
              </p>
              {auditoria.AuditorSecundario?.email && (
                <p className="text-xs text-gray-500 truncate">
                  {auditoria.AuditorSecundario.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Alertas de plazo */}
        {diasRestantes !== null && diasRestantes <= 3 && diasRestantes >= 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex">
              <ClockIcon className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {diasRestantes === 0 ? '¡Fecha límite hoy!' : `¡Solo ${diasRestantes} días restantes!`}
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  La fecha límite para completar la carga de documentos es el {formatearFecha(auditoria.fecha_limite)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de vencimiento */}
        {diasRestantes !== null && diasRestantes < 0 && (
          <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3">
            <div className="flex">
              <ClockIcon className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-900">
                  Fecha límite vencida
                </h3>
                <p className="mt-1 text-sm text-red-800">
                  La fecha límite venció hace {Math.abs(diasRestantes)} días. 
                  Contacte al coordinador de auditorías para solicitar una extensión.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditoriaHeader;
