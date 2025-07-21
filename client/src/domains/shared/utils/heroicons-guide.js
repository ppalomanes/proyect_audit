// GUIA DE ICONOS HEROICONS V2 CORRECTOS
// Para evitar errores de importación

// ✅ ICONOS CORRECTOS (Heroicons v2)
export const ICONOS_CORRECTOS = {
  // Básicos
  'CheckIcon': '✅ Correcto',
  'XMarkIcon': '✅ Correcto', 
  'PlusIcon': '✅ Correcto',
  'PencilIcon': '✅ Correcto',
  'EyeIcon': '✅ Correcto',
  'PlayIcon': '✅ Correcto',
  
  // Navegación
  'ChevronLeftIcon': '✅ Correcto',
  'ChevronRightIcon': '✅ Correcto',
  'ArrowLeftIcon': '✅ Correcto',
  'ArrowRightIcon': '✅ Correcto',
  
  // Documentos
  'DocumentTextIcon': '✅ Correcto',
  'ClipboardDocumentListIcon': '✅ Correcto',
  'FolderIcon': '✅ Correcto',
  
  // Usuarios y Auth
  'UserIcon': '✅ Correcto',
  'UsersIcon': '✅ Correcto',
  'LockClosedIcon': '✅ Correcto',
  
  // Métricas y Stats
  'ChartBarIcon': '✅ Correcto',
  'ArrowTrendingUpIcon': '✅ Correcto',  // NO TrendingUpIcon
  'ArrowTrendingDownIcon': '✅ Correcto', // NO TrendingDownIcon
  
  // Filtros y Búsqueda
  'FunnelIcon': '✅ Correcto',
  'MagnifyingGlassIcon': '✅ Correcto',
  
  // Fechas y Tiempo
  'CalendarIcon': '✅ Correcto',
  'ClockIcon': '✅ Correcto',
  
  // Estados
  'ExclamationTriangleIcon': '✅ Correcto',
  'InformationCircleIcon': '✅ Correcto',
  'CheckCircleIcon': '✅ Correcto'
};

// ❌ ICONOS INCORRECTOS (NO EXISTEN EN HEROICONS V2)
export const ICONOS_INCORRECTOS = {
  'TrendingUpIcon': '❌ NO EXISTE - Usar ArrowTrendingUpIcon',
  'TrendingDownIcon': '❌ NO EXISTE - Usar ArrowTrendingDownIcon',
  'SearchIcon': '❌ NO EXISTE - Usar MagnifyingGlassIcon',
  'FilterIcon': '❌ NO EXISTE - Usar FunnelIcon',
  'DotsVerticalIcon': '❌ NO EXISTE - Usar EllipsisVerticalIcon',
  'DotsHorizontalIcon': '❌ NO EXISTE - Usar EllipsisHorizontalIcon'
};

// EJEMPLO DE USO CORRECTO:
// import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';