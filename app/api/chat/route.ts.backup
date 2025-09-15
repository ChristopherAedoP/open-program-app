import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { QdrantClient } from '@qdrant/js-client-rest';
import { classifyQuery, expandQuery, type ClassificationResult } from '../../../lib/query-preprocessor';

// Inicializar cliente Qdrant
const qdrantClient = new QdrantClient({
	url: process.env.QDRANT_URL!,
	apiKey: process.env.QDRANT_API_KEY!,
});

// Función para generar embeddings usando Vercel AI SDK
async function generateEmbedding(text: string): Promise<number[]> {
	const { embedding } = await embed({
		model: openai.textEmbeddingModel('text-embedding-3-small'),
		value: text,
	});
	console.log('Generated embedding dimension:', embedding.length);
	return embedding;
}

// Funciones de reranking híbrido optimizadas
function calculateEnhancedTagMatch(tags: string[], content: string, query: string): number {
	const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
	let totalScore = 0;
	let maxPossibleScore = queryWords.length;
	
	// Tag-based matching (70% weight)
	if (tags?.length > 0) {
		const tagMatches = tags.filter(tag => 
			queryWords.some(word => tag.toLowerCase().includes(word))
		);
		const tagScore = tagMatches.length / Math.max(tags.length, 1);
		totalScore += tagScore * 0.7;
	}
	
	// Content-based matching (30% weight)
	if (content?.length > 0) {
		const contentLower = content.toLowerCase();
		const contentMatches = queryWords.filter(word => 
			contentLower.includes(word) && word.length > 3
		);
		const contentScore = contentMatches.length / Math.max(queryWords.length, 1);
		totalScore += contentScore * 0.3;
	}
	
	// Exact phrase bonus
	const queryPhrase = query.toLowerCase();
	if ((tags?.some(tag => tag.toLowerCase().includes(queryPhrase)) || 
		 content?.toLowerCase().includes(queryPhrase)) && queryPhrase.length > 8) {
		totalScore *= 1.2;
	}
	
	return Math.min(totalScore, 1.0);
}

function calculateHeaderRelevance(headers: Record<string, string>, query: string): number {
	if (!headers) return 0;
	const headerText = Object.values(headers).join(' ').toLowerCase();
	const queryWords = query.toLowerCase().split(' ');
	const matches = queryWords.filter(word => headerText.includes(word));
	return matches.length / queryWords.length;
}

function getCandidateDiversityScore(candidate: string, allCandidates: string[], index: number): number {
	if (!candidate) return 0;
	
	const candidateCount = allCandidates.filter(c => c === candidate).length;
	const totalCandidates = new Set(allCandidates.filter(Boolean)).size;
	
	// Smart diversity: promote variety but don't heavily penalize relevant repetition
	// Give diminishing returns rather than linear penalty
	const diversityFactor = Math.min(0.08, 0.08 / Math.sqrt(candidateCount));
	
	// Slight boost for representing different candidates in top results
	const positionBonus = index < 5 ? 0.02 / (index + 1) : 0;
	
	// Ensure we don't completely eliminate good results from productive candidates
	return Math.max(0.01, diversityFactor + positionBonus);
}

interface QdrantResult {
	id: string | number;
	version: number;
	score: number;
	payload: {
		content: string;
		candidate: string;
		party: string;
		page_number: number;
		topic_category: string;
		proposal_type: string;
		source_file: string;
		program_name: string;
		section_title: string;
		taxonomy_path?: string;
		tags?: string[];
		headers?: string[];
		section_hierarchy?: string[];
		metadata?: Record<string, unknown>;
		[key: string]: unknown;
	};
	vector?: number[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rerankWithExistingMetadata(results: any[], originalQuery: string, classification: ClassificationResult) {
	console.log('📊 Aplicando reranking híbrido a', results.length, 'candidatos');
	
	// Extraer todos los candidatos para cálculo de diversidad
	const allCandidates = results.map(r => r.payload?.candidate).filter(Boolean);
	
	const rerankedResults = results.map((result, index) => {
		const payload = result.payload;
		
		// Scoring híbrido optimizado usando metadatos existentes
		const hybridScore = {
			// Score vectorial base (50%)
			semantic: result.score * 0.5,
			
			// Bonus por match mejorado en tags y contenido (20%)
			tagMatch: calculateEnhancedTagMatch(payload.tags || [], payload.content || '', originalQuery) * 0.2,
			
			// Bonus por taxonomía exacta (15%)
			taxonomyBonus: payload.taxonomy_path === classification.taxonomy_path ? 0.15 : 0,
			
			// Bonus por diversidad de candidatos inteligente (10%)
			diversityBonus: getCandidateDiversityScore(payload.candidate, allCandidates, index) * 0.1,
			
			// Bonus por headers relevantes (5%)
			headerMatch: calculateHeaderRelevance(payload.headers || {}, originalQuery) * 0.05
		};
		
		const finalScore = Object.values(hybridScore).reduce((a, b) => a + b, 0);
		
		return {
			...result,
			finalScore,
			scoreBreakdown: hybridScore
		};
	}).sort((a, b) => b.finalScore - a.finalScore);

	console.log('🎯 Reranking completado:', {
		total_processed: results.length,
		avg_improvement: rerankedResults.slice(0, 5).map(r => (r.finalScore - r.score).toFixed(3)).join(', '),
		top_candidates: rerankedResults.slice(0, 3).map(r => r.payload?.candidate).join(', ')
	});

	return rerankedResults;
}

// Define types for our search results
interface SearchResultPayload {
	content?: string;
	candidate?: string;
	party?: string;
	page_number?: number;
	topic_category?: string;
	proposal_type?: string;
	source_file?: string;
	headers?: Record<string, string>;
	section_hierarchy?: string[];
	sub_category?: string;
	taxonomy_path?: string;
	tags?: string[];
}

interface SearchResultPoint {
	id: string | number;
	version: number;
	score: number;
	payload?: SearchResultPayload;
	vector?: number[];
}

// Función para generar resumen estructurado de resultados de búsqueda
interface DocumentResult {
	candidate: string;
	party: string;
	taxonomy_path: string;
	score: number;
	[key: string]: unknown;
}

function generateSearchSummary(documents: DocumentResult[], classification: ClassificationResult) {
	if (documents.length === 0) {
		return {
			candidates_found: [],
			taxonomy_matches: 0,
			coverage: 'sin_resultados',
			recommendation: 'ampliar_busqueda'
		};
	}

	// Agrupar por candidato
	interface CandidateGroup {
		candidate: string;
		party: string;
		documents: DocumentResult[];
		taxonomy_matches: number;
		avg_score: number;
	}

	const candidateGroups = documents.reduce((groups, doc) => {
		const candidate = doc.candidate || 'Desconocido';
		if (!groups[candidate]) {
			groups[candidate] = {
				candidate,
				party: doc.party || '',
				documents: [],
				taxonomy_matches: 0,
				avg_score: 0
			};
		}
		groups[candidate].documents.push(doc);
		if (doc.taxonomy_path === classification.taxonomy_path) {
			groups[candidate].taxonomy_matches++;
		}
		return groups;
	}, {} as Record<string, CandidateGroup>);

	// Calcular métricas por candidato
	const candidates = Object.values(candidateGroups).map((group) => {
		group.avg_score = group.documents.reduce((sum, doc) => sum + (doc.score || 0), 0) / group.documents.length;
		return group;
	});

	// Estadísticas generales
	const taxonomyMatches = documents.filter(d => d.taxonomy_path === classification.taxonomy_path).length;
	const totalTaxonomyPaths = new Set(documents.map(d => d.taxonomy_path).filter(tp => tp)).size;
	
	let coverage = 'parcial';
	if (taxonomyMatches >= documents.length * 0.8) {
		coverage = 'alta';
	} else if (taxonomyMatches >= documents.length * 0.5) {
		coverage = 'media';
	} else if (taxonomyMatches < documents.length * 0.2) {
		coverage = 'baja';
	}

	let recommendation = 'suficiente';
	if (documents.length < 5) {
		recommendation = 'ampliar_busqueda';
	} else if (classification.confidence < 0.3) {
		recommendation = 'refinar_consulta';
	} else if (candidates.length === 1) {
		recommendation = 'buscar_otros_candidatos';
	}

	return {
		candidates_found: candidates.map(c => ({
			name: c.candidate,
			party: c.party,
			document_count: c.documents.length,
			taxonomy_matches: c.taxonomy_matches,
			avg_relevance: Number(c.avg_score.toFixed(3))
		})),
		taxonomy_matches: taxonomyMatches,
		total_taxonomy_paths: totalTaxonomyPaths,
		coverage,
		recommendation,
		classification_effectiveness: classification.confidence > 0.5 ? 'alta' : classification.confidence > 0.25 ? 'media' : 'baja'
	};
}

// Lista completa de candidatos presidenciales 2025
const ALL_CANDIDATES = [
	'Harold Mayne-Nicholls',
	'Marco Enríquez-Ominami', 
	'Jeannette Jara',
	'Johannes Kaiser',
	'José Antonio Kast',
	'Evelyn Matthei',
	'Eduardo Artés',
	'Franco Parisi'
];

// Función para hacer búsqueda específica por candidato
async function searchByCandidate(
	query: string,
	queryEmbedding: number[],
	classification: ClassificationResult,
	candidate: string,
	topic?: string
): Promise<{
	candidate: string;
	documents: DocumentResult[];
	found_information: boolean;
}> {
	try {
		// Construir filtros específicos para el candidato
		const must: Array<{ key: string; match: { value?: string; any?: string[] } }> = [];
		
		// Filtro obligatorio por candidato
		must.push({ key: 'candidate', match: { value: candidate } });
		
		// Agregar filtros de taxonomía si hay confianza suficiente
		if (classification.filters.length > 0) {
			must.push(...(classification.filters as any));
		}
		
		// Agregar filtro de topic si se especifica
		if (topic && topic.trim() !== '') {
			must.push({ key: 'topic_category', match: { value: topic } });
		}
		
		console.log(`🎯 Búsqueda específica para ${candidate}:`, {
			filters_count: must.length,
			taxonomy_confidence: classification.confidence.toFixed(3)
		});
		
		// Ejecutar búsqueda específica para este candidato
		const queryResult = await qdrantClient.query(
			process.env.QDRANT_COLLECTION!,
			{
				query: queryEmbedding,
				filter: { must },
				limit: 8, // Límite por candidato para controlar el tamaño total
				with_vector: true,
				with_payload: true,
				params: {
					hnsw_ef: 128,
					exact: false
				}
			}
		);
		
		const points = queryResult.points || [];
		
		// Procesar resultados
		const documents: DocumentResult[] = points.map((point: QdrantResult) => ({
			id: String(point.id),
			content: point.payload.content,
			candidate: point.payload.candidate,
			party: point.payload.party,
			page_number: point.payload.page_number,
			topic_category: point.payload.topic_category,
			proposal_type: point.payload.proposal_type,
			source_file: point.payload.source_file,
			program_name: point.payload.program_name,
			section_title: point.payload.section_title,
			taxonomy_path: point.payload.taxonomy_path,
			tags: point.payload.tags || [],
			headers: point.payload.headers || [],
			section_hierarchy: point.payload.section_hierarchy || [],
			score: point.score
		}));
		
		console.log(`📊 Candidato ${candidate}: ${documents.length} documentos encontrados`);
		
		return {
			candidate,
			documents,
			found_information: documents.length > 0
		};
		
	} catch (error) {
		console.error(`❌ Error buscando información para ${candidate}:`, error);
		return {
			candidate,
			documents: [],
			found_information: false
		};
	}
}

// Función para mapear nombres/apellidos de usuarios a nombres completos
function mapCandidateNames(userInputs: string[]): string[] {
	const mapped: string[] = [];
	
	for (const input of userInputs) {
		const inputLower = input.toLowerCase().trim();
		
		// Buscar coincidencias exactas o parciales
		const match = ALL_CANDIDATES.find(candidate => {
			const candidateLower = candidate.toLowerCase();
			const parts = candidateLower.split(' ');
			
			// Coincidencia exacta
			if (candidateLower === inputLower) return true;
			
			// Coincidencia por apellido
			if (parts.some(part => part === inputLower)) return true;
			
			// Coincidencia por nombre
			if (parts.some(part => part.includes(inputLower) && inputLower.length > 3)) return true;
			
			return false;
		});
		
		if (match && !mapped.includes(match)) {
			mapped.push(match);
		}
	}
	
	return mapped;
}

// Tool para buscar documentos políticos
const searchPoliticalDocs = tool({
	description: 'Buscar en documentos políticos de candidatos presidenciales con cobertura completa',
	inputSchema: z.object({
		query: z.string().describe('La pregunta o tema a buscar'),
		topic: z.string().optional().describe('Filtrar por tema específico'),
		query_type: z.enum(['general', 'specific', 'comparative']).describe('Tipo de consulta: general (todos los candidatos), specific (candidato específico), comparative (múltiples candidatos)'),
		target_candidates: z.array(z.string()).optional().describe('Candidatos específicos para consultas específicas/comparativas (nombres o apellidos)')
	}),
	execute: async ({ query, topic, query_type = 'general', target_candidates = [] }) => {
		console.log('🔍 searchPoliticalDocs - Ejecutando con parámetros:', {
			query,
			topic,
			query_type,
			target_candidates
		});

		// Clasificar query usando taxonomía
		const classification = await classifyQuery(query);
		console.log('🎯 Query classification:', {
			taxonomy_path: classification.taxonomy_path,
			confidence: classification.confidence.toFixed(3),
			matched_keywords: classification.matched_keywords,
			filters_count: classification.filters.length
		});

		// Expandir query con keywords de taxonomy existente
		const expandedQuery = expandQuery(query, classification);
		const queryToEmbed = expandedQuery !== query ? expandedQuery : query;

		// Generar embedding de la query expandida
		const queryEmbedding = await generateEmbedding(queryToEmbed);
		console.log('📊 Embedding generado:', {
			original_query: query,
			expanded_query: queryToEmbed,
			expansion_applied: expandedQuery !== query,
			dimensions: queryEmbedding.length
		});

		try {
			let candidateResults: Array<{
				candidate: string;
				documents: DocumentResult[];
				found_information: boolean;
			}> = [];

			// Lógica diferenciada según el tipo de consulta
			if (query_type === 'general') {
				console.log('🌐 Ejecutando búsqueda GENERAL para todos los candidatos');
				
				// Buscar información para TODOS los candidatos
				const searchPromises = ALL_CANDIDATES.map(candidate => 
					searchByCandidate(query, queryEmbedding, classification, candidate, topic)
				);
				
				candidateResults = await Promise.all(searchPromises);
				
			} else if (query_type === 'specific' || query_type === 'comparative') {
				console.log(`🎯 Ejecutando búsqueda ${query_type.toUpperCase()} para candidatos específicos`);
				
				// Mapear nombres de usuario a nombres completos
				const targetCandidates = mapCandidateNames(target_candidates);
				console.log('🗺️ Candidatos mapeados:', { input: target_candidates, mapped: targetCandidates });
				
				if (targetCandidates.length === 0) {
					console.warn('⚠️ No se pudieron mapear los candidatos especificados');
					return {
						message: 'No se reconocieron los candidatos especificados. Candidatos disponibles: ' + ALL_CANDIDATES.join(', '),
						documents: [],
						total_results: 0,
						candidates_without_info: [],
						search_summary: { coverage: 'error', recommendation: 'verificar_nombres_candidatos' }
					};
				}
				
				// Buscar solo para los candidatos especificados
				const searchPromises = targetCandidates.map(candidate => 
					searchByCandidate(query, queryEmbedding, classification, candidate, topic)
				);
				
				candidateResults = await Promise.all(searchPromises);
			}

			// Agregar y procesar resultados
			let allDocuments: DocumentResult[] = [];
			const candidatesWithInfo: string[] = [];
			const candidatesWithoutInfo: string[] = [];

			candidateResults.forEach(result => {
				if (result.found_information && result.documents.length > 0) {
					candidatesWithInfo.push(result.candidate);
					allDocuments.push(...result.documents);
				} else {
					candidatesWithoutInfo.push(result.candidate);
				}
			});

			console.log('📊 Resumen de búsqueda por candidato:', {
				total_candidates_searched: candidateResults.length,
				candidates_with_info: candidatesWithInfo.length,
				candidates_without_info: candidatesWithoutInfo.length,
				total_documents: allDocuments.length
			});

			// Aplicar reranking híbrido a todos los documentos
			const rerankedResults = hybridReranking(
				allDocuments,
				query,
				classification.matched_keywords
			);

			// Aplicar límite final
			const finalDocuments = rerankedResults.slice(0, 20); // Aumentado para consultas generales
			
			// Generar resumen estructurado
			const summary = generateSearchSummary(finalDocuments, classification);

			// Resultado final con información de cobertura completa
			const result = {
				message: `Búsqueda ${query_type}: ${candidatesWithInfo.length} candidatos con información, ${candidatesWithoutInfo.length} sin información sobre este tema`,
				documents: finalDocuments,
				total_results: finalDocuments.length,
				candidates_with_info: candidatesWithInfo,
				candidates_without_info: candidatesWithoutInfo,
				search_summary: summary,
				classification: {
					taxonomy_path: classification.taxonomy_path,
					confidence: classification.confidence,
					matched_keywords: classification.matched_keywords,
					suggested_tags: classification.suggested_tags
				},
				coverage_analysis: {
					query_type,
					total_candidates: candidateResults.length,
					coverage_percentage: ((candidatesWithInfo.length / candidateResults.length) * 100).toFixed(1),
					methodology: 'multiple_candidate_search'
				}
			};
			
			// Métricas finales optimizadas
			console.log('🎯 Métricas de búsqueda múltiple:', {
				strategy: `multiple_search_${query_type}`,
				taxonomy_path: classification.taxonomy_path,
				classification_confidence: classification.confidence.toFixed(3),
				candidates_searched: candidateResults.length,
				candidates_with_results: candidatesWithInfo.length,
				total_documents: allDocuments.length,
				final_documents: finalDocuments.length,
				coverage: `${candidatesWithInfo.length}/${candidateResults.length}`,
				avg_score: finalDocuments.length > 0 ? (finalDocuments.reduce((sum, d) => sum + (d.score || 0), 0) / finalDocuments.length).toFixed(3) : '0'
			});

			return result;
		} catch (error: unknown) {
				console.error('Error searching Qdrant:', error);
				// Log the full error response if available
				if (error instanceof Error && 'data' in error) {
					console.error('Qdrant Error Data:', JSON.stringify((error as Error & { data: unknown }).data, null, 2));
				}

				return {
					error: 'Error al buscar en la base de datos política',
					documents: [],
					query,
					total_results: 0,
				};
		}
	},
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const messages = Array.isArray(body.messages) ? body.messages : [];
		
		console.log(
			'🚀 Chat API - Starting request with messages:',
					program_name: programName,
					section_title: sectionTitle,
					headers: typedResult.payload?.headers || {},
					section_hierarchy: typedResult.payload?.section_hierarchy || [],
					// Campos de taxonomía enriquecida
					sub_category: typedResult.payload?.sub_category || '',
					taxonomy_path: typedResult.payload?.taxonomy_path || '',
					tags: typedResult.payload?.tags || [],
					// Metadatos de clasificación para contexto
					query_classification: {
						matched_taxonomy: classification.taxonomy_path,
						confidence: classification.confidence,
						matched_keywords: classification.matched_keywords
					}
				};
			});

			console.log('📝 Documentos optimizados:', {
				total: documents.length,
				hasContent: documents.filter((d) => d.content.length > 0).length,
				withTaxonomyPath: documents.filter((d) => d.taxonomy_path).length,
				avgVectorScore: documents.length > 0
					? (documents.reduce((sum, d) => sum + (d.score || 0), 0) / documents.length).toFixed(3)
					: 'N/A',
				avgFinalScore: documents.length > 0
					? (documents.reduce((sum, d) => sum + (d.score || 0), 0) / documents.length).toFixed(3)
					: 'N/A',
				classification_match: documents.filter((d) => 
					d.taxonomy_path === classification.taxonomy_path
				).length,
				unique_candidates: Array.from(new Set(documents.map(d => d.candidate))).length,
				reranking_applied: false,
				query_expanded: expandedQuery !== query
			});

			// Log contenido de los primeros documentos para debug
			if (documents.length > 0) {
				console.log('📄 Primer documento:', {
					candidate: documents[0].candidate,
					taxonomy_path: documents[0].taxonomy_path,
					sub_category: documents[0].sub_category,
					content_preview: documents[0].content.substring(0, 200) + '...',
					score: documents[0].score,
					tags: documents[0].tags?.slice(0, 3) || []
				});
			}

			if (documents.length === 0) {
				console.log(`✅ searchPoliticalDocs - No se encontraron documentos para la consulta: "${query}" (clasificación: ${classification.taxonomy_path})`);
				return {
					message: `No se encontraron documentos específicos sobre "${query}" en la base de datos de programas políticos.`,
					query,
					classification: {
						taxonomy_path: classification.taxonomy_path,
						confidence: classification.confidence,
						matched_keywords: classification.matched_keywords
					},
					total_results: 0,
					documents: []
				};
			}

			const result = {
				documents: documents,
				query,
				classification: {
					taxonomy_path: classification.taxonomy_path,
					confidence: classification.confidence,
					matched_keywords: classification.matched_keywords,
					suggested_tags: classification.suggested_tags
				},
				total_results: documents.length,
				// Datos agregados para análisis estructurado
				summary: generateSearchSummary(documents, classification)
			};

			console.log('✅ searchPoliticalDocs - Resultado OPTIMIZADO:', {
				total_documents: documents.length,
				taxonomy_path: classification.taxonomy_path,
				confidence: classification.confidence.toFixed(3),
				taxonomy_matches: documents.filter(d => d.taxonomy_path === classification.taxonomy_path).length,
				unique_candidates: Array.from(new Set(documents.map(d => d.candidate))).length,
				optimizations_applied: {
					query_expansion: expandedQuery !== query,
					oversampling_used: '30→15',
					hnsw_ef_optimized: 128,
					hybrid_reranking: true,
					adaptive_filters: classification.filters.length > 0
				},
				performance_indicators: {
					avg_vector_score: documents.length > 0 ? (documents.reduce((sum, d) => sum + (d.score || 0), 0) / documents.length).toFixed(3) : '0',
					avg_final_score: documents.length > 0 ? (documents.reduce((sum, d) => sum + (d.score || 0), 0) / documents.length).toFixed(3) : '0',
					score_improvement: '0.000'
				}
			});
			
			return result;
		} catch (error: unknown) {
			console.error('Error searching Qdrant:', error);
			// Log the full error response if available
			if (error instanceof Error && 'data' in error) {
				console.error('Qdrant Error Data:', JSON.stringify((error as Error & { data: unknown }).data, null, 2));
			}

			return {
				error: 'Error al buscar en la base de datos política',
				documents: [],
				query,
				total_results: 0,
			};
		}
	},
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const messages = Array.isArray(body.messages) ? body.messages : [];
		
		console.log(
			'🚀 Chat API - Starting request with messages:',
			messages?.length || 0,
			'messages'
		);
		console.log(
			'🔍 Last message:',
			messages[messages?.length - 1]?.content || 'No content'
		);
		console.log('🔧 Messages validation:', {
			isArray: Array.isArray(messages),
			length: messages.length,
			firstMessage: messages[0]
		});

		// Ensure messages have required structure and convert UIMessage to ModelMessage
		if (!Array.isArray(messages) || messages.length === 0) {
			throw new Error('Invalid messages format');
		}

		// Convert UIMessages to ModelMessages format
		const modelMessages = convertToModelMessages(messages);

		const result = streamText({
			model: openai('gpt-4o-mini'),
			system: `# ROL Y OBJETIVO
Eres un analista político senior, experto en los programas electorales de Chile. Tu misión es proporcionar respuestas imparciales, rigurosas y basadas exclusivamente en los documentos de los programas de gobierno.

# METODOLOGÍA DE ANÁLISIS (Reglas de Búsqueda)

Antes de responder, sigue estos 3 pasos para determinar cómo buscar la información:

**Paso 1: Identificar la Intención del Usuario**
Analiza la pregunta para clasificarla en una de estas tres categorías:
- **Consulta General:** El usuario pregunta por un tema sin nombrar a ningún candidato (ej: "¿qué proponen para las pensiones?").
- **Consulta Específica:** El usuario nombra a UN SOLO candidato (ej: "propuestas de Kast", "¿qué dice Matthei sobre salud?").
- **Consulta Comparativa:** El usuario nombra a DOS O MÁS candidatos (ej: "compara a Jara y Kast en seguridad").

**Paso 2: Ejecutar la Búsqueda según la Intención**
Usa la herramienta \`searchPoliticalDocs\` de la siguiente manera:
- **Para Consultas Generales:** DEBES buscar información sobre el tema para TODOS los siguientes candidatos: **Harold Mayne-Nicholls, Marco Enríquez-Ominami, Jeannette Jara, Johannes Kaiser, José Antonio Kast, Evelyn Matthei, Eduardo Artés, Franco Parisi.**
- **Para Consultas Específicas:** DEBES buscar información filtrando ÚNICAMENTE por el candidato mencionado. Reconoce los apellidos como "Kast", "Jara", "Parisi", "Matthei", etc.
- **Para Consultas Comparativas:** DEBES buscar información filtrando ÚNICAMENTE por los candidatos mencionados en la pregunta.

**Paso 3: Estructurar la Respuesta**
- **Para Consultas Generales y Comparativas:** Organiza la respuesta con encabezados claros para cada candidato del que encuentres información.
- **Para Consultas Específicas:** Responde de forma directa y enfocada en el candidato solicitado.

# FORMATO DE CITAS (OBLIGATORIO Y ESTRICTO)

Cada dato o afirmación que extraigas de un documento DEBE ser citado al final de la oración usando este formato EXACTO:

**(Programa [Nombre del Candidato] 2025, Pág. [Número de Página], Sección: "[Título de la Sección]")**

**Reglas para el Título de la Sección:**
1. El "[Título de la Sección]" DEBE ser el título o encabezado real extraído del documento. Este valor lo encontrarás en los metadatos del documento recuperado (probablemente bajo un campo como \`section_title\`, \`header\` o similar).
2. **PROHIBIDO:** Nunca uses la categoría temática general (como "Salud", "Pensiones", "Seguridad") en la cita, a menos que ese sea el título textual de la sección en el documento. La cita debe ser 100% verificable en el programa original.

# APROVECHAMIENTO DE TAXONOMÍA EXPANDIDA
- Usa \`taxonomy_path\` y \`confidence\` para ajustar especificidad de análisis
- Aprovecha \`matched_keywords\` para enfocar el análisis en términos relevantes
- Utiliza la clasificación automática (14 categorías, 83 subcategorías) para contexto adicional

# ESTILO Y PERSONALIDAD
- Analista político experimentado con perspectiva académica
- Imparcial pero crítico: no favoreces ningún candidato, pero señalas fortalezas y debilidades
- Lenguaje profesional pero accesible
- Evaluación de viabilidad política, técnica y presupuestaria
- Análisis balanceado que reconoce complejidades del sistema político chileno

Los candidatos son: Harold Mayne-Nicholls, Marco Enríquez-Ominami, Jeannette Jara, Johannes Kaiser, José Antonio Kast, Evelyn Matthei, Eduardo Artés, Franco Parisi`,
			messages: modelMessages,
			tools: {
				searchPoliticalDocs,
			},
			stopWhen: () => false, // No detener automáticamente, dejar que el modelo complete
			toolChoice: 'auto', // Permitir uso inteligente de herramientas
			temperature: 0.2, // Más consistencia para análisis profesional
			onStepFinish: ({ toolResults }) => {
				for (const toolResult of toolResults) {
					if (toolResult.toolName === 'searchPoliticalDocs') {
						console.log('Resultados de searchPoliticalDocs:', toolResult.output);
					}
				}
			},
			onFinish: (result) => {
				console.log('📡 Final result:', {
					hasText: !!result.text,
					textLength: result.text?.length || 0,
					finishReason: result.finishReason,
					toolCalls: result.toolCalls?.length || 0
				});
				
				if (!result.text || result.text.trim() === '') {
					console.warn('⚠️ Modelo no generó texto después de usar herramientas');
				}
			},
		});

		console.log('📡 Starting to stream response...');

		// Crear response stream con manejo de errores
		const response = result.toUIMessageStreamResponse();
		console.log('✅ Stream response created successfully');
		return response;
	} catch (error) {
		console.error('💥 Chat API Error:', error);
		return Response.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
