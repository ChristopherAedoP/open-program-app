/** @format */

import { Metadata } from 'next';

interface SEOProps {
	title?: string;
	description?: string;
	pathname?: string;
	image?: string;
	keywords?: string[];
}


export function constructMetadata({
	title = 'Open Program IA | Analiza Programas Presidenciales 2025',
	description = 'Compara y consulta los programas de gobierno de los candidatos presidenciales de Chile 2025 con nuestra IA. Obtén respuestas directas, análisis imparciales y citas extraídas de los documentos oficiales.',
	pathname = '/',
	image = '/og.png', 
	keywords = [
		'programas presidenciales chile 2025',
		'propuestas candidatos chile',
		'elecciones chile 2025',

		'ia para política',
		'análisis político con ia',
		'open program ia',

		'comparar programas presidenciales',
		'propuestas economía chile',
		'propuestas seguridad candidatos',
		'plan de gobierno chile',
		'resumen propuestas electorales',
		'propuestas sociales chile',
		'propuestas Kast',
		'propuestas Matthei',
		'propuestas Jara',
	],
}: SEOProps = {}): Metadata {
	const siteName = 'Open Program IA';
	const baseUrl =
		process.env.NEXT_PUBLIC_BASE_URL || 'https://open-program.caedo.cl';
	const url = `${baseUrl}${pathname}`;

	const metadata: Metadata = {
		metadataBase: new URL(baseUrl),
		title: {
			default: title,
			template: `%s | ${siteName}`,
		},
		description,
		keywords,

		authors: [{ name: 'Equipo Open Program IA', url: baseUrl }],
		creator: 'Equipo Open Program IA',
		publisher: 'Open Program IA',

		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				'max-video-preview': -1,
				'max-image-preview': 'large',
				'max-snippet': -1,
			},
		},

		icons: {
			icon: '/favicon.ico',
			shortcut: '/logo.png',
			apple: '/logo.png',
		},

		alternates: {
			canonical: url,
		},

		openGraph: {
			title,
			description,
			url,
			siteName,
			images: [
				{
					url: image, // La ruta debe ser absoluta
					width: 1200,
					height: 630,
					alt: `Análisis de programas presidenciales con IA - ${siteName}`,
				},
			],
			locale: 'es_CL',
			type: 'website',
		},

		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [image],
			creator: '@OpenProgramIA',
		},

		// verification: {
		// 	google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
		// },
	};

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: siteName,
		url: baseUrl,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${baseUrl}/?q={search_term_string}`,
			'query-input': 'required name=search_term_string',
		},
	};

	const faqStructuredData = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: '¿Qué es Open Program IA?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: `Open Program IA es una herramienta de inteligencia artificial que te permite consultar y comparar los programas de gobierno de los candidatos presidenciales de Chile 2025. Todas las respuestas se basan estrictamente en los documentos oficiales.`,
				},
			},
			{
				'@type': 'Question',
				name: '¿Cómo puedo comparar las propuestas de dos candidatos?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Simplemente escribe una pregunta en el chat, como por ejemplo: "Compara las propuestas de Kast y Jara sobre pensiones". La IA buscará en ambos programas y te entregará una respuesta estructurada.',
				},
			},
			{
				'@type': 'Question',
				name: '¿La información es confiable y neutral?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Sí. La IA tiene la instrucción estricta de responder únicamente con la información extraída de los programas presidenciales oficiales, citando la fuente. No emite opiniones ni análisis propios, garantizando total neutralidad.',
				},
			},
		],
	};

	return {
		...metadata,
		other: {
			'application/ld+json': JSON.stringify([
				structuredData,
				faqStructuredData,
			]),
		},
	};
}
