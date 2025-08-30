/** @format */

// components/Disclaimer.tsx

import { Separator } from '@/components/ui/separator';
import { Scale } from 'lucide-react';

export function Disclaimer() {
	return (
		<div className="container mx-auto max-w-5xl px-4 mt-16">
			<Separator />
			<div className="py-12 text-center">
				<div className="flex items-center justify-center gap-x-3 mb-4">
					<Scale className="h-6 w-6 text-muted-foreground" />
					<h3 className="text-xl font-semibold text-foreground">
						Neutralidad y Propósito del Proyecto
					</h3>
				</div>
				<p className="text-sm text-muted-foreground max-w-3xl mx-auto">
					Open Program IA es una herramienta independiente y sin afiliación
					política. Su desarrollo y mantenimiento se realizan con un estricto
					compromiso de neutralidad e imparcialidad. El contenido generado por
					la IA se basa exclusivamente en los programas de gobierno oficiales y
					no debe interpretarse como un respaldo, crítica o apoyo hacia ningún
					candidato o partido político.
				</p>
				<p className="text-sm text-muted-foreground max-w-3xl mx-auto mt-2">
					Este proyecto fue creado con fines exclusivamente educativos, cívicos
					y de investigación, sin ningún propósito comercial. Su objetivo es
					fomentar la participación ciudadana a través del acceso transparente a
					la información.
				</p>
			</div>
		</div>
	);
}
