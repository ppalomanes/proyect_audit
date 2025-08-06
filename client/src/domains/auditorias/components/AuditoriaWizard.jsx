// AuditoriaWizard.jsx - Componente principal para el proceso de auditoría de 8 etapas
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DocumentArrowUpIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import auditoriaService from '../services/auditoriaService';
import DocumentUpload from './DocumentUpload';
import EtapaProgress from './EtapaProgress';
import useNotificacionesStore from '../../notificaciones/NotificacionesStore';

const AuditoriaWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mostrarNotificacion } = useNotificacionesStore();
  
  // Estado principal
  const [auditoria, setAuditoria] = useState(null);
  const [etapaActual, setEtapaActual] = useState(1);
  const [etapas, setEtapas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estado de carga de documentos
  const [seccionesCompletadas, setSeccionesCompletadas] = useState({});
  const [documentosObligatoriosFaltantes, setDocumentosObligatoriosFaltantes] = useState([]);

  // Definición de las 8 etapas con sus iconos y descripciones
  const ETAPAS_CONFIG = [
    {
      numero: 1,
      nombre: 'Notificación',
      icono: ClipboardDocumentCheckIcon,
      descripcion: 'Inicio del proceso y notificación al proveedor',
      color: 'blue'
    },
    {
      numero: 2,
      nombre: 'Carga Documentos',
      icono: DocumentArrowUpIcon,
      descripcion: 'Carga de 13 documentos requeridos',
      color: 'indigo'
    },
    {
      numero: 3,
      nombre: 'Validación Auto',
      icono: MagnifyingGlassCircleIcon,
      descripcion: 'Validación automática ETL + IA',
      color: 'purple'
    },
    {
      numero: 4,
      nombre: 'Revisión Auditor',
      icono: UserGroupIcon,
      descripcion: 'Evaluación manual por auditor',
      color: 'pink'
    },
    {
      numero: 5,
      nombre: 'Visita Presencial',
      icono: BuildingOfficeIcon,
      descripcion: 'Visita opcional al sitio',
      color: 'orange'
    },
    {
      numero: 6,
      nombre: 'Análisis',
      icono: ChartBarIcon,
      descripcion: 'Consolidación de resultados',
      color: 'yellow'
    },
    {
      numero: 7,
      nombre: 'Informe',
      icono: DocumentTextIcon,
      descripcion: 'Generación de informe final',
      color: 'green'
    },
    {
      numero: 8,
      nombre: 'Cierre',
      icono: CheckCircleIcon,
      descripcion: 'Notificación y cierre',
      color: 'teal'
    }
  ];

  // Secciones de documentos requeridos
  const SECCIONES_DOCUMENTOS = [
    { 
      id: 'TOPOLOGIA', 
      nombre: 'Topología', 
      obligatorio: false,
      descripcion: 'Diagrama de topología de red'
    },
    { 
      id: 'CUARTO_TECNOLOGIA', 
      nombre: 'Cuarto de Tecnología', 
      obligatorio: true,
      descripcion: 'Fotografías e inventario del cuarto técnico'
    },
    { 
      id: 'CONECTIVIDAD', 
      nombre: 'Conectividad', 
      obligatorio: false,
      descripcion: 'Certificación de cableado estructurado'
    },
    { 
      id: 'ENERGIA', 
      nombre: 'Energía', 
      obligatorio: true,
      descripcion: 'Mantenimiento UPS, generador, termografías'
    },
    { 
      id: 'TEMPERATURA_CT', 
      nombre: 'Temperatura CT', 
      obligatorio: false,
      descripcion: 'Mantenimiento de climatización'
    },
    { 
      id: 'SERVIDORES', 
      nombre: 'Servidores', 
      obligatorio: false,
      descripcion: 'Detalles de software y servidores'
    },
    { 
      id: 'INTERNET', 
      nombre: 'Internet', 
      obligatorio: false,
      descripcion: 'Histograma de uso de ancho de banda'
    },
    { 
      id: 'SEGURIDAD_INFORMATICA', 
      nombre: 'Seguridad Informática', 
      obligatorio: true,
      descripcion: 'Documentación de sistemas de seguridad'
    },
    { 
      id: 'PERSONAL_CAPACITADO', 
      nombre: 'Personal Capacitado', 
      obligatorio: false,
      descripcion: 'Detalle de personal IT y horarios'
    },
    { 
      id: 'ESCALAMIENTO', 
      nombre: 'Escalamiento', 
      obligatorio: false,
      descripcion: 'Contactos y procedimientos de escalamiento'
    },
    { 
      id: 'INFORMACION_ENTORNO', 
      nombre: 'Información Entorno', 
      obligatorio: false,
      descripcion: 'Logs de navegación de usuarios'
    },
    { 
      id: 'PARQUE_INFORMATICO', 
      nombre: 'Parque Informático', 
      obligatorio: true,
      descripcion: 'Excel con inventario de hardware (28 campos)'
    },
    { 
      id: 'HARDWARE_SOFTWARE', 
      nombre: 'Hardware y Software', 
      obligatorio: true,
      descripcion: 'Detalle completo de equipos'
    }
  ];

  useEffect(() => {
    if (id) {
      cargarAuditoria();
    }
  }, [id]);

  const cargarAuditoria = async () => {
    try {
      setLoading(true);
      const data = await auditoriaService.obtenerAuditoria(id);
      setAuditoria(data.auditoria);
      setEtapaActual(data.auditoria.etapa_actual);
      setEtapas(data.etapas);
      setDocumentos(data.documentos);
      
      // Verificar documentos cargados
      const seccionesCompletas = {};
      SECCIONES_DOCUMENTOS.forEach(seccion => {
        seccionesCompletas[seccion.id] = data.documentos.some(
          doc => doc.tipo_documento === seccion.id && doc.es_version_actual
        );
      });
      setSeccionesCompletadas(seccionesCompletas);
      
      // Identificar obligatorios faltantes
      const faltantes = SECCIONES_DOCUMENTOS
        .filter(s => s.obligatorio && !seccionesCompletas[s.id])
        .map(s => s.id);
      setDocumentosObligatoriosFaltantes(faltantes);
      
    } catch (error) {
      console.error('Error cargando auditoría:', error);
      mostrarNotificacion('Error al cargar la auditoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (seccionId, archivo, observaciones) => {
    try {
      setGuardando(true);
      
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('tipo', seccionId);
      formData.append('nombre', archivo.name);
      formData.append('observaciones', observaciones || '');
      
      await auditoriaService.cargarDocumento(id, formData);
      
      // Actualizar estado local
      setSeccionesCompletadas(prev => ({
        ...prev,
        [seccionId]: true
      }));
      
      // Actualizar faltantes
      setDocumentosObligatoriosFaltantes(prev => 
        prev.filter(f => f !== seccionId)
      );
      
      mostrarNotificacion('Documento cargado exitosamente', 'success');
      
      // Recargar auditoría para obtener estado actualizado
      await cargarAuditoria();
      
    } catch (error) {
      console.error('Error cargando documento:', error);
      mostrarNotificacion('Error al cargar el documento', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const finalizarCarga = async () => {
    if (documentosObligatoriosFaltantes.length > 0) {
      mostrarNotificacion('Faltan documentos obligatorios', 'warning');
      return;
    }
    
    try {
      setGuardando(true);
      await auditoriaService.finalizarCarga(id);
      mostrarNotificacion('Carga finalizada, iniciando validación automática', 'success');
      await cargarAuditoria();
    } catch (error) {
      console.error('Error finalizando carga:', error);
      mostrarNotificacion(error.message || 'Error al finalizar carga', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const renderEtapaContent = () => {
    switch (etapaActual) {
      case 1:
        return (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-24 h-24 mx-auto text-green-500 mb-4" />
            <h3 className="text-2xl font-semibold text-primary mb-2">
              Auditoría Iniciada
            </h3>
            <p className="text-secondary mb-4">
              Se ha notificado al proveedor para iniciar la carga de documentos
            </p>
            <p className="text-muted">
              Fecha límite de carga: {new Date(auditoria?.fecha_limite_carga).toLocaleDateString()}
            </p>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-4 border border-primary">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Documentos Requeridos
              </h3>
              <p className="text-secondary mb-4">
                Cargue los documentos requeridos para cada sección. 
                Los marcados con (*) son obligatorios.
              </p>
              
              {documentosObligatoriosFaltantes.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      Faltan {documentosObligatoriosFaltantes.length} documentos obligatorios
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECCIONES_DOCUMENTOS.map(seccion => (
                <DocumentUpload
                  key={seccion.id}
                  seccion={seccion}
                  completado={seccionesCompletadas[seccion.id]}
                  onUpload={(archivo, obs) => handleDocumentUpload(seccion.id, archivo, obs)}
                  disabled={guardando || auditoria?.estado !== 'CARGANDO'}
                />
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={finalizarCarga}
                disabled={guardando || documentosObligatoriosFaltantes.length > 0}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all
                  ${documentosObligatoriosFaltantes.length === 0
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {guardando ? 'Procesando...' : 'Finalizar Carga y Validar'}
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-2xl font-semibold text-primary mb-2">
              Validación en Proceso
            </h3>
            <p className="text-secondary mb-4">
              El sistema está validando automáticamente los documentos cargados
            </p>
            <div className="max-w-md mx-auto">
              <div className="bg-card rounded-lg p-4 text-left">
                <div className="flex items-center mb-2">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm">Procesamiento ETL del parque informático</span>
                </div>
                <div className="flex items-center mb-2">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm">Análisis IA de documentos PDF</span>
                </div>
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm">Calculando score automático...</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              {React.createElement(ETAPAS_CONFIG[etapaActual - 1].icono, {
                className: 'w-12 h-12 text-blue-600 dark:text-blue-400'
              })}
            </div>
            <h3 className="text-2xl font-semibold text-primary mb-2">
              {ETAPAS_CONFIG[etapaActual - 1].nombre}
            </h3>
            <p className="text-secondary mb-4">
              {ETAPAS_CONFIG[etapaActual - 1].descripcion}
            </p>
            {auditoria?.score_automatico && (
              <div className="mt-4">
                <p className="text-sm text-muted">Score Automático</p>
                <p className="text-3xl font-bold text-primary">
                  {auditoria.score_automatico}%
                </p>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 mb-6 border border-primary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Auditoría {auditoria?.codigo}
            </h1>
            <p className="text-secondary">
              Período: {auditoria?.periodo} | Estado: {auditoria?.estado}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Fecha límite</p>
            <p className="text-lg font-semibold text-primary">
              {new Date(auditoria?.fecha_limite_carga).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Progress Bar de Etapas */}
        <EtapaProgress 
          etapas={ETAPAS_CONFIG}
          etapaActual={etapaActual}
          etapasCompletadas={etapas.filter(e => e.estado === 'COMPLETADA').map(e => e.numero_etapa)}
        />
      </div>
      
      {/* Contenido de la Etapa */}
      <div className="bg-card rounded-lg p-6 border border-primary">
        {renderEtapaContent()}
      </div>
      
      {/* Navegación */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigate('/auditorias')}
          className="flex items-center px-4 py-2 text-secondary hover:text-primary transition-all"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Volver al listado
        </button>
        
        {etapaActual < 8 && auditoria?.estado !== 'CERRADA' && (
          <button
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            disabled
          >
            Continuar
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AuditoriaWizard;
