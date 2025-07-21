import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { auditoriasService } from '../services/auditoriasService';

const CreateAuditoriaModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    proveedor_id: '',
    auditor_principal_id: '',
    auditor_secundario_id: '',
    fecha_programada: '',
    alcance: '',
    observaciones: ''
  });
  
  const [proveedores, setProveedores] = useState([]);
  const [auditores, setAuditores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadProveedores();
      loadAuditores();
      setFormData({
        proveedor_id: '',
        auditor_principal_id: '',
        auditor_secundario_id: '',
        fecha_programada: '',
        alcance: '',
        observaciones: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const loadProveedores = async () => {
    try {
      const data = await auditoriasService.getProveedores();
      setProveedores(data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const loadAuditores = async () => {
    try {
      const data = await auditoriasService.getAuditores();
      setAuditores(data);
    } catch (error) {
      console.error('Error al cargar auditores:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.proveedor_id) {
      newErrors.proveedor_id = 'El proveedor es requerido';
    }

    if (!formData.auditor_principal_id) {
      newErrors.auditor_principal_id = 'El auditor principal es requerido';
    }

    if (!formData.fecha_programada) {
      newErrors.fecha_programada = 'La fecha programada es requerida';
    } else {
      const fechaSeleccionada = new Date(formData.fecha_programada);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        newErrors.fecha_programada = 'La fecha debe ser hoy o posterior';
      }
    }

    if (!formData.alcance) {
      newErrors.alcance = 'El alcance es requerido';
    }

    if (formData.auditor_secundario_id === formData.auditor_principal_id) {
      newErrors.auditor_secundario_id = 'El auditor secundario debe ser diferente al principal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al crear auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Nueva Auditoría</h3>
              <button onClick={onClose} className="bg-white rounded-md text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 sm:p-6 sm:pt-0">
              <div className="space-y-4">
                <div>
                  <label htmlFor="proveedor_id" className="block text-sm font-medium text-gray-700">Proveedor *</label>
                  <select
                    id="proveedor_id"
                    name="proveedor_id"
                    value={formData.proveedor_id}
                    onChange={handleChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.proveedor_id ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
                    ))}
                  </select>
                  {errors.proveedor_id && <p className="mt-1 text-sm text-red-600">{errors.proveedor_id}</p>}
                </div>

                <div>
                  <label htmlFor="auditor_principal_id" className="block text-sm font-medium text-gray-700">Auditor Principal *</label>
                  <select
                    id="auditor_principal_id"
                    name="auditor_principal_id"
                    value={formData.auditor_principal_id}
                    onChange={handleChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.auditor_principal_id ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Seleccionar auditor principal...</option>
                    {auditores.map((auditor) => (
                      <option key={auditor.id} value={auditor.id}>{auditor.nombre} ({auditor.email})</option>
                    ))}
                  </select>
                  {errors.auditor_principal_id && <p className="mt-1 text-sm text-red-600">{errors.auditor_principal_id}</p>}
                </div>

                <div>
                  <label htmlFor="fecha_programada" className="block text-sm font-medium text-gray-700">Fecha Programada *</label>
                  <input
                    type="date"
                    id="fecha_programada"
                    name="fecha_programada"
                    value={formData.fecha_programada}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.fecha_programada ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.fecha_programada && <p className="mt-1 text-sm text-red-600">{errors.fecha_programada}</p>}
                </div>

                <div>
                  <label htmlFor="alcance" className="block text-sm font-medium text-gray-700">Alcance de la Auditoría *</label>
                  <textarea
                    id="alcance"
                    name="alcance"
                    rows={3}
                    value={formData.alcance}
                    onChange={handleChange}
                    placeholder="Describe el alcance de la auditoría..."
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.alcance ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.alcance && <p className="mt-1 text-sm text-red-600">{errors.alcance}</p>}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Auditoría'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuditoriaModal;