import type { LucideIcon } from 'lucide-react';

export interface ClassSchedule {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: string; // e.g., "60 minutos"
  availableSlots: number;
  totalSlots: number;
  description: string;
  icon?: LucideIcon; // Optional: Icon for the class type
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
