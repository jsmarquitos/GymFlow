
"use client";

import { useContext } from 'react';
import { InstructorContext } from '@/contexts/InstructorContext';

export const useInstructors = () => {
  const context = useContext(InstructorContext);
  if (context === undefined) {
    throw new Error('useInstructors debe ser utilizado dentro de un InstructorProvider');
  }
  return context;
};
