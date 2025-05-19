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
  adminOnly?: boolean; // Para controlar visibilidad en el menú
  requiresAuth?: boolean; // Para mostrar solo si el usuario está autenticado
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
  role: 'admin' | 'member';
  email?: string; // Añadido para poder enviar correos
}

// Tipo para la configuración general del gimnasio
export interface GymSettings {
  gymName: string;
  address?: string; // Optional, as per form
  phone?: string; // Optional
  email?: string; // Optional
  instagramUrl?: string; // Optional
  facebookUrl?: string; // Optional
  twitterUrl?: string; // Optional
}
