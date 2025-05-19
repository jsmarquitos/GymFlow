import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; 
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext'; // Importar AuthProvider

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'GymFlow',
  description: 'Sistema Completo de Gestión de Gimnasios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <AuthProvider> {/* Envolver con AuthProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <footer className="bg-card shadow-inner py-6 text-center">
                <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} GymFlow. Todos los derechos reservados.</p>
              </footer>
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
