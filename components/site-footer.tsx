/** @format */

import { Separator } from '@/components/ui/separator';
import { Github, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function SiteFooter() {
	return (
		<footer className="bg-background px-4">
			<div className="container mx-auto max-w-7xl">
				<Separator />
				<div className="flex h-12 items-center justify-between">
					{/* Texto a la izquierda */}
					{/* CAMBIO CLAVE: Texto más pequeño en móvil (11px) y sube a 12px en pantallas sm y mayores */}
					<p className="text-[11px] text-muted-foreground sm:text-xs">
						© {new Date().getFullYear()} Open Program IA. Creado por{' '}
						<Link
							href="https://caedo.cl"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium underline underline-offset-4 hover:text-primary"
						>
							Christopher Aedo
						</Link>
						.
					</p>

					{/* Iconos a la derecha */}
					<div className="flex items-center space-x-2">
						<Link
							href="https://github.com/ChristopherAedoP"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground transition-colors hover:text-primary"
						>
							<Github className="h-4 w-4" />
							<span className="sr-only">GitHub</span>
						</Link>
						<Link
							href="https://www.linkedin.com/in/christopheraedop/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground transition-colors hover:text-primary"
						>
							<Linkedin className="h-4 w-4" />
							<span className="sr-only">LinkedIn</span>
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
