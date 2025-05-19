
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ShieldCheck, User as UserIcon } from 'lucide-react'; // ShieldCheck for admin, User for member
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function LoginClient() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si ya hay un usuario y no estamos cargando, redirigir a la home
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);


  if (isLoading || user) { // Muestra un loader o nada si ya está logueado y redirigiendo
    return (
      <div className="flex justify-center items-center p-8">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <Button 
        onClick={() => login('admin')} 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        <ShieldCheck className="mr-2 h-5 w-5" />
        Ingresar como Administrador
      </Button>
      <Button 
        onClick={() => login('member')} 
        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        size="lg"
      >
        <UserIcon className="mr-2 h-5 w-5" />
        Ingresar como Miembro
      </Button>
    </div>
  );
}
