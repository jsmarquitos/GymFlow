
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!authIsLoading) {
      if (!user || user.role !== 'admin') {
        router.replace('/'); // Redirige a la página principal si no es admin
      } else {
        setIsVerifying(false); // El usuario es admin, permitir acceso
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

  // Si el usuario es admin y la verificación ha terminado, mostrar el layout.
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
        <nav className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/members">
              <Users className="mr-2 h-4 w-4" /> Miembros
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/subscriptions">
              <CreditCard className="mr-2 h-4 w-4" /> Planes
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/classes">
              <Activity className="mr-2 h-4 w-4" /> Clases
            </Link>
          </Button>
        </nav>
      </div>
      <div className="border-t pt-6">
        {children}
      </div>
    </div>
  );
}
