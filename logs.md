╭─ pwsh    H:\Desarrollo\chatbot-politico\open-program-app   master ?12 ~3                                                                                    22.16.0   14:22:33 
╰─❯ bun run dev
$ next dev --turbopack
   ▲ Next.js 15.4.6 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.2.240:3000
   - Environments: .env.local
   - Experiments (use with caution):
     · optimizePackageImports

 ✓ Starting...
Slow filesystem detected. The benchmark took 118ms. If H:\Desarrollo\chatbot-politico\open-program-app\.next is a network drive, consider moving it to a local folder. If you have an antivirus enabled, consider excluding your project directory.
 ✓ Ready in 1116ms
 ○ Compiling / ...
 GET /programs 200 in 2121ms
 ✓ Compiled / in 4.6s
 GET / 200 in 4716ms
 GET / 200 in 61ms
 ✓ Compiled /api/chat in 431ms
🚀 Chat API - Starting request with messages: 1 messages
🔍 Last message: No content
📡 Starting to stream response...
✅ Stream response created successfully
🔍 searchPoliticalDocs - Ejecutando con parámetros: { query: 'educación', topic: 'educación' }
🎯 Evaluando filtros adaptativos: {
  confidence: '1.000',
  taxonomy_path: 'Educación > Educación Escolar',
  suggested_tags_count: 8,
  matched_keywords_count: 8
}
✅ Filtro específico aplicado: Educación > Educación Escolar
🎯 Query classification: {
  taxonomy_path: 'Educación > Educación Escolar',
  confidence: '1.000',
  matched_keywords: [
    'educación',
    'educación básica',
    'establecimientos educacionales',
    'educación escolar',
    'educación chile',
    'mejorar educación',
    'propuestas educación',
    'políticas educación'
  ],
  filters_count: 1
}
🔍 Query expansion: {
  original: 'educación',
  taxonomy: 'Educación > Educación Escolar',
  keywords_added: [ 'educación básica', 'media', 'liceo' ],
  confidence: '1.000'
}
Generated embedding dimension: 1536
📊 Embedding generado: {
  original_query: 'educación',
  expanded_query: 'educación educación básica media liceo',
  expansion_applied: true,
  dimensions: 1536
}
🎯 Aplicando filtros de taxonomía: [
  {
    key: 'taxonomy_path',
    match: { value: 'Educación > Educación Escolar' }
  }
]
📂 Aplicando filtro de topic: educación
⚙️ Parámetros de búsqueda Qdrant optimizados: {
  collection: 'political_documents',
  embedding_dim: 1536,
  filters: 2,
  taxonomy_enhanced: true,
  confidence: '1.000',
  oversampling_limit: 30,
  final_limit: 15,
  hnsw_ef: 128
}
🔄 Fallback: Pocos resultados con taxonomy, reintentando sin filtros de taxonomía
🔄 Fallback completado: 0 resultados
📊 Qdrant query result: {
  total_points: 0,
  taxonomy_filtered: true,
  classification_used: 'Educación > Educación Escolar',
  confidence: '1.000',
  fallback_used: true
}
📊 Aplicando reranking híbrido a 0 candidatos
🎯 Reranking completado: { total_processed: 0, avg_improvement: '', top_candidates: '' }
📝 Documentos optimizados: {
  total: 0,
  hasContent: 0,
  withTaxonomyPath: 0,
  avgVectorScore: 'N/A',
  avgFinalScore: 'N/A',
  classification_match: 0,
  unique_candidates: 0,
  reranking_applied: false,
  query_expanded: true
}
✅ searchPoliticalDocs - No se encontraron documentos para la consulta: "educación" (clasificación: Educación > Educación Escolar)
Resultados de searchPoliticalDocs: {
  message: 'No se encontraron documentos específicos sobre "educación" en la base de datos de programas políticos.',
  query: 'educación',
  classification: {
    taxonomy_path: 'Educación > Educación Escolar',
    confidence: 1,
    matched_keywords: [
      'educación',
      'educación básica',
      'establecimientos educacionales',
      'educación escolar',
      'educación chile',
      'mejorar educación',
      'propuestas educación',
      'políticas educación'
    ]
  },
  total_results: 0,
  documents: []
}
🔍 searchPoliticalDocs - Ejecutando con parámetros: { query: 'mejorar educación', topic: 'educación escolar' }
🎯 Evaluando filtros adaptativos: {
  confidence: '1.000',
  taxonomy_path: 'Educación > Educación Escolar',
  suggested_tags_count: 8,
  matched_keywords_count: 8
}
✅ Filtro específico aplicado: Educación > Educación Escolar
🎯 Query classification: {
  taxonomy_path: 'Educación > Educación Escolar',
  confidence: '1.000',
  matched_keywords: [
    'mejorar educación',
    'educación',
    'educación básica',
    'establecimientos educacionales',
    'educación escolar',
    'educación chile',
    'propuestas educación',
    'políticas educación'
  ],
  filters_count: 1
}
🔍 Query expansion: {
  original: 'mejorar educación',
  taxonomy: 'Educación > Educación Escolar',
  keywords_added: [ 'educación básica', 'media', 'liceo' ],
  confidence: '1.000'
}
Generated embedding dimension: 1536
📊 Embedding generado: {
  original_query: 'mejorar educación',
  expanded_query: 'mejorar educación educación básica media liceo',
  expansion_applied: true,
  dimensions: 1536
}
🎯 Aplicando filtros de taxonomía: [
  {
    key: 'taxonomy_path',
    match: { value: 'Educación > Educación Escolar' }
  }
]
📂 Aplicando filtro de topic: educación escolar
⚙️ Parámetros de búsqueda Qdrant optimizados: {
  collection: 'political_documents',
  embedding_dim: 1536,
  filters: 2,
  taxonomy_enhanced: true,
  confidence: '1.000',
  oversampling_limit: 30,
  final_limit: 15,
  hnsw_ef: 128
}
🔄 Fallback: Pocos resultados con taxonomy, reintentando sin filtros de taxonomía
🔄 Fallback completado: 0 resultados
📊 Qdrant query result: {
  total_points: 0,
  taxonomy_filtered: true,
  classification_used: 'Educación > Educación Escolar',
  confidence: '1.000',
  fallback_used: true
}
📊 Aplicando reranking híbrido a 0 candidatos
🎯 Reranking completado: { total_processed: 0, avg_improvement: '', top_candidates: '' }
📝 Documentos optimizados: {
  total: 0,
  hasContent: 0,
  withTaxonomyPath: 0,
  avgVectorScore: 'N/A',
  avgFinalScore: 'N/A',
  classification_match: 0,
  unique_candidates: 0,
  reranking_applied: false,
  query_expanded: true
}
✅ searchPoliticalDocs - No se encontraron documentos para la consulta: "mejorar educación" (clasificación: Educación > Educación Escolar)
Resultados de searchPoliticalDocs: {
  message: 'No se encontraron documentos específicos sobre "mejorar educación" en la base de datos de programas políticos.',
  query: 'mejorar educación',
  classification: {
    taxonomy_path: 'Educación > Educación Escolar',
    confidence: 1,
    matched_keywords: [
      'mejorar educación',
      'educación',
      'educación básica',
      'establecimientos educacionales',
      'educación escolar',
      'educación chile',
      'propuestas educación',
      'políticas educación'
    ]
  },
  total_results: 0,
  documents: []
}
🔍 searchPoliticalDocs - Ejecutando con parámetros: { query: 'propuestas educación', topic: 'educación escolar' }
🎯 Evaluando filtros adaptativos: {
  confidence: '1.000',
  taxonomy_path: 'Educación > Educación Escolar',
  suggested_tags_count: 8,
  matched_keywords_count: 8
}
✅ Filtro específico aplicado: Educación > Educación Escolar
🎯 Query classification: {
  taxonomy_path: 'Educación > Educación Escolar',
  confidence: '1.000',
  matched_keywords: [
    'propuestas educación',
    'educación',
    'educación básica',
    'establecimientos educacionales',
    'educación escolar',
    'educación chile',
    'mejorar educación',
    'políticas educación'
  ],
  filters_count: 1
}
🔍 Query expansion: {
  original: 'propuestas educación',
  taxonomy: 'Educación > Educación Escolar',
  keywords_added: [ 'educación básica', 'media', 'liceo' ],
  confidence: '1.000'
}
Generated embedding dimension: 1536
📊 Embedding generado: {
  original_query: 'propuestas educación',
  expanded_query: 'propuestas educación educación básica media liceo',
  expansion_applied: true,
  dimensions: 1536
}
🎯 Aplicando filtros de taxonomía: [
  {
    key: 'taxonomy_path',
    match: { value: 'Educación > Educación Escolar' }
  }
]
📂 Aplicando filtro de topic: educación escolar
⚙️ Parámetros de búsqueda Qdrant optimizados: {
  collection: 'political_documents',
  embedding_dim: 1536,
  filters: 2,
  taxonomy_enhanced: true,
  confidence: '1.000',
  oversampling_limit: 30,
  final_limit: 15,
  hnsw_ef: 128
}
🔄 Fallback: Pocos resultados con taxonomy, reintentando sin filtros de taxonomía
🔄 Fallback completado: 0 resultados
📊 Qdrant query result: {
  total_points: 0,
  taxonomy_filtered: true,
  classification_used: 'Educación > Educación Escolar',
  confidence: '1.000',
  fallback_used: true
}
📊 Aplicando reranking híbrido a 0 candidatos
🎯 Reranking completado: { total_processed: 0, avg_improvement: '', top_candidates: '' }
📝 Documentos optimizados: {
  total: 0,
  hasContent: 0,
  withTaxonomyPath: 0,
  avgVectorScore: 'N/A',
  avgFinalScore: 'N/A',
  classification_match: 0,
  unique_candidates: 0,
  reranking_applied: false,
  query_expanded: true
}
✅ searchPoliticalDocs - No se encontraron documentos para la consulta: "propuestas educación" (clasificación: Educación > Educación Escolar)
Resultados de searchPoliticalDocs: {
  message: 'No se encontraron documentos específicos sobre "propuestas educación" en la base de datos de programas políticos.',
  query: 'propuestas educación',
  classification: {
    taxonomy_path: 'Educación > Educación Escolar',
    confidence: 1,
    matched_keywords: [
      'propuestas educación',
      'educación',
      'educación básica',
      'establecimientos educacionales',
      'educación escolar',
      'educación chile',
      'mejorar educación',
      'políticas educación'
    ]
  },
  total_results: 0,
  documents: []
}
📡 Final result: { hasText: true, textLength: 3026, finishReason: 'stop', toolCalls: 0 }
 POST /api/chat 200 in 27965ms
