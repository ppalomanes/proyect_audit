# FASE 2: Implementación de Base de Conocimiento RAG (Opcional)

> **📝 Nota**: Esta fase es opcional y se recomienda implementar solo cuando el proyecto supere los 50+ módulos o cuando la documentación Claude.md exceda los límites de contexto eficiente.

## 🎯 Objetivo

Transformar la documentación estática Claude.md en una base de conocimiento dinámica y consultable mediante **Recuperación Aumentada por Generación (RAG)** para optimizar la navegación en proyectos de gran escala.

## 🏗️ Arquitectura RAG

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOCUMENTACIÓN CLAUDE.MD                    │
│   PROJECT_OVERVIEW.md + /domains/*/Claude.md + Código fuente   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Fragmentación Semántica
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESAMIENTO DE CHUNKS                     │
│     Fragmentos de 1000 tokens + 200 overlap + Metadatos       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Embedding Generation
┌─────────────────────────────────────────────────────────────────┐
│                   BASE DE DATOS VECTORIAL                      │
│        Pinecone / Chroma / Qdrant + Embeddings OpenAI          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Semantic Search
┌─────────────────────────────────────────────────────────────────┐
│                   CLAUDE RAG-ENHANCED QUERIES                  │
│      Query → Retrieve → Augment → Generate → Response          │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Componentes RAG

### 1. Document Processor

```javascript
// /scripts/rag-processor.js
class DocumentProcessor {
  constructor() {
    this.chunkSize = 1000;
    this.overlapSize = 200;
    this.embeddingModel = 'text-embedding-3-small';
  }

  async processClaudeMDFiles() {
    const claudeMDFiles = await this.findAllClaudeMD();
    const chunks = [];

    for (const file of claudeMDFiles) {
      const content = await fs.readFile(file, 'utf8');
      const fileChunks = await this.chunkDocument(content, file);
      chunks.push(...fileChunks);
    }

    return chunks;
  }

  async chunkDocument(content, filePath) {
    const chunks = [];
    const sections = this.splitByHeaders(content);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      if (section.content.length > this.chunkSize) {
        // Dividir sección grande en chunks más pequeños
        const subChunks = this.splitLongSection(section);
        chunks.push(...subChunks);
      } else {
        chunks.push({
          id: `${this.getFileId(filePath)}_${i}`,
          content: section.content,
          metadata: {
            source_file: filePath,
            domain: this.extractDomain(filePath),
            section_title: section.title,
            chunk_type: 'section',
            last_updated: new Date().toISOString()
          }
        });
      }
    }

    return chunks;
  }

  splitByHeaders(content) {
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    const sections = [];
    let currentSection = null;
    
    const lines = content.split('\n');
    
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: headerMatch[2],
          level: headerMatch[1].length,
          content: line + '\n'
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }
}
```

### 2. Vector Database Integration

```javascript
// /scripts/vector-db.js
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

class VectorDatabase {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.indexName = 'portal-auditorias-claude-md';
  }

  async initializeIndex() {
    try {
      await this.pinecone.createIndex({
        name: this.indexName,
        dimension: 1536, // text-embedding-3-small dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log('✅ Índice Pinecone creado exitosamente');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Índice Pinecone ya existe');
      } else {
        throw error;
      }
    }
  }

  async upsertChunks(chunks) {
    const index = this.pinecone.index(this.indexName);
    const batchSize = 100;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Generar embeddings para el batch
      const texts = batch.map(chunk => chunk.content);
      const embeddings = await this.generateEmbeddings(texts);
      
      // Preparar vectores para upsert
      const vectors = batch.map((chunk, index) => ({
        id: chunk.id,
        values: embeddings[index],
        metadata: {
          ...chunk.metadata,
          content: chunk.content // Pinecone permite hasta 40KB de metadata
        }
      }));
      
      await index.upsert(vectors);
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} procesado (${vectors.length} chunks)`);
    }
  }

  async generateEmbeddings(texts) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts
    });
    
    return response.data.map(item => item.embedding);
  }

  async semanticSearch(query, k = 5, filters = {}) {
    const index = this.pinecone.index(this.indexName);
    
    // Generar embedding para la query
    const queryEmbedding = await this.generateEmbeddings([query]);
    
    // Realizar búsqueda
    const searchResults = await index.query({
      vector: queryEmbedding[0],
      topK: k,
      includeMetadata: true,
      filter: filters
    });
    
    return searchResults.matches.map(match => ({
      content: match.metadata.content,
      score: match.score,
      source: match.metadata.source_file,
      domain: match.metadata.domain,
      section: match.metadata.section_title
    }));
  }
}
```

### 3. RAG Query Engine

```javascript
// /scripts/rag-query-engine.js
class RAGQueryEngine {
  constructor() {
    this.vectorDB = new VectorDatabase();
    this.maxContextLength = 8000; // Tokens para contexto Claude
  }

  async queryWithRAG(userQuery, options = {}) {
    const {
      domain = null,
      maxResults = 5,
      minScore = 0.7,
      includeCode = true
    } = options;

    console.log(`🔍 Procesando query RAG: "${userQuery}"`);
    
    // 1. Búsqueda semántica
    const filters = domain ? { domain: { $eq: domain } } : {};
    const searchResults = await this.vectorDB.semanticSearch(
      userQuery, 
      maxResults, 
      filters
    );
    
    // 2. Filtrar por score mínimo
    const relevantResults = searchResults.filter(r => r.score >= minScore);
    
    if (relevantResults.length === 0) {
      return {
        context: '',
        sources: [],
        message: 'No se encontró información relevante. Consulte PROJECT_OVERVIEW.md'
      };
    }
    
    // 3. Construir contexto optimizado
    const context = this.buildOptimizedContext(relevantResults, userQuery);
    
    return {
      context: context.text,
      sources: context.sources,
      relevanceScore: this.calculateAverageScore(relevantResults),
      suggestedFollowups: this.generateFollowups(relevantResults)
    };
  }

  buildOptimizedContext(results, query) {
    let context = `# Contexto RAG para: "${query}"\n\n`;
    let currentLength = context.length;
    const sources = [];
    
    // Ordenar por relevancia y diversidad de fuentes
    const sortedResults = this.diversifyResults(results);
    
    for (const result of sortedResults) {
      const sectionText = `## ${result.section} (${result.domain})\n${result.content}\n\n`;
      
      if (currentLength + sectionText.length > this.maxContextLength) {
        break;
      }
      
      context += sectionText;
      currentLength += sectionText.length;
      
      sources.push({
        file: result.source,
        domain: result.domain,
        section: result.section,
        relevance: result.score
      });
    }
    
    return { text: context, sources };
  }

  diversifyResults(results) {
    // Asegurar diversidad de dominios y secciones
    const domainsSeen = new Set();
    const diversified = [];
    
    // Primero, tomar el mejor resultado de cada dominio
    for (const result of results) {
      if (!domainsSeen.has(result.domain)) {
        diversified.push(result);
        domainsSeen.add(result.domain);
      }
    }
    
    // Luego, agregar resultados adicionales por score
    for (const result of results) {
      if (diversified.length >= 5) break;
      if (!diversified.includes(result)) {
        diversified.push(result);
      }
    }
    
    return diversified;
  }

  calculateAverageScore(results) {
    const scores = results.map(r => r