
'use client';

import { useGymSettings } from '@/hooks/useGymSettings';

export function Footer() {
  const { settings, isLoading } = useGymSettings();
  const year = new Date().getFullYear();
  
  // Provide a fallback name while loading or if settings.gymName is not yet available
  const gymName = isLoading || !settings?.gymName ? "GymFlow" : settings.gymName;

  return (
    <footer className="bg-card shadow-inner py-6 text-center mt-auto">
      <p className="text-muted-foreground text-sm">
        &copy; {year} {gymName}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
