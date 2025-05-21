
import type { LucideIcon } from 'lucide-react';

export interface ClassSchedule {
  id: string;
  name: string;
  instructor: string;
  time: string; // e.g., "Lun, Mié, Vie - 7:00 AM"
  duration: string; // e.g., "60 minutos"
  availableSlots: number;
  totalSlots: number;
  description: string;
  iconName?: string; // Nombre del icono de Lucide (e.g., "Dumbbell")
  imageUrl?: string; // Optional: Image for the class
  imageHint?: string; // Optional: AI hint for placeholder image
}

export interface MemberBooking {
  id: string;
  classId: string;
  className: string;
  classDate: string; // e.g., "2024-07-15"
  classTime: string; // e.g., "10:00 AM"
  status: 'Reservada' | 'Asistida' | 'Cancelada';
}

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  membershipType: string;
  joinDate: string; // e.g., "2023-01-20"
  profilePictureUrl?: string;
  profilePictureHint?: string;
  bookings: MemberBooking[];
}

export interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  requiresAuth?: boolean;
  instructorOnly?: boolean;
  memberOnly?: boolean;
  instructorAllowed?: boolean;
  hideWhenLoggedIn?: boolean; // Para ocultar "Login", "Registro" cuando ya está logueado
}

// Tipos para el Panel de Administración
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'Mensual' | 'Trimestral' | 'Anual' | 'Otro';
  features: string[];
  description?: string;
}

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  joinDate: string; // formato "yyyy-MM-dd" para facilitar la ordenación/manejo
  status: 'Activo' | 'Inactivo' | 'Suspendido';
  subscriptionPlanId: string | null; // Puede no tener plan
  profilePictureUrl?: string;
  profilePictureHint?: string;
}

export type PaymentStatus = 'Pagado' | 'Pendiente' | 'Vencido' | 'Cancelado';
export type PaymentMethod = 'Efectivo' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Transferencia Bancaria' | 'Otro';

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string; // Para facilitar la visualización en la tabla de pagos
  paymentDate: string; // formato "yyyy-MM-dd"
  amount: number;
  paymentMethod: PaymentMethod;
  coveredPeriodStart: string; // formato "yyyy-MM-dd"
  coveredPeriodEnd: string; // formato "yyyy-MM-dd"
  status: PaymentStatus;
  notes?: string; // Notas adicionales sobre el pago
}

// Tipo para el usuario autenticado
export interface User {
  id: string; // ID único para cada usuario
  name?: string; // Nombre del usuario, especialmente para miembros registrados
  role: 'admin' | 'member' | 'instructor';
  email: string; // Email siempre será requerido
}

// Tipo para la configuración general del gimnasio
export interface GymSettings {
  gymName: string;
  address?: string;
  phone?: string;
  email?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
}

// Tipos para Rutinas de Entrenamiento (Estructura Anidada para Contexto)
export interface RoutineExercise {
  id: string;
  name: string;
  sets: string; // Ej: "3-4"
  reps: string; // Ej: "8-12"
  weight?: string; // Ej: "50kg", "Progresivo", "Corporal"
  restPeriod?: string; // Ej: "60-90s"
  notes?: string; // Notas específicas del ejercicio
  order: number; // Para ordenar los ejercicios dentro del día
  routineDayId?: string; // Added to link exercise to its day, useful if exercises are flat
}

export interface RoutineDay {
  id: string;
  name: string; // Ej: "Día 1: Pecho y Tríceps"
  order: number; // Para ordenar los días
  description?: string; // Descripción o enfoque del día
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  name: string;
  assignedToMemberId: string | null; // Puede ser null si es una plantilla
  assignedByInstructorName: string; // Nombre del instructor que la crea/asigna
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes?: string; // Notas generales de la rutina
  days: RoutineDay[];
}

// Tipo para Instructores
export interface Instructor {
  id: string;
  name: string;
  email: string;
  specialization: string; // Ej: "Yoga, Pilates", "Entrenamiento de Fuerza"
  bio?: string;
  profilePictureUrl?: string;
  profilePictureHint?: string;
  joinDate: string; // formato "yyyy-MM-dd"
}
