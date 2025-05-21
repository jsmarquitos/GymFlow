
import { LoginForm } from '@/components/auth/LoginForm'; // Cambiado a LoginForm
import { LoginClient } from '@/components/auth/LoginClient'; // Importación añadida
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
          <hr className="my-2" />
          <p className="text-center text-xs text-muted-foreground mb-2">O inicia sesión rápidamente como:</p>
          <LoginClient /> {/* Mantenemos LoginClient para roles predefinidos */}
        </CardContent>
      </Card>
    </div>
  );
}
