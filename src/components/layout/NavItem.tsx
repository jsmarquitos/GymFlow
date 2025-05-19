
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "@/types"; 
import { Button } from "@/components/ui/button";

interface NavItemProps extends NavItemConfig {
  onClick?: () => void;
}

export function NavItem({ href, label, icon: Icon, onClick }: NavItemProps) {
  const pathname = usePathname();
  // Check if the current path starts with the item's href,
  // or if it's an exact match for the homepage (href === "/")
  const isActive = (href === "/" && pathname === href) || (href !== "/" && pathname.startsWith(href));

  return (
    <Button 
      asChild 
      variant="ghost" // Base variant is ghost
      size="sm" 
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 rounded-md px-3 py-2 transition-colors",
        isActive 
          ? "bg-accent text-accent-foreground hover:bg-accent/90" // Active style using accent color
          : "text-foreground hover:bg-accent/10 hover:text-accent-foreground" // Subtle hover for non-active
      )}
    >
      <Link href={href}>
        <Icon className={cn("h-5 w-5", isActive ? "text-accent-foreground" : "text-primary")} />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
