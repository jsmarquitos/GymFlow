import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean sans-serif font alternative to Geist, which might have specific setup.
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

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
    <html lang="es" className="dark"> {/* Apply dark class to html for theme, lang="es" for Spanish */}
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
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
      </body>
    </html>
  );
}
