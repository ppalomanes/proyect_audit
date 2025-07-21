import React from 'react';

const AuditoriaWorkflow = ({ auditoria, isOpen, onClose, onAvanzarEtapa }) => {
  if (!isOpen) return null;

  const etapas = [
    { numero: 1, nombre: 'Notificación', descripcion: 'Notificación inicial al proveedor' },
    { numero: 2, nombre: 'Carga de Documentos', descripcion: 'Proveedor carga documentos requeridos' },
    { numero: 3, nombre: 'Validación de Documentos', descripcion: 'Revisión y validación de documentos' },
    { numero: 4, nombre: 'Análisis de Parque', descripcion: 'Análisis del parque informático' },
    { numero: 5, nombre: 'Visita Presencial', descripcion: 'Visita presencial a las instalaciones' },
    { numero: 6, nombre: 'Informe Preliminar', descripcion: 'Elaboración de informe preliminar' },
    { numero: 7, nombre: 'Revisión de Observaciones', descripcion: 'Revisión de observaciones del proveedor' },
    { numero: 8, nombre: 'Informe Final', descripcion: 'Elaboración de informe final' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Workflow - {auditoria.codigo_auditoria}
            </h3>
            
            <div className="space-y-4">
              {etapas.map((etapa) => {
                const isCompleted = etapa.numero < auditoria.etapa_actual;
                const isCurrent = etapa.numero === auditoria.etapa_actual;
                const isPending = etapa.numero > auditoria.etapa_actual;

                return (
                  <div key={etapa.numero} className={`p-4 rounded-lg border ${
                    isCompleted ? 'bg-green-50 border-green-200' :
                    isCurrent ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {etapa.numero}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{etapa.nombre}</h4>
                          <p className="text-sm text-gray-600">{etapa.descripcion}</p>
                        </div>
                      </div>
                      {isCurrent && (
                        <button
                          onClick={() => onAvanzarEtapa(auditoria.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                        >
                          Avanzar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaWorkflow;