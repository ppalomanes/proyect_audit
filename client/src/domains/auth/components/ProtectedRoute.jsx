import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../authStore';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = null,
  fallbackPath = '/login',
  showUnauthorized = false 
}) => {
  const { isAuthenticated, user, hasRole, hasAnyRole } = useAuthStore();
  const location = useLocation();

  // No autenticado
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verificar rol específico
  if (requiredRole && !hasRole(requiredRole)) {
    if (showUnauthorized) {
      return <UnauthorizedComponent />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar múltiples roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    if (showUnauthorized) {
      return <UnauthorizedComponent />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const UnauthorizedComponent = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acceso No Autorizado
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          No tienes permisos para acceder a esta sección del portal.
        </p>
        <button
          onClick={() => window.history.back()}
          className="btn-primary"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
