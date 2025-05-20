
"use client";

import type { Instructor } from "@/types";
import { MOCK_INSTRUCTORS } from "@/lib/constants";
import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface InstructorContextType {
  instructors: Instructor[];
  addInstructor: (newInstructor: Omit<Instructor, 'id'>) => void;
  updateInstructor: (updatedInstructor: Instructor) => void;
  deleteInstructor: (instructorId: string) => void;
  isLoading: boolean;
  getInstructorById: (instructorId: string) => Instructor | undefined;
}

export const InstructorContext = createContext<InstructorContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gymInstructors';

export function InstructorProvider({ children }: { children: ReactNode }) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedInstructors = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedInstructors) {
        setInstructors(JSON.parse(storedInstructors));
      } else {
        setInstructors(MOCK_INSTRUCTORS.map(i => ({ ...i, id: i.id || uuidv4() })));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_INSTRUCTORS.map(i => ({ ...i, id: i.id || uuidv4() }))));
      }
    } catch (error) {
      console.error("Error al leer los instructores de localStorage", error);
      setInstructors(MOCK_INSTRUCTORS.map(i => ({ ...i, id: i.id || uuidv4() })));
    }
    setIsLoading(false);
  }, []);

  const persistInstructors = (updatedInstructors: Instructor[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedInstructors));
    } catch (error) {
      console.error("Error al guardar los instructores en localStorage", error);
    }
  };

  const addInstructor = useCallback((newInstructorData: Omit<Instructor, 'id'>) => {
    const fullNewInstructor = { ...newInstructorData, id: uuidv4() };
    setInstructors(prevInstructors => {
      const updatedInstructors = [...prevInstructors, fullNewInstructor];
      persistInstructors(updatedInstructors);
      return updatedInstructors;
    });
  }, []);

  const updateInstructor = useCallback((updatedInstructorData: Instructor) => {
    setInstructors(prevInstructors => {
      const updatedInstructors = prevInstructors.map(i => i.id === updatedInstructorData.id ? updatedInstructorData : i);
      persistInstructors(updatedInstructors);
      return updatedInstructors;
    });
  }, []);

  const deleteInstructor = useCallback((instructorId: string) => {
    setInstructors(prevInstructors => {
      const updatedInstructors = prevInstructors.filter(i => i.id !== instructorId);
      persistInstructors(updatedInstructors);
      return updatedInstructors;
    });
  }, []);

  const getInstructorById = useCallback((instructorId: string) => {
    return instructors.find(i => i.id === instructorId);
  }, [instructors]);

  return (
    <InstructorContext.Provider value={{ instructors, addInstructor, updateInstructor, deleteInstructor, isLoading, getInstructorById }}>
      {children}
    </InstructorContext.Provider>
  );
}
