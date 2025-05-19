"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "@/types";
import { Button } from "@/components/ui/button";

export function NavItem({ href, label, icon: Icon }: NavItemConfig) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Button asChild variant={isActive ? "secondary" : "ghost"} size="sm">
      <Link href={href} className={cn("flex items-center space-x-2 rounded-md px-3 py-2 transition-colors",
        isActive ? "text-primary-foreground bg-primary hover:bg-primary/90" : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}>
        <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-primary")} />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
