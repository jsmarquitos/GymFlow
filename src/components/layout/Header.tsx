
'use client';

import Link from 'next/link';
import { Shield, Users, LogIn, LogOut, Brain, Dumbbell, CalendarDays, Menu, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useGymSettings } from '@/hooks/useGymSettings'; 
import type { NavItemConfig } from '@/types';
import { NavItem } from './NavItem';
import { useState } from 'react';

const allNavItems: NavItemConfig[] = [
  { href: "/schedule", label: "Horario", icon: CalendarDays },
  { href: "/bookings", label: "Mis Reservas", icon: Dumbbell, requiresAuth: true, memberOnly: true },
  { href: "/routines", label: "Mis Rutinas", icon: ClipboardList, requiresAuth: true, memberOnly: true },
  { href: "/workout-ai", label: "IA de Entrenamiento", icon: Brain, requiresAuth: true },
  { href: "/profile", label: "Perfil", icon: Users, requiresAuth: true, memberOnly: true },
  { href: "/admin/members", label: "Administración", icon: Shield, requiresAuth: true, adminOnly: true },
];

export function Header() {
  const { user, logout, isLoading: authIsLoading } = useAuth();
  const { settings, isLoading: settingsIsLoading } = useGymSettings(); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = allNavItems.filter(item => {
    if (!user && item.requiresAuth) return false;
    if (user) {
      if (item.adminOnly && user.role !== 'admin' && user.role !== 'instructor') return false;
      if (item.memberOnly && user.role !== 'member') return false;
      if (item.instructorOnly && user.role !== 'instructor') return false;
    }
    return true;
  });

  const gymName = settingsIsLoading || !settings?.gymName ? "GymFlow" : settings.gymName;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          {gymName} 
        </Link>
        
        {/* Desktop Navigation and Controls Group */}
        <div className="hidden md:flex items-center space-x-2">
          <nav className="flex items-center space-x-1 lg:space-x-2 flex-row-reverse space-x-reverse">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>

          <ThemeToggle />
          {!authIsLoading && (
            user ? (
              <Button variant="ghost" size="icon" onClick={logout} title="Cerrar Sesión">
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="sr-only">Cerrar Sesión</span>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="mr-1 h-5 w-5" /> Iniciar Sesión
                </Link>
              </Button>
            )
          )}
        </div>
        
        {/* Mobile Menu Trigger (and theme toggle for mobile) */}
        <div className="flex items-center space-x-2 md:hidden">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col space-y-1 p-4 space-y-reverse flex-col-reverse">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} onClick={() => setMobileMenuOpen(false)} />
            ))}
            <div className="border-t pt-2 mt-2"> {/* This div might look odd if items are reversed, consider its placement or removing it if nav is reversed */}
              {!authIsLoading && (
                user ? (
                  <Button variant="ghost" onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full justify-start text-destructive">
                    <LogOut className="mr-2 h-5 w-5" /> Cerrar Sesión
                  </Button>
                ) : (
                  <Button variant="default" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/login">
                      <LogIn className="mr-2 h-5 w-5" /> Iniciar Sesión
                    </Link>
                  </Button>
                )
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
