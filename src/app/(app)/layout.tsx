
import type React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AiCodeAnalyzer } from '@/components/layout/ai-code-analyzer';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true} className="group/sidebar-wrapper flex min-h-svh max-h-svh w-full overflow-hidden has-[[data-variant=inset]]:bg-sidebar">
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 min-h-0"> {/* Added flex-1 here */}
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
        <AppFooter />
        <AiCodeAnalyzer />
      </SidebarInset>
    </SidebarProvider>
  );
}
