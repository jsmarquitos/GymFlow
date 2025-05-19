import type { SubscriptionPlan, AdminMember } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan_basic_mensual",
    name: "Plan Básico",
    price: 29.99,
    duration: "Mensual",
    features: ["Acceso al gimnasio", "Clases grupales limitadas", "Vestuarios con duchas"],
    description: "Ideal para empezar tu viaje de fitness.",
  },
  {
    id: "plan_premium_mensual",
    name: "Plan Premium",
    price: 49.99,
    duration: "Mensual",
    features: ["Acceso ilimitado al gimnasio", "Todas las clases grupales", "Acceso a la piscina", "Entrenador personal (1 sesión/mes)"],
    description: "La experiencia completa para alcanzar tus metas.",
  },
  {
    id: "plan_pro_anual",
    name: "Plan Pro Anual",
    price: 499.00,
    duration: "Anual",
    features: ["Todo lo del Premium", "Descuento anual", "Taquilla personal", "Invitado gratis (1 vez/mes)"],
    description: "El mejor valor para un compromiso a largo plazo.",
  },
];

export const MOCK_ADMIN_MEMBERS: AdminMember[] = [
  {
    id: "member_001",
    name: "Carlos Santana",
    email: "carlos.s@example.com",
    joinDate: "2023-05-15",
    status: "Activo",
    subscriptionPlanId: "plan_premium_mensual",
    profilePictureUrl: "https://placehold.co/100x100.png",
    profilePictureHint: "hombre sonriendo",
  },
  {
    id: "member_002",
    name: "Laura Vargas",
    email: "laura.v@example.com",
    joinDate: "2024-01-20",
    status: "Activo",
    subscriptionPlanId: "plan_basic_mensual",
    profilePictureUrl: "https://placehold.co/100x100.png",
    profilePictureHint: "mujer fitness",
  },
  {
    id: "member_003",
    name: "Pedro Jiménez",
    email: "pedro.j@example.com",
    joinDate: "2022-11-01",
    status: "Inactivo",
    subscriptionPlanId: null,
    profilePictureUrl: "https://placehold.co/100x100.png",
    profilePictureHint: "persona retrato",
  },
  {
    id: "member_004",
    name: "Sofía Castro",
    email: "sofia.c@example.com",
    joinDate: "2023-09-10",
    status: "Suspendido",
    subscriptionPlanId: "plan_basic_mensual",
    profilePictureUrl: "https://placehold.co/100x100.png",
    profilePictureHint: "mujer joven",
  },
];

export const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
};
