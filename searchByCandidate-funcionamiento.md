# Funcionamiento de searchByCandidate

## Resumen Ejecutivo

La función `searchByCandidate` es un componente crítico del sistema RAG (Retrieval-Augmented Generation) de **Open Program IA** que permite realizar búsquedas específicas por candidato presidencial en la base de datos vectorial Qdrant. Esta función implementa una estrategia de filtrado gradual optimizada para maximizar la cobertura de información mientras mantiene la relevancia temática.

### Propósito Principal
- Buscar documentos específicos de un candidato presidencial individual
- Aplicar filtros taxonomicos adaptativos basados en la confianza de clasificación
- Implementar sistema de fallback para garantizar resultados incluso con consultas complejas
- Proporcionar logging detallado para debugging y optimización

## Arquitectura Técnica

### Signatura de Función

```typescript
async function searchByCandidate(
  query: string,                    // Consulta original del usuario
  queryEmbedding: number[],         // Vector embedding de la consulta (1536 dimensiones)
  classification: ClassificationResult, // Resultado de clasificación taxonomica
  candidate: string,                // Nombre exacto del candidato
  topic?: string                    // Tema específico opcional
): Promise<{
  candidate: string;
  documents: DocumentResult[];
  found_information: boolean;
}>
```

### Tipos de Datos Principales

#### ClassificationResult
```typescript
interface ClassificationResult {
  category: string;          // Categoría taxonomica principal (ej: "Pensiones")
  subcategory: string;       // Subcategoría (ej: "AFP")
  taxonomy_path: string;     // Ruta completa en taxonomía
  confidence: number;        // Nivel de confianza (0.0 - 1.0)
  matched_keywords: string[];
  suggested_tags: string[];
  filters: QdrantFilter[];
  query_type: QueryType;
}
```

#### DocumentResult
```typescript
interface DocumentResult {
  id: string;
  content: string;
  candidate: string;
  party: string;
  page_number: number;
  topic_category: string;
  proposal_type: string;
  source_file: string;
  program_name: string;
  section_title: string;
  taxonomy_path: string;
  tags: string[];
  headers: string[];
  section_hierarchy: string[];
  score: number;             // Similaridad vectorial (0.0 - 1.0)
}
```

## Construcción de Consultas

### Estrategia de Filtrado Gradual

La función implementa una **estrategia menos restrictiva** para candidatos específicos, optimizada para maximizar la cobertura de información:

#### 1. Filtro Obligatorio - Candidato
```typescript
// Filtro siempre aplicado
mustConditions.push({
  key: 'candidate',
  match: { value: candidate }
});
```

#### 2. Filtro Condicional - Categoría Temática
```typescript
// Lógica de selección de categoría
const categoryToFilter = topic && topic.trim() !== ''
  ? topic
  : classification.category;

// Aplicación condicional basada en confianza
if (categoryToFilter && classification.confidence > 0.3) {
  mustConditions.push({
    key: 'topic_category',
    match: { value: categoryToFilter }
  });
}
```

### Threshold de Confianza: 0.3

**Justificación del Threshold:**
- **> 0.3**: Clasificación suficientemente confiable para aplicar filtros temáticos
- **≤ 0.3**: Búsqueda solo por candidato para maximizar recall
- **Balanceo**: Precision vs Recall optimizado para consultas complejas

## Proceso de Búsqueda Detallado

### Fase 1: Búsqueda Principal

```typescript
const queryResult = await qdrantClient.search(
  process.env.QDRANT_COLLECTION!,
  {
    vector: queryEmbedding,    // Vector de 1536 dimensiones
    filter: {
      must: mustConditions     // Filtros construidos dinámicamente
    },
    limit: 8,                  // Control de tamaño por candidato
    with_payload: true,        // Incluir metadatos completos
    params: {
      hnsw_ef: 128,           // Parámetro de recall para HNSW
      exact: false            // Búsqueda aproximada (más rápida)
    }
  }
);
```

**Parámetros de Optimización:**
- **limit: 8**: Balance entre calidad y eficiencia (vs 30 en búsqueda general)
- **hnsw_ef: 128**: Mayor recall que el default (128 vs 64)
- **exact: false**: Prioriza velocidad sobre precisión absoluta

### Fase 2: Procesamiento de Resultados

```typescript
const documents: DocumentResult[] = points
  .filter((point: QdrantResult) => point && point.payload)
  .map((point: QdrantResult) => ({
    id: String(point.id),
    content: point.payload?.content || '',
    candidate: point.payload?.candidate || '',
    // ... mapeo completo con valores por defecto
    score: point.score || 0,
  }));
```

**Validaciones Implementadas:**
- Verificación de existencia de `payload`
- Conversión segura de tipos
- Valores por defecto para prevenir errores
- Logging de resultados encontrados

### Fase 3: Sistema de Fallback

```typescript
// Activación del fallback
if (documents.length === 0 && mustConditions.length > 1) {
  console.log(`🔄 Fallback para ${candidate}: búsqueda solo por candidato...`);

  const fallbackResult = await qdrantClient.search(
    process.env.QDRANT_COLLECTION!,
    {
      vector: queryEmbedding,
      filter: {
        must: [{ key: 'candidate', match: { value: candidate } }] // Solo candidato
      },
      limit: 15,              // Más resultados en fallback
      // ... mismos parámetros de optimización
    }
  );
}
```

**Características del Fallback:**
- **Activación**: Cuando no hay resultados Y se aplicaron filtros adicionales
- **Estrategia**: Eliminar filtros temáticos, mantener solo candidato
- **Límite Expandido**: 15 documentos (vs 8 en búsqueda principal)
- **Logging**: Transparencia completa del proceso

## Ejemplos Prácticos

### Ejemplo 1: Alta Confianza Taxonomica

**Entrada:**
```typescript
await searchByCandidate(
  "¿Qué propone Kast sobre las AFP?",
  [0.1, 0.2, ...], // embedding vector
  {
    category: "Pensiones",
    confidence: 0.85,
    // ... resto de clasificación
  },
  "Jose Antonio Kast"
);
```

**Filtros Aplicados:**
```json
{
  "must": [
    { "key": "candidate", "match": { "value": "Jose Antonio Kast" } },
    { "key": "topic_category", "match": { "value": "Pensiones" } }
  ]
}
```

**Resultado Esperado:** 3-8 documentos específicos sobre pensiones de Kast

### Ejemplo 2: Baja Confianza Taxonomica

**Entrada:**
```typescript
await searchByCandidate(
  "opinión general de Matthei",
  [0.05, 0.8, ...], // embedding vector
  {
    category: "General",
    confidence: 0.2,  // Baja confianza
    // ...
  },
  "Evelyn Matthei"
);
```

**Filtros Aplicados:**
```json
{
  "must": [
    { "key": "candidate", "match": { "value": "Evelyn Matthei" } }
  ]
}
```

**Resultado Esperado:** 5-8 documentos diversos de Matthei (sin filtro temático)

### Ejemplo 3: Activación de Fallback

**Escenario:**
```typescript
// Búsqueda inicial con filtros = 0 resultados
// Fallback activado automáticamente
```

**Logging:**
```
🎯 Búsqueda específica para Jeannette Jara: filters_count: 2
📊 Candidato Jeannette Jara: 0 documentos encontrados
🔄 Fallback para Jeannette Jara: búsqueda solo por candidato...
🔄 Fallback Jeannette Jara: 7 documentos encontrados
```

## Métodos y Estrategias Implementadas

### 1. Filtrado Adaptivo

**Principio:** La restrictividad de filtros se adapta automáticamente a la calidad de clasificación.

```typescript
// Confianza alta (>0.3) = Filtros específicos
// Confianza baja (≤0.3) = Solo filtro por candidato
const shouldApplyTopicFilter = classification.confidence > 0.3;
```

### 2. Oversampling Controlado

**Estrategia de Límites:**
- **Búsqueda General**: 30 docs → rerank a 15
- **Por Candidato**: 8 docs directos (sin rerank)
- **Fallback**: 15 docs (expansión controlada)

### 3. Validación Robusta

```typescript
// Múltiples capas de validación
if (Array.isArray(queryResult)) {
  points = queryResult as QdrantResult[];
} else if (queryResult && typeof queryResult === 'object' && 'points' in queryResult) {
  points = (queryResult as { points: QdrantResult[] }).points || [];
}
```

### 4. Logging Comprehensivo

```typescript
console.log(`🎯 Búsqueda específica para ${candidate}:`, {
  filters_count: mustConditions.length,
  taxonomy_confidence: classification.confidence.toFixed(3),
  filter_details: mustConditions.map(f => ({
    key: f.key,
    match_type: Object.keys(f.match)[0]
  }))
});
```

**Beneficios del Logging:**
- **Debugging**: Identificar problemas de filtrado
- **Optimización**: Análizar efectividad de estrategias
- **Monitoreo**: Detectar patrones de uso y fallas
- **Auditabilidad**: Trazabilidad completa del proceso

## Integración en el Sistema

### Uso en executeSearchWithFallback

```typescript
const searchPromises = candidates.map((candidate) =>
  searchByCandidate(
    query,
    queryEmbedding,
    modifiedClassification,
    candidate,
    topic
  )
);

return await Promise.all(searchPromises);
```

**Características de la Integración:**
- **Ejecución Paralela**: Múltiples candidatos simultáneamente
- **Modificación de Clasificación**: Adaptación por tipo de consulta
- **Manejo de Promesas**: Error handling centralizado

### Coordinación con ALL_CANDIDATES

```typescript
const ALL_CANDIDATES = [
  'Jose Antonio Kast',
  'Evelyn Matthei',
  'Jeannette Jara',
  'Johannes Kaiser',
  'Harold Mayne-Nicholls',
  'Eduardo Artes',
  'Franco Parisi',
  'Marco Antonio Enriquez-Ominami',
];
```

**Uso:**
- **Consultas Generales**: Buscar en todos los candidatos
- **Consultas Específicas**: Validar nombres de candidatos
- **Error Handling**: Mensaje de candidatos disponibles

## Manejo de Errores

### Estrategia de Error Handling

```typescript
try {
  // Lógica principal de búsqueda
} catch (error: unknown) {
  console.error(`❌ Error buscando información para ${candidate}:`, error);

  // Logging detallado del error
  if (error instanceof Error) {
    console.error(`🔍 Error completo para ${candidate}:`, {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
  }

  // Retorno seguro
  return {
    candidate,
    documents: [],
    found_information: false
  };
}
```

**Tipos de Errores Manejados:**
- **Conexión Qdrant**: Timeouts, red, autenticación
- **Formato de Datos**: Payload malformado, tipos incorrectos
- **Embedding**: Vector dimensions, encoding issues
- **Filtros**: Sintaxis incorrecta, campos inexistentes

### Logging de Errores Detallado

```typescript
// Múltiples propiedades del error inspeccionadas
const errorObj = error as Error & {
  response?: { data: unknown };
  data?: unknown;
  body?: unknown;
  details?: unknown;
};

// Logging condicional de cada propiedad
if (errorObj.response?.data) {
  console.error(`📊 Response data para ${candidate}:`,
    JSON.stringify(errorObj.response.data, null, 2));
}
```

## Análisis de Performance

### Optimizaciones Implementadas

#### 1. Límite de Documentos Reducido
- **General**: 30 docs → rerank a 15 (2 pasos)
- **Por Candidato**: 8 docs directos (1 paso)
- **Beneficio**: ~60% reducción en processing time

#### 2. Parámetros HNSW Optimizados
```typescript
params: {
  hnsw_ef: 128,    // Mayor recall que default
  exact: false     // Velocidad sobre precisión absoluta
}
```

#### 3. Validación Early Exit
```typescript
.filter((point: QdrantResult) => point && point.payload)
```

#### 4. Fallback Condicional
- Solo se ejecuta cuando es necesario
- Evita búsquedas innecesarias
- Límite expandido pero controlado

### Métricas de Performance

**Tiempos Esperados:**
- **Búsqueda Principal**: 150-300ms
- **Fallback (si aplica)**: +200-400ms
- **Processing**: 10-50ms
- **Total**: 160-750ms (dependiendo de fallback)

**Throughput:**
- **Paralela (8 candidatos)**: ~500ms total
- **Secuencial**: ~2-4 segundos
- **Mejora**: 4-8x más rápido con paralelización

## Configuración y Tunning

### Variables de Entorno

```bash
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your-api-key
QDRANT_COLLECTION=political-programs-2025
```

### Parámetros Configurables

```typescript
// En la función (valores actuales)
limit: 8,           // Documentos por candidato
hnsw_ef: 128,       // Recall parameter
confidence: 0.3,    // Threshold para filtros
fallback_limit: 15, // Documentos en fallback
```

**Recomendaciones de Tunning:**
- **Alta Precision**: Aumentar confidence threshold a 0.5
- **Alta Recall**: Reducir confidence threshold a 0.2
- **Mayor Velocidad**: Reducir limit a 5, hnsw_ef a 64
- **Mayor Calidad**: Aumentar limit a 12, hnsw_ef a 256

### Configuración de Logging

```typescript
// Niveles de logging disponibles
console.log('🎯 Búsqueda específica');    // Info
console.error('❌ Error');                // Error
console.log('🔄 Fallback');              // Warning
console.log('📊 Candidato');             // Debug
```

## Casos de Uso Avanzados

### 1. Búsqueda Temática Específica

```typescript
await searchByCandidate(
  "propuestas educación superior",
  embedding,
  classification,
  "Harold Mayne-Nicholls",
  "Educación"  // Topic override
);
```

### 2. Análisis Comparativo

```typescript
// Ejecutar para múltiples candidatos
const candidates = ['Jose Antonio Kast', 'Evelyn Matthei'];
const results = await Promise.all(
  candidates.map(candidate =>
    searchByCandidate(query, embedding, classification, candidate)
  )
);
```

### 3. Búsqueda de Alta Precision

```typescript
// Modificar clasificación para mayor restrictividad
const highPrecisionClassification = {
  ...classification,
  confidence: 0.9  // Solo filtros con muy alta confianza
};
```

## Conclusiones

La función `searchByCandidate` representa una implementación sofisticada de búsqueda vectorial con las siguientes características clave:

### Fortalezas
- **Adaptabilidad**: Filtros dinámicos basados en confianza
- **Robustez**: Sistema de fallback automático
- **Performance**: Optimizaciones específicas para candidatos únicos
- **Observabilidad**: Logging detallado para debugging
- **Escalabilidad**: Paralelización nativa en sistema mayor

### Innovaciones Técnicas
- **Threshold Adaptivo**: 0.3 como punto de balance precision/recall
- **Fallback Inteligente**: Activación solo cuando necesario
- **Error Recovery**: Manejo robusto de fallos de Qdrant
- **Resource Management**: Límites optimizados por contexto

### Uso Recomendado
- Consultas específicas sobre candidatos individuales
- Comparaciones dirigidas entre subconjuntos
- Análisis temático detallado
- Debugging de problemas de retrieval

Esta función forma parte integral del sistema RAG de Open Program IA, proporcionando la base técnica para análisis precisos y contextualmente relevantes de los programas presidenciales chilenos 2025.