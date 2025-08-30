/** @format */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Lightbulb,
	Search,
	PencilRuler,
	DatabaseZap,
	FileText,
	Scissors,
	Tags,
	BrainCircuit,
	CloudUpload,
	Cpu,
} from 'lucide-react';
import { Metadata } from 'next';
import { Disclaimer } from './disclaimer';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
	title: 'El Proceso | Open Program IA',
	description:
		'Descubre la arquitectura, la tecnología y la filosofía detrás de Open Program IA, la herramienta para analizar los programas presidenciales de Chile.',
};

// Pequeño componente para las tarjetas de tecnología

// Componente para los pasos del proceso
function ProcessStep({
	icon: Icon,
	title,
	children,
}: {
	icon: React.ElementType;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-start space-x-4">
			<div className="flex-shrink-0">
				<Icon className="h-8 w-8 text-primary mt-1" />
			</div>
			<div>
				<h4 className="text-lg font-semibold text-foreground">{title}</h4>
				<div className="text-muted-foreground">{children}</div>
			</div>
		</div>
	);
}

export default function HowItWasMadePage() {
	return (
		<>
		<main className="bg-background text-foreground animate-fadeIn">
			<div className="container mx-auto max-w-5xl py-20 px-4 sm:py-24 animate-fadeIn">
				<div className="text-center mb-20">
					<Lightbulb className="mx-auto h-12 w-12 text-primary" />
					<h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
						Acerca de Open Program IA
					</h1>
					<p className="mt-6 text-xl leading-8 text-muted-foreground">
						Democratizando el acceso a la información política con Inteligencia
						Artificial.
					</p>
				</div>

				<Card className="mb-16">
					<CardHeader>
						<CardTitle>Nuestra Misión</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-muted-foreground">
						<p>
							Open Program IA nació con un objetivo claro: romper la barrera de
							acceso a los programas de gobierno. Nuestra misión es ofrecer a
							cada ciudadano una herramienta para explorar, comparar y entender
							las propuestas de los candidatos presidenciales de Chile.
						</p>
						<p>
							Creemos en un debate informado y en la tecnología para fomentar la
							transparencia. Esta plataforma es una ventana directa a las
							fuentes oficiales, potenciada por una IA entrenada para ser un
							analista neutral y riguroso.
						</p>
					</CardContent>
				</Card>

				<div className="text-center mb-12">
					<Cpu className="mx-auto h-12 w-12 text-primary" />
					<h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
						¿Cómo Piensa Nuestra IA? Una Analogía
					</h2>
					<p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
						El término técnico es &quot;Arquitectura RAG&quot;, pero preferimos
						explicarlo así:
					</p>
				</div>

				<Card className="mb-16">
					<CardHeader>
						<CardTitle>Un Analista Experto en su Biblioteca</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-muted-foreground">
						<p>
							Imagina que nuestra IA es un analista político ultrarrápido y con
							una memoria fotográfica perfecta. Su única misión es responder a
							tus preguntas de forma clara e imparcial.
						</p>
						<p>
							Para garantizar esa neutralidad, tiene una regla de oro: <strong>no
							puede responder de memoria</strong>. Por cada pregunta que haces, el
							analista va a su biblioteca (nuestra base de datos con los
							programas presidenciales), busca los capítulos y páginas más relevantes en los
							libros (los PDFs), los lee en una fracción de segundo y, solo
							entonces, usando únicamente esa información fresca, construye la
							respuesta perfecta para ti.
						</p>
						<p>
							Como cualquier experto, tiene un límite en la cantidad de páginas
							que puede leer al mismo tiempo para dar una respuesta coherente.
							Este &quot;foco de atención&quot; asegura que su análisis siempre
							esté anclado a los hechos del libro que acaba de &quot;leer&quot;,
							y no a un vago recuerdo.
						</p>
						<p className="font-semibold text-foreground">
							Este proceso de{' '}
							<span className="text-primary">buscar para responder</span> es lo
							que garantiza que cada respuesta sea inteligente y, a la vez, 100%
							verificable.
						</p>
					</CardContent>
				</Card>

				<div className="text-center mb-12">
					<DatabaseZap className="mx-auto h-12 w-12 text-primary" />
					<h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
						Construyendo la Base del Conocimiento
					</h2>
					<p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
						Antes de que la IA pueda responder una sola pregunta, ejecutamos un
						sofisticado proceso de RAG (Generación Aumentada por Recuperación)
						para procesar y estructurar la información. Este trabajo se hace
						mediante scripts de Python especializados.
					</p>
				</div>
				<div className="space-y-12 mb-20">
					<ProcessStep
						icon={FileText}
						title="1. La Materia Prima: Documentos Oficiales"
					>
						<p>
							Todo comienza con las fuentes primarias: los programas de gobierno
							en formato PDF, obtenidos directamente de los sitios web oficiales
							de cada candidato.
						</p>
						<p className="mt-2">
							Para que nuestra IA pueda &quot;leer&quot; y analizar estos
							documentos, primero los procesamos con una herramienta de parsing
							avanzada, LlamaParse de <Badge>llamaindex.ai</Badge>. Este paso es
							clave, ya que convierte un PDF visual en un archivo de texto
							estructurado (Markdown). Así, preservamos encabezados y listas,
							preparando el contenido para un análisis preciso en los siguientes
							pasos.
						</p>
					</ProcessStep>
					<ProcessStep
						icon={Scissors}
						title="2. Chunking Inteligente y Preciso"
					>
						<p>
							Dividimos cada documento en <strong>fragmentos</strong> (chunks).
							Este no es un corte cualquiera: nuestro script respeta los
							marcadores de páginas, secciones, etc. para asegurar que cada cita
							que la IA genere sea 100% precisa y verificable en el documento
							original.
						</p>
					</ProcessStep>
					<ProcessStep
						icon={Tags}
						title="3. Clasificación y Enriquecimiento Automático"
					>
						<p>
							Aquí ocurre la magia. Por cada uno de los chunks, el script
							analiza el contenido y lo enriquece con metadatos cruciales:
						</p>
						<ul className="list-disc list-inside mt-2 space-y-1">
							<li>
								<strong>9 Categorías Temáticas:</strong> Detecta si el texto
								habla de <Badge variant="secondary">salud</Badge>,{' '}
								<Badge variant="secondary">pensiones</Badge>,{' '}
								<Badge variant="secondary">seguridad</Badge>, etc.
							</li>
							<li>
								<strong>4 Tipos de Propuesta:</strong> Identifica si es un{' '}
								<Badge variant="secondary">diagnóstico</Badge>, una{' '}
								<Badge variant="secondary">meta cuantitativa</Badge> o una{' '}
								<Badge variant="secondary">propuesta específica</Badge>.
							</li>
						</ul>
					</ProcessStep>
					<ProcessStep
						icon={BrainCircuit}
						title="4. La Traducción a Vectores (Embeddings)"
					>
						<p>
							Usamos la API de OpenAI y su modelo{' '}
							<Badge>text-embedding-3-small</Badge> para convertir el
							significado de cada fragmento en un &quot;embedding&quot;: un
							vector de múltiples dimensiones. Este es el lenguaje que nuestra
							base de datos vectorial comprende.
						</p>
					</ProcessStep>
					<ProcessStep icon={CloudUpload} title="5. Despliegue a la Nube">
						<p>
							Finalmente, todos los vectores junto a sus ricos metadatos
							(candidato, página, tema, tipo) se exportan y se suben a nuestra
							base de datos <Badge>Qdrant Cloud</Badge>, dejándola lista y
							optimizada para las consultas en tiempo real desde esta aplicación
							web.
						</p>
					</ProcessStep>
				</div>

				<div className="mb-16">
					<div className="text-center mb-12">
						<Search className="mx-auto h-12 w-12 text-primary" />
						<h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
							Anatomía de una Pregunta
						</h2>
						<p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
							Cuando escribes en el chat, se activa la segunda mitad de nuestro
							sistema RAG.
						</p>
					</div>
					<ol className="list-decimal list-inside space-y-4 text-muted-foreground">
						<li>
							<strong className="text-foreground">
								Vectorización de la Consulta:
							</strong>{' '}
							Tu pregunta se convierte en un vector, usando el mismo modelo de
							OpenAI.
						</li>
						<li>
							<strong className="text-foreground">
								Búsqueda Semántica en Qdrant:
							</strong>{' '}
							Buscamos en los chunks los que más se asemejan conceptualmente a
							tu pregunta, aplicando filtros por candidato o tema si es
							necesario.
						</li>
						<li>
							<strong className="text-foreground">
								Análisis y Generación por IA:
							</strong>{' '}
							El modelo <Badge>GPT-5</Badge> recibe tu pregunta y el contexto
							recuperado. Actuando como analista político, sintetiza la
							información para generar una respuesta coherente y neutral.
						</li>
						<li>
							<strong className="text-foreground">
								Respuesta con Citas y Streaming:
							</strong>{' '}
							La IA construye la respuesta final, añade las citas exactas y te
							la envía en tiempo real.
						</li>
					</ol>
				</div>

				<div className="text-center mb-12">
					<PencilRuler className="mx-auto h-12 w-12 text-primary" />
					<h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
						Las Piezas del Puzzle
					</h2>
				</div>
				<div className="max-w-4xl mx-auto text-center space-x-2 space-y-2">
					{[
						'Next.js 15',
						'React 19',
						'TypeScript',
						'Tailwind CSS 4',
						'ShadCN UI',
						'Vercel AI SDK',
						'Assistant UI',
						'OpenAI GPT-5',
						'Qdrant',
						'Python',
						'llamaindex.ai',
					].map((tech) => (
						<Badge key={tech} variant="secondary" className="text-lg py-1 px-3">
							{tech}
						</Badge>
					))}
				</div>
			</div>

			<Disclaimer />
		</main>
		<SiteFooter />
		
		</>
	);
}
