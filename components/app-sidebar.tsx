/** @format */

import * as React from 'react';
import { Info, Archive, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from '@/components/ui/sidebar';
// import { ThreadList } from "./assistant-ui/thread-list"
import { GiScrollUnfurled } from 'react-icons/gi';
import { usePathname } from 'next/navigation';
import { Badge } from './ui/badge';

const data = {
	navMain: [
		{
			title: 'Information',
			url: '#',
			items: [
				{
					title: 'Programas Politicos',
					url: '/programs',
					icon: Archive,
				},
				{
					title: 'Como se hizo',
					url: '/about',
					icon: Info,
				},
			],
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();

	const { state, toggleSidebar, isMobile } = useSidebar();
	const handleItemClick = () => {
		if (state === 'expanded' && isMobile) {
			toggleSidebar();
		}
	};

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/" onClick={handleItemClick}>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<GiScrollUnfurled className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5 leading-none">
									<span className="font-semibold">Open Program IA</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuButton asChild isActive={pathname === '/'}>
								<Link href="/" onClick={handleItemClick}>
									<BrainCircuit className="mr-2 h-4 w-4" />
									Chat
								</Link>
							</SidebarMenuButton>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{data.navMain.map((item) => (
					<SidebarGroup key={item.title}>
						<SidebarGroupLabel>{item.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{item.items.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={pathname === item.url}>
											<Link href={item.url} onClick={handleItemClick}>
												{item.icon && <item.icon />}
												{item.title}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarRail />
			<SidebarFooter>
				<div className="mt-auto border-t p-4">
					<div className="flex items-start space-x-2.5">
						<div>
							{/* Un ícono sutil para llamar la atención */}
							<Info className="h-4 w-4 text-muted-foreground mt-0.5" />
						</div>
						<div className="flex-1">
							<p className="text-xs font-semibold text-foreground mb-1">
								Notas
							</p>
							<p className="text-xs text-muted-foreground leading-relaxed">
								- Ahora con todos los programas oficiales de{' '}
								<strong>Servel.cl</strong>.
							</p>
							<p className="text-xs text-muted-foreground leading-relaxed">
								- Se ha mejorado la clasificación y estructura de los datos para
								respuestas con mayor precisión y contexto.
							</p>
						</div>
					</div>
					<div className="mt-4 text-center">
						<Badge variant="outline">v.1.5</Badge>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
