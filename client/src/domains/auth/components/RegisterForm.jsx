import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../authStore';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    empresa: '',
    telefono: '',
    rol: 'PROVEEDOR'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register, loading, error, clearError } = useAuthStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    if (error) clearError();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = 'La empresa es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    const result = await register(formData);
    if (result.success) {
      onSuccess?.();
    }
  };

  const roles = [
    { value: 'PROVEEDOR', label: 'Proveedor de Servicios' },
    { value: 'AUDITOR', label: 'Auditor' }
  ];

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-2">
              Nombres *
            </label>
            <input
              id="nombres"
              name="nombres"
              type="text"
              required
              className={`input-field ${errors.nombres ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Tus nombres"
              value={formData.nombres}
              onChange={handleInputChange}
            />
            {errors.nombres && (
              <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>
            )}
          </div>

          <div>
            <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-2">
              Apellidos *
            </label>
            <input
              id="apellidos"
              name="apellidos"
              type="text"
              required
              className={`input-field ${errors.apellidos ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Tus apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
            />
            {errors.apellidos && (
              <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="tu@empresa.com"
            value={formData.email}
            onChange={handleInputChange}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña *
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleInputChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Contraseña *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Empresa y Teléfono */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-2">
              Empresa *
            </label>
            <input
              id="empresa"
              name="empresa"
              type="text"
              required
              className={`input-field ${errors.empresa ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Nombre de empresa"
              value={formData.empresa}
              onChange={handleInputChange}
            />
            {errors.empresa && (
              <p className="mt-1 text-sm text-red-600">{errors.empresa}</p>
            )}
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              className="input-field"
              placeholder="123-456-7890"
              value={formData.telefono}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Rol */}
        <div>
          <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Usuario
          </label>
          <select
            id="rol"
            name="rol"
            className="input-field"
            value={formData.rol}
            onChange={handleInputChange}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error en el registro
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Registrando...
              </>
            ) : (
              'Registrarse'
            )}
          </button>
        </div>

        {/* Switch to Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
