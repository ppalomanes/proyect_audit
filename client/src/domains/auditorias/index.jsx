import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuditoriaWizard from './components/AuditoriaWizard';

const AuditoriasRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuditoriasIndex />} />
      <Route path="/nueva" element={<NuevaAuditoria />} />
      <Route path="/:id/wizard" element={<AuditoriaWizard />} />
      <Route path="/:id/resumen" element={<ResumenAuditoria />} />
    </Routes>
  );
};

// Componente temporal para index
const AuditoriasIndex = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Auditorías Técnicas</h1>
    <p>Lista de auditorías disponibles...</p>
  </div>
);

const NuevaAuditoria = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Nueva Auditoría</h1>
    <p>Formulario para crear nueva auditoría...</p>
  </div>
);

const ResumenAuditoria = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Resumen de Auditoría</h1>
    <p>Vista resumen de la auditoría completada...</p>
  </div>
);

export default AuditoriasRoutes;