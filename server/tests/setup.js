// server/tests/setup.js
// CONFIGURACIÓN DE JEST PARA PORTAL DE AUDITORÍAS TÉCNICAS

const path = require("path");

// Configurar variables de entorno para tests
process.env.NODE_ENV = "test";
process.env.PORT = "3003";
process.env.DB_NAME = "portal_auditorias_test";

// Mock básico de Sequelize para tests que no requieren DB real
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  getQueryInterface: jest.fn().mockReturnValue({
    showAllTables: jest.fn().mockResolvedValue(["usuarios", "auditorias", "documentos"])
  })
};

// Mock de modelos básicos
const mockModels = {
  Usuario: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Auditoria: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Documento: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
};

// Configuración global de Jest
beforeAll(async () => {
  console.log("🧪 Configurando entorno de tests...");
  
  // Mock de servicios globales
  global.mockSequelize = mockSequelize;
  global.mockModels = mockModels;
  
  // Mock de servicios de bitácora
  global.mockBitacoraService = {
    registrar: jest.fn().mockResolvedValue({ id: "mock-bitacora-id" }),
    obtenerLogReciente: jest.fn().mockResolvedValue([])
  };
  
  // Mock de servicios de versionado
  global.mockVersioningService = {
    crearVersion: jest.fn().mockResolvedValue({ version: "1.0" }),
    obtenerHistorial: jest.fn().mockResolvedValue([]),
    restaurarVersion: jest.fn().mockResolvedValue({ success: true })
  };
  
  console.log("✅ Entorno de tests configurado");
});

afterAll(async () => {
  console.log("🧹 Limpiando entorno de tests...");
  jest.clearAllMocks();
  jest.restoreAllMocks();
  console.log("✅ Entorno de tests limpiado");
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});

// Configuración de timeouts
jest.setTimeout(30000);

// Helpers para tests
global.testHelpers = {
  createMockRequest: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    user: { id: "test-user-id", rol: "admin" },
    ip: "127.0.0.1",
    ...overrides
  }),
  
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },
  
  createMockNext: () => jest.fn(),
  
  createTestData: {
    usuario: {
      id: "test-user-id",
      email: "test@example.com",
      nombre: "Usuario Test",
      rol: "admin"
    },
    auditoria: {
      id: "test-auditoria-id",
      proveedor_id: "test-proveedor-id",
      sitio_id: "test-sitio-id",
      estado: "EN_CURSO",
      etapa_actual: 1
    }
  }
};

// Mock de axios para requests HTTP en tests
jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ status: 200, data: {} })),
    post: jest.fn(() => Promise.resolve({ status: 200, data: {} })),
    put: jest.fn(() => Promise.resolve({ status: 200, data: {} })),
    delete: jest.fn(() => Promise.resolve({ status: 200, data: {} }))
  }
}));