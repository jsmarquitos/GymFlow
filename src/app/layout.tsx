
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; 
import './globals.css';
// import { Header } from '@/components/layout/Header'; // Will be used differently
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // Import SidebarProvider and SidebarInset
import { AppSidebar } from '@/components/layout/AppSidebar'; // Import the new AppSidebar
import { Header } from '@/components/layout/Header'; // This will be the mobile header

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
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider defaultOpen={true} collapsible="icon">
              <div className="flex min-h-screen">
                <AppSidebar />
                <SidebarInset className="flex flex-col flex-1">
                  <Header /> {/* This is now the mobile-only header with trigger */}
                  <main className="flex-grow container mx-auto px-4 py-8">
                    {children}
                  </main>
                  <footer className="bg-card shadow-inner py-6 text-center mt-auto">
                    <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} GymFlow. Todos los derechos reservados.</p>
                  </footer>
                </SidebarInset>
              </div>
            </SidebarProvider>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
