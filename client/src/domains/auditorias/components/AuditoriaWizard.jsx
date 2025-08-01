import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  ComputerDesktopIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import useAuditoriaStore, { SECCIONES_AUDITORIA } from '../AuditoriaStore';
import useAuthStore from '../../auth/authStore';
import AuditoriaHeader from './AuditoriaHeader';
import SeccionModal from './SeccionModal';
import ParqueInformaticoModal from './ParqueInformaticoModal';
import StepsNavigation from './StepsNavigation';
import ProgressIndicator from './ProgressIndicator';
import IncumplimientosPanel from './IncumplimientosPanel';

const AuditoriaWizard = () => {
  const { auditoriaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const {
    auditoriaActual,
    documentos,
    parqueInformatico,
    conteos,
    loading,
    error,
    modalSeccionAbierto,
    modalParqueAbierto,
    procesoETLEnCurso,
    
    fetchAuditoria,
    abrirSeccion,
    cerrarSeccion,
    abrirParqueInformatico,
    cerrarParqueInformatico,
    finalizarCarga,
    verificarProgreso,
    getEstadoLegible,
    clearError
  } = useAuditoriaStore();

  const [showComunicaciones, setShowComunicaciones] = useState(false);
  const [mensajeActual, setMensajeActual] = useState('');

  useEffect(() => {
    if (auditoriaId) {
      fetchAuditoria(auditoriaId);
    }
  }, [auditoriaId, fetchAuditoria]);

  const handleFinalizarCarga = async () => {
    try {
      await finalizarCarga(auditoriaId);
      alert('¡Carga finalizada exitosamente! La auditoría ha sido enviada para validación.');
    } catch (error) {
      alert(`Error finalizando carga: ${error.message}`);
    }
  };

  const getSeccionEstado = (seccionId) => {
    if (seccionId === 'parque_informatico') {
      return parqueInformatico.archivo ? 'completa' : 'pendiente';
    }
    
    const documento = documentos.find(d => d.seccion_id === seccionId);
    return documento ? 'completa' : 'pendiente';
  };

  const getSeccionIcon = (seccionId, estado) => {
    if (estado === 'completa') {
      return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
    }
    
    const seccion = SECCIONES_AUDITORIA.find(s => s.id === seccionId);
    if (seccion?.obligatoria) {
      return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
    }
    
    return <ClockIcon className="w-6 h-6 text-gray-400" />;
  };

  const progreso = verificarProgreso();
  const seccionesObligatoriasPendientes = SECCIONES_AUDITORIA
    .filter(s => s.obligatoria && getSeccionEstado(s.id) === 'pendiente')
    .length;

  if (loading && !auditoriaActual) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando auditoría...</p>
        </div>
      </div>
    );
  }

  if (error && !auditoriaActual) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error cargando auditoría</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/auditorias')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Volver a auditorías
          </button>
        </div>
      </div>
    );
  }

  if (!auditoriaActual) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Auditoría no encontrada</p>
        </div>
      </div>
    );
  }

  // Verificar permisos
  const esProveedor = user.rol === 'PROVEEDOR' && user.id === auditoriaActual.proveedor_id;
  const esAuditor = ['AUDITOR', 'ADMIN', 'COORDINADOR'].includes(user.rol);
  const puedeEditar = esProveedor && ['CARGA_PRESENCIAL', 'CARGA_PARQUE'].includes(auditoriaActual.estado);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header de la auditoría */}
      <AuditoriaHeader 
        auditoria={auditoriaActual}
        progreso={progreso}
        onComunicaciones={() => setShowComunicaciones(!showComunicaciones)}
      />

      {/* Navegación de etapas */}
      <StepsNavigation 
        etapaActual={auditoriaActual.etapa_actual}
        estado={auditoriaActual.estado}
      />

      {/* Indicador de progreso */}
      <ProgressIndicator 
        progreso={progreso}
        seccionesCompletas={documentos.length + (parqueInformatico.archivo ? 1 : 0)}
        totalSecciones={SECCIONES_AUDITORIA.length}
        seccionesObligatoriasPendientes={seccionesObligatoriasPendientes}
      />

      {/* Alertas y notificaciones */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationCircleIcon className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado no editable para proveedores */}
      {esProveedor && !puedeEditar && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <ClockIcon className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Estado: {getEstadoLegible(auditoriaActual.estado)}
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                {auditoriaActual.estado === 'VALIDACION_AUTOMATICA' && 
                  'Su auditoría está siendo procesada automáticamente. Recibirá una notificación cuando esté lista.'}
                {auditoriaActual.estado === 'REVISION_AUDITOR' && 
                  'Su auditoría está siendo revisada por los auditores asignados.'}
                {auditoriaActual.estado === 'COMPLETADA' && 
                  'Su auditoría ha sido completada. Puede revisar los resultados finales.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel principal - Secciones de auditoría */}
        <div className="lg:col-span-2">
          {/* Información Presencial */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DocumentTextIcon className="w-6 h-6 text-blue-600 mr-2" />
                Información Presencial
                <span className="ml-2 text-sm text-gray-500">
                  ({SECCIONES_AUDITORIA.filter(s => s.categoria === 'presencial').length} secciones)
                </span>
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SECCIONES_AUDITORIA
                  .filter(s => s.categoria === 'presencial')
                  .map(seccion => {
                    const estado = getSeccionEstado(seccion.id);
                    const documento = documentos.find(d => d.seccion_id === seccion.id);
                    
                    return (
                      <div
                        key={seccion.id}
                        className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                          estado === 'completa' 
                            ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                            : seccion.obligatoria 
                              ? 'border-red-200 bg-red-50 hover:bg-red-100'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        } ${!puedeEditar ? 'cursor-default opacity-75' : ''}`}
                        onClick={() => puedeEditar && abrirSeccion(seccion.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              {getSeccionIcon(seccion.id, estado)}
                              <h4 className="ml-2 text-sm font-medium text-gray-900">
                                {seccion.nombre}
                                {seccion.obligatoria && (
                                  <span className="ml-1 text-red-500">*</span>
                                )}
                              </h4>
                            </div>
                            
                            {documento && (
                              <div className="mt-2 text-xs text-gray-600">
                                <p>Archivo: {documento.nombre_archivo}</p>
                                <p>Cargado: {new Date(documento.fecha_carga).toLocaleDateString()}</p>
                                {documento.observaciones && (
                                  <p className="mt-1 italic">"{documento.observaciones}"</p>
                                )}
                              </div>
                            )}
                            
                            {estado === 'pendiente' && seccion.obligatoria && (
                              <p className="mt-2 text-xs text-red-600">
                                Sección obligatoria pendiente
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Parque Informático */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ComputerDesktopIcon className="w-6 h-6 text-blue-600 mr-2" />
                Parque Informático
                <span className="ml-2 text-red-500">*</span>
                {procesoETLEnCurso && (
                  <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin ml-2" />
                )}
              </h3>
            </div>

            <div className="p-6">
              {parqueInformatico.archivo ? (
                <div className="space-y-4">
                  {/* Resumen del archivo */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">
                          Archivo procesado: {parqueInformatico.archivo}
                        </h4>
                        <div className="mt-1 text-sm text-green-700">
                          <p>Total equipos: {conteos.totalEquipos}</p>
                          <p>On Site (OS): {conteos.equiposOS} | Home Office (HO): {conteos.equiposHO}</p>
                          <p>Cumplen requisitos: {conteos.equiposCumplen} | No cumplen: {conteos.equiposNoCumplen}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={abrirParqueInformatico}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Ver Detalles
                    </button>
                    {puedeEditar && (
                      <button
                        onClick={abrirParqueInformatico}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Actualizar Archivo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ComputerDesktopIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Parque Informático Pendiente
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Debe cargar el archivo Excel/CSV con el inventario de equipos
                  </p>
                  {puedeEditar && (
                    <button
                      onClick={abrirParqueInformatico}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                    >
                      Cargar Parque Informático
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botón de finalizar carga */}
          {puedeEditar && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Finalizar Carga de Documentos
                </h4>
                <p className="text-gray-600 mb-4">
                  Una vez que haya completado todas las secciones obligatorias, 
                  puede finalizar la carga para enviar su auditoría a validación.
                </p>
                
                {seccionesObligatoriasPendientes > 0 ? (
                  <div className="mb-4">
                    <p className="text-red-600 text-sm font-medium">
                      Faltan {seccionesObligatoriasPendientes} secciones obligatorias por completar
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleFinalizarCarga}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium"
                  >
                    {loading ? 'Finalizando...' : 'Finalizar y Enviar Auditoría'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="lg:col-span-1">
          {/* Incumplimientos del parque informático */}
          {parqueInformatico.incumplimientos.length > 0 && (
            <IncumplimientosPanel incumplimientos={parqueInformatico.incumplimientos} />
          )}

          {/* Panel de comunicaciones */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600 mr-2" />
                Comunicaciones
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Use este canal para consultas técnicas o aclaraciones sobre la auditoría.
              </p>
              <button
                onClick={() => setShowComunicaciones(!showComunicaciones)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {showComunicaciones ? 'Ocultar' : 'Abrir'} Chat
              </button>
            </div>
          </div>

          {/* Información de la auditoría */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="text-sm text-gray-900">{getEstadoLegible(auditoriaActual.estado)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Etapa Actual</p>
                <p className="text-sm text-gray-900">{auditoriaActual.etapa_actual} de 8</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha Programada</p>
                <p className="text-sm text-gray-900">
                  {new Date(auditoriaActual.fecha_programada).toLocaleDateString()}
                </p>
              </div>
              {auditoriaActual.fecha_limite && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha Límite</p>
                  <p className="text-sm text-gray-900">
                    {new Date(auditoriaActual.fecha_limite).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Auditor Principal</p>
                <p className="text-sm text-gray-900">
                  {auditoriaActual.AuditorPrincipal?.nombres} {auditoriaActual.AuditorPrincipal?.apellidos}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <SeccionModal 
        isOpen={modalSeccionAbierto}
        onClose={cerrarSeccion}
        auditoriaId={auditoriaId}
      />

      <ParqueInformaticoModal 
        isOpen={modalParqueAbierto}
        onClose={cerrarParqueInformatico}
        auditoriaId={auditoriaId}
      />
    </div>
  );
};

export default AuditoriaWizard;
