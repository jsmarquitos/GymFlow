
"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"; // Import from ui/sidebar
import { ThemeToggle } from "@/components/theme/ThemeToggle"; // Keep ThemeToggle if needed in mobile top bar

export function Header() {
  const { isMobile } = useSidebar(); // Get isMobile from useSidebar

  if (!isMobile) {
    return null; // Don't render header on desktop if sidebar is present
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container mx-auto h-14 flex items-center justify-between px-4">
        <SidebarTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menú lateral</span>
          </Button>
        </SidebarTrigger>
        <Link href="/" className="text-xl font-bold text-primary">
          GymFlow
        </Link>
        <ThemeToggle /> 
      </div>
    </header>
  );
}
