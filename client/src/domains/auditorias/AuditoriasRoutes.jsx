// AuditoriasRoutes.jsx - Rutas del módulo de auditorías
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';

// Lazy loading de componentes
const AuditoriasList = lazy(() => import('./components/AuditoriasList'));
const AuditoriaWizard = lazy(() => import('./components/AuditoriaWizard'));
const AuditoriaForm = lazy(() => import('./components/AuditoriaForm'));
const AuditoriaRevisar = lazy(() => import('./components/AuditoriaRevisar'));
const AuditoriaInforme = lazy(() => import('./components/AuditoriaInforme'));

// Componente de carga
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const AuditoriasRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Listado de auditorías - Todos los roles */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR', 'PROVEEDOR', 'VISUALIZADOR']}>
              <AuditoriasList />
            </ProtectedRoute>
          } 
        />
        
        {/* Crear nueva auditoría - Solo ADMIN */}
        <Route 
          path="/nueva" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditoriaForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Ver/Gestionar auditoría - Según rol y etapa */}
        <Route 
          path="/:id" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR', 'PROVEEDOR']}>
              <AuditoriaWizard />
            </ProtectedRoute>
          } 
        />
        
        {/* Revisar auditoría - Solo AUDITOR y ADMIN */}
        <Route 
          path="/:id/revisar" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR']}>
              <AuditoriaRevisar />
            </ProtectedRoute>
          } 
        />
        
        {/* Ver informe - Todos los roles */}
        <Route 
          path="/:id/informe" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR', 'PROVEEDOR', 'VISUALIZADOR']}>
              <AuditoriaInforme />
            </ProtectedRoute>
          } 
        />
        
        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/auditorias" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AuditoriasRoutes;
