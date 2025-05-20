
"use client";

import type { Routine, RoutineDay, RoutineExercise } from "@/types";
import { INITIAL_CONTEXT_ROUTINES } from "@/lib/constants";
import { createContext, useState, useEffect, type ReactNode, useCallback, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos

interface RoutineContextType {
  routines: Routine[];
  addRoutine: (newRoutineData: Omit<Routine, 'id' | 'days'> & { days: Array<Omit<RoutineDay, 'id' | 'exercises'> & { exercises: Array<Omit<RoutineExercise, 'id'>> }> }) => void;
  updateRoutine: (updatedRoutineData: Routine) => void;
  deleteRoutine: (routineId: string) => void;
  isLoading: boolean;
  getRoutineById: (routineId: string) => Routine | undefined;
}

export const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gymRoutines';

// Helper para generar IDs para días y ejercicios anidados
const generateFullIdsForRoutine = (routineData: Omit<Routine, 'id' | 'days'> & { days: Array<Omit<RoutineDay, 'id' | 'exercises'> & { exercises: Array<Omit<RoutineExercise, 'id'>> }> }): Routine => {
  const newRoutineId = uuidv4();
  return {
    ...routineData,
    id: newRoutineId,
    days: routineData.days.map(day => {
      const newDayId = uuidv4();
      return {
        ...day,
        id: newDayId,
        exercises: day.exercises.map(exercise => ({
          ...exercise,
          id: uuidv4(),
        })),
      };
    }),
  };
};


export function RoutineProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRoutines = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedRoutines) {
        setRoutines(JSON.parse(storedRoutines));
      } else {
        // Si no hay nada, inicializar con las rutinas de ejemplo con IDs generados
        const routinesWithGeneratedIds = INITIAL_CONTEXT_ROUTINES.map(r => ({
          ...r,
          id: r.id || uuidv4(), // Asegurar que la rutina principal tenga ID
          days: r.days.map(d => ({
            ...d,
            id: d.id || uuidv4(), // Asegurar que el día tenga ID
            exercises: d.exercises.map(e => ({
              ...e,
              id: e.id || uuidv4(), // Asegurar que el ejercicio tenga ID
            }))
          }))
        }));
        setRoutines(routinesWithGeneratedIds);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(routinesWithGeneratedIds));
      }
    } catch (error) {
      console.error("Error al leer las rutinas de localStorage", error);
      setRoutines(INITIAL_CONTEXT_ROUTINES); // Fallback
    }
    setIsLoading(false);
  }, []);

  const persistRoutines = (updatedRoutines: Routine[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRoutines));
    } catch (error) {
      console.error("Error al guardar las rutinas en localStorage", error);
    }
  };

  const addRoutine = useCallback((newRoutineData: Omit<Routine, 'id' | 'days'> & { days: Array<Omit<RoutineDay, 'id' | 'exercises'> & { exercises: Array<Omit<RoutineExercise, 'id'>> }> }) => {
    const fullNewRoutine = generateFullIdsForRoutine(newRoutineData);
    setRoutines(prevRoutines => {
      const updatedRoutines = [...prevRoutines, fullNewRoutine];
      persistRoutines(updatedRoutines);
      return updatedRoutines;
    });
  }, []);

  const updateRoutine = useCallback((updatedRoutineData: Routine) => {
    setRoutines(prevRoutines => {
      const updatedRoutines = prevRoutines.map(r => r.id === updatedRoutineData.id ? updatedRoutineData : r);
      persistRoutines(updatedRoutines);
      return updatedRoutines;
    });
  }, []);

  const deleteRoutine = useCallback((routineId: string) => {
    setRoutines(prevRoutines => {
      const updatedRoutines = prevRoutines.filter(r => r.id !== routineId);
      persistRoutines(updatedRoutines);
      return updatedRoutines;
    });
  }, []);

  const getRoutineById = useCallback((routineId: string) => {
    return routines.find(r => r.id === routineId);
  }, [routines]);

  return (
    <RoutineContext.Provider value={{ routines, addRoutine, updateRoutine, deleteRoutine, isLoading, getRoutineById }}>
      {children}
    </RoutineContext.Provider>
  );
}
