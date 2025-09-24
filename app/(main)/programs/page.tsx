/** @format */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, BrainCircuit, Info } from 'lucide-react';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';

const candidates = [
	{
		name: 'Harold Mayne-Nicholls',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/HAROLD-MAYNE-NICHOLLS-SECUL.pdf',
	},
	{
		name: 'Marco Enríquez-Ominami',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/MARCO-ANTONIO-ENRIQUEZ-OMINAMI-GUMUCIO.pdf',
	},
	{
		name: 'Jeannette Jara',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/JEANNETTE-JARA-ROMAN.pdf',
	},
	{
		name: 'Johannes Kaiser',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/JOHANNES-KAISER-BARENTS-VON-HOHENHAGEN.pdf',
	},
	{
		name: 'José Antonio Kast',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/JOSE-ANTONIO-KAST-RIST.pdf',
	},
	{
		name: 'Evelyn Matthei',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/EVELYN-MATTHEI-FORNET.pdf',
	},
	{
		name: 'Eduardo Artés',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/EDUARDO-ANTONIO-ARTES-BRICHETTI.pdf',
	},
	{
		name: 'Franco Parisi',
		programUrl:
			'https://www.servel.cl/wp-content/uploads/2025/09/FRANCO-PARISI-FERNANDEZ.pdf',
	},
];

const ProgramsPage = () => {
	return (
		<>
			<section className="bg-background py-15 sm:py-15 animate-fadeIn">
				<div className="container mx-auto max-w-7xl px-4 animate-fadeIn">
					<div className="mx-auto max-w-3xl text-center">
						{/* Un ícono que representa mejor el análisis y la inteligencia */}
						<BrainCircuit className="mx-auto h-12 w-12 text-primary" />
						<h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
							Análisis Experto, Cero Opinión.
						</h2>
						<p className="mt-6 text-lg leading-8 text-muted-foreground">
							Piensa en nuestra IA como tu propio equipo de analistas políticos,
							trabajando exclusivamente para ti. Su única misión es estudiar a
							fondo los programas presidenciales oficiales obtenidos directamente del{' '}
							<strong className="text-foreground">SERVEL</strong>, sin acceso a
							noticias, redes sociales ni opiniones externas.
						</p>
						<p className="mt-4 text-lg leading-8 text-muted-foreground">
							Cuando haces una pregunta, la IA no se limita a buscar palabras.
							Lee, comprende y conecta las ideas para entregarte un{' '}
							<strong className="text-foreground">análisis imparcial</strong> y
							estructurado, capaz de comparar propuestas. Pero lo más
							importante: cada dato y conclusión se basa{' '}
							<strong className="text-foreground">estrictamente</strong> en los
							documentos oficiales del organismo regulador electoral, citando siempre la página exacta.
						</p>
					</div>

					<div className="mt-20">
						<div className="text-center">
							<h3 className="text-2xl font-semibold leading-8 text-foreground">
								Programas Presidenciales Oficiales SERVEL
							</h3>
							<p className="mt-2 text-md text-muted-foreground">
								Fuente única y oficial: <strong>SERVEL</strong> (Servicio Electoral de Chile),
								el organismo regulador de las elecciones presidenciales.
							</p>
							<p className="mt-2 text-sm text-muted-foreground">
								Documentos obtenidos desde{' '}
								<Link
									href="https://www.servel.cl/candidaturas-y-programas-elecciones-presidencial-y-parlamentarias-2025/"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline font-semibold"
								>
									servel.cl/candidaturas-y-programas
								</Link>
							</p>
						</div>
						<div className="mt-6 text-sm text-muted-foreground bg-accent/50 p-4 rounded-lg max-w-2xl mx-auto flex items-start space-x-3">
							<Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
							<p className="text-left">
								<strong>¿Cómo los analiza?</strong> Imagina que nuestra IA es un
								analista experto que, para cada pregunta, va a su biblioteca oficial del SERVEL,
								lee las páginas relevantes de estos documentos oficiales y solo entonces te
								responde con base en la fuente única de verdad electoral.
								<Link
									href="/about"
									className="text-primary hover:underline font-semibold ml-1"
								>
									Descubre el proceso completo aquí.
								</Link>
							</p>
						</div>

						<div className="mx-auto mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{candidates.map((candidate) => (
								<Card key={candidate.name} className="flex flex-col">
									<CardHeader className="justify-center">
										<CardTitle>{candidate.name}</CardTitle>
									</CardHeader>
									<CardContent className="flex-grow flex items-end">
										<Button
											asChild
											className="w-full"
											disabled={candidate.programUrl === '#'}
										>
											<Link
												href={candidate.programUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												<BookOpenCheck className="mr-2 h-4 w-4" />
												{candidate.programUrl === '#'
													? 'Fuente Próximamente'
													: 'Ver Programa Oficial'}
											</Link>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</section>

			<SiteFooter />
		</>
	);
};

export default ProgramsPage;
