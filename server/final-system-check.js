// server/final-system-check.js
// VERIFICACIÓN COMPLETA DEL PORTAL DE AUDITORÍAS TÉCNICAS

const axios = require("axios");
const fs = require("fs");
const path = require("path");

class SystemChecker {
  constructor() {
    this.baseURL = "http://localhost:3002";
    this.results = {
      timestamp: new Date().toISOString(),
      overall_status: "UNKNOWN",
      checks_passed: 0,
      checks_failed: 0,
      details: []
    };
  }

  async runAllChecks() {
    console.log("🎯 === VERIFICACIÓN FINAL DEL SISTEMA ===\n");
    
    await this.checkServerHealth();
    await this.checkEndpoints();
    this.checkFileStructure();
    this.checkDependencies();
    
    this.generateReport();
  }

  async checkServerHealth() {
    console.log("🔍 1. Verificando salud del servidor...");
    
    try {
      const response = await axios.get(`${this.baseURL}/api/health`, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      
      if (response.status === 200) {
        console.log("✅ Servidor respondiendo correctamente");
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Version: ${response.data.version}`);
        
        if (response.data.services?.database === "connected") {
          console.log("✅ Base de datos conectada");
        } else {
          console.log("⚠️  Base de datos no conectada");
        }
        
        this.addResult("Server Health", "PASS", "Servidor funcionando correctamente");
      } else {
        this.addResult("Server Health", "FAIL", `Servidor responde con status ${response.status}`);
        console.log(`❌ Servidor responde con status ${response.status}`);
      }
    } catch (error) {
      this.addResult("Server Health", "FAIL", `Servidor no responde: ${error.message}`);
      console.log("❌ Servidor no responde:", error.message);
    }
  }

  async checkEndpoints() {
    console.log("\n🔌 2. Verificando endpoints críticos...");
    
    const endpoints = [
      { path: "/api/auth/status", name: "Auth" },
      { path: "/api/auditorias", name: "Auditorías" },
      { path: "/api/etl/status", name: "ETL" },
      { path: "/api/chat/health", name: "Chat" },
      { path: "/api/bitacora", name: "Bitácora" }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.baseURL}${endpoint.path}`, { 
          timeout: 3000,
          validateStatus: () => true 
        });
        
        if (response.status === 200 || response.status === 401) {
          console.log(`✅ ${endpoint.name}: OK`);
          this.addResult(`Endpoint ${endpoint.name}`, "PASS", "Endpoint accesible");
        } else {
          console.log(`⚠️  ${endpoint.name}: Status ${response.status}`);
          this.addResult(`Endpoint ${endpoint.name}`, "PARTIAL", `Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
        this.addResult(`Endpoint ${endpoint.name}`, "FAIL", error.message);
      }
    }
  }

  checkFileStructure() {
    console.log("\n📁 3. Verificando estructura de archivos...");
    
    const criticalFiles = [
      { path: "server.js", required: true },
      { path: "package.json", required: true },
      { path: "config/database.js", required: false },
      { path: "domains/auditorias/auditorias.controller.js", required: false },
      { path: "domains/auth/auth.controller.js", required: false }
    ];

    let filesFound = 0;
    const missingRequired = [];
    
    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, file.path);
      
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file.path}`);
        filesFound++;
      } else {
        console.log(`${file.required ? "❌" : "⚠️ "} ${file.path} - ${file.required ? "FALTANTE CRÍTICO" : "Opcional"}`);
        if (file.required) {
          missingRequired.push(file.path);
        }
      }
    }

    if (missingRequired.length === 0) {
      this.addResult("File Structure", "PASS", `${filesFound}/${criticalFiles.length} archivos encontrados`);
    } else {
      this.addResult("File Structure", "FAIL", `Archivos críticos faltantes: ${missingRequired.join(", ")}`);
    }
  }

  checkDependencies() {
    console.log("\n📦 4. Verificando dependencias...");
    
    const packageJsonPath = path.join(__dirname, "package.json");
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log("❌ package.json no encontrado");
      this.addResult("Dependencies", "FAIL", "package.json no encontrado");
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const dependencies = Object.keys(packageJson.dependencies || {});
      
      console.log(`✅ package.json encontrado`);
      console.log(`📋 Dependencias: ${dependencies.length}`);
      
      const criticalDeps = ["express", "cors"];
      const missingCritical = criticalDeps.filter(dep => !dependencies.includes(dep));
      
      if (missingCritical.length === 0) {
        this.addResult("Dependencies", "PASS", `${dependencies.length} dependencias, críticas OK`);
        console.log("✅ Dependencias críticas presentes");
      } else {
        this.addResult("Dependencies", "FAIL", `Dependencias críticas faltantes: ${missingCritical.join(", ")}`);
        console.log(`❌ Dependencias críticas faltantes: ${missingCritical.join(", ")}`);
      }
      
    } catch (error) {
      console.log("❌ Error leyendo package.json:", error.message);
      this.addResult("Dependencies", "FAIL", "Error leyendo package.json");
    }
  }

  addResult(check, status, details) {
    this.results.details.push({
      check,
      status,
      details,
      timestamp: new Date().toISOString()
    });

    if (status === "PASS") {
      this.results.checks_passed++;
    } else {
      this.results.checks_failed++;
    }
  }

  generateReport() {
    const totalChecks = this.results.checks_passed + this.results.checks_failed;
    const successRate = totalChecks > 0 ? (this.results.checks_passed / totalChecks) * 100 : 0;

    if (successRate >= 90) {
      this.results.overall_status = "EXCELENTE";
    } else if (successRate >= 75) {
      this.results.overall_status = "BUENO";
    } else if (successRate >= 50) {
      this.results.overall_status = "FUNCIONAL CON PROBLEMAS";
    } else {
      this.results.overall_status = "REQUIERE ATENCIÓN";
    }

    console.log("\n================================================================================");
    console.log("📊 REPORTE FINAL DE VERIFICACIÓN");
    console.log("================================================================================");
    console.log(`🎯 Estado General: ${this.results.overall_status}`);
    console.log(`✅ Verificaciones Exitosas: ${this.results.checks_passed}`);
    console.log(`❌ Verificaciones Fallidas: ${this.results.checks_failed}`);
    console.log(`📈 Tasa de Éxito: ${successRate.toFixed(1)}%`);
    console.log("================================================================================");

    if (successRate >= 75) {
      console.log("🎉 ¡SISTEMA EN BUEN ESTADO!");
      console.log("🚀 Portal de Auditorías Técnicas operacional");
      console.log("📋 URLs del sistema:");
      console.log("   🌐 Frontend: http://localhost:5173");
      console.log("   🔧 Backend:  http://localhost:3002");
      console.log("   🔍 Health:   http://localhost:3002/api/health");
    } else {
      console.log("⚠️  SISTEMA REQUIERE ATENCIÓN");
      console.log("🛠️  Problemas detectados:");
      
      const failedChecks = this.results.details.filter(d => d.status === "FAIL");
      failedChecks.forEach(check => {
        console.log(`   - ${check.check}: ${check.details}`);
      });
    }

    console.log("================================================================================");

    // Guardar reporte
    try {
      fs.writeFileSync(
        path.join(__dirname, "system-check-report.json"),
        JSON.stringify(this.results, null, 2)
      );
      console.log("📄 Reporte guardado: system-check-report.json");
    } catch (error) {
      console.log("⚠️  No se pudo guardar el reporte:", error.message);
    }

    return this.results;
  }
}

// Función de verificación rápida
async function quickCheck() {
  console.log("🔍 Verificación rápida del sistema...\n");
  
  try {
    const response = await axios.get("http://localhost:3002/api/health", { timeout: 3000 });
    console.log("✅ Backend funcionando");
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Timestamp: ${response.data.timestamp}`);
    return true;
  } catch (error) {
    console.log("❌ Backend no responde:", error.message);
    return false;
  }
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
  const checker = new SystemChecker();
  
  const args = process.argv.slice(2);
  
  if (args.includes("--quick")) {
    quickCheck().then(result => {
      process.exit(result ? 0 : 1);
    });
  } else {
    checker.runAllChecks().catch(error => {
      console.error("💥 Error en verificación:", error);
      process.exit(1);
    });
  }
}

module.exports = { SystemChecker, quickCheck };