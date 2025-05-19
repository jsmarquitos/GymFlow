import { LoginClient } from '@/components/auth/LoginClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Iniciar Sesión</CardTitle>
          <CardDescription>Elige tu rol para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginClient />
        </CardContent>
      </Card>
    </div>
  );
}
