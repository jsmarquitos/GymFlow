
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ShieldCheck, User as UserIcon, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState as useReactState } from 'react'; // Renombrar useState para evitar conflicto con el del AuthContext

// Este componente ahora solo manejará el login rápido para roles predefinidos
// El login principal con email/pass está en LoginForm.tsx
export function LoginClient() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useReactState(false);


  // No redirigir desde aquí, la página de login/page.tsx maneja la redirección si ya está logueado.
  // useEffect(() => {
  //   if (!isLoading && user) {
  //     router.push('/');
  //   }
  // }, [user, isLoading, router]);

  const handleRoleLogin = async (role: 'admin' | 'instructor') => {
    setIsProcessing(true);
    let emailToLogin = '';
    if (role === 'admin') emailToLogin = 'admin@gymflow.com';
    if (role === 'instructor') emailToLogin = 'instructor@gymflow.com';
    
    if (emailToLogin) {
      await login(emailToLogin, undefined, role); // Llama al login con roleOverride
    }
    setIsProcessing(false);
  };
  
  // No mostrar nada si ya está logueado o cargando auth, la página principal lo maneja.
  if (isLoading || user) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Button 
        onClick={() => handleRoleLogin('admin')} 
        className="w-full bg-primary/80 hover:bg-primary/70 text-primary-foreground"
        size="sm"
        disabled={isProcessing}
      >
        <ShieldCheck className="mr-2 h-4 w-4" />
        Admin (Demo)
      </Button>
       <Button 
        onClick={() => handleRoleLogin('instructor')} 
        className="w-full bg-accent/80 hover:bg-accent/70 text-accent-foreground"
        size="sm"
        disabled={isProcessing}
      >
        <BrainCircuit className="mr-2 h-4 w-4" />
        Instructor (Demo)
      </Button>
       {/* El login de Miembro ahora se hace principalmente via el LoginForm */}
    </div>
  );
}
