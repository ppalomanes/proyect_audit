import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../domains/auth/authStore';

// Components
import AuthPage from '../domains/auth/AuthPage';
import Dashboard from '../Dashboard';
import DashboardsPage from '../domains/dashboards/DashboardsPage';
import ETLProcessor from '../domains/etl/ETLProcessor';
import AuditoriasPage from '../domains/auditorias/AuditoriasPage';
import { ProtectedRoute, UserProfile } from '../domains/auth/components';

// Nuevo layout con tema oscuro
import { MainLayout } from '../components/layout';

const AppRouter = () => {
  const { initializeAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
          } 
        />

        {/* Protected Routes con MainLayout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardsPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard-old" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserProfile />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/etl" 
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'AUDITOR']}>
              <MainLayout>
                <ETLProcessor />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/auditorias" 
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'AUDITOR', 'SUPERVISOR']}>
              <MainLayout>
                <AuditoriasPage />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/ia" 
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'AUDITOR']}>
              <MainLayout>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Módulo de IA Scoring</h1>
                  <p className="text-gray-600 mb-6">
                    Análisis automático de documentos con Ollama - Sistema de IA local
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Estado del Módulo</h3>
                    <p className="text-sm text-blue-700">
                      🚧 En desarrollo - Próximamente disponible para análisis de documentos PDF e imágenes
                    </p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/chat" 
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'AUDITOR', 'SUPERVISOR', 'PROVEEDOR']}>
              <MainLayout>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Sistema de Chat</h1>
                  <p className="text-gray-600 mb-6">
                    Comunicación asíncrona entre auditores y proveedores
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Próximamente</h3>
                    <p className="text-sm text-yellow-700">
                      💬 Mensajería en tiempo real con WebSockets y notificaciones push
                    </p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/reportes" 
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'AUDITOR', 'SUPERVISOR']}>
              <MainLayout>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Reportes Avanzados</h1>
                  <p className="text-gray-600 mb-6">
                    Generación de reportes ejecutivos y análisis comparativos
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-800 mb-2">En Planificación</h3>
                    <p className="text-sm text-green-700">
                      📊 Dashboards ejecutivos, exportación PDF y métricas comparativas
                    </p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="ADMIN" showUnauthorized={true}>
              <MainLayout>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Panel de Administración</h1>
                  <p className="text-gray-600 mb-6">
                    Gestión completa del sistema - Solo para administradores
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Gestión de Usuarios */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-purple-800 mb-2">👥 Usuarios</h3>
                      <p className="text-sm text-purple-700 mb-3">
                        Gestión de usuarios, roles y permisos del sistema
                      </p>
                      <button className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors">
                        Gestionar
                      </button>
                    </div>
                    
                    {/* Configuración del Sistema */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">⚙️ Sistema</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Configuración global, parámetros y variables del sistema
                      </p>
                      <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                        Configurar
                      </button>
                    </div>
                    
                    {/* Logs y Monitoreo */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">📊 Monitoreo</h3>
                      <p className="text-sm text-red-700 mb-3">
                        Logs del sistema, métricas de performance y alertas
                      </p>
                      <button className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors">
                        Ver Logs
                      </button>
                    </div>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Rutas adicionales para páginas individuales */}
        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserProfile />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/configuracion" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Configuración de Usuario</h1>
                  <p className="text-gray-600 mb-6">
                    Personaliza tu experiencia en el Portal de Auditorías
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">Próximamente</h3>
                    <p className="text-sm text-gray-700">
                      ⚙️ Configuración de preferencias, notificaciones y tema
                    </p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/notificaciones" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Centro de Notificaciones</h1>
                  <p className="text-gray-600 mb-6">
                    Historial completo de notificaciones y alertas del sistema
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">En Desarrollo</h3>
                    <p className="text-sm text-blue-700">
                      🔔 Centro de notificaciones con filtros y gestión de preferencias
                    </p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Default redirects */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
        
        {/* Catch all - redirect to dashboard if authenticated, login if not */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
