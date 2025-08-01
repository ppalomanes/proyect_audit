// client/src/domains/auditorias/index.js

// Componentes principales
export { default as AuditoriaWizard } from './components/AuditoriaWizard';
export { default as AuditoriaHeader } from './components/AuditoriaHeader';

// Componentes auxiliares
export { default as SeccionModal } from './components/SeccionModal';
export { default as ParqueInformaticoModal } from './components/ParqueInformaticoModal';
export { default as StepsNavigation } from './components/StepsNavigation';
export { default as ProgressIndicator } from './components/ProgressIndicator';
export { default as IncumplimientosPanel } from './components/IncumplimientosPanel';

// Stores
export { useAuditoriaStore } from './stores/AuditoriaStore';

// Servicios
export { default as auditoriaService } from './services/auditoriaService';