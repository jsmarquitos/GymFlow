
'use client';

import { useContext } from 'react';
import { GymSettingsContext } from '@/contexts/GymSettingsContext';

export const useGymSettings = () => {
  const context = useContext(GymSettingsContext);
  if (context === undefined) {
    throw new Error('useGymSettings debe ser utilizado dentro de un GymSettingsProvider');
  }
  return context;
};
