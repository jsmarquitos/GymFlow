
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Activity, Loader2, Receipt, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Added cn

interface AdminNavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
}

const adminNavItems: AdminNavItemProps[] = [
  { href: "/admin/members", label: "Miembros", icon: Users },
  { href: "/admin/subscriptions", label: "Planes", icon: CreditCard },
  { href: "/admin/classes", label: "Clases", icon: Activity },
  { href: "/admin/payments", label: "Pagos", icon: Receipt },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!authIsLoading) {
      if (!user || user.role !== 'admin') {
        router.replace('/'); 
      } else {
        setIsVerifying(false); 
      }
    }
  }, [user, authIsLoading, router]);

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
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost" // Base variant is ghost
                size="sm"
                className={cn(
                  "flex items-center space-x-2 rounded-md px-3 py-2 transition-colors",
                  isActive 
                    ? "bg-accent text-accent-foreground hover:bg-accent/90" // Active style using accent color
                    : "text-foreground hover:bg-accent/10 hover:text-accent-foreground" // Subtle hover for non-active
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
