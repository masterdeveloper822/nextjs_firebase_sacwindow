
"use client";

import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ListChecks, 
  Settings, 
  BarChart2, 
  LogOut, 
  Headset, 
  DatabaseZap, 
  Users,
  Landmark, 
  Truck,    
  ClipboardList, 
  ShieldCheck,
  LayoutGrid // Added for icon mode logo
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '@/components/ui/sidebar'; // Import useSidebar

export function AppSidebar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const { isMobile, setOpenMobile, state: sidebarState } = useSidebar(); // Get sidebarState

  const operationalMenuItems = [
    { href: '/dashboard', label: 'Manifestações', icon: ListChecks, roles: ['ti', 'administrator', 'attendant', 'sac', 'finance'] },
    { href: '/admin/finance', label: 'Financeiro', icon: Landmark, roles: ['ti', 'administrator', 'attendant', 'sac', 'finance'] },
    { href: '/admin/logistics', label: 'Logística', icon: Truck, roles: ['ti', 'administrator', 'attendant', 'sac', 'finance', 'operation', 'logistics'] },
    { href: '/admin/operation', label: 'Operação', icon: ClipboardList, roles: ['ti', 'administrator', 'attendant', 'sac', 'finance', 'operation', 'logistics'] },
    { href: '/admin/audit', label: 'Auditoria', icon: ShieldCheck, roles: ['ti', 'administrator'] },
  ];

  const adminMenuItems = [
    { href: '/admin/dashboard', label: 'Painel Gerencial', icon: BarChart2, roles: ['ti', 'administrator', 'attendant', 'sac', 'finance', 'operation', 'logistics'] },
    { href: '/admin/user-management', label: 'Gerenciamento Usuários', icon: Users, roles: ['ti', 'administrator'] },
    { href: '/admin/parameters', label: 'Parâmetros App', icon: Settings, roles: ['ti', 'administrator'] },
    { href: '/admin/it-settings', label: 'Configurações TI', icon: DatabaseZap, roles: ['ti'] },
  ];

  const getInitials = (name?: string | null) => {
    if (!name) return 'S'; // Default for SAC
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const currentRole = role?.toLowerCase() || '';

  const canViewOperationalGroup = operationalMenuItems.some(item => item.roles.includes(currentRole));
  const canViewAdminGroup = adminMenuItems.some(item => item.roles.includes(currentRole));

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 flex flex-col items-center group-data-[collapsible=icon]:items-center">
        <Link href="/dashboard" className="flex flex-col items-center gap-2 text-center" onClick={handleMenuItemClick}>
          {/* Conditional rendering for logo/icon */}
          {sidebarState === 'expanded' && !isMobile ? (
            <>
              <div className="mb-2">
                <Image
                  src="https://res.cloudinary.com/dm77rdv3r/image/upload/fl_preserve_transparency/v1747146142/Logo_bluetech_sem_fundo_azul_Prancheta_1_Prancheta_1_2_hrr3g5.jpg?_s=public-apps"
                  alt="Bluetech Window Films Logo"
                  width={180}
                  height={90}
                  priority
                  data-ai-hint="company logo"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Headset className="w-6 h-6 text-sidebar-primary" />
                <h1 className="text-xl font-semibold text-sidebar-foreground">
                  SAC
                </h1>
              </div>
            </>
          ) : ( // Collapsed or Mobile view
            <div className="my-3 flex flex-col items-center justify-center h-[90px] group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:py-2">
              {isMobile ? ( // Mobile view always shows full logo if possible, or icon
                 <Image
                  src="https://res.cloudinary.com/dm77rdv3r/image/upload/fl_preserve_transparency/v1747146142/Logo_bluetech_sem_fundo_azul_Prancheta_1_Prancheta_1_2_hrr3g5.jpg?_s=public-apps"
                  alt="Bluetech Window Films Logo"
                  width={120} // Smaller for mobile sheet
                  height={60}
                  priority
                  className="mb-2"
                  data-ai-hint="company logo"
                />
              ) : (
                <LayoutGrid className="size-7 text-sidebar-primary" data-ai-hint="window grid" />
              )}
               {(isMobile) && ( // Show SAC title also in mobile if expanded
                <div className="mt-2 flex items-center gap-2">
                    <Headset className="w-5 h-5 text-sidebar-primary" />
                    <h1 className="text-lg font-semibold text-sidebar-foreground">SAC</h1>
                </div>
               )}
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-grow p-2">
        {canViewOperationalGroup && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:justify-center">
              <span className="group-data-[collapsible=icon]:hidden">Operacional</span>
              <Separator className="group-data-[collapsible=icon]:block hidden my-2 w-4 bg-sidebar-border"/>
            </SidebarGroupLabel>
            <SidebarMenu>
              {operationalMenuItems.filter(item => item.roles.includes(currentRole)).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                      tooltip={item.label}
                      onClick={handleMenuItemClick} 
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {canViewAdminGroup && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:justify-center">
              <span className="group-data-[collapsible=icon]:hidden">Administração</span>
              <Separator className="group-data-[collapsible=icon]:block hidden my-2 w-4 bg-sidebar-border"/>
            </SidebarGroupLabel>
            <SidebarMenu>
              {adminMenuItems.filter(item => item.roles.includes(currentRole)).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || pathname.startsWith(item.href)}
                      tooltip={item.label}
                      onClick={handleMenuItemClick} 
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 group-data-[collapsible=icon]:size-8">
                <AvatarImage src={user?.photoURL || `https://placehold.co/40x40.png`} alt={user?.displayName || 'User'} data-ai-hint="user avatar" />
                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.displayName || user?.email}</p>
                <p className="text-xs text-sidebar-foreground/70 capitalize">{role}</p>
            </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2" onClick={handleLogoutClick} aria-label="Sair">
          <LogOut className="mr-2 group-data-[collapsible=icon]:mr-0" />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
