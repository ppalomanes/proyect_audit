import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../domains/auth/authStore';

// Components
import Login from '../domains/auth/Login';
import Dashboard from '../Dashboard';
import ETLProcessor from '../domains/etl/ETLProcessor';
import Navbar from '../layout/Navbar';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
};

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
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/etl" 
          element={
            <ProtectedRoute>
              <ETLProcessor />
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
