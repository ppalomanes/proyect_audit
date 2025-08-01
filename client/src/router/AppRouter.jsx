// client/src/router/AppRouter.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import useAuthStore from "../domains/auth/authStore";
import { ThemeProvider } from "../contexts/ThemeContext";

// Components
import AuthPage from "../domains/auth/AuthPage";
import MainLayout from "../components/layout/MainLayout";
import Dashboard from "../Dashboard";
import AuditoriasPage from "../domains/auditorias/AuditoriasPage";
import AuditoriaDetallePage from "../domains/auditorias/AuditoriaDetallePage";
import AuditoriaWizard from "../domains/auditorias/components/AuditoriaWizard";
import ETLPage from "../domains/etl/ETLProcessor";
import IAPage from "../domains/ia-scoring/components/IAScoring";
import ChatPage from "../domains/chat/ChatPage";

// ✅ NUEVOS IMPORTS - Módulos implementados
import { BitacoraViewer } from "../domains/bitacora";
import { VersionesViewer } from "../domains/versiones";
import { NotificacionesCenter } from "../domains/notificaciones";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <ThemeProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes with MainLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* ✅ RUTAS DE AUDITORÍAS OPTIMIZADAS */}
                    <Route path="/auditorias" element={<AuditoriasPage />} />
                    <Route path="/auditorias/:auditoriaId" element={<AuditoriaDetallePage />} />
                    <Route path="/auditorias/:auditoriaId/wizard" element={<AuditoriaWizard />} />
                    <Route path="/auditorias/:auditoriaId/editar" element={<AuditoriaWizard />} />
                    
                    <Route path="/etl/*" element={<ETLPage />} />
                    <Route path="/ia-scoring/*" element={<IAPage />} />
                    <Route path="/chat/*" element={<ChatPage />} />
                    
                    {/* ✅ NUEVAS RUTAS - Módulos implementados */}
                    <Route path="/bitacora" element={<BitacoraViewer />} />
                    <Route path="/versiones" element={<VersionesViewer />} />
                    <Route path="/notificaciones" element={<NotificacionesCenter />} />
                    
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default AppRouter;
