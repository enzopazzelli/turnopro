import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Clock,
  ClockAlert,
  Receipt,
  BarChart3,
  Settings,
  Star,
} from "lucide-react";

export const sidebarItems = [
  {
    titulo: "Dashboard",
    href: "/dashboard",
    icono: LayoutDashboard,
  },
  {
    titulo: "Agenda",
    href: "/dashboard/agenda",
    icono: CalendarDays,
  },
  {
    titulo: "Pacientes",
    href: "/dashboard/pacientes",
    icono: Users,
  },
  {
    titulo: "Servicios",
    href: "/dashboard/servicios",
    icono: Briefcase,
  },
  {
    titulo: "Horarios",
    href: "/dashboard/horarios",
    icono: Clock,
  },
  {
    titulo: "Lista de espera",
    href: "/dashboard/lista-espera",
    icono: ClockAlert,
    feature: "lista_espera",
  },
  {
    titulo: "Facturacion",
    href: "/dashboard/facturacion",
    icono: Receipt,
    feature: "facturacion",
  },
  {
    titulo: "Reportes",
    href: "/dashboard/reportes",
    icono: BarChart3,
    feature: "reportes_avanzados",
  },
  {
    titulo: "Reseñas",
    href: "/dashboard/reviews",
    icono: Star,
  },
  {
    titulo: "Configuracion",
    href: "/dashboard/configuracion",
    icono: Settings,
  },
];
