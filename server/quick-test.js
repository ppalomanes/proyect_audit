#!/usr/bin/env node
// /server/quick-test.js
// Script de testing rápido para validar funcionalidad IA

const axios = require('axios');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001/api/ia';

async function runQuickTests() {
  console.log('🧪 Ejecutando tests rápidos del módulo IA...\n');

  const tests = [
    {
      name: 'Health Check',
      test: () => axios.get(`${BASE_URL}/health`),
      expect: (res) => res.status === 200 && res.data.status === 'healthy'
    },
    {
      name: 'Test Connection',
      test: () => axios.get(`${BASE_URL}/test/connection`),
      expect: (res) => res.status === 200 && res.data.status === 'success'
    },
    {
      name: 'Get Metrics',
      test: () => axios.get(`${BASE_URL}/metrics`),
      expect: (res) => res.status === 200
    },
    {
      name: 'Get Criterios',
      test: () => axios.get(`${BASE_URL}/criterios`),
      expect: (res) => res.status === 200 && res.data.data.criterios
    },
    {
      name: 'Test Document Analysis',
      test: () => axios.post(`${BASE_URL}/test/document-analysis`, {
        documento_test: 'Este es un documento de prueba para análisis IA. Contiene información técnica sobre call centers.'
      }),
      expect: (res) => res.status === 200 && res.data.data.analisis_resultado
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const response = await test.test();
      
      if (test.expect(response)) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED (unexpected response)`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED (${error.message})`);
      failed++;
    }
    
    // Pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADOS:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡Todos los tests pasaron! El módulo IA está funcionando correctamente.');
  } else {
    console.log('\n⚠️ Algunos tests fallaron. Verificar configuración.');
  }
  
  console.log('='.repeat(50));
}

// Test específico de análisis con archivo real
async function testRealFileAnalysis() {
  console.log('\n🔍 Test adicional: Análisis con archivo real...');
  
  try {
    // Crear archivo de prueba
    const testContent = `
DOCUMENTO DE AUDITORÍA TÉCNICA
==============================

INFORMACIÓN DEL PROVEEDOR:
Nombre: Call Center Solutions S.A.
Ubicación: Madrid, España
Servicios: Atención al cliente, soporte técnico

INFRAESTRUCTURA TÉCNICA:
- Servidores: Dell PowerEdge R740
- Conexión: Fibra óptica 1Gbps
- Backup: Cada 4 horas automático
- Antivirus: Windows Defender actualizado

PROCEDIMIENTOS:
1. Protocolo de atención estándar
2. Escalamiento a supervisores
3. Documentación de casos
4. Seguimiento post-resolución

CUMPLIMIENTO:
- ISO 27001: Certificado vigente
- GDPR: Políticas implementadas
- Auditorías: Trimestrales

Este documento cumple con los estándares requeridos.
`;

    await fs.writeFile('./test-document.txt', testContent);
    
    const response = await axios.post(`${BASE_URL}/analyze/document`, {
      documento_path: './test-document.txt',
      criterios_ids: [],
      auditoria_id: 1
    });
    
    if (response.status === 200) {
      console.log('✅ Análisis de archivo real: PASSED');
      console.log(`   Score obtenido: ${response.data.data.score}/100`);
      console.log(`   Recomendaciones: ${response.data.data.recomendaciones.length}`);
    }
    
    // Limpiar archivo de prueba
    await fs.unlink('./test-document.txt');
    
  } catch (error) {
    console.log(`❌ Análisis de archivo real: FAILED (${error.message})`);
  }
}

async function main() {
  try {
    await runQuickTests();
    await testRealFileAnalysis();
  } catch (error) {
    console.error('💥 Error en testing:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runQuickTests, testRealFileAnalysis };
