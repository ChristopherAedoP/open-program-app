/** @format */
'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			
			<div className="flex h-dvh w-full pr-0.5">
				<AppSidebar />
				<SidebarInset>
					<SiteHeader />
					{children}
				</SidebarInset>
			</div>
			
		</SidebarProvider>
	);
}
