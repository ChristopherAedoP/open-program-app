/** @format */

'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export function SiteHeader() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		setTheme(theme === 'dark' ? 'light' : 'dark');
	};

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger />
			<Separator orientation="vertical" className="mr-2 h-4" />
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Análisis Político a tu Disposición</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="ml-auto flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleTheme}
					aria-label="Toggle theme"
					className="h-8 w-8"
				>
					<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				</Button>
			</div>
		</header>
	);
}
