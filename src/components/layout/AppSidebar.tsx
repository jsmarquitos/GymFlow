
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, Users, Brain, Shield, LogIn, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import type { NavItemConfig } from "@/types";
import { cn } from "@/lib/utils";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar,
  SidebarTrigger // Import SidebarTrigger from ui/sidebar
} from "@/components/ui/sidebar"; // Ensure this path is correct

const allNavItems: NavItemConfig[] = [
  { href: "/schedule", label: "Horario", icon: CalendarDays },
  { href: "/bookings", label: "Mis Reservas", icon: Dumbbell, requiresAuth: true },
  { href: "/workout-ai", label: "IA de Entrenamiento", icon: Brain, requiresAuth: true },
  { href: "/profile", label: "Perfil", icon: Users, requiresAuth: true },
  { href: "/admin/members", label: "Administración", icon: Shield, adminOnly: true, requiresAuth: true },
];

export function AppSidebar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();

  const navItems = allNavItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4">
        <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          GymFlow
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* Increased gap for more vertical spacing between menu items */}
        <SidebarMenu className="gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                     "justify-start" 
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className={cn("h-5 w-5", isActive ? "" : "text-primary")} />
                    <span className={cn(sidebarState === "collapsed" && !isMobile ? "hidden" : "inline-block")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 mt-auto border-t border-sidebar-border space-y-2">
        <div className={cn("flex items-center", sidebarState === "collapsed" && !isMobile ? "justify-center" : "justify-between")}>
          <span className={cn("text-xs text-muted-foreground", sidebarState === "collapsed" && !isMobile ? "hidden" : "inline-block")}>Tema</span>
          <ThemeToggle />
        </div>
        {!isLoading && (
          user ? (
            <Button 
              variant="ghost" 
              size={sidebarState === "collapsed" && !isMobile ? "icon" : "default"} 
              onClick={logout} 
              className="w-full justify-start text-left p-2"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5 text-destructive" />
              <span className={cn("ml-2 text-destructive", sidebarState === "collapsed" && !isMobile ? "hidden" : "inline-block")}>Cerrar Sesión</span>
            </Button>
          ) : (
            <Button 
              variant="default" 
              size={sidebarState === "collapsed" && !isMobile ? "icon" : "default"} 
              asChild 
              className="w-full justify-start text-left p-2"
              title="Iniciar Sesión"
            >
              <Link href="/login">
                <LogIn className="h-5 w-5" />
                <span className={cn("ml-2", sidebarState === "collapsed" && !isMobile ? "hidden" : "inline-block")}>Iniciar Sesión</span>
              </Link>
            </Button>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
