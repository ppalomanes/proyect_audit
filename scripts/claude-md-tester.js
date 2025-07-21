#!/usr/bin/env node

/**
 * Script de Testing Completo - Estrategia Claude.md
 * Valida la implementación completa del sistema Claude.md
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ClaudeMDTester {
  constructor() {
    this.projectRoot = process.cwd();
    this.testResults = {
      estructura: [],
      contenido: [],
      scripts: [],
      integridad: []
    };
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runCompleteTest() {
    console.log('🧪 Iniciando Testing Completo de Estrategia Claude.md\n');
    console.log('=' .repeat(60));

    try {
      await this.testProjectStructure();
      await this.testClaudeMDFiles();
      await this.testScripts();
      await this.testIntegrity();
      
      this.printSummary();
      
    } catch (error) {
      console.error('💥 Error fatal en testing:', error.message);
      process.exit(1);
    }
  }

  async testProjectStructure() {
    console.log('\n📁 Testing Estructura del Proyecto');
    console.log('-'.repeat(40));

    const requiredFiles = [
      '.clauderc',
      'PROJECT_OVERVIEW.md',
      'package.json',
      'scripts/claude-md-generator.js',
      'scripts/claude-md-validator.js'
    ];

    for (const file of requiredFiles) {
      await this.runTest(`Verificar ${file}`, async () => {
        const filePath = path.join(this.projectRoot, file);
        
        try {
          await fs.access(filePath);
          return `✅ Archivo ${file} existe`;
        } catch {
          throw new Error(`❌ Archivo ${file} no encontrado`);
        }
      });
    }

    // Verificar estructura de dominios
    const domains = ['auth', 'auditorias', 'etl', 'ia', 'chat', 'notifications', 'entities', 'dashboards'];
    
    for (const domain of domains) {
      await this.runTest(`Verificar directorio ${domain}`, async () => {
        const domainPath = path.join(this.projectRoot, 'server', 'domains', domain);
        
        try {
          await fs.access(domainPath);
          return `✅ Dominio ${domain} existe`;
        } catch {
          throw new Error(`❌ Dominio ${domain} no encontrado`);
        }
      });
    }
  }

  async testClaudeMDFiles() {
    console.log('\n📄 Testing Archivos Claude.md');
    console.log('-'.repeat(40));

    const claudeMDFiles = [
      'PROJECT_OVERVIEW.md',
      'server/domains/auth/Claude.md',
      'server/domains/auditorias/Claude.md',
      'server/domains/etl/Claude.md',
      'server/domains/ia/Claude.md',
      'server/domains/chat/Claude.md',
      'server/domains/notifications/Claude.md',
      'server/domains/entities/Claude.md',
      'server/domains/dashboards/Claude.md'
    ];

    for (const file of claudeMDFiles) {
      await this.runTest(`Validar contenido ${file}`, async () => {
        const filePath = path.join(this.projectRoot, file);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          
          // Validaciones básicas de contenido
          if (!content.includes('# Claude.md') && !content.includes('# PROJECT_OVERVIEW')) {
            throw new Error('No contiene header Claude.md válido');
          }
          
          if (!content.includes('🎯 Propósito') && !content.includes('🎯 Visión General')) {
            throw new Error('No contiene sección de Propósito');
          }
          
          if (content.length < 500) {
            throw new Error('Contenido muy breve, posiblemente incompleto');
          }
          
          return `✅ ${file} - ${content.length} caracteres, estructura válida`;
          
        } catch (error) {
          if (error.code === 'ENOENT') {
            throw new Error(`❌ Archivo ${file} no encontrado`);
          }
          throw new Error(`❌ ${file}: ${error.message}`);
        }
      });
    }
  }

  async testScripts() {
    console.log('\n🤖 Testing Scripts de Automatización');
    console.log('-'.repeat(40));

    // Test .clauderc configuration
    await this.runTest('Validar configuración .clauderc', async () => {
      const configPath = path.join(this.projectRoot, '.clauderc');
      const content = await fs.readFile(configPath, 'utf8');
      
      try {
        const config = JSON.parse(content);
        
        if (!config.project?.name) {
          throw new Error('Falta project.name en configuración');
        }
        
        if (!config.claude_md?.entry_point) {
          throw new Error('Falta claude_md.entry_point en configuración');
        }
        
        if (!config.domains) {
          throw new Error('Falta configuración de dominios');
        }
        
        const expectedDomains = ['auth', 'auditorias', 'etl', 'ia'];
        for (const domain of expectedDomains) {
          if (!config.domains[domain]) {
            throw new Error(`Dominio ${domain} no configurado`);
          }
        }
        
        return `✅ .clauderc válido - ${Object.keys(config.domains).length} dominios configurados`;
        
      } catch (parseError) {
        throw new Error(`JSON inválido: ${parseError.message}`);
      }
    });

    // Test package.json scripts
    await this.runTest('Validar scripts NPM Claude.md', async () => {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(content);
      
      const requiredScripts = [
        'claude:generate',
        'claude:generate:all',
        'claude:validate',
        'claude:rebuild'
      ];
      
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        throw new Error(`Scripts faltantes: ${missingScripts.join(', ')}`);
      }
      
      return `✅ Scripts NPM configurados - ${requiredScripts.length}/4 disponibles`;
    });
  }

  async testIntegrity() {
    console.log('\n🔍 Testing Integridad del Sistema');
    console.log('-'.repeat(40));

    // Test cobertura de documentación
    await this.runTest('Cobertura de documentación Claude.md', async () => {
      const domainsPath = path.join(this.projectRoot, 'server', 'domains');
      
      try {
        const domains = await fs.readdir(domainsPath);
        const claudeMDFiles = [];
        const missingClaudeMD = [];
        
        for (const domain of domains) {
          const domainPath = path.join(domainsPath, domain);
          const stat = await fs.stat(domainPath);
          
          if (stat.isDirectory()) {
            const claudeMDPath = path.join(domainPath, 'Claude.md');
            
            try {
              await fs.access(claudeMDPath);
              claudeMDFiles.push(domain);
            } catch {
              missingClaudeMD.push(domain);
            }
          }
        }
        
        const coverage = (claudeMDFiles.length / domains.length) * 100;
        
        if (coverage < 90) {
          throw new Error(`Cobertura insuficiente: ${coverage.toFixed(1)}%. Faltantes: ${missingClaudeMD.join(', ')}`);
        }
        
        return `✅ Cobertura ${coverage.toFixed(1)}% - ${claudeMDFiles.length}/${domains.length} dominios documentados`;
        
      } catch (error) {
        throw new Error(`Error verificando cobertura: ${error.message}`);
      }
    });
  }

  async runTest(testName, testFunction) {
    this.totalTests++;
    
    try {
      const result = await testFunction();
      console.log(`✅ ${testName}: ${result}`);
      this.passedTests++;
      return true;
    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      return false;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE TESTING CLAUDE.MD');
    console.log('='.repeat(60));
    
    const successRate = (this.passedTests / this.totalTests) * 100;
    
    console.log(`\n🎯 Resultado General:`);
    console.log(`   Tests Ejecutados: ${this.totalTests}`);
    console.log(`   Tests Exitosos: ${this.passedTests}`);
    console.log(`   Tests Fallidos: ${this.totalTests - this.passedTests}`);
    console.log(`   Tasa de Éxito: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 95) {
      console.log('\n🎉 EXCELENTE: Estrategia Claude.md implementada exitosamente!');
      console.log('✅ Sistema listo para uso en desarrollo');
      console.log('🚀 Puedes comenzar a usar los protocolos de interacción');
    } else if (successRate >= 85) {
      console.log('\n⚠️  BUENO: Implementación sólida con algunos aspectos por mejorar');
      console.log('🔧 Revisa los tests fallidos y completa la implementación');
    } else if (successRate >= 70) {
      console.log('\n🟡 REGULAR: Implementación básica, necesita trabajo adicional');
      console.log('📝 Completa los archivos Claude.md faltantes');
      console.log('🔨 Verifica scripts y configuración');
    } else {
      console.log('\n🔴 INSUFICIENTE: Implementación incompleta');
      console.log('❌ Revisa la documentación y completa los componentes faltantes');
      console.log('📖 Consulta el Plan de Acción Inmediato');
    }
    
    console.log('\n📖 Próximos pasos recomendados:');
    
    if (successRate >= 90) {
      console.log('   1. Ejecutar: npm run claude:validate');
      console.log('   2. Comenzar desarrollo con protocolo Claude.md');
      console.log('   3. Entrenar al equipo en patrones de uso');
    } else {
      console.log('   1. Completar archivos Claude.md faltantes');
      console.log('   2. Verificar configuración .clauderc');
      console.log('   3. Re-ejecutar este testing');
    }
    
    console.log('\n📞 Soporte:');
    console.log('   - Consultar PROJECT_OVERVIEW.md para navegación');
    console.log('   - Usar protocolos de consulta definidos');
    console.log('   - Activar Modo Plan para tareas complejas');
    
    console.log('\n' + '='.repeat(60));
    
    // Exit code basado en el resultado
    if (successRate < 70) {
      process.exit(1);
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const tester = new ClaudeMDTester();
  tester.runCompleteTest().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = ClaudeMDTester;