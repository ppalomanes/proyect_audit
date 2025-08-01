import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "../domains/auth/authStore";

// Components
import AuthPage from "../domains/auth/AuthPage";
import Dashboard from "../Dashboard";
import DashboardsPage from "../domains/dashboards/DashboardsPage";
import ETLProcessor from "../domains/etl/ETLProcessor";
import AuditoriasPage from "../domains/auditorias/AuditoriasPage";
import { ProtectedRoute, UserProfile } from "../domains/auth/components";
import IAScoring from "../domains/ia-scoring/components/IAScoring";
import AdminPage from "../domains/admin/AdminPage";
import ChatPage from "../domains/chat/ChatPage";
import ClickUpTestPage from "../ClickUpTestPage";

// Nuevo layout con tema oscuro
import { MainLayout } from "../components/layout";

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
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage />
            )
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
            <ProtectedRoute requiredRoles={["ADMIN", "AUDITOR"]}>
              <MainLayout>
                <ETLProcessor />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/auditorias"
          element={
            <ProtectedRoute requiredRoles={["ADMIN", "AUDITOR", "SUPERVISOR"]}>
              <MainLayout>
                <AuditoriasPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ia"
          element={
            <ProtectedRoute requiredRoles={["ADMIN", "AUDITOR"]}>
              <MainLayout>
                <IAScoring />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute
              requiredRoles={["ADMIN", "AUDITOR", "SUPERVISOR", "PROVEEDOR"]}
            >
              <MainLayout>
                <ChatPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <ProtectedRoute requiredRoles={["ADMIN", "AUDITOR", "SUPERVISOR"]}>
              <MainLayout>
                <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
                  <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                    Reportes Avanzados
                  </h1>
                  <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Generación de reportes ejecutivos y análisis comparativos
                  </p>
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <h3 className="mb-2 text-sm font-medium text-green-800 dark:text-green-300">
                      En Planificación
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      📊 Dashboards ejecutivos, exportación PDF y métricas
                      comparativas
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
                <AdminPage />
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
                <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
                  <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                    Configuración de Usuario
                  </h1>
                  <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Personaliza tu experiencia en el Portal de Auditorías
                  </p>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                    <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                      Próximamente
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-400">
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
                <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
                  <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                    Centro de Notificaciones
                  </h1>
                  <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Historial completo de notificaciones y alertas del sistema
                  </p>
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-300">
                      En Desarrollo
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      🔔 Centro de notificaciones con filtros y gestión de
                      preferencias
                    </p>
                  </div>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta de testing ClickUp Sidebar */}
        <Route
          path="/clickup-test"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <MainLayout>
                <ClickUpTestPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirects */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />

        {/* Catch all - redirect to dashboard if authenticated, login if not */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
