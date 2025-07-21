import React from 'react';

const AuditoriaDetail = ({ auditoria, isOpen, onClose, onUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Detalles de Auditoría - {auditoria.codigo_auditoria}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                  <p className="mt-1 text-sm text-gray-900">{auditoria.proveedor?.nombre || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <p className="mt-1 text-sm text-gray-900">{auditoria.estado}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etapa Actual</label>
                  <p className="mt-1 text-sm text-gray-900">{auditoria.etapa_actual}/8</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Programada</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {auditoria.fecha_programada ? new Date(auditoria.fecha_programada).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alcance</label>
                <p className="mt-1 text-sm text-gray-900">{auditoria.alcance || 'N/A'}</p>
              </div>
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

export default AuditoriaDetail;