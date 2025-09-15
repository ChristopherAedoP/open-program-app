import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed, type ModelMessage } from 'ai';
import { z } from 'zod';
import { QdrantClient } from '@qdrant/js-client-rest';
import { classifyQuery, expandQuery, type ClassificationResult, type QueryType } from '../../../lib/query-preprocessor';

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
		const payload = result.payload || {}; // Asegurar que payload no sea undefined
		
		// Scoring híbrido optimizado usando metadatos existentes
		const hybridScore = {
			// Score vectorial base (50%)
			semantic: result.score * 0.5,
			
			// Bonus por match mejorado en tags y contenido (20%)
			tagMatch: calculateEnhancedTagMatch(payload.tags || [], payload.content || '', originalQuery) * 0.2,
			
			// Bonus por taxonomía exacta (15%)
			taxonomyBonus: payload.taxonomy_path === classification.taxonomy_path ? 0.15 : 0,
			
			// Bonus por diversidad de candidatos inteligente (10%)
			diversityBonus: getCandidateDiversityScore(payload.candidate || '', allCandidates, index) * 0.1,
			
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
// interface SearchResultPayload {
// 	content?: string;
// 	candidate?: string;
// 	party?: string;
// 	page_number?: number;
// 	topic_category?: string;
// 	proposal_type?: string;
// 	source_file?: string;
// 	headers?: Record<string, string>;
// 	section_hierarchy?: string[];
// 	sub_category?: string;
// 	taxonomy_path?: string;
// 	tags?: string[];
// }

// interface SearchResultPoint {
// 	id: string | number;
// 	version: number;
// 	score: number;
// 	payload?: SearchResultPayload;
// 	vector?: number[];
// }

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

// Lista completa de 8 candidatos presidenciales 2025 (nombres exactos como aparecen en Qdrant)
const ALL_CANDIDATES = [
	'Harold Mayne-Nicholls',
	'Marco Enríquez-Ominami', // Verificar disponibilidad en DB
	'Jeannette Jara',
	'Johannes Kaiser',
	'Jose Antonio Kast', // Sin acento en la DB
	'Evelyn Matthei',
	'Eduardo Artes', // Sin acento en la DB
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
		// Construir filtros para Qdrant - estructura correcta
		const mustConditions: Array<{
			key: string;
			match: { value?: string; any?: string[] };
		}> = [];
		
		// Filtro obligatorio por candidato
		mustConditions.push({
			key: 'candidate',
			match: { value: candidate }
		});
		
		// ESTRATEGIA GRADUAL PARA CANDIDATOS ESPECÍFICOS
		// Para candidatos específicos, usamos filtros menos restrictivos para maximizar cobertura
		
		// Usar el topic específico si se proporciona, sino usar la categoría de clasificación
		const categoryToFilter = (topic && topic.trim() !== '') ? topic : classification.category;
		
		if (categoryToFilter && classification.confidence > 0.3) {
			mustConditions.push({
				key: 'topic_category',
				match: { value: categoryToFilter }
			});
		}
		
		console.log(`🎯 Búsqueda específica para ${candidate}:`, {
			filters_count: mustConditions.length,
			taxonomy_confidence: classification.confidence.toFixed(3),
			filter_details: mustConditions.map(f => ({ key: f.key, match_type: Object.keys(f.match)[0] }))
		});
		
		// Ejecutar búsqueda específica para este candidato
		const queryResult: unknown = await qdrantClient.search(
			process.env.QDRANT_COLLECTION!,
			{
				vector: queryEmbedding, // queryEmbedding ya es number[]
				filter: {
					must: mustConditions
				},
				limit: 8, // Límite por candidato para controlar el tamaño total
				with_payload: true,
				params: {
					hnsw_ef: 128,
					exact: false
				}
			}
		);

		// search() devuelve array directo, no { points: [...] }
		let points: QdrantResult[] = [];
		if (Array.isArray(queryResult)) {
			points = queryResult as QdrantResult[];
		} else if (queryResult && typeof queryResult === 'object' && 'points' in queryResult) {
			points = (queryResult as { points: QdrantResult[] }).points || [];
		}

		// Procesar resultados
		const documents: DocumentResult[] = points
			.filter((point: QdrantResult) => point && point.payload) // Validar que exista payload
			.map((point: QdrantResult) => ({
			id: String(point.id),
			content: point.payload?.content || '',
			candidate: point.payload?.candidate || '',
			party: point.payload?.party || '',
			page_number: point.payload?.page_number || 0,
			topic_category: point.payload?.topic_category || '',
			proposal_type: point.payload?.proposal_type || '',
			source_file: point.payload?.source_file || '',
			program_name: point.payload?.program_name || '',
			section_title: point.payload?.section_title || '',
			taxonomy_path: point.payload?.taxonomy_path || '',
			tags: point.payload?.tags || [],
			headers: point.payload?.headers || [],
			section_hierarchy: point.payload?.section_hierarchy || [],
			score: point.score || 0
		}));
		
		console.log(`📊 Candidato ${candidate}: ${documents.length} documentos encontrados`);
		
		// FALLBACK: Si no encontró documentos con filtros, buscar solo por candidato
		if (documents.length === 0 && mustConditions.length > 1) {
			console.log(`🔄 Fallback para ${candidate}: búsqueda solo por candidato...`);
			
			const fallbackResult: unknown = await qdrantClient.search(
				process.env.QDRANT_COLLECTION!,
				{
					vector: queryEmbedding,
					filter: {
						must: [{ key: 'candidate', match: { value: candidate } }] // Solo filtro por candidato
					},
					limit: 15, // Más resultados en fallback
					with_payload: true,
					params: {
						hnsw_ef: 128,
						exact: false
					}
				}
			);

			let fallbackPoints: QdrantResult[] = [];
			if (Array.isArray(fallbackResult)) {
				fallbackPoints = fallbackResult as QdrantResult[];
			} else if (fallbackResult && typeof fallbackResult === 'object' && 'points' in fallbackResult) {
				fallbackPoints = (fallbackResult as { points: QdrantResult[] }).points || [];
			}

			const fallbackDocuments: DocumentResult[] = fallbackPoints
				.filter((point: QdrantResult) => point && point.payload)
				.map((point: QdrantResult) => ({
					id: String(point.id),
					content: point.payload?.content || '',
					candidate: point.payload?.candidate || '',
					party: point.payload?.party || '',
					page_number: point.payload?.page_number || 0,
					topic_category: point.payload?.topic_category || '',
					proposal_type: point.payload?.proposal_type || '',
					source_file: point.payload?.source_file || '',
					program_name: point.payload?.program_name || '',
					section_title: point.payload?.section_title || '',
					taxonomy_path: point.payload?.taxonomy_path || '',
					tags: point.payload?.tags || [],
					headers: point.payload?.headers || [],
					section_hierarchy: point.payload?.section_hierarchy || [],
					score: point.score || 0
				}));
			
			console.log(`🔄 Fallback ${candidate}: ${fallbackDocuments.length} documentos encontrados`);
			
			return {
				candidate,
				documents: fallbackDocuments,
				found_information: fallbackDocuments.length > 0
			};
		}
		
		return {
			candidate,
			documents,
			found_information: documents.length > 0
		};
		
	} catch (error: unknown) {
		console.error(`❌ Error buscando información para ${candidate}:`, error);
		
		// Log detallado del error de Qdrant - múltiples propiedades
		if (error instanceof Error) {
			// Inspeccionar todas las propiedades posibles del error
			console.error(`🔍 Error completo para ${candidate}:`, {
				message: error.message,
				name: error.name,
				stack: error.stack?.split('\n').slice(0, 3).join('\n'), // Solo primeras 3 líneas
			});
			
			// Intentar acceder a diferentes propiedades del error
			const errorObj = error as Error & { 
				response?: { data: unknown }; 
				data?: unknown; 
				body?: unknown;
				details?: unknown;
			};
			
			if (errorObj.response?.data) {
				console.error(`📊 Response data para ${candidate}:`, JSON.stringify(errorObj.response.data, null, 2));
			}
			
			if (errorObj.data) {
				console.error(`📊 Error data para ${candidate}:`, JSON.stringify(errorObj.data, null, 2));
			}
			
			if (errorObj.body) {
				console.error(`📊 Error body para ${candidate}:`, JSON.stringify(errorObj.body, null, 2));
			}
			
			if (errorObj.details) {
				console.error(`📊 Error details para ${candidate}:`, JSON.stringify(errorObj.details, null, 2));
			}
		}
		
		// Log de los filtros reales enviados (no solo el count)
		console.error(`🔍 Filtros enviados a Qdrant para ${candidate}:`, {
			candidate,
			classification_confidence: classification.confidence,
			classification_filters: classification.filters,
			topic: topic || 'undefined'
		});
		
		return {
			candidate,
			documents: [],
			found_information: false
		};
	}
}

/**
 * Normalize text for candidate name comparison
 */
function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remove accents
		.trim();
}

// Función para mapear nombres/apellidos de usuarios a nombres completos
function mapCandidateNames(userInputs: string[]): string[] {
	const mapped: string[] = [];
	
	for (const input of userInputs) {
		const inputNormalized = normalizeText(input);
		
		// Buscar coincidencias exactas o parciales
		const match = ALL_CANDIDATES.find(candidate => {
			const candidateNormalized = normalizeText(candidate);
			const parts = candidateNormalized.split(' ');
			
			// Coincidencia exacta
			if (candidateNormalized === inputNormalized) return true;
			
			// Coincidencia por apellido
			if (parts.some(part => part === inputNormalized)) return true;
			
			// Coincidencia por nombre
			if (parts.some(part => part.includes(inputNormalized) && inputNormalized.length > 3)) return true;
			
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
		const classification = await classifyQuery(query, query_type as QueryType);
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

			// Función auxiliar para ejecutar búsqueda con fallback automático
			const executeSearchWithFallback = async (
				candidates: string[], 
				useClassificationFilters: boolean = true
			): Promise<Array<{ candidate: string; documents: DocumentResult[]; found_information: boolean; }>> => {
				const modifiedClassification = useClassificationFilters 
					? classification 
					: { ...classification, filters: [], confidence: 0.1 }; // Sin filtros para fallback
				
				const searchPromises = candidates.map(candidate => 
					searchByCandidate(query, queryEmbedding, modifiedClassification, candidate, topic)
				);
				
				return await Promise.all(searchPromises);
			};

			// Lógica diferenciada según el tipo de consulta
			if (query_type === 'general') {
				console.log('🌐 Ejecutando búsqueda GENERAL para todos los candidatos');
				
				// Buscar información para TODOS los candidatos con filtros de clasificación
				candidateResults = await executeSearchWithFallback(ALL_CANDIDATES, true);
				
				// Verificar cobertura y aplicar fallback si es necesario
				const candidatesWithInfo = candidateResults.filter(r => r.found_information).length;
				
				if (candidatesWithInfo < 3) {
					console.warn(`⚠️ Cobertura insuficiente: ${candidatesWithInfo}/8 candidatos. Activando fallback sin filtros...`);
					
					// Fallback: búsqueda sin filtros de taxonomía para mayor recall
					const fallbackResults = await executeSearchWithFallback(ALL_CANDIDATES, false);
					const fallbackCandidatesWithInfo = fallbackResults.filter(r => r.found_information).length;
					
					console.log(`🔄 Fallback completado: ${fallbackCandidatesWithInfo}/8 candidatos encontrados`);
					
					// Usar resultados de fallback si mejoran la cobertura
					if (fallbackCandidatesWithInfo > candidatesWithInfo) {
						candidateResults = fallbackResults;
						console.log(`✅ Fallback exitoso: mejoró cobertura de ${candidatesWithInfo} a ${fallbackCandidatesWithInfo} candidatos`);
					} else {
						console.log(`ℹ️ Fallback no mejoró la cobertura. Manteniendo resultados originales.`);
					}
				} else {
					console.log(`✅ Cobertura adecuada: ${candidatesWithInfo}/8 candidatos con información`);
				}
				
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
				
				// Buscar para los candidatos especificados con filtros
				candidateResults = await executeSearchWithFallback(targetCandidates, true);
				
				// Verificar si se encontró información para los candidatos solicitados
				const candidatesWithInfo = candidateResults.filter(r => r.found_information).length;
				
				if (candidatesWithInfo === 0) {
					console.warn(`⚠️ Sin información para candidatos específicos. Activando fallback sin filtros...`);
					
					// Fallback para consultas específicas
					const fallbackResults = await executeSearchWithFallback(targetCandidates, false);
					const fallbackCandidatesWithInfo = fallbackResults.filter(r => r.found_information).length;
					
					console.log(`🔄 Fallback específico completado: ${fallbackCandidatesWithInfo}/${targetCandidates.length} candidatos`);
					
					if (fallbackCandidatesWithInfo > 0) {
						candidateResults = fallbackResults;
						console.log(`✅ Fallback específico exitoso: encontró información para ${fallbackCandidatesWithInfo} candidatos`);
					}
				}
			}

			// Agregar y procesar resultados
			const allDocuments: DocumentResult[] = [];
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
			const rerankedResults = rerankWithExistingMetadata(
				allDocuments,
				query,
				classification
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
				console.error('🚨 Error en searchPoliticalDocs:', error);
				console.error('🚨 Error tipo:', typeof error);
				console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack');
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

		// Convert UIMessage format to ModelMessage format
		interface MessagePart {
			type: string;
			text: string;
		}
		
		interface UIMessage {
			role: string;
			content?: string;
			parts?: MessagePart[];
		}
		
		const allowedRoles = ['user', 'assistant', 'system', 'tool'] as const;
		type ModelRole = typeof allowedRoles[number];

		const modelMessages: ModelMessage[] = messages.map((message: UIMessage) => {
			// Normalize role to allowed values and cast as string literal
			const normalizedRole: ModelRole = allowedRoles.includes(message.role as ModelRole)
				? (message.role as ModelRole)
				: 'user';

			// Handle UIMessage format with parts
			if (message.parts && Array.isArray(message.parts)) {
				const textContent = message.parts
					.filter((part: MessagePart) => part.type === 'text')
					.map((part: MessagePart) => part.text)
					.join('');
				
				return {
					role: normalizedRole,
					content: textContent
				} as ModelMessage;
			}
			
			// Handle already converted ModelMessage format
			if (message.content) {
				return {
					role: normalizedRole,
					content: message.content
				} as ModelMessage;
			}
			
			// Fallback for unexpected formats
			console.warn('Unexpected message format:', message);
			return {
				role: normalizedRole,
				content: message.content || 'No content'
			} as ModelMessage;
		});

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
- **Candidatos sin información:** Si no encuentras información para algún candidato mencionado,indica explicitamente que "No se encontró informacion para [Nombre del Candidato] sobre este tema
"

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

Los candidatos son: Harold Mayne-Nicholls, Marco Enríquez-Ominami, Jeannette Jara, Johannes Kaiser, José Antonio Kast, Evelyn Matthei, Eduardo Artés, Franco Parisi


`,
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
