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
			'https://www.haroldpresidente.cl/wp-content/uploads/2025/08/LINEAMIENTOS-PROGRAMA-DE-GOBIERNO-2026-2030-HAROLD-MAYNE-NICHOLLS-1.pdf',
	},
	{ name: 'Marco Enríquez-Ominami', programUrl: '#' },
	{
		name: 'Jeannette Jara',
		programUrl:
			'https://drive.google.com/file/d/1Ct-AEMifxrh2xcSTBNKSiP16oyR3npEj/view',
	},
	{
		name: 'Johannes Kaiser',
		programUrl:
			'https://static.emol.cl/emol50/documentos/archivos/2025/08/22/file_20250822192805.pdf',
	},
	{
		name: 'José Antonio Kast',
		programUrl:
			'https://kast.cl/wp-content/uploads/2025/08/Programa_Jose_Antonio_Kast_R.pdf',
	},
	{
		name: 'Evelyn Matthei',
		programUrl:
			'https://evelynmatthei.cl/wp-content/uploads/2025/08/Bases-programaticas-Evelyn-Matthei-2026.pdf',
	},
	{ name: 'Eduardo Artés', programUrl: '#' },

	{
		name: 'Franco Parisi',
		programUrl:
			'https://storage.googleapis.com/parisipresidente/programa%20de%20gobierno/programa-de-gobierno-parisi-presidente-2026.pdf',
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
							fondo los programas presidenciales oficiales, sin acceso a
							noticias, redes sociales ni opiniones externas.
						</p>
						<p className="mt-4 text-lg leading-8 text-muted-foreground">
							Cuando haces una pregunta, la IA no se limita a buscar palabras.
							Lee, comprende y conecta las ideas para entregarte un{' '}
							<strong className="text-foreground">análisis imparcial</strong> y
							estructurado, capaz de comparar propuestas. Pero lo más
							importante: cada dato y conclusión se basa{' '}
							<strong className="text-foreground">estrictamente</strong> en los
							documentos oficiales, citando siempre la página exacta.
						</p>
					</div>

					<div className="mt-20">
						<div className="text-center">
							<h3 className="text-2xl font-semibold leading-8 text-foreground">
								Programas de Gobierno Analizados
							</h3>
							<p className="mt-2 text-md text-muted-foreground">
								Estas son las fuentes públicas y oficiales que alimentan a
								nuestra IA.
							</p>
						</div>
						<div className="mt-6 text-sm text-muted-foreground bg-accent/50 p-4 rounded-lg max-w-2xl mx-auto flex items-start space-x-3">
							<Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
							<p className="text-left">
								<strong>¿Cómo los analiza?</strong> Imagina que nuestra IA es un
								analista experto que, para cada pregunta, va a su biblioteca,
								lee las páginas relevantes de estos libros y solo entonces te
								responde.
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
