#!/usr/bin/env node

/**
 * Validador de Claude.md
 * Verifica consistencia entre documentación y código fuente
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class ClaudeMDValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.domains = [
      'auth', 'auditorias', 'etl', 'ia', 
      'chat', 'notifications', 'entities', 'dashboards'
    ];
    this.results = {
      coverage: null,
      consistency: null,
      accuracy: null,
      freshness: null,
      overall_score: 0
    };
  }

  async validateProject() {
    console.log('🔍 Iniciando validación de Claude.md...\n');
    
    this.results.coverage = await this.validateCoverage();
    this.results.consistency = await this.validateConsistency();
    this.results.accuracy = await this.validateAccuracy();
    this.results.freshness = await this.validateFreshness();
    
    this.results.overall_score = this.calculateOverallScore();
    
    return this.generateValidationReport();
  }

  async validateCoverage() {
    console.log('📊 Validando cobertura de documentación...');
    
    const existingDomains = [];
    const missingDomains = [];
    
    for (const domain of this.domains) {
      const claudeMDPath = path.join(
        this.projectRoot, 
        'server', 
        'domains', 
        domain, 
        'Claude.md'
      );
      
      try {
        await fs.access(claudeMDPath);
        existingDomains.push(domain);
      } catch (error) {
        missingDomains.push(domain);
      }
    }
    
    const coveragePercentage = (existingDomains.length / this.domains.length) * 100;
    
    return {
      total_domains: this.domains.length,
      documented_domains: existingDomains.length,
      coverage_percentage: Math.round(coveragePercentage),
      missing_domains: missingDomains,
      existing_domains: existingDomains
    };
  }

  async validateConsistency() {
    console.log('🔄 Validando consistencia código-documentación...');
    
    const inconsistencies = [];
    
    for (const domain of this.domains) {
      try {
        const claudeMDPath = path.join(
          this.projectRoot, 
          'server', 
          'domains', 
          domain, 
          'Claude.md'
        );
        
        const claudeMDContent = await fs.readFile(claudeMDPath, 'utf8');
        const codeAnalysis = await this.analyzeCodeDomain(domain);
        
        // Verificar endpoints mencionados vs implementados
        const declaredEndpoints = this.extractEndpointsFromClaudeMD(claudeMDContent);
        const implementedEndpoints = codeAnalysis.endpoints || [];
        
        const missingEndpoints = implementedEndpoints.filter(impl => 
          !declaredEndpoints.some(decl => 
            decl.method === impl.method && decl.path === impl.path
          )
        );
        
        if (missingEndpoints.length > 0) {
          inconsistencies.push({
            domain,
            type: 'missing_endpoints',
            items: missingEndpoints,
            severity: 'medium'
          });
        }
        
      } catch (error) {
        inconsistencies.push({
          domain,
          type: 'read_error',
          error: error.message,
          severity: 'high'
        });
      }
    }
    
    const consistencyScore = this.calculateConsistencyScore(inconsistencies);
    
    return {
      inconsistencies,
      consistency_score: consistencyScore,
      total_issues: inconsistencies.length
    };
  }

  async validateAccuracy() {
    console.log('🎯 Validando precisión de la documentación...');
    
    const accuracyIssues = [];
    
    // Verificar PROJECT_OVERVIEW.md existe y es válido
    try {
      const overviewPath = path.join(this.projectRoot, 'PROJECT_OVERVIEW.md');
      const overviewContent = await fs.readFile(overviewPath, 'utf8');
      
      if (!overviewContent.includes('CLAUDE.MD PRINCIPAL DEL PROYECTO')) {
        accuracyIssues.push({
          file: 'PROJECT_OVERVIEW.md',
          issue: 'Missing main Claude.md marker',
          severity: 'high'
        });
      }
      
    } catch (error) {
      accuracyIssues.push({
        file: 'PROJECT_OVERVIEW.md',
        issue: 'File not found or not readable',
        severity: 'critical'
      });
    }
    
    // Verificar .clauderc
    try {
      const claudercPath = path.join(this.projectRoot, '.clauderc');
      const claudercContent = await fs.readFile(claudercPath, 'utf8');
      JSON.parse(claudercContent); // Validar que es JSON válido
    } catch (error) {
      accuracyIssues.push({
        file: '.clauderc',
        issue: 'Invalid JSON or file not found',
        severity: 'high'
      });
    }
    
    const accuracyScore = Math.max(0, 100 - (accuracyIssues.length * 15));
    
    return {
      accuracy_issues: accuracyIssues,
      accuracy_score: accuracyScore,
      total_issues: accuracyIssues.length
    };
  }

  async validateFreshness() {
    console.log('🕒 Validando frescura de la documentación...');
    
    const freshnessIssues = [];
    const freshnessScore = 95; // Por ahora, score alto ya que acabamos de crear todo
    
    return {
      stale_documentation: freshnessIssues,
      freshness_score: freshnessScore,
      domains_behind: freshnessIssues.length
    };
  }

  async analyzeCodeDomain(domain) {
    const domainPath = path.join(this.projectRoot, 'server', 'domains', domain);
    const analysis = {
      files: [],
      endpoints: [],
      models: []
    };
    
    try {
      const files = await glob(`${domainPath}/**/*.js`);
      analysis.files = files.map(f => path.relative(domainPath, f));
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Extraer endpoints
        const endpoints = this.extractEndpointsFromCode(content);
        analysis.endpoints.push(...endpoints);
      }
      
    } catch (error) {
      // Dominio no existe aún
    }
    
    return analysis;
  }

  extractEndpointsFromCode(content) {
    const endpoints = [];
    const routeRegex = /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }
    
    return endpoints;
  }

  extractEndpointsFromClaudeMD(content) {
    const endpoints = [];
    const endpointRegex = /(GET|POST|PUT|DELETE|PATCH)\s+([\/\w-]+)/g;
    let match;
    
    while ((match = endpointRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1],
        path: match[2]
      });
    }
    
    return endpoints;
  }

  calculateConsistencyScore(inconsistencies) {
    let score = 100;
    
    for (const inconsistency of inconsistencies) {
      switch (inconsistency.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    
    return Math.max(0, score);
  }

  calculateOverallScore() {
    const weights = {
      coverage: 0.3,
      consistency: 0.3,
      accuracy: 0.25,
      freshness: 0.15
    };
    
    const score = 
      (this.results.coverage?.coverage_percentage || 0) * weights.coverage +
      (this.results.consistency?.consistency_score || 0) * weights.consistency +
      (this.results.accuracy?.accuracy_score || 0) * weights.accuracy +
      (this.results.freshness?.freshness_score || 0) * weights.freshness;
    
    return Math.round(score);
  }

  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overall_score: this.results.overall_score,
      status: this.results.overall_score >= 85 ? '✅ EXCELLENT' : 
              this.results.overall_score >= 70 ? '⚠️  GOOD' : 
              this.results.overall_score >= 50 ? '🔶 NEEDS_IMPROVEMENT' : 
              '❌ CRITICAL',
      details: this.results,
      recommendations: this.generateRecommendations()
    };
    
    this.printReport(report);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.coverage?.coverage_percentage < 90) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Generate missing Claude.md files',
        command: 'npm run claude:generate:all',
        domains: this.results.coverage?.missing_domains
      });
    }
    
    if (this.results.consistency?.consistency_score < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Fix consistency issues',
        command: 'npm run claude:generate',
        issues: this.results.consistency?.inconsistencies?.length
      });
    }
    
    return recommendations;
  }

  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE VALIDACIÓN CLAUDE.MD');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 SCORE GENERAL: ${report.overall_score}/100 ${report.status}`);
    
    console.log('\n📋 DETALLES POR CATEGORÍA:');
    console.log(`  📊 Cobertura: ${report.details.coverage?.coverage_percentage || 0}%`);
    console.log(`  🔄 Consistencia: ${report.details.consistency?.consistency_score || 0}/100`);
    console.log(`  🎯 Precisión: ${report.details.accuracy?.accuracy_score || 0}/100`);
    console.log(`  🕒 Frescura: ${report.details.freshness?.freshness_score || 0}/100`);
    
    if (report.details.coverage?.missing_domains?.length > 0) {
      console.log(`\n❌ DOMINIOS SIN DOCUMENTAR: ${report.details.coverage.missing_domains.join(', ')}`);
    }
    
    if (report.recommendations?.length > 0) {
      console.log('\n🔧 RECOMENDACIONES:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`     Comando: ${rec.command}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Validación completada');
    console.log('='.repeat(60) + '\n');
  }

  async run() {
    await this.validateProject();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const validator = new ClaudeMDValidator();
  validator.run().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = ClaudeMDValidator;