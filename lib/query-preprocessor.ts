import taxonomyData from './taxonomy.json';

/**
 * Query types for different search strategies
 */
export type QueryType = 'general' | 'specific';

/**
 * Classification result from query preprocessing
 */
export interface ClassificationResult {
  category: string;
  subcategory: string;
  taxonomy_path: string;
  confidence: number;
  matched_keywords: string[];
  suggested_tags: string[];
  filters: QdrantFilter[];
  query_type: QueryType;
}

/**
 * Qdrant filter structure
 */
export interface QdrantFilter {
  key: string;
  match: {
    value?: string;
    any?: string[];
  };
}

/**
 * Cached classification to improve performance
 */
interface CachedClassification {
  result: ClassificationResult;
  timestamp: number;
}

/**
 * In-memory cache for query classifications
 */
const classificationCache = new Map<string, CachedClassification>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize text for better keyword matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Extract keywords from a query
 */
function extractKeywords(query: string): string[] {
  const normalized = normalizeText(query);
  const words = normalized.split(' ').filter(word => word.length > 2);
  
  // Add bigrams for better matching
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  
  return [...words, ...bigrams];
}

/**
 * Score keyword matches against taxonomy keywords
 */
function scoreKeywordMatches(queryKeywords: string[], taxonomyKeywords: string[]): {
  score: number;
  matchedKeywords: string[];
} {
  const matches: string[] = [];
  let totalScore = 0;
  
  for (const queryKeyword of queryKeywords) {
    for (const taxKeyword of taxonomyKeywords) {
      const normalizedTaxKeyword = normalizeText(taxKeyword);
      
      // Exact match
      if (queryKeyword === normalizedTaxKeyword) {
        matches.push(taxKeyword);
        totalScore += 2.0;
        continue;
      }
      
      // Partial match (contains) - with improved scoring
      if (queryKeyword.includes(normalizedTaxKeyword) || normalizedTaxKeyword.includes(queryKeyword)) {
        matches.push(taxKeyword);
        
        // Penalize matches where single word matches part of longer phrase
        const lengthRatio = Math.min(queryKeyword.length, normalizedTaxKeyword.length) / 
                           Math.max(queryKeyword.length, normalizedTaxKeyword.length);
        
        // Lower score for partial matches, proportional to length similarity
        totalScore += lengthRatio * 0.7;
        continue;
      }
      
    }
  }
  
  return {
    score: totalScore,
    matchedKeywords: Array.from(new Set(matches))
  };
}


/**
 * Calculate confidence score using multi-factor approach for political queries
 */
function calculateConfidence(
  bestScore: number,
  matchedKeywords: string[],
  queryKeywords: string[],
  subcategoryKeywords: string[]
): number {
  if (bestScore === 0) return 0;
  
  // Factor 1: Keyword coverage (40%) - how many query keywords match taxonomy
  const keywordCoverage = matchedKeywords.length / Math.max(queryKeywords.length, 1);
  
  // Factor 2: Taxonomy coverage (30%) - how well we match taxonomy keywords
  const taxonomyCoverage = matchedKeywords.length / Math.max(subcategoryKeywords.length, 1);
  
  // Factor 3: Match quality (20%) - exact vs partial matches
  const exactMatches = matchedKeywords.filter(keyword =>
    subcategoryKeywords.some(taxKeyword => 
      normalizeText(keyword) === normalizeText(taxKeyword)
    )
  ).length;
  const matchQuality = exactMatches / Math.max(matchedKeywords.length, 1);
  
  // Factor 4: Query complexity bonus (10%) - longer queries get small boost
  const complexityBonus = Math.min(queryKeywords.length / 10, 0.1);
  
  // Calculate weighted confidence
  let confidence = (
    keywordCoverage * 0.4 +
    taxonomyCoverage * 0.3 +
    matchQuality * 0.2 +
    complexityBonus * 0.1
  );
  
  // Special bonuses for political context
  const hasPoliticalIndicators = queryKeywords.some(kw => 
    ['candidato', 'propone', 'programa', 'gobierno', 'política'].includes(kw.toLowerCase())
  );
  
  if (hasPoliticalIndicators) {
    confidence = Math.min(confidence * 1.1, 1.0);
  }
  
  // Boost confidence for exact matches in political domain
  if (exactMatches > 0) {
    confidence = Math.min(confidence * (1 + exactMatches * 0.1), 1.0);
  }
  
  // Enhanced multi-topic handling: detect citizen language patterns
  const hasCitizenLanguage = queryKeywords.some(kw => 
    ['caro', 'barato', 'alcanza', 'falta', 'necesito', 'problema', 'crisis', 'mal'].some(pattern => 
      kw.includes(pattern)
    )
  );
  
  if (hasCitizenLanguage) {
    confidence = Math.min(confidence * 1.08, 1.0); // Small boost for citizen language
  }
  
  // Lower threshold for better multi-topic coverage but with gradual confidence
  return confidence < 0.06 ? 0 : confidence;
}

/**
 * Generate appropriate tags based on classification
 */
function generateTags(category: string, subcategory: string, matchedKeywords: string[]): string[] {
  const tags: string[] = [];
  
  // Add category and subcategory as tags
  tags.push(normalizeText(category));
  tags.push(normalizeText(subcategory));
  
  // Add matched keywords as tags (normalized)
  matchedKeywords.forEach(keyword => {
    const normalized = normalizeText(keyword);
    if (normalized.length > 2 && !tags.includes(normalized)) {
      tags.push(normalized);
    }
  });
  
  return tags.slice(0, 10); // Limit to 10 tags
}

/**
 * Check if query is asking for general category information
 */
function isGeneralCategoryQuery(query: string, classification: Omit<ClassificationResult, 'filters'>): boolean {
  const queryNormalized = normalizeText(query);
  const categoryNames = Object.keys(taxonomyData.categories);
  
  // Check if query contains category name and lacks specific subcategory indicators
  const containsCategoryName = categoryNames.some(categoryName => 
    queryNormalized.includes(normalizeText(categoryName))
  );
  
  // Check for general query patterns (Spanish)
  const hasGeneralPattern = /\b(propuestas? en|temas? de|sobre|relacionado con|acerca de)\b/i.test(query);
  
  // Check for specific subcategory keywords that would indicate a specific query
  const [category, subcategory] = classification.taxonomy_path.split(' > ');
  const subcategoryData = (taxonomyData.categories as Record<string, { subcategories: Record<string, { keywords: string[] }> }>)[category]?.subcategories?.[subcategory];
  
  let hasSpecificKeywords = false;
  if (subcategoryData?.keywords) {
    hasSpecificKeywords = subcategoryData.keywords.some((keyword: string) => 
      queryNormalized.includes(normalizeText(keyword)) && keyword.length > 4 // Avoid very short matches
    );
  }
  
  return (containsCategoryName || hasGeneralPattern) && !hasSpecificKeywords;
}

/**
 * Generate intelligent graduated filters based on classification confidence
 */
function generateFilters(classification: Omit<ClassificationResult, 'filters'> & { query_type: QueryType }, originalQuery: string = ''): QdrantFilter[] {
  const filters: QdrantFilter[] = [];
  const queryType = classification.query_type || 'specific';
  
  console.log('🎯 Evaluando filtros adaptativos por tipo de consulta:', {
    query_type: queryType,
    confidence: classification.confidence.toFixed(3),
    category: classification.category,
    taxonomy_path: classification.taxonomy_path
  });
  
  if (queryType === 'general') {
    // CONSULTAS GENERALES: Buscar en TODA la categoría para maximizar cobertura
    // Ejemplo: "salud" debe encontrar TODOS los candidatos con propuestas de salud
    
    if (classification.confidence > 0.3) {
      // Use topic_category for broad search across all subcategories
      filters.push({
        key: "topic_category",
        match: { value: classification.category }
      });
      console.log('🌐 GENERAL: Filtro por categoría completa para maximizar cobertura:', classification.category);
    } else {
      // Very low confidence: no filters for maximum recall
      console.log('🔓 GENERAL: Sin filtros - búsqueda completamente abierta por confianza muy baja');
    }
    
  } else {
    // CONSULTAS ESPECÍFICAS: Buscar en subcategoría específica para mayor precisión
    // Ejemplo: "isapres" debe buscar solo en "Salud > Isapres"
    
    if (classification.confidence > 0.7) {
      // High confidence: use specific taxonomy path
      filters.push({
        key: "taxonomy_path",
        match: { value: classification.taxonomy_path }
      });
      console.log('🎯 ESPECÍFICA: Filtro por taxonomy_path (alta confianza):', classification.taxonomy_path);
      
    } else if (classification.confidence > 0.4) {
      // Medium confidence: use tags if available, otherwise category
      if (classification.suggested_tags && classification.suggested_tags.length > 0) {
        filters.push({
          key: "tags", 
          match: { any: classification.suggested_tags.slice(0, 5) }
        });
        console.log('🏷️ ESPECÍFICA: Filtro por tags (confianza media):', classification.suggested_tags.slice(0, 3));
      } else {
        filters.push({
          key: "topic_category",
          match: { value: classification.category }
        });
        console.log('📂 ESPECÍFICA: Fallback a categoría completa:', classification.category);
      }
      
    } else {
      // Low confidence: fall back to category level for better recall
      filters.push({
        key: "topic_category",
        match: { value: classification.category }
      });
      console.log('📂 ESPECÍFICA: Filtro amplio por categoría (confianza baja):', classification.category);
    }
  }
  
  return filters;
}

/**
 * Dynamic query expansion based on context and confidence
 */
function expandQueryWithTaxonomyKeywords(query: string, classification: ClassificationResult): string {
  // Adaptive expansion based on confidence and query complexity
  if (classification.confidence < 0.2) {
    return query; // Don't expand very uncertain classifications
  }

  try {
    const [category, subcategory] = classification.taxonomy_path.split(' > ');
    const subcategoryData = (taxonomyData.categories as Record<string, { subcategories: Record<string, { keywords: string[] }> }>)[category]?.subcategories?.[subcategory];
    
    if (!subcategoryData?.keywords) {
      return query;
    }

    const queryLower = query.toLowerCase();
    const queryWords = extractKeywords(query);
    
    // Smart keyword selection based on relevance and confidence
    const relevantKeywords = subcategoryData.keywords
      .filter((keyword: string) => {
        const keywordLower = keyword.toLowerCase();
        const keywordWords = keywordLower.split(' ');
        
        // Skip if already in query
        if (queryLower.includes(keywordLower)) return false;
        
        // Skip very short keywords
        if (keyword.length < 4) return false;
        
        // Prefer keywords that don't overlap with query words
        const hasOverlap = keywordWords.some(kw => queryWords.includes(kw));
        return !hasOverlap;
      })
      // Sort by relevance (prefer shorter, more specific terms)
      .sort((a, b) => a.length - b.length);

    // Dynamic expansion limit based on confidence and query length
    const maxExpansion = Math.max(2, Math.min(5, Math.floor(classification.confidence * 6)));
    const expansionKeywords = relevantKeywords.slice(0, maxExpansion);

    // Additional context keywords based on confidence
    if (classification.confidence > 0.7 && category) {
      // Add category-level context for high confidence
      const categoryData = (taxonomyData.categories as Record<string, any>)[category];
      if (categoryData?.subcategories && Object.keys(categoryData.subcategories).length > 1) {
        // Add related subcategory keywords for broader context
        const relatedSubcategories = Object.keys(categoryData.subcategories)
          .filter(sub => sub !== subcategory)
          .slice(0, 1); // Just one related subcategory
          
        relatedSubcategories.forEach(relatedSub => {
          const relatedKeywords = categoryData.subcategories[relatedSub]?.keywords?.slice(0, 1) || [];
          expansionKeywords.push(...relatedKeywords.filter((kw: string) => 
            !queryLower.includes(kw.toLowerCase()) && kw.length > 4
          ));
        });
      }
    }

    const finalKeywords = expansionKeywords.slice(0, maxExpansion);

    if (finalKeywords.length > 0) {
      const expandedQuery = `${query} ${finalKeywords.join(' ')}`;
      console.log('🚀 Query expansion inteligente:', {
        original: query,
        taxonomy: classification.taxonomy_path,
        keywords_added: finalKeywords,
        confidence: classification.confidence.toFixed(3),
        expansion_level: maxExpansion
      });
      return expandedQuery;
    }
  } catch (error) {
    console.warn('⚠️ Error in dynamic query expansion:', error);
  }

  return query;
}

/**
 * Detect if query is general or specific based on citizen language patterns
 */
function detectQueryType(query: string): QueryType {
  const normalizedQuery = normalizeText(query);
  
  // General query patterns - citizen asks about broad topics
  const generalPatterns = [
    // Direct general topics
    /^(salud|educación|educacion|economía|economia|seguridad|pensiones|trabajo|vivienda|medioambiente)$/i,
    // Question patterns about general topics
    /cuáles?\s+son\s+las\s+propuestas\s+(en|sobre|de)/i,
    /qué\s+(propone|hará|medidas|planes)\s+(en|sobre|para)\s+(salud|educación|economía|seguridad)/i,
    /cómo\s+(enfrentará|solucionará|mejorará)\s+(la\s+)?(salud|educación|economía|seguridad)/i,
    /propuestas\s+(en|de|sobre)\s+(salud|educación|economía|seguridad|pensiones|trabajo)/i,
    // Very broad questions about systems
    /sistema\s+de\s+(salud|educación|pensiones|afp)$/i,
    // Pension system queries that should be general
    /sistema\s+(de\s+)?afp/i,
    /sistema\s+previsional/i,
    /pensiones\s+(en\s+general|generales?)/i
  ];
  
  // Specific query patterns - citizen asks about particular aspects
  const specificPatterns = [
    // Healthcare specific
    /isapres?/i, /fonasa/i, /lista\s+de\s+espera/i, /medicamentos/i, /salud\s+mental/i,
    // Education specific  
    /\bcae\b/i, /gratuidad\s+universitaria/i, /educación\s+técnica/i, /psu/i, /paes/i,
    // Labor specific
    /salario\s+mínimo/i, /jornada\s+laboral/i, /\bafp\b/i, /sindicatos?/i,
    // Security specific
    /narcotráfico/i, /tren\s+de\s+aragua/i, /carabineros/i, /delincuencia/i,
    // Housing specific
    /campamentos/i, /subsidio\s+habitacional/i, /déficit\s+habitacional/i,
    // Environment specific
    /crisis\s+hídrica/i, /energías?\s+renovables?/i, /litio/i, /hidrógeno\s+verde/i,
    // Economy specific
    /inflación/i, /\biva\b/i, /impuestos/i, /pib/i
  ];
  
  // Check for specific patterns first (more restrictive)
  for (const pattern of specificPatterns) {
    if (pattern.test(normalizedQuery)) {
      return 'specific';
    }
  }
  
  // Check for general patterns
  for (const pattern of generalPatterns) {
    if (pattern.test(normalizedQuery)) {
      return 'general';
    }
  }
  
  // Default logic based on query characteristics
  const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  
  // Single word queries for main categories are usually general
  if (words.length === 1) {
    const generalWords = ['salud', 'educacion', 'educación', 'economia', 'economía', 'seguridad', 'pensiones', 'trabajo', 'empleo', 'vivienda', 'medioambiente'];
    if (generalWords.includes(words[0])) {
      return 'general';
    }
  }
  
  // Short questions (2-4 words) with general categories are usually general
  if (words.length <= 4 && /\b(salud|educación|economía|seguridad|pensiones|trabajo|vivienda)\b/i.test(normalizedQuery)) {
    return 'general';
  }
  
  // Default to specific for more complex/detailed queries
  return 'specific';
}

/**
 * Main classification function
 */
export async function classifyQuery(query: string, providedQueryType?: QueryType): Promise<ClassificationResult> {
  if (!query.trim()) {
    return {
      category: taxonomyData.metadata.fallback_category,
      subcategory: 'General',
      taxonomy_path: `${taxonomyData.metadata.fallback_category} > General`,
      confidence: 0,
      matched_keywords: [],
      suggested_tags: [],
      filters: [],
      query_type: 'general'
    };
  }
  
  // Use provided query type or detect it
  const queryType = providedQueryType || detectQueryType(query);
  
  // Check cache first
  const cacheKey = normalizeText(query);
  const cached = classificationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    // Update cached result with query type in case it wasn't cached before
    return { ...cached.result, query_type: queryType };
  }
  
  const queryKeywords = extractKeywords(query);
  let bestMatch = {
    category: '',
    subcategory: '',
    score: 0,
    matchedKeywords: [] as string[]
  };
  
  // Iterate through all categories and subcategories
  for (const [categoryName, categoryData] of Object.entries(taxonomyData.categories)) {
    for (const [subcategoryName, subcategoryData] of Object.entries(categoryData.subcategories)) {
      const match = scoreKeywordMatches(queryKeywords, subcategoryData.keywords);
      
      if (match.score > bestMatch.score) {
        bestMatch = {
          category: categoryName,
          subcategory: subcategoryName,
          score: match.score,
          matchedKeywords: match.matchedKeywords
        };
      }
    }
  }
  
  // Calculate confidence
  const subcategoryData = bestMatch.category && bestMatch.subcategory 
    ? (taxonomyData.categories as Record<string, { subcategories: Record<string, { keywords: string[] }> }>)[bestMatch.category]?.subcategories?.[bestMatch.subcategory]
    : null;
  
  const confidence = subcategoryData 
    ? calculateConfidence(
        bestMatch.score,
        bestMatch.matchedKeywords,
        queryKeywords,
        subcategoryData.keywords
      )
    : 0;
  
  // Fallback to default category if confidence is too low
  const finalCategory = confidence >= taxonomyData.metadata.confidence_threshold 
    ? bestMatch.category 
    : taxonomyData.metadata.fallback_category;
  
  const finalSubcategory = confidence >= taxonomyData.metadata.confidence_threshold 
    ? bestMatch.subcategory 
    : 'General';
  
  const result: ClassificationResult = {
    category: finalCategory,
    subcategory: finalSubcategory,
    taxonomy_path: `${finalCategory} > ${finalSubcategory}`,
    confidence: confidence,
    matched_keywords: bestMatch.matchedKeywords,
    suggested_tags: generateTags(finalCategory, finalSubcategory, bestMatch.matchedKeywords),
    filters: [], // Will be populated below
    query_type: queryType
  };
  
  // Generate filters
  result.filters = generateFilters(result, query);
  
  // Cache the result
  classificationCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  return result;
}

/**
 * Expand query with taxonomy keywords (exported for use in API)
 */
export function expandQuery(query: string, classification: ClassificationResult): string {
  return expandQueryWithTaxonomyKeywords(query, classification);
}

/**
 * Get taxonomy information for debugging
 */
export function getTaxonomyInfo() {
  return {
    version: taxonomyData.version,
    total_categories: taxonomyData.metadata.total_categories,
    total_subcategories: taxonomyData.metadata.total_subcategories,
    confidence_threshold: taxonomyData.metadata.confidence_threshold,
    fallback_category: taxonomyData.metadata.fallback_category
  };
}

/**
 * Clear classification cache (useful for testing)
 */
export function clearCache() {
  classificationCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [, cached] of classificationCache.entries()) {
    if ((now - cached.timestamp) < CACHE_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    total_entries: classificationCache.size,
    valid_entries: validEntries,
    expired_entries: expiredEntries,
    cache_ttl_minutes: CACHE_TTL / (60 * 1000)
  };
}