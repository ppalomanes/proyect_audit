#!/usr/bin/env node

/**
 * Generador Automático de Claude.md
 * Analiza el código fuente y mantiene actualizados los archivos Claude.md
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ClaudeMDGenerator {
  constructor() {
    this.config = null;
    this.projectRoot = process.cwd();
    this.domains = [
      'auth', 'auditorias', 'etl', 'ia', 
      'chat', 'notifications', 'entities', 'dashboards'
    ];
  }

  async init() {
    try {
      const configPath = path.join(this.projectRoot, '.clauderc');
      const configFile = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configFile);
      console.log('✅ Configuración .clauderc cargada correctamente');
    } catch (error) {
      console.error('❌ Error cargando .clauderc:', error.message);
      process.exit(1);
    }
  }

  async detectChanges() {
    console.log('🔍 Detectando cambios en archivos...');
    
    try {
      const { stdout } = await execAsync('git diff --name-only HEAD~1');
      const changedFiles = stdout.split('\n').filter(file => 
        file && (file.endsWith('.js') || file.endsWith('.jsx'))
      );
      
      const affectedDomains = new Set();
      
      for (const file of changedFiles) {
        for (const domain of this.domains) {
          if (file.includes(`/domains/${domain}/`)) {
            affectedDomains.add(domain);
          }
        }
      }
      
      console.log(`📝 Dominios afectados: ${Array.from(affectedDomains).join(', ')}`);
      return Array.from(affectedDomains);
      
    } catch (error) {
      console.log('⚠️  No se pudo detectar cambios via Git, regenerando todos los dominios');
      return this.domains;
    }
  }

  async analyzeDomain(domainName) {
    console.log(`🔎 Analizando dominio: ${domainName}`);
    
    const domainPath = path.join(this.projectRoot, 'server', 'domains', domainName);
    const analysis = {
      domain: domainName,
      purpose: '',
      components: {
        controllers: [],
        services: [],
        models: [],
        routes: [],
        middleware: [],
        utils: []
      },
      endpoints: [],
      dependencies: {
        internal: [],
        external: []
      },
      codeSnippets: [],
      lastUpdated: new Date().toISOString()
    };

    try {
      // Analizar estructura de archivos
      const files = await glob(`${domainPath}/**/*.js`);
      
      for (const file of files) {
        const relativePath = path.relative(domainPath, file);
        const content = await fs.readFile(file, 'utf8');
        
        // Clasificar archivos por tipo
        if (relativePath.includes('controller')) {
          analysis.components.controllers.push({
            file: relativePath,
            endpoints: this.extractEndpoints(content)
          });
        } else if (relativePath.includes('service')) {
          analysis.components.services.push({
            file: relativePath,
            functions: this.extractFunctions(content)
          });
        } else if (relativePath.includes('model')) {
          analysis.components.models.push({
            file: relativePath,
            schema: this.extractSchema(content)
          });
        } else if (relativePath.includes('routes')) {
          analysis.components.routes.push({
            file: relativePath,
            routes: this.extractRoutes(content)
          });
        }

        // Extraer dependencias
        analysis.dependencies.internal.push(...this.extractInternalDeps(content));
        analysis.dependencies.external.push(...this.extractExternalDeps(content));
      }

      // Eliminar duplicados
      analysis.dependencies.internal = [...new Set(analysis.dependencies.internal)];
      analysis.dependencies.external = [...new Set(analysis.dependencies.external)];

      return analysis;

    } catch (error) {
      console.error(`❌ Error analizando dominio ${domainName}:`, error.message);
      return null;
    }
  }

  extractEndpoints(content) {
    const endpoints = [];
    const routeRegex = /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return endpoints;
  }

  extractFunctions(content) {
    const functions = [];
    const funcRegex = /(?:const|function|async function)\s+(\w+)/g;
    let match;
    
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return functions;
  }

  extractSchema(content) {
    // Extraer esquema de Sequelize
    const schemaMatch = content.match(/define\(['"`](\w+)['"`],\s*{([^}]+)}/);
    if (schemaMatch) {
      return {
        tableName: schemaMatch[1],
        fields: schemaMatch[2].split(',').map(f => f.trim()).slice(0, 10) // Primeros 10 campos
      };
    }
    return null;
  }

  extractRoutes(content) {
    return this.extractEndpoints(content);
  }

  extractInternalDeps(content) {
    const deps = [];
    const internalRegex = /require\(['"`]\.\.\/([^'"`]+)['"`]\)/g;
    let match;
    
    while ((match = internalRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }
    
    return deps;
  }

  extractExternalDeps(content) {
    const deps = [];
    const externalRegex = /require\(['"`]([a-z-]+)['"`]\)/g;
    let match;
    
    while ((match = externalRegex.exec(content)) !== null) {
      if (!match[1].startsWith('.')) {
        deps.push(match[1]);
      }
    }
    
    return deps;
  }

  async generateClaudeMD(domainAnalysis) {
    const template = `# Claude.md - Módulo ${domainAnalysis.domain.charAt(0).toUpperCase() + domainAnalysis.domain.slice(1)}

> **📍 Ubicación**: \`/server/domains/${domainAnalysis.domain}/\`
> 
> **🎯 Dominio**: ${this.getDomainDescription(domainAnalysis.domain)}

## 🎯 Propósito

${this.generatePurposeSection(domainAnalysis)}

## 🏗️ Componentes Clave

### Controllers
${domainAnalysis.components.controllers.map(c => 
  `- **\`${c.file}\`**: ${c.endpoints.length} endpoints definidos`
).join('\n')}

### Services  
${domainAnalysis.components.services.map(s => 
  `- **\`${s.file}\`**: ${s.functions.length} funciones principales`
).join('\n')}

### Models
${domainAnalysis.components.models.map(m => 
  `- **\`${m.file}\`**: ${m.schema ? `Esquema ${m.schema.tableName}` : 'Modelo de datos'}`
).join('\n')}

## 🔌 Interfaces/APIs

### Endpoints Principales
${this.generateEndpointsSection(domainAnalysis)}

## 🔗 Dependencias

### Dependencias Internas
${domainAnalysis.dependencies.internal.map(dep => `- \`${dep}\``).join('\n')}

### Dependencias Externas  
${domainAnalysis.dependencies.external.map(dep => `- \`${dep}\``).join('\n')}

## 💡 Fragmentos de Código Ilustrativos

${this.generateCodeSnippetsSection(domainAnalysis)}

---

**📝 Generado automáticamente por**: Claude.md Generator
**🔄 Última actualización**: ${domainAnalysis.lastUpdated}
**📊 Estado**: ✅ Sincronizado con código fuente
`;

    return template;
  }

  getDomainDescription(domain) {
    const descriptions = {
      auth: 'Autenticación y autorización de usuarios',
      auditorias: 'Gestión del proceso completo de auditoría técnica',
      etl: 'Procesamiento ETL de parque informático',
      ia: 'Motor de IA local con Ollama',
      chat: 'Sistema de mensajería asíncrona',
      notifications: 'Sistema de notificaciones',
      entities: 'Gestión de entidades base',
      dashboards: 'Dashboards y métricas'
    };
    return descriptions[domain] || 'Módulo del sistema';
  }

  generatePurposeSection(analysis) {
    return `Este módulo se encarga de ${this.getDomainDescription(analysis.domain).toLowerCase()}. 

### Responsabilidades Principales
- Gestión de ${analysis.components.controllers.length} controladores
- Implementación de ${analysis.components.services.length} servicios
- Manejo de ${analysis.components.models.length} modelos de datos`;
  }

  generateEndpointsSection(analysis) {
    let section = '';
    
    for (const controller of analysis.components.controllers) {
      if (controller.endpoints.length > 0) {
        section += `\n#### ${controller.file}\n\`\`\`javascript\n`;
        
        for (const endpoint of controller.endpoints.slice(0, 5)) { // Máximo 5 endpoints
          section += `${endpoint.method} ${endpoint.path}\n`;
        }
        
        section += '```\n';
      }
    }
    
    return section || 'No se encontraron endpoints definidos.';
  }

  generateCodeSnippetsSection(analysis) {
    // Generar snippets básicos basados en el análisis
    return `\`\`\`javascript
// Ejemplo de uso del módulo ${analysis.domain}
// Ver archivos fuente para implementación completa
\`\`\``;
  }

  async writeClaudeMD(domain, content) {
    const outputPath = path.join(
      this.projectRoot, 
      'server', 
      'domains', 
      domain, 
      'Claude.md'
    );
    
    try {
      await fs.writeFile(outputPath, content, 'utf8');
      console.log(`✅ Claude.md generado para ${domain}: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error escribiendo Claude.md para ${domain}:`, error.message);
    }
  }

  async updateProjectOverview(changedDomains) {
    console.log('📋 Actualizando PROJECT_OVERVIEW.md...');
    
    const overviewPath = path.join(this.projectRoot, 'PROJECT_OVERVIEW.md');
    
    try {
      let content = await fs.readFile(overviewPath, 'utf8');
      
      // Actualizar timestamp
      const timestamp = new Date().toISOString();
      content = content.replace(
        /\*\*📝 Última actualización\*\*:.*$/m,
        `**📝 Última actualización**: ${timestamp}`
      );
      
      // Agregar nota de dominios actualizados
      content += `\n\n---\n**🔄 Último cambio**: Dominios actualizados: ${changedDomains.join(', ')}`;
      
      await fs.writeFile(overviewPath, content, 'utf8');
      console.log('✅ PROJECT_OVERVIEW.md actualizado');
      
    } catch (error) {
      console.error('❌ Error actualizando PROJECT_OVERVIEW.md:', error.message);
    }
  }

  async generateForDomains(domains) {
    console.log(`🚀 Generando Claude.md para dominios: ${domains.join(', ')}`);
    
    for (const domain of domains) {
      console.log(`\n📦 Procesando dominio: ${domain}`);
      
      const analysis = await this.analyzeDomain(domain);
      if (analysis) {
        const claudeMD = await this.generateClaudeMD(analysis);
        await this.writeClaudeMD(domain, claudeMD);
      }
    }
    
    await this.updateProjectOverview(domains);
  }

  async run() {
    console.log('🎯 Iniciando generador Claude.md...\n');
    
    await this.init();
    
    const args = process.argv.slice(2);
    let domainsToProcess;
    
    if (args.includes('--all')) {
      domainsToProcess = this.domains;
    } else if (args.includes('--domain')) {
      const domainIndex = args.indexOf('--domain');
      domainsToProcess = [args[domainIndex + 1]];
    } else {
      domainsToProcess = await this.detectChanges();
    }
    
    if (domainsToProcess.length === 0) {
      console.log('ℹ️  No hay cambios detectados. Claude.md está actualizado.');
      return;
    }
    
    await this.generateForDomains(domainsToProcess);
    
    console.log('\n🎉 Generación de Claude.md completada exitosamente!');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const generator = new ClaudeMDGenerator();
  generator.run().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = ClaudeMDGenerator;