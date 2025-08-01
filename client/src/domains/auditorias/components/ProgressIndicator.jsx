import React from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertTriangle,
  FileText,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useAuditoriaStore } from '../AuditoriaStore';

const ProgressIndicator = ({ auditoriaId, compact = false }) => {
  const { auditoriaActual } = useAuditoriaStore();

  // Configuración de las 11 secciones de auditoría
  const secciones = [
    { id: 'topologia', titulo: 'Topología', obligatoria: false, icon: FileText },
    { id: 'cuarto_tecnologia', titulo: 'Cuarto de Tecnología', obligatoria: true, icon: Zap },
    { id: 'conectividad', titulo: 'Conectividad', obligatoria: false, icon: FileText },
    { id: 'energia', titulo: 'Energía', obligatoria: true, icon: Zap },
    { id: 'temperatura_ct', titulo: 'Temperatura CT', obligatoria: false, icon: FileText },
    { id: 'servidores', titulo: 'Servidores', obligatoria: false, icon: FileText },
    { id: 'internet', titulo: 'Internet', obligatoria: false, icon: FileText },
    { id: 'seguridad_informatica', titulo: 'Seguridad Informática', obligatoria: true, icon: Zap },
    { id: 'personal_capacitado', titulo: 'Personal Capacitado', obligatoria: false, icon: FileText },
    { id: 'escalamiento', titulo: 'Escalamiento', obligatoria: false, icon: FileText },
    { id: 'informacion_entorno', titulo: 'Información de Entorno', obligatoria: false, icon: FileText }
  ];

  // Obtener estado de una sección
  const getSectionStatus = (sectionId) => {
    if (!auditoriaActual?.documentos) return 'pending';
    
    const documento = auditoriaActual.documentos.find(doc => doc.seccion === sectionId);
    if (!documento) return 'pending';
    
    return documento.estado || 'completed';
  };

  // Calcular progreso general
  const calcularProgreso = () => {
    if (!auditoriaActual) return { general: 0, obligatorias: 0, opcionales: 0 };

    const seccionesObligatorias = secciones.filter(s => s.obligatoria);
    const seccionesOpcionales = secciones.filter(s => !s.obligatoria);
    
    const obligatoriasCompletas = seccionesObligatorias.filter(s => 
      getSectionStatus(s.id) === 'completed'
    ).length;
    
    const opcionalesCompletas = seccionesOpcionales.filter(s => 
      getSectionStatus(s.id) === 'completed'
    ).length;
    
    const totalCompletas = obligatoriasCompletas + opcionalesCompletas;
    const progresoGeneral = Math.round((totalCompletas / secciones.length) * 100);
    const progresoObligatorias = Math.round((obligatoriasCompletas / seccionesObligatorias.length) * 100);
    const progresoOpcionales = seccionesOpcionales.length > 0 
      ? Math.round((opcionalesCompletas / seccionesOpcionales.length) * 100)
      : 100;

    return {
      general: progresoGeneral,
      obligatorias: progresoObligatorias,
      opcionales: progresoOpcionales,
      stats: {
        totalSecciones: secciones.length,
        completadas: totalCompletas,
        obligatoriasCompletas,
        totalObligatorias: seccionesObligatorias.length,
        opcionalesCompletas,
        totalOpcionales: seccionesOpcionales.length
      }
    };
  };

  // Verificar si puede finalizar
  const puedeFinalizarCarga = () => {
    const progreso = calcularProgreso();
    const parqueCompleto = auditoriaActual?.parque_informatico_cargado || false;
    
    return progreso.obligatorias === 100 && parqueCompleto;
  };

  const progreso = calcularProgreso();
  const puedeFinalizarEnabled = puedeFinalizarCarga();

  // Versión compacta para header o sidebar
  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Progreso</h4>
          <span className={`text-sm font-semibold ${
            progreso.general >= 100 ? 'text-green-600' :
            progreso.general >= 75 ? 'text-blue-600' :
            progreso.general >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {progreso.general}%
          </span>
        </div>
        
        {/* Barra de progreso general */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progreso.general >= 100 ? 'bg-green-500' :
              progreso.general >= 75 ? 'bg-blue-500' :
              progreso.general >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${progreso.general}%` }}
          ></div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Obligatorias:</span>
            <span className={`font-medium ${
              progreso.obligatorias === 100 ? 'text-green-600' : 'text-red-600'
            }`}>
              {progreso.stats.obligatoriasCompletas}/{progreso.stats.totalObligatorias}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Opcionales:</span>
            <span className="font-medium text-gray-600">
              {progreso.stats.opcionalesCompletas}/{progreso.stats.totalOpcionales}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Parque IT:</span>
            <span className={`font-medium ${
              auditoriaActual?.parque_informatico_cargado ? 'text-green-600' : 'text-red-600'
            }`}>
              {auditoriaActual?.parque_informatico_cargado ? 'Completo' : 'Pendiente'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Estado:</span>
            <span className={`font-medium ${
              puedeFinalizarEnabled ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {puedeFinalizarEnabled ? 'Listo' : 'En progreso'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Versión completa - continuar en próxima función
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header con progreso general */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Progreso de Carga de Información
          </h3>
          <div className="flex items-center space-x-2">
            <TrendingUp className={`${
              progreso.general >= 75 ? 'text-green-500' : 'text-gray-400'
            }`} size={20} />
            <span className={`text-xl font-bold ${
              progreso.general >= 100 ? 'text-green-600' :
              progreso.general >= 75 ? 'text-blue-600' :
              progreso.general >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {progreso.general}%
            </span>
          </div>
        </div>

        {/* Barra de progreso principal */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className={`h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
              progreso.general >= 100 ? 'bg-green-500' :
              progreso.general >= 75 ? 'bg-blue-500' :
              progreso.general >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(progreso.general, 8)}%` }}
          >
            {progreso.general > 15 && (
              <span className="text-white text-xs font-medium">
                {progreso.stats.completadas}/{progreso.stats.totalSecciones}
              </span>
            )}
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Secciones obligatorias */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-red-800">Obligatorias</h4>
              <span className={`text-sm font-bold ${
                progreso.obligatorias === 100 ? 'text-green-600' : 'text-red-600'
              }`}>
                {progreso.obligatorias}%
              </span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  progreso.obligatorias === 100 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${progreso.obligatorias}%` }}
              ></div>
            </div>
            <p className="text-xs text-red-700">
              {progreso.stats.obligatoriasCompletas} de {progreso.stats.totalObligatorias} completadas
            </p>
          </div>

          {/* Secciones opcionales */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-800">Opcionales</h4>
              <span className="text-sm font-bold text-blue-600">
                {progreso.opcionales}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progreso.opcionales}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-700">
              {progreso.stats.opcionalesCompletas} de {progreso.stats.totalOpcionales} completadas
            </p>
          </div>

          {/* Parque informático */}
          <div className={`p-4 rounded-lg border ${
            auditoriaActual?.parque_informatico_cargado 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-medium ${
                auditoriaActual?.parque_informatico_cargado ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Parque Informático
              </h4>
              <span className={`text-sm font-bold ${
                auditoriaActual?.parque_informatico_cargado ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {auditoriaActual?.parque_informatico_cargado ? '100%' : '0%'}
              </span>
            </div>
            <div className={`w-full rounded-full h-2 mb-2 ${
              auditoriaActual?.parque_informatico_cargado ? 'bg-green-200' : 'bg-yellow-200'
            }`}>
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  auditoriaActual?.parque_informatico_cargado ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: auditoriaActual?.parque_informatico_cargado ? '100%' : '0%' }}
              ></div>
            </div>
            <p className={`text-xs ${
              auditoriaActual?.parque_informatico_cargado ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {auditoriaActual?.parque_informatico_cargado ? 'Archivo procesado' : 'Archivo pendiente'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista detallada de secciones */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 mb-3">Detalle por Sección</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {secciones.map((seccion) => {
            const status = getSectionStatus(seccion.id);
            const IconComponent = seccion.icon;
            
            return (
              <div 
                key={seccion.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  status === 'completed' 
                    ? 'bg-green-50 border-green-200'
                    : seccion.obligatoria 
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded ${
                    status === 'completed' 
                      ? 'bg-green-100 text-green-600'
                      : seccion.obligatoria 
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent size={16} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      status === 'completed' ? 'text-green-800' :
                      seccion.obligatoria ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      {seccion.titulo}
                      {seccion.obligatoria && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {seccion.obligatoria ? 'Obligatoria' : 'Opcional'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {status === 'completed' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : status === 'pending' ? (
                    <Circle className="text-gray-400" size={20} />
                  ) : (
                    <Clock className="text-yellow-500" size={20} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado de finalización */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className={`p-4 rounded-lg border-2 ${
          puedeFinalizarEnabled 
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-3">
            {puedeFinalizarEnabled ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <AlertTriangle className="text-yellow-500" size={24} />
            )}
            <div>
              <h4 className={`font-medium ${
                puedeFinalizarEnabled ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {puedeFinalizarEnabled 
                  ? 'Listo para Finalizar Carga'
                  : 'Elementos Pendientes para Finalizar'
                }
              </h4>
              <p className={`text-sm ${
                puedeFinalizarEnabled ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {puedeFinalizarEnabled 
                  ? 'Todas las secciones obligatorias y el parque informático están completos.'
                  : 'Complete las secciones obligatorias y cargue el parque informático para continuar.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">*</span>
            <span>Sección obligatoria</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-500" size={12} />
            <span>Completada</span>
          </div>
          <div className="flex items-center space-x-2">
            <Circle className="text-gray-400" size={12} />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="text-yellow-500" size={12} />
            <span>En proceso</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
