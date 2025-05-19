
"use client";

import { useContext } from 'react';
import { ClassScheduleContext } from '@/contexts/ClassScheduleContext';

export const useClassSchedules = () => {
  const context = useContext(ClassScheduleContext);
  if (context === undefined) {
    throw new Error('useClassSchedules debe ser utilizado dentro de un ClassScheduleProvider');
  }
  return context;
};
