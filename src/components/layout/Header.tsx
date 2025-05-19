
"use client";

import Link from "next/link";
import { NavItem } from "./NavItem";
import type { NavItemConfig } from "@/types";
import { CalendarDays, Dumbbell, Users, Brain, Menu, X, Shield, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth"; // Importar useAuth

const allNavItems: NavItemConfig[] = [
  { href: "/schedule", label: "Horario", icon: CalendarDays },
  { href: "/bookings", label: "Mis Reservas", icon: Dumbbell },
  { href: "/workout-ai", label: "IA de Entrenamiento", icon: Brain },
  { href: "/profile", label: "Perfil", icon: Users },
  { href: "/admin/members", label: "Administración", icon: Shield, adminOnly: true },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const navItems = allNavItems.filter(item => !item.adminOnly || (user?.role === 'admin'));

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          GymFlow
        </Link>
        
        {/* Desktop Navigation & Auth & Theme Toggle */}
        <div className="hidden md:flex items-center space-x-2">
          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>
          <div className="flex items-center space-x-2">
            {!isLoading && (
              user ? (
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                  </Link>
                </Button>
              )
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation & Auth & Theme Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-foreground" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-card p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <Link href="/" className="text-xl font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                    GymFlow
                  </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-6 w-6 text-foreground" />
                     <span className="sr-only">Cerrar menú</span>
                  </Button>
                </SheetClose>
              </div>
              <nav className="flex flex-col space-y-3 flex-grow">
                {navItems.map((item) => (
                   <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors text-foreground text-base"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                   </SheetClose>
                ))}
              </nav>
              <div className="mt-auto border-t pt-4">
                {!isLoading && (
                  user ? (
                    <Button variant="outline" className="w-full" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                      <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                    </Button>
                  ) : (
                    <Button variant="default" className="w-full" asChild>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                      </Link>
                    </Button>
                  )
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
