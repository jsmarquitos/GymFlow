
import type { SubscriptionPlan, AdminMember, ClassSchedule, MemberBooking, PaymentRecord, PaymentMethod, PaymentStatus, GymSettings, MemberProfile, Routine, RoutineDay, RoutineExercise } from "@/types";
import { format, subDays, addDays } from "date-fns"; // Added subDays, addDays
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
  { // Añadido para que MOCK_MEMBER_PROFILE tenga un registro en AdminMember
    id: "user123_alex_ryder",
    name: "Alex Ryder",
    email: "miembro@gymflow.com",
    joinDate: "2023-01-15",
    status: "Activo",
    subscriptionPlanId: "plan_premium_mensual", // Asumiendo que Alex tiene un plan premium
    profilePictureUrl: "https://placehold.co/100x100.png",
    profilePictureHint: "persona avatar",
  }
];

export const MOCK_MEMBER_PROFILE: MemberProfile = {
  id: "user123_alex_ryder",
  name: "Alex Ryder",
  email: "miembro@gymflow.com",
  membershipType: "Premium Oro",
  joinDate: "15 de enero de 2023",
  profilePictureUrl: "https://placehold.co/150x150.png",
  profilePictureHint: "persona avatar",
  bookings: [
    { id: "b1", classId: "1", className: "Flujo de Yoga Matutino", classDate: "10 de julio de 2024", classTime: "7:00 AM", status: "Asistida" },
    { id: "b2", classId: "2", className: "Explosión HIIT", classDate: "11 de julio de 2024", classTime: "6:00 PM", status: "Reservada" },
  ],
};

export const formatDate = (dateString: string | Date, outputFormat: string = "dd 'de' MMMM 'de' yyyy") => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00') : dateString;
    return format(date, outputFormat, { locale: es });
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
    memberName: "Sofía Castro",
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
    memberId: "member_003",
    memberName: "Pedro Jiménez",
    paymentDate: "2024-07-10",
    amount: 15.00,
    paymentMethod: "Otro",
    coveredPeriodStart: "2024-07-10",
    coveredPeriodEnd: "2024-07-17",
    status: "Pagado",
    notes: "Pase semanal."
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia Bancaria', 'Otro'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['Pagado', 'Pendiente', 'Vencido', 'Cancelado'];

export const MOCK_GYM_SETTINGS: GymSettings = {
  gymName: "GymFlow Pro",
  address: "Calle Falsa 123, Ciudad Ejemplo, País",
  phone: "+1 (555) 123-4567",
  email: "info@gymflow.com",
  instagramUrl: "https://instagram.com/gymflow",
  facebookUrl: "https://facebook.com/gymflow",
  twitterUrl: "https://twitter.com/gymflow",
};

// Mock data para la vista del miembro (separado de lo que gestionará el admin inicialmente)
export const MOCK_MEMBER_VIEW_ROUTINE: Routine = {
  id: "routine_member_001",
  name: "Rutina de Fuerza y Resistencia (Asignada)",
  assignedToMemberId: MOCK_MEMBER_PROFILE.id,
  assignedByInstructorName: "Entrenador AI",
  startDate: formatDate(subDays(new Date(), 15), "yyyy-MM-dd"),
  endDate: formatDate(addDays(new Date(), 15), "yyyy-MM-dd"),
  notes: "Concéntrate en la técnica y aumenta progresivamente el peso. No olvides calentar antes y estirar después de cada sesión.",
  days: [
    {
      id: "day_member_001",
      name: "Día 1: Empuje (Pecho, Hombros, Tríceps)",
      order: 1,
      description: "Enfócate en movimientos compuestos para la parte superior del cuerpo.",
      exercises: [
        { id: "ex_member_001", name: "Press de Banca Plano", sets: "3-4", reps: "6-10", weight: "Progresivo", restPeriod: "90s", order: 1 },
        { id: "ex_member_002", name: "Press Militar con Barra (de pie)", sets: "3", reps: "8-12", weight: "Progresivo", restPeriod: "75s", order: 2 },
        { id: "ex_member_003", name: "Fondos en Paralelas (o banco)", sets: "3", reps: "Al fallo", weight: "Corporal", restPeriod: "75s", order: 3 },
      ]
    },
    {
      id: "day_member_002",
      name: "Día 2: Jalón (Espalda, Bíceps)",
      order: 2,
      description: "Trabaja la espalda en todos sus ángulos y complementa con bíceps.",
      exercises: [
        { id: "ex_member_004", name: "Dominadas (o Jalón al Pecho)", sets: "3-4", reps: "Al fallo / 8-12", weight: "Corporal / Progresivo", restPeriod: "90s", order: 1 },
        { id: "ex_member_005", name: "Remo con Barra", sets: "3", reps: "8-12", weight: "Progresivo", restPeriod: "75s", order: 2 },
      ]
    },
    {
      id: "day_member_003",
      name: "Día 3: Pierna Completa",
      order: 3,
      description: "Un día dedicado a fortalecer todo el tren inferior.",
      exercises: [
        { id: "ex_member_006", name: "Sentadilla Trasera con Barra", sets: "3-4", reps: "6-10", weight: "Progresivo", restPeriod: "120s", order: 1 },
        { id: "ex_member_007", name: "Peso Muerto Rumano con Mancuernas", sets: "3", reps: "10-15", weight: "Moderado", restPeriod: "90s", order: 2 },
      ]
    }
  ]
};


// Mock data para la gestión de rutinas por el instructor/admin (CONTEXTO)
// Estas rutinas serán gestionadas por RoutineContext.
export const INITIAL_CONTEXT_ROUTINES: Routine[] = [
  {
    id: "ctx_routine_strength_template",
    name: "Plantilla: Fuerza General 3 Días",
    assignedToMemberId: null, // Es una plantilla
    assignedByInstructorName: "Sistema",
    startDate: formatDate(new Date(), "yyyy-MM-dd"),
    endDate: formatDate(addDays(new Date(), 30), "yyyy-MM-dd"),
    notes: "Plantilla base para entrenamiento de fuerza de 3 días. Asignar a un miembro y ajustar según necesidades.",
    days: [
      {
        id: "ctx_day_1_push",
        name: "Día 1: Empuje (Pecho, Hombro, Tríceps)",
        order: 1,
        description: "Movimientos de empuje para la parte superior.",
        exercises: [
          { id: "ctx_ex_1_1", name: "Press Banca", sets: "4", reps: "8-12", weight: "70% RM", restPeriod: "90s", order: 1 },
          { id: "ctx_ex_1_2", name: "Press Inclinado Mancuernas", sets: "3", reps: "10-15", weight: "60% RM", restPeriod: "75s", order: 2 },
          { id: "ctx_ex_1_3", name: "Extensiones Tríceps Polea", sets: "3", reps: "12-15", weight: " ajustable", restPeriod: "60s", order: 3 },
        ]
      },
      {
        id: "ctx_day_2_pull",
        name: "Día 2: Jalón (Espalda, Bíceps)",
        order: 2,
        description: "Movimientos de tracción para la parte superior.",
        exercises: [
          { id: "ctx_ex_2_1", name: "Dominadas Asistidas", sets: "4", reps: "Max", weight: "Asistencia X", restPeriod: "90s", order: 1 },
          { id: "ctx_ex_2_2", name: "Remo con Barra", sets: "3", reps: "8-12", weight: "70% RM", restPeriod: "75s", order: 2 },
          { id: "ctx_ex_2_3", name: "Curl Bíceps Mancuernas", sets: "3", reps: "10-15", weight: "ajustable", restPeriod: "60s", order: 3 },
        ]
      },
      {
        id: "ctx_day_3_legs",
        name: "Día 3: Piernas",
        order: 3,
        description: "Entrenamiento completo de tren inferior.",
        exercises: [
          { id: "ctx_ex_3_1", name: "Sentadilla", sets: "4", reps: "8-12", weight: "75% RM", restPeriod: "120s", order: 1 },
          { id: "ctx_ex_3_2", name: "Peso Muerto Rumano", sets: "3", reps: "10-15", weight: "65% RM", restPeriod: "90s", order: 2 },
          { id: "ctx_ex_3_3", name: "Elevación Gemelos", sets: "3", reps: "15-20", weight: "ajustable", restPeriod: "60s", order: 3 },
        ]
      }
    ]
  },
  {
    id: "ctx_routine_cardio_focus_laura_v",
    name: "Rutina Cardio: Laura Vargas",
    assignedToMemberId: "member_002", // ID de Laura Vargas de MOCK_ADMIN_MEMBERS
    assignedByInstructorName: "Ana Entrenadora",
    startDate: formatDate(subDays(new Date(), 7), "yyyy-MM-dd"),
    endDate: formatDate(addDays(new Date(), 23), "yyyy-MM-dd"),
    notes: "Rutina enfocada en mejorar resistencia cardiovascular.",
    days: [
      {
        id: "ctx_day_cardio_1",
        name: "Lunes: Carrera Continua",
        order: 1,
        description: "Mantener ritmo constante.",
        exercises: [
          { id: "ctx_ex_c1_1", name: "Correr en Cinta", sets: "1", reps: "30 min", weight: "N/A", restPeriod: "N/A", order: 1 },
        ]
      },
      {
        id: "ctx_day_cardio_2",
        name: "Miércoles: HIIT Bicicleta",
        order: 2,
        description: "Intervalos de alta intensidad.",
        exercises: [
          { id: "ctx_ex_c2_1", name: "Bicicleta Estática (Intervalos)", sets: "5", reps: "1 min fuerte / 2 min suave", weight: "N/A", restPeriod: "N/A", order: 1 },
        ]
      },
      {
        id: "ctx_day_cardio_3",
        name: "Viernes: Natación",
        order: 3,
        description: "Entrenamiento completo de bajo impacto.",
        exercises: [
          { id: "ctx_ex_c3_1", name: "Nado Estilo Libre", sets: "1", reps: "45 min", weight: "N/A", restPeriod: "N/A", order: 1 },
        ]
      }
    ]
  }
];
