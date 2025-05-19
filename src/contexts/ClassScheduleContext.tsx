
"use client";

import type { ClassSchedule } from "@/types";
import { MOCK_CLASS_SCHEDULES } from "@/lib/constants";
import { createContext, useState, useEffect, type ReactNode, useCallback, useContext } from 'react';

interface ClassScheduleContextType {
  classes: ClassSchedule[];
  addClass: (newClass: Omit<ClassSchedule, 'id'>) => void;
  updateClass: (updatedClass: ClassSchedule) => void;
  deleteClass: (classId: string) => void;
  isLoading: boolean;
  updateClassSlots: (classId: string, newAvailableSlots: number) => void;
}

export const ClassScheduleContext = createContext<ClassScheduleContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'classSchedules';

export function ClassScheduleProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedClasses = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedClasses) {
        setClasses(JSON.parse(storedClasses));
      } else {
        setClasses(MOCK_CLASS_SCHEDULES); // Fallback to mock if nothing in localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_CLASS_SCHEDULES));
      }
    } catch (error) {
      console.error("Error al leer los horarios de clase de localStorage", error);
      setClasses(MOCK_CLASS_SCHEDULES); // Fallback in case of error
    }
    setIsLoading(false);
  }, []);

  const persistClasses = (updatedClasses: ClassSchedule[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClasses));
    } catch (error) {
      console.error("Error al guardar los horarios de clase en localStorage", error);
    }
  };

  const addClass = useCallback((newClassData: Omit<ClassSchedule, 'id'>) => {
    setClasses(prevClasses => {
      const fullNewClass = { ...newClassData, id: `class_${Date.now()}` };
      const updatedClasses = [...prevClasses, fullNewClass];
      persistClasses(updatedClasses);
      return updatedClasses;
    });
  }, []);

  const updateClass = useCallback((updatedClassData: ClassSchedule) => {
    setClasses(prevClasses => {
      const updatedClasses = prevClasses.map(c => c.id === updatedClassData.id ? updatedClassData : c);
      persistClasses(updatedClasses);
      return updatedClasses;
    });
  }, []);

  const deleteClass = useCallback((classId: string) => {
    setClasses(prevClasses => {
      const updatedClasses = prevClasses.filter(c => c.id !== classId);
      persistClasses(updatedClasses);
      return updatedClasses;
    });
  }, []);

  const updateClassSlots = useCallback((classId: string, newAvailableSlots: number) => {
    setClasses(prevClasses => {
      const updatedClasses = prevClasses.map(c => 
        c.id === classId ? { ...c, availableSlots: newAvailableSlots } : c
      );
      persistClasses(updatedClasses); // Persist this change too, as booking is a real action
      return updatedClasses;
    });
  }, []);


  return (
    <ClassScheduleContext.Provider value={{ classes, addClass, updateClass, deleteClass, isLoading, updateClassSlots }}>
      {children}
    </ClassScheduleContext.Provider>
  );
}
