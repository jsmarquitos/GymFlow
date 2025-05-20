
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { GymSettingsProvider } from '@/contexts/GymSettingsContext';
import { ClassScheduleProvider } from '@/contexts/ClassScheduleContext';
import { RoutineProvider } from '@/contexts/RoutineContext'; // Import RoutineProvider

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
      <body className={cn("min-h-screen bg-background font-sans antialiased", poppins.variable)}>
        <AuthProvider>
          <GymSettingsProvider>
            <ClassScheduleProvider>
              <RoutineProvider> {/* Wrap with RoutineProvider */}
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow container mx-auto px-4 py-8 animate-fadeInPage">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <Toaster />
                </ThemeProvider>
              </RoutineProvider>
            </ClassScheduleProvider>
          </GymSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
