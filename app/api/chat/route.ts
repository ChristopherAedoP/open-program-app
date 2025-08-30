import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { QdrantClient } from '@qdrant/js-client-rest';

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
}

interface SearchResultPoint {
	id: string | number;
	version: number;
	score: number;
	payload?: SearchResultPayload;
	vector?: number[];
}

// Tool para buscar documentos políticos
const searchPoliticalDocs = tool({
	description: 'Buscar en documentos políticos de candidatos presidenciales',
	inputSchema: z.object({
		query: z.string().describe('La pregunta o tema a buscar'),
		topic: z.string().optional().describe('Filtrar por tema específico'),
	}),
	execute: async ({ query, topic }) => {
		console.log('🔍 searchPoliticalDocs - Ejecutando con parámetros:', {
			query,
			topic,
		});

		// Generar embedding de la query
		const queryEmbedding = await generateEmbedding(query);
		console.log('📊 Embedding generado - dimensiones:', queryEmbedding.length);

		try {
			// Construir filtros
			const filters: Array<{ key: string; match: { value: string } }> = [];

			// Parámetros de búsqueda
			console.log('⚙️ Parámetros de búsqueda Qdrant:', {
				collection: process.env.QDRANT_COLLECTION!,
				embedding_dim: queryEmbedding.length,
				filters: filters.length,
				limit: 15,
			});

			const queryResult = await qdrantClient.query(
				process.env.QDRANT_COLLECTION!,
				{
					query: queryEmbedding,
					filter: filters.length > 0 ? { must: filters } : undefined,
					limit: 15,
					with_vector: true,
					with_payload: true,
				}
			);

			console.log(
				'📊 Qdrant query result - raw points:',
				queryResult.points?.length || 'No points field'
			);

			// Formatear resultados con metadata completa para referencias
			const searchResult = queryResult.points || queryResult;
			const documents = searchResult.map((result) => {
				const typedResult = result as SearchResultPoint;
				// Extraer nombre del programa desde source_file
				const sourceFile = typedResult.payload?.source_file || '';
				const programName = sourceFile.split('/').pop()?.replace('.md', '').replace('Programa_', '') || typedResult.payload?.candidate || 'Programa';
				
				// Extraer sección desde headers o section_hierarchy
				const headers = typedResult.payload?.headers || {};
				const sectionTitle = Object.values(headers)[0] || 
								   (typedResult.payload?.section_hierarchy && typedResult.payload.section_hierarchy[0]) || 
								   typedResult.payload?.topic_category || 'Sección General';

				return {
					content: typedResult.payload?.content || '',
					candidate: typedResult.payload?.candidate || '',
					party: typedResult.payload?.party || '',
					page_number: typedResult.payload?.page_number || 0,
					topic_category: typedResult.payload?.topic_category || '',
					proposal_type: typedResult.payload?.proposal_type || '',
					score: typedResult.score,
					source_file: sourceFile,
					// Campos adicionales para referencias académicas
					program_name: programName,
					section_title: sectionTitle,
					headers: typedResult.payload?.headers || {},
					section_hierarchy: typedResult.payload?.section_hierarchy || [],
				};
			});

			console.log('📝 Documentos formateados:', {
				total: documents.length,
				hasContent: documents.filter((d) => d.content.length > 0).length,
				avgScore:
					documents.length > 0
						? (
								documents.reduce((sum, d) => sum + (d.score || 0), 0) /
								documents.length
						  ).toFixed(3)
						: 'N/A',
			});

			// Log contenido de los primeros documentos para debug
			if (documents.length > 0) {
				console.log('📄 Primer documento:', {
					candidate: documents[0].candidate,
					content_preview: documents[0].content.substring(0, 200) + '...',
					score: documents[0].score,
				});
			}

			if (documents.length === 0) {
				console.log(`✅ searchPoliticalDocs - No se encontraron documentos para la consulta: "${query}"`);
				return {
					message: `No se encontraron documentos específicos sobre "${query}" en la base de datos de programas políticos.`,
					query,
					total_results: 0,
					documents: []
				};
			}

			const result = {
				documents: documents,
				query,
				total_results: documents.length,
			};

			console.log(
				'✅ searchPoliticalDocs - Retornando resultado con',
				documents.length,
				'documentos'
			);
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
		const { messages } = await req.json();
		console.log(
			'🚀 Chat API - Starting request with messages:',
			messages?.length || 0,
			'messages'
		);
		console.log(
			'🔍 Last message:',
			messages[messages?.length - 1]?.content || 'No content'
		);

		const result = streamText({
			model: openai('gpt-4o-mini'),
			system: `Eres un analista político senior especializado en programas electorales chilenos. Tu rol es proporcionar análisis crítico, imparcial y técnicamente riguroso.

PERSONALIDAD Y ENFOQUE:
- Analista político experimentado con perspectiva académica
- Imparcial pero crítico: no favoreces ningún candidato, pero señalas fortalezas y debilidades
- Usas terminología técnica de ciencia política
- Contextualizas propuestas dentro del sistema político chileno
- Evalúas viabilidad política, técnica y presupuestaria

METODOLOGÍA DE ANÁLISIS:
1. Usa searchPoliticalDocs para obtener información precisa
2. Estructura tu análisis profesionalmente:
   - Panorama General (síntesis ejecutiva)
   - Análisis por Candidato (crítico y contextual)
   - Evaluación Transversal (comparativa)
   - Observaciones Técnicas (viabilidad)

FORMATO DE REFERENCIAS:
Siempre cita fuentes precisas usando esta estructura:
*(Programa [Candidato] 2025, Pág. X, Sección: "[Título de Sección]")*

ESTILO:
- Lenguaje profesional pero accesible
- Análisis balanceado que reconoce complejidades
- Perspectiva comparativa entre propuestas
- Consideraciones de implementación práctica`,
			messages: convertToModelMessages(messages),
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
