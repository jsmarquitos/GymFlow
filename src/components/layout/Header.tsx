
'use client';

import Link from 'next/link';
import { Shield, Users, LogIn, LogOut, Brain, Dumbbell, CalendarDays, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import type { NavItemConfig } from '@/types';
import { NavItem } from './NavItem';
import { useState } from 'react'; // Importar useState

const allNavItems: NavItemConfig[] = [
  { href: "/schedule", label: "Horario", icon: CalendarDays },
  { href: "/bookings", label: "Mis Reservas", icon: Dumbbell, requiresAuth: true },
  { href: "/workout-ai", label: "IA de Entrenamiento", icon: Brain, requiresAuth: true },
  { href: "/profile", label: "Perfil", icon: Users, requiresAuth: true },
  { href: "/admin/members", label: "Administración", icon: Shield, adminOnly: true, requiresAuth: true },
];

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Estado para el menú móvil

  const navItems = allNavItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          GymFlow
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {!isLoading && (
            user ? (
              <Button variant="ghost" size="icon" onClick={logout} title="Cerrar Sesión" className="hidden md:inline-flex">
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="sr-only">Cerrar Sesión</span>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild className="hidden md:inline-flex">
                <Link href="/login">
                  <LogIn className="mr-1 h-5 w-5" /> Iniciar Sesión
                </Link>
              </Button>
            )
          )}
          
          {/* Mobile Menu Trigger - visible only on small screens */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} // Toggle mobile menu
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col space-y-1 p-4">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
            <div className="border-t pt-2 mt-2">
              {!isLoading && (
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
