
'use client';

import type { GymSettings } from '@/types';
import { MOCK_GYM_SETTINGS } from '@/lib/constants';
import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';

interface GymSettingsContextType {
  settings: GymSettings | null;
  updateSettings: (newSettings: GymSettings) => void;
  isLoading: boolean;
}

export const GymSettingsContext = createContext<GymSettingsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gymSettings';

export function GymSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        setSettings(MOCK_GYM_SETTINGS); // Fallback to mock if nothing in localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_GYM_SETTINGS));
      }
    } catch (error) {
      console.error("Error al leer la configuración del gimnasio de localStorage", error);
      setSettings(MOCK_GYM_SETTINGS); // Fallback in case of error
    }
    setIsLoading(false);
  }, []);

  const updateSettings = useCallback((newSettings: GymSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error al guardar la configuración del gimnasio en localStorage", error);
    }
  }, []);

  return (
    <GymSettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </GymSettingsContext.Provider>
  );
}
