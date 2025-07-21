/**
 * Testing Automatizado - Módulo ETL
 * Portal de Auditorías Técnicas
 */

const fs = require('fs');
const path = require('path');

// Configuración del testing
const CONFIG = {
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  retries: 3
};

// Utilidades de testing
class ETLTester {
  constructor() {
    this.baseURL = CONFIG.baseURL;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  // Método principal de testing
  async runAllTests() {
    console.log('🚀 Iniciando Testing Automatizado del Módulo ETL\n');
    console.log('================================================================\n');
    
    try {
      // Verificar conectividad
      await this.testConnectivity();
      
      // Tests básicos de endpoints
      await this.testBasicEndpoints();
      
      // Tests de funcionalidad
      await this.testJobManagement();
      
      // Tests de configuración
      await this.testConfiguration();
      
      // Generar reporte final
      this.generateReport();
      
    } catch (error) {
      console.error('💥 Error fatal en testing:', error.message);
      process.exit(1);
    }
  }

  // ============================================
  // TESTS DE CONECTIVIDAD
  // ============================================

  async testConnectivity() {
    console.log('🔗 Testing Conectividad...\n');

    await this.runTest('Health check del módulo ETL', async () => {
      const response = await this.makeRequest('GET', '/api/etl/health');
      
      if (response.status !== 200) {
        throw new Error(`Health check falló. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.success || data.data.status !== 'healthy') {
        throw new Error('Módulo ETL no está healthy');
      }
      
      return `ETL Health: ${data.data.status} - Version: ${data.data.version}`;
    });

    await this.runTest('Verificación de versión', async () => {
      const response = await this.makeRequest('GET', '/api/etl/version');
      
      if (response.status !== 200) {
        throw new Error(`Versión no disponible. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.data.version || !data.data.module) {
        throw new Error('Información de versión incompleta');
      }
      
      return `Módulo ${data.data.module} v${data.data.version} - ${data.data.endpoints_disponibles} endpoints`;
    });
  }

  // ============================================
  // TESTS DE ENDPOINTS BÁSICOS
  // ============================================

  async testBasicEndpoints() {
    console.log('📋 Testing Endpoints Básicos...\n');

    await this.runTest('Obtener esquema normalizado', async () => {
      const response = await this.makeRequest('GET', '/api/etl/schema');
      
      if (response.status !== 200) {
        throw new Error(`Esquema no disponible. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.data.esquema || data.data.total_campos !== 28) {
        throw new Error('Esquema normalizado incompleto');
      }
      
      return `Esquema normalizado: ${data.data.total_campos} campos definidos`;
    });

    await this.runTest('Obtener reglas de validación', async () => {
      const response = await this.makeRequest('GET', '/api/etl/validation-rules');
      
      if (response.status !== 200) {
        throw new Error(`Reglas no disponibles. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.data.reglas_esquema || !data.data.reglas_negocio) {
        throw new Error('Reglas de validación incompletas');
      }
      
      return 'Reglas de validación disponibles y completas';
    });

    await this.runTest('Obtener métricas de procesamiento', async () => {
      const response = await this.makeRequest('GET', '/api/etl/metrics?periodo=7d');
      
      if (response.status !== 200) {
        throw new Error(`Métricas no disponibles. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (typeof data.data.total_jobs === 'undefined') {
        throw new Error('Métricas incompletas');
      }
      
      return `Métricas: ${data.data.total_jobs} jobs totales, Success rate: ${data.data.success_rate}%`;
    });

    await this.runTest('Dashboard de calidad', async () => {
      const response = await this.makeRequest('GET', '/api/etl/quality-dashboard');
      
      if (response.status !== 200) {
        throw new Error(`Dashboard no disponible. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.data.metricas_calidad) {
        throw new Error('Dashboard de calidad incompleto');
      }
      
      return `Dashboard: Score promedio ${data.data.metricas_calidad.score_promedio_global}`;
    });
  }

  // ============================================
  // TESTS DE GESTIÓN DE JOBS
  // ============================================

  async testJobManagement() {
    console.log('⚙️ Testing Gestión de Jobs...\n');

    await this.runTest('Listar jobs ETL', async () => {
      const response = await this.makeRequest('GET', '/api/etl/jobs?limit=5');
      
      if (response.status !== 200) {
        throw new Error(`Lista de jobs no disponible. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!Array.isArray(data.jobs)) {
        throw new Error('Respuesta no contiene array de jobs');
      }
      
      return `${data.jobs.length} jobs listados. Paginación funcionando.`;
    });

    await this.runTest('Filtrar jobs por estado', async () => {
      const response = await this.makeRequest('GET', '/api/etl/jobs?estado=COMPLETADO');
      
      if (response.status !== 200) {
        throw new Error(`Filtro por estado falló. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!Array.isArray(data.jobs)) {
        throw new Error('Filtro no devuelve array válido');
      }
      
      return `Filtro por estado funcionando. ${data.jobs.length} jobs COMPLETADO.`;
    });
  }

  // ============================================
  // TESTS DE CONFIGURACIÓN
  // ============================================

  async testConfiguration() {
    console.log('⚙️ Testing Configuración...\n');

    await this.runTest('Configurar reglas de validación', async () => {
      const reglas = {
        reglas: {
          ram_minima_gb: 8,
          cpu_minima_ghz: 2.5,
          os_soportados: ['Windows 10', 'Windows 11']
        }
      };

      const response = await this.makeRequest('POST', '/api/etl/validation-rules', reglas);
      
      if (response.status !== 200) {
        throw new Error(`Configuración de reglas falló. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.success) {
        throw new Error('Configuración de reglas no exitosa');
      }
      
      return 'Reglas de validación configuradas correctamente';
    });

    await this.runTest('Generar reporte de calidad', async () => {
      const reportConfig = {
        tipo_reporte: 'quality',
        formato_salida: 'json'
      };

      const response = await this.makeRequest('POST', '/api/etl/reports/quality', reportConfig);
      
      if (response.status !== 200) {
        throw new Error(`Generación de reporte falló. Status: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.reporte_id) {
        throw new Error('No se generó ID de reporte');
      }
      
      return `Reporte generado exitosamente: ${data.reporte_id}`;
    });
  }

  // ============================================
  // UTILIDADES DE TESTING
  // ============================================

  async makeRequest(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      let response;
      
      if (method === 'GET') {
        response = await fetch(url);
      } else if (method === 'POST') {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else if (method === 'PUT') {
        response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else if (method === 'DELETE') {
        response = await fetch(url, { method: 'DELETE' });
      }
      
      const responseData = await response.json();
      
      return {
        status: response.status,
        data: responseData
      };
      
    } catch (error) {
      throw new Error(`Request falló: ${error.message}`);
    }
  }

  async runTest(name, testFunction) {
    this.testResults.total++;
    
    try {
      console.log(`🧪 ${name}...`);
      const result = await testFunction();
      
      this.testResults.passed++;
      this.testResults.details.push({
        name,
        status: 'PASSED',
        result,
        timestamp: new Date().toISOString()
      });
      
      console.log(`   ✅ ${result}`);
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        name,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.log(`   ❌ ${error.message}`);
    }
    
    console.log('');
  }

  generateReport() {
    console.log('================================================================');
    console.log('📊 REPORTE FINAL DE TESTING ETL');
    console.log('================================================================');
    console.log('');
    
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    
    console.log(`📈 Resumen General:`);
    console.log(`   Total Tests: ${this.testResults.total}`);
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   📊 Success Rate: ${successRate}%`);
    console.log('');
    
    if (this.testResults.failed > 0) {
      console.log('❌ Tests Fallidos:');
      this.testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
      console.log('');
    }
    
    console.log('✅ Tests Exitosos:');
    this.testResults.details
      .filter(test => test.status === 'PASSED')
      .forEach(test => {
        console.log(`   • ${test.name}`);
      });
    console.log('');
    
    // Guardar reporte en archivo
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        success_rate: successRate
      },
      details: this.testResults.details
    };
    
    try {
      fs.writeFileSync('etl-test-report.json', JSON.stringify(reportData, null, 2));
      console.log('📄 Reporte guardado en: etl-test-report.json');
    } catch (error) {
      console.log('⚠️  No se pudo guardar el reporte en archivo');
    }
    
    if (this.testResults.failed === 0) {
      console.log('');
      console.log('🎉 ¡TODOS LOS TESTS PASARON! Módulo ETL funcionando correctamente.');
      process.exit(0);
    } else {
      console.log('');
      console.log('⚠️  Algunos tests fallaron. Revisar implementación.');
      process.exit(1);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

// Polyfill para fetch si no está disponible
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (error) {
    console.error('❌ node-fetch no está instalado. Ejecute: npm install node-fetch');
    process.exit(1);
  }
}

async function main() {
  const tester = new ETLTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Error ejecutando tests:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = ETLTester;
