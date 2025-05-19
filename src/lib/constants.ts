
import type { SubscriptionPlan, AdminMember, ClassSchedule, MemberBooking, PaymentRecord, PaymentMethod, PaymentStatus } from "@/types";
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
  try {
    // Asegurarse de que la fecha se parsea correctamente, especialmente si solo es yyyy-MM-dd
    const date = new Date(dateString + 'T00:00:00'); // Añadir hora para evitar problemas de zona horaria
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
  } catch (error) {
    console.warn(`Error formatting date: ${dateString}`, error);
    return "Fecha inválida";
  }
};

export const MOCK_CLASS_SCHEDULES: ClassSchedule[] = [
  {
    id: "1",
    name: "Flujo de Yoga Matutino",
    instructor: "Sarah Lee",
    time: "Lun, Mié, Vie - 7:00 AM",
    duration: "60 minutos",
    availableSlots: 15,
    totalSlots: 20,
    description: "Comienza tu día con una vigorizante sesión de yoga diseñada para despertar tu cuerpo y mente. Apta para todos los niveles.",
    iconName: "Leaf", 
    imageUrl: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOHx8eW9nYXxlbnwwfHx8fDE3NDc2OTY3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    imageHint: "clase yoga"
  },
  {
    id: "2",
    name: "Explosión HIIT",
    instructor: "Mike Ross",
    time: "Mar, Jue - 6:00 PM",
    duration: "45 minutos",
    availableSlots: 5,
    totalSlots: 15,
    description: "Entrenamiento de Intervalos de Alta Intensidad para llevar tus límites al máximo y quemar calorías. ¡Prepárate para sudar!",
    iconName: "Flame",
    imageUrl: "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxoaWl0fGVufDB8fHx8MTc0NzY5Njg5NXww&ixlib=rb-4.1.0&q=80&w=1080",
    imageHint: "entrenamiento HIIT"
  },
  {
    id: "3",
    name: "Hora de Poder en Spin",
    instructor: "Jessica Chen",
    time: "Lun, Mié - 5:30 PM",
    duration: "60 minutos",
    availableSlots: 0,
    totalSlots: 25,
    description: "Una clase energética de ciclismo indoor con música animada y terrenos desafiantes. ¡Pedalea hacia tu bienestar!",
    iconName: "Bike",
    imageUrl: "https://images.unsplash.com/photo-1652363723082-b1fdca4bdbd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjeWNsZSUyMGd5bXxlbnwwfHx8fDE3NDc2OTY5Njl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    imageHint: "clase spin"
  },
  {
    id: "4",
    name: "Fitness Acuático",
    instructor: "David Kim",
    time: "Sáb - 10:00 AM",
    duration: "50 minutos",
    availableSlots: 12,
    totalSlots: 15,
    description: "Entrenamiento acuático de bajo impacto y alta resistencia. Perfecto para todos los niveles de fitness y suave para las articulaciones.",
    iconName: "Waves",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "fitness acuatico"
  },
   {
    id: "5",
    name: "Entrenamiento de Fuerza 101",
    instructor: "Alex Johnson",
    time: "Mar, Jue - 7:00 AM",
    duration: "75 minutos",
    availableSlots: 8,
    totalSlots: 12,
    description: "Aprende los fundamentos del entrenamiento de fuerza, enfocándote en la forma y técnica correctas para los principales levantamientos.",
    iconName: "Dumbbell",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "gimnasio pesas"
  },
  {
    id: "6",
    name: "Fiesta de Baile Zumba",
    instructor: "Maria Rodriguez",
    time: "Vie - 7:00 PM",
    duration: "60 minutos",
    availableSlots: 20,
    totalSlots: 30,
    description: "Baila hacia el fitness con esta divertida y energética clase de Zumba. ¡No se requiere experiencia en baile!",
    iconName: "Sparkles",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "baile zumba"
  },
];


export const MOCK_MEMBER_BOOKINGS: MemberBooking[] = [
  { id: "booking_1", classId: "1", className: "Flujo de Yoga Matutino", classDate: "25 de julio de 2024", classTime: "7:00 AM", status: "Reservada" },
  { id: "booking_2", classId: "2", className: "Explosión HIIT", classDate: "26 de julio de 2024", classTime: "6:00 PM", status: "Reservada" },
  { id: "booking_3", classId: "3", className: "Hora de Poder en Spin", classDate: "20 de julio de 2024", classTime: "5:30 PM", status: "Asistida" },
  { id: "booking_4", classId: "4", className: "Fitness Acuático", classDate: "15 de julio de 2024", classTime: "10:00 AM", status: "Cancelada" },
  { id: "booking_5", classId: "5", className: "Entrenamiento de Fuerza 101", classDate: "18 de julio de 2024", classTime: "7:00 AM", status: "Asistida" },
];

export const MOCK_PAYMENT_RECORDS: PaymentRecord[] = [
  {
    id: "pay_001",
    memberId: "member_001",
    memberName: "Carlos Santana",
    paymentDate: "2024-07-01",
    amount: 49.99,
    paymentMethod: "Tarjeta de Crédito",
    coveredPeriodStart: "2024-07-01",
    coveredPeriodEnd: "2024-07-31",
    status: "Pagado",
    notes: "Pago mensual plan Premium."
  },
  {
    id: "pay_002",
    memberId: "member_002",
    memberName: "Laura Vargas",
    paymentDate: "2024-07-05",
    amount: 29.99,
    paymentMethod: "Efectivo",
    coveredPeriodStart: "2024-07-05",
    coveredPeriodEnd: "2024-08-04",
    status: "Pagado",
  },
  {
    id: "pay_003",
    memberId: "member_001",
    memberName: "Carlos Santana",
    paymentDate: "2024-06-01",
    amount: 49.99,
    paymentMethod: "Tarjeta de Crédito",
    coveredPeriodStart: "2024-06-01",
    coveredPeriodEnd: "2024-06-30",
    status: "Pagado",
  },
   {
    id: "pay_004",
    memberId: "member_004",
    memberName: "Sofía Castro", // Miembro con estado Suspendido
    paymentDate: "2024-05-15",
    amount: 29.99,
    paymentMethod: "Tarjeta de Débito",
    coveredPeriodStart: "2024-05-15",
    coveredPeriodEnd: "2024-06-14",
    status: "Vencido",
    notes: "Pago pendiente, contactar."
  },
   {
    id: "pay_005",
    memberId: "member_003", // Miembro con estado Inactivo
    memberName: "Pedro Jiménez",
    paymentDate: "2024-07-10",
    amount: 15.00,
    paymentMethod: "Otro",
    coveredPeriodStart: "2024-07-10",
    coveredPeriodEnd: "2024-07-17", // Pase diario o algo así
    status: "Pagado",
    notes: "Pase semanal."
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia Bancaria', 'Otro'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['Pagado', 'Pendiente', 'Vencido', 'Cancelado'];


    