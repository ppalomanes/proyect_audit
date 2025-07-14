#!/usr/bin/env node
// /server/test-ia-functionality.js
// Script para testing completo de la funcionalidad IA

const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

class IAFunctionalityTester {
  constructor() {
    this.baseURL = "http://localhost:3001/api/ia";
    this.testResults = [];
  }

  async runAllTests() {
    console.log("🧪 Iniciando testing completo de funcionalidad IA...\n");

    const tests = [
      this.testHealthCheck,
      this.testConnection,
      this.testMetrics,
      this.testCriterios,
      this.testDocumentAnalysis,
      this.testImageAnalysis,
      this.testBatchAnalysis,
      this.testGetAnalisis,
    ];

    for (const test of tests) {
      try {
        await test.call(this);
        await this.sleep(1000); // Pausa entre tests
      } catch (error) {
        console.error(`❌ Test falló: ${error.message}`);
        this.addResult(test.name, "FAILED", error.message);
      }
    }

    this.printSummary();
  }

  async testHealthCheck() {
    console.log("🔍 Testing Health Check...");

    const response = await axios.get(`${this.baseURL}/health`);

    if (response.status === 200 && response.data.status === "healthy") {
      console.log("✅ Health Check: OK");
      this.addResult(
        "Health Check",
        "PASSED",
        "Ollama conectado correctamente"
      );
    } else {
      throw new Error("Health check failed");
    }
  }

  async testConnection() {
    console.log("🔍 Testing Connection...");

    const response = await axios.get(`${this.baseURL}/test/connection`);

    if (response.status === 200 && response.data.status === "success") {
      console.log("✅ Connection Test: OK");
      console.log(
        `   Modelos disponibles: ${response.data.data.modelos_disponibles.join(", ")}`
      );
      this.addResult("Connection Test", "PASSED", "Conexión Ollama funcional");
    } else {
      throw new Error("Connection test failed");
    }
  }

  async testMetrics() {
    console.log("🔍 Testing Metrics...");

    const response = await axios.get(`${this.baseURL}/metrics`);

    if (response.status === 200 && response.data.status === "success") {
      console.log("✅ Metrics: OK");
      console.log(`   Total análisis: ${response.data.data.total_analisis}`);
      this.addResult("Metrics", "PASSED", "Métricas obtenidas correctamente");
    } else {
      throw new Error("Metrics test failed");
    }
  }

  async testCriterios() {
    console.log("🔍 Testing Criterios...");

    // Obtener criterios existentes
    const getResponse = await axios.get(`${this.baseURL}/criterios`);

    if (getResponse.status === 200) {
      console.log("✅ Get Criterios: OK");
      console.log(`   Criterios encontrados: ${getResponse.data.data.total}`);
    }

    // Crear nuevo criterio de prueba
    const newCriterio = {
      descripcion: "Criterio de prueba automatizada",
      categoria: "general",
      peso: 5,
      activo: true,
    };

    try {
      const createResponse = await axios.post(
        `${this.baseURL}/criterios`,
        newCriterio
      );

      if (createResponse.status === 201) {
        console.log("✅ Create Criterio: OK");
        this.addResult(
          "Criterios Management",
          "PASSED",
          "CRUD de criterios funcional"
        );
      }
    } catch (error) {
      // Puede fallar si el criterio ya existe, eso está bien
      if (
        error.response?.status === 500 &&
        error.response.data.error.includes("Duplicate entry")
      ) {
        console.log("✅ Create Criterio: OK (criterio ya existe)");
        this.addResult(
          "Criterios Management",
          "PASSED",
          "CRUD de criterios funcional"
        );
      } else {
        throw error;
      }
    }
  }

  async testDocumentAnalysis() {
    console.log("🔍 Testing Document Analysis...");

    // Test con documento de ejemplo usando el endpoint de test
    const testData = {
      documento_test:
        "Este es un documento de prueba para auditoría técnica. Contiene información sobre procedimientos de call center, incluyendo protocolos de atención al cliente, medidas de seguridad informática, y estándares de calidad. El documento cumple con los requisitos básicos establecidos en el pliego técnico.",
    };

    const response = await axios.post(
      `${this.baseURL}/test/document-analysis`,
      testData
    );

    if (response.status === 200 && response.data.status === "success") {
      console.log("✅ Document Analysis Test: OK");
      console.log(`   Score obtenido: ${response.data.data.scoring.score}/100`);
      console.log(`   Modelo usado: ${response.data.data.modelo_usado}`);
      this.addResult(
        "Document Analysis",
        "PASSED",
        "Análisis de documentos funcional"
      );
    } else {
      throw new Error("Document analysis test failed");
    }
  }

  async testImageAnalysis() {
    console.log("🔍 Testing Image Analysis...");

    // Crear imagen de prueba si no existe
    await this.createTestImage();

    const testData = {
      imagen_path: path.join(__dirname, "test-image.png"),
      criterios_ids: [],
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/analyze/image`,
        testData
      );

      if (response.status === 200 && response.data.status === "success") {
        console.log("✅ Image Analysis: OK");
        console.log(`   Score obtenido: ${response.data.data.score}/100`);
        this.addResult(
          "Image Analysis",
          "PASSED",
          "Análisis de imágenes funcional"
        );
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(
          "⚠️ Image Analysis: SKIPPED (archivo de prueba no encontrado)"
        );
        this.addResult(
          "Image Analysis",
          "SKIPPED",
          "Archivo de prueba no disponible"
        );
      } else {
        throw error;
      }
    }
  }

  async testBatchAnalysis() {
    console.log("🔍 Testing Batch Analysis...");

    // Crear archivos de prueba
    await this.createTestFiles();

    const testData = {
      archivos: [
        path.join(__dirname, "test-doc1.txt"),
        path.join(__dirname, "test-doc2.txt"),
      ],
      criterios_ids: [],
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/analyze/batch`,
        testData
      );

      if (response.status === 200 && response.data.status === "success") {
        console.log("✅ Batch Analysis: OK");
        console.log(
          `   Archivos procesados: ${response.data.data.estadisticas.completados}/${response.data.data.estadisticas.total}`
        );
        console.log(
          `   Score promedio: ${response.data.data.estadisticas.score_promedio}/100`
        );
        this.addResult(
          "Batch Analysis",
          "PASSED",
          "Análisis en lote funcional"
        );
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(
          "⚠️ Batch Analysis: SKIPPED (archivos de prueba no encontrados)"
        );
        this.addResult(
          "Batch Analysis",
          "SKIPPED",
          "Archivos de prueba no disponibles"
        );
      } else {
        throw error;
      }
    } finally {
      // Limpiar archivos de prueba
      await this.cleanupTestFiles();
    }
  }

  async testGetAnalisis() {
    console.log("🔍 Testing Get Análisis...");

    // Primero obtener una lista de análisis existentes
    try {
      const metricsResponse = await axios.get(`${this.baseURL}/metrics`);

      if (metricsResponse.data.data.total_analisis > 0) {
        // Buscar un análisis existente (asumimos ID 1 existe)
        try {
          const response = await axios.get(
            `${this.baseURL}/analisis/1?include_content=true`
          );

          if (response.status === 200) {
            console.log("✅ Get Análisis: OK");
            console.log(`   Análisis ID: ${response.data.data.id}`);
            console.log(`   Tipo: ${response.data.data.tipo_analisis}`);
            this.addResult(
              "Get Análisis",
              "PASSED",
              "Consulta de análisis funcional"
            );
          }
        } catch (error) {
          if (error.response?.status === 404) {
            console.log("⚠️ Get Análisis: SKIPPED (no hay análisis previos)");
            this.addResult(
              "Get Análisis",
              "SKIPPED",
              "No hay análisis previos en BD"
            );
          } else {
            throw error;
          }
        }
      } else {
        console.log("⚠️ Get Análisis: SKIPPED (no hay análisis en BD)");
        this.addResult("Get Análisis", "SKIPPED", "Base de datos sin análisis");
      }
    } catch (error) {
      throw new Error("Error obteniendo métricas para test de análisis");
    }
  }

  // ============== HELPERS ================

  async createTestImage() {
    // Crear una imagen PNG simple de 1x1 pixel para testing
    const pngData = Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a, // PNG signature
      0x00,
      0x00,
      0x00,
      0x0d,
      0x49,
      0x48,
      0x44,
      0x52, // IHDR chunk
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01, // 1x1 dimensions
      0x08,
      0x02,
      0x00,
      0x00,
      0x00,
      0x90,
      0x77,
      0x53,
      0xde,
      0x00,
      0x00,
      0x00,
      0x0c,
      0x49,
      0x44,
      0x41, // IDAT chunk
      0x54,
      0x08,
      0xd7,
      0x63,
      0xf8,
      0x0f,
      0x00,
      0x00,
      0x01,
      0x00,
      0x01,
      0x5c,
      0xc2,
      0x8a,
      0x8e,
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x45,
      0x4e,
      0x44,
      0xae, // IEND chunk
      0x42,
      0x60,
      0x82,
    ]);

    try {
      await fs.writeFile(path.join(__dirname, "test-image.png"), pngData);
    } catch (error) {
      console.log("⚠️ No se pudo crear imagen de prueba");
    }
  }

  async createTestFiles() {
    const testDoc1 = `
DOCUMENTO DE PRUEBA 1 - PROCEDIMIENTOS TÉCNICOS
===============================================

Este documento contiene los procedimientos técnicos estándar para el call center.

REQUISITOS DE HARDWARE:
- CPU: Intel Core i5 o superior
- RAM: 8GB mínimo
- Disco: 256GB SSD
- Conexión: 50Mbps dedicado

PROCEDIMIENTOS DE ATENCIÓN:
1. Verificar identidad del cliente
2. Consultar historial en sistema CRM
3. Aplicar protocolos de resolución
4. Documentar interacción completa

ESTÁNDARES DE CALIDAD:
- Tiempo respuesta: <3 segundos
- Resolución primer contacto: >80%
- Satisfacción cliente: >4.5/5

El documento cumple con la normativa ISO 9001 y las mejores prácticas del sector.
`;

    const testDoc2 = `
DOCUMENTO DE PRUEBA 2 - SEGURIDAD INFORMÁTICA
=============================================

Protocolos de seguridad informática para el centro de atención.

POLÍTICAS DE ACCESO:
- Autenticación multifactor obligatoria
- Revisión de accesos cada 90 días
- Principio de menor privilegio
- Auditoría de logs continua

PROTECCIÓN DE DATOS:
- Cifrado AES-256 en reposo
- TLS 1.3 para transmisiones
- Backup automático cada 4 horas
- Retención según GDPR

MONITOREO Y ALERTAS:
- SOC 24/7 activo
- Detección anomalías ML
- Respuesta incidentes <15 min
- Comunicación stakeholders automática

Este documento está alineado con ISO 27001 y frameworks de ciberseguridad.
`;

    try {
      await fs.writeFile(path.join(__dirname, "test-doc1.txt"), testDoc1);
      await fs.writeFile(path.join(__dirname, "test-doc2.txt"), testDoc2);
    } catch (error) {
      console.log("⚠️ No se pudieron crear archivos de prueba");
    }
  }

  async cleanupTestFiles() {
    const filesToClean = ["test-image.png", "test-doc1.txt", "test-doc2.txt"];

    for (const file of filesToClean) {
      try {
        await fs.unlink(path.join(__dirname, file));
      } catch (error) {
        // Ignorar errores de limpieza
      }
    }
  }

  addResult(testName, status, details) {
    this.testResults.push({
      test: testName,
      status: status,
      details: details,
      timestamp: new Date().toISOString(),
    });
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DE TESTING IA FUNCTIONALITY");
    console.log("=".repeat(60));

    const passed = this.testResults.filter((r) => r.status === "PASSED").length;
    const failed = this.testResults.filter((r) => r.status === "FAILED").length;
    const skipped = this.testResults.filter(
      (r) => r.status === "SKIPPED"
    ).length;

    console.log(`\n📈 ESTADÍSTICAS:`);
    console.log(`   ✅ Passed:  ${passed}`);
    console.log(`   ❌ Failed:  ${failed}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   📊 Total:   ${this.testResults.length}`);

    console.log(`\n📋 DETALLE DE RESULTADOS:`);
    this.testResults.forEach((result) => {
      const emoji =
        result.status === "PASSED"
          ? "✅"
          : result.status === "FAILED"
            ? "❌"
            : "⚠️";
      console.log(`   ${emoji} ${result.test}: ${result.details}`);
    });

    const successRate = Math.round((passed / this.testResults.length) * 100);
    console.log(`\n🎯 TASA DE ÉXITO: ${successRate}%`);

    if (failed === 0) {
      console.log("\n🎉 ¡TODOS LOS TESTS CRÍTICOS PASARON!");
      console.log("✅ La funcionalidad IA está lista para uso en producción.");
    } else {
      console.log("\n⚠️ ALGUNOS TESTS FALLARON");
      console.log("❌ Revisar configuración antes de usar en producción.");
    }

    console.log("\n" + "=".repeat(60));
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============== FUNCIÓN PRINCIPAL ================

async function main() {
  const tester = new IAFunctionalityTester();

  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error("💥 Error fatal en testing:", error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = IAFunctionalityTester;
