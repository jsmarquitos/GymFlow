
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Activity, Loader2, Receipt, Settings, ClipboardList, Dumbbell, UserCog } from "lucide-react"; // Added UserCog
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "@/types";

const allAdminNavItems: NavItemConfig[] = [
  { href: "/admin/members", label: "Miembros", icon: Users, adminOnly: false, instructorAllowed: true }, 
  { href: "/admin/instructors", label: "Instructores", icon: UserCog, adminOnly: true }, // Nuevo, solo admin
  { href: "/admin/subscriptions", label: "Planes", icon: CreditCard, adminOnly: true }, 
  { href: "/admin/classes", label: "Clases", icon: Activity, adminOnly: false, instructorAllowed: true }, 
  { href: "/admin/payments", label: "Pagos", icon: Receipt, adminOnly: true }, 
  { href: "/admin/routines-management", label: "Gestión de Rutinas", icon: Dumbbell, adminOnly: false, instructorAllowed: true }, 
  { href: "/admin/settings", label: "Configuración", icon: Settings, adminOnly: true }, 
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);

  const visibleNavItems = allAdminNavItems.filter(item => {
    if (!user) return false; 
    if (user.role === 'admin') return true; 
    if (user.role === 'instructor' && item.instructorAllowed) return true; 
    return false;
  });

  useEffect(() => {
    if (!authIsLoading) {
      if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
        router.replace('/');
      } else {
        const currentItem = allAdminNavItems.find(item => pathname.startsWith(item.href));
        if (user.role === 'instructor' && currentItem && currentItem.adminOnly && !currentItem.instructorAllowed) {
           // Si un instructor intenta acceder a una ruta solo de admin y no permitida para instructor
          const firstAllowedInstructorPage = visibleNavItems.length > 0 ? visibleNavItems[0].href : '/';
          router.replace(firstAllowedInstructorPage);
        } else {
          setIsVerifying(false);
        }
      }
    }
  }, [user, authIsLoading, router, pathname, visibleNavItems]); // Added visibleNavItems to dependencies

  if (authIsLoading || isVerifying) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Verificando acceso al panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
        <nav className="flex flex-wrap gap-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center space-x-2 rounded-md px-3 py-2 transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "text-foreground hover:bg-accent/10 hover:text-accent-foreground"
                )}
              >
                <Link href={item.href}>
                  <item.icon className={cn("mr-2 h-4 w-4", isActive ? "text-accent-foreground" : "text-primary")} /> {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
      <div className="border-t pt-6">
        {children}
      </div>
    </div>
  );
}
