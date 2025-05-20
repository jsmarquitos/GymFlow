
"use client";

import { useContext } from 'react';
import { RoutineContext } from '@/contexts/RoutineContext';

export const useRoutines = () => {
  const context = useContext(RoutineContext);
  if (context === undefined) {
    throw new Error('useRoutines debe ser utilizado dentro de un RoutineProvider');
  }
  return context;
};
