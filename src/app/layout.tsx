
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google'; // Cambiado de Inter a Poppins
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { GymSettingsProvider } from '@/contexts/GymSettingsContext';

// Configuración para Poppins
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Pesos deseados
  variable: '--font-sans', // Mantener la misma variable CSS
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
      <body className={cn("min-h-screen bg-background font-sans antialiased", poppins.variable)}> {/* Usar poppins.variable */}
        <AuthProvider>
          <GymSettingsProvider>
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
                <Footer />
              </div>
              <Toaster />
            </ThemeProvider>
          </GymSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
