import type { LucideIcon } from 'lucide-react';
import { Dumbbell, Bike, Waves, Zap, Heart, Brain, Users, CalendarDays, Shield, Activity, TrendingUp, Scale, Flame, Wind, Leaf, Sparkles, UserCheck, Clock, BarChart } from 'lucide-react';

export const availableIcons: Record<string, LucideIcon> = {
  Dumbbell: Dumbbell,
  Bike: Bike,
  Waves: Waves,
  Zap: Zap,
  Heart: Heart,
  Brain: Brain,
  Users: Users,
  CalendarDays: CalendarDays,
  Shield: Shield,
  Activity: Activity,
  TrendingUp: TrendingUp,
  Scale: Scale,
  Flame: Flame,
  Wind: Wind,
  Leaf: Leaf,
  Sparkles: Sparkles, // Para clases como "Yoga Flow & Glow"
  UserCheck: UserCheck, // Para clases de "Bienvenida" o "Introducción"
  Clock: Clock, // Relacionado con el tiempo o clases de duración específica
  BarChart: BarChart, // Para clases de seguimiento o performance
};

export const defaultIcon: LucideIcon = Activity; // Usar Activity como un icono genérico por defecto

export function getIconComponent(iconName?: string): LucideIcon {
  if (iconName && availableIcons[iconName]) {
    return availableIcons[iconName];
  }
  return defaultIcon;
}

export const iconOptions = Object.keys(availableIcons).map(name => ({
  value: name,
  label: name,
}));
