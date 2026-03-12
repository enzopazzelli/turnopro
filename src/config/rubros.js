import {
  Stethoscope,
  Scale,
  PawPrint,
  Brain,
  Calculator,
  SmilePlus,
  CircleDot,
  ClipboardList,
  FileHeart,
  Activity,
  Pill,
  FolderOpen,
  FileUp,
  CalendarClock,
  Syringe,
  NotebookPen,
  TrendingUp,
  ClipboardCheck,
  ListChecks,
  BookOpen,
  FileText,
  Library,
} from "lucide-react";

export const RUBROS = {
  odontologia: {
    nombre: "Odontologia",
    icono: SmilePlus,
    color: "#06b6d4",
    modulos: [
      { id: "odontograma", nombre: "Odontograma", ruta: "/dashboard/odontograma", icono: CircleDot },
      { id: "tratamientos", nombre: "Planes de Tratamiento", ruta: "/dashboard/tratamientos", icono: ClipboardList },
      { id: "historia_dental", nombre: "Historia Dental", ruta: "/dashboard/historia-dental", icono: FileHeart },
      { id: "recetas", nombre: "Recetas", ruta: "/dashboard/recetas", icono: Pill },
    ],
    terminoPaciente: "Paciente",
    crm: {
      terminoPlural: "Pacientes",
      campos: {
        obra_social: true,
        numero_afiliado: true,
        genero: true,
        fecha_nacimiento: true,
      },
      etiquetas: ["nuevo", "regular", "vip", "obra_social", "particular", "derivado", "reserva_online"],
      columnaExtra: "Obra social",
    },
  },
  medicina: {
    nombre: "Medicina General",
    icono: Stethoscope,
    color: "#ef4444",
    modulos: [
      { id: "historia_clinica", nombre: "Historia Clinica", ruta: "/dashboard/historia-clinica", icono: BookOpen },
      { id: "signos_vitales", nombre: "Signos Vitales", ruta: "/dashboard/signos-vitales", icono: Activity },
      { id: "recetas", nombre: "Recetas", ruta: "/dashboard/recetas", icono: Pill },
      { id: "recursos_medicos", nombre: "Recursos Medicos", ruta: "/dashboard/recursos-medicos", icono: Library },
    ],
    terminoPaciente: "Paciente",
    crm: {
      terminoPlural: "Pacientes",
      campos: {
        obra_social: true,
        numero_afiliado: true,
        genero: true,
        fecha_nacimiento: true,
      },
      etiquetas: ["nuevo", "regular", "vip", "obra_social", "particular", "derivado", "reserva_online"],
      columnaExtra: "Obra social",
    },
  },
  abogados: {
    nombre: "Abogacia",
    icono: Scale,
    color: "#8b5cf6",
    modulos: [
      { id: "expedientes", nombre: "Expedientes", ruta: "/dashboard/expedientes", icono: FolderOpen },
      { id: "documentos", nombre: "Documentos", ruta: "/dashboard/documentos", icono: FileUp },
      { id: "vencimientos", nombre: "Vencimientos", ruta: "/dashboard/vencimientos", icono: CalendarClock },
      { id: "recetas", nombre: "Docs. Profesionales", ruta: "/dashboard/recetas", icono: FileText },
      { id: "recursos_legales", nombre: "Recursos Legales", ruta: "/dashboard/recursos-legales", icono: Library },
    ],
    terminoPaciente: "Cliente",
    crm: {
      terminoPlural: "Clientes",
      campos: {
        obra_social: false,
        numero_afiliado: false,
        genero: false,
        fecha_nacimiento: false,
      },
      etiquetas: ["nuevo", "regular", "vip", "corporativo", "particular", "litigio", "consultoria", "reserva_online"],
      columnaExtra: null,
    },
  },
  veterinaria: {
    nombre: "Veterinaria",
    icono: PawPrint,
    color: "#22c55e",
    modulos: [
      { id: "mascotas", nombre: "Mascotas", ruta: "/dashboard/mascotas", icono: PawPrint },
      { id: "vacunacion", nombre: "Vacunacion", ruta: "/dashboard/vacunacion", icono: Syringe },
      { id: "historial_mascota", nombre: "Historial", ruta: "/dashboard/historial-mascota", icono: ClipboardList },
      { id: "recetas", nombre: "Recetas", ruta: "/dashboard/recetas", icono: Pill },
    ],
    terminoPaciente: "Tutor",
    crm: {
      terminoPlural: "Tutores",
      campos: {
        obra_social: false,
        numero_afiliado: false,
        genero: false,
        fecha_nacimiento: true,
      },
      etiquetas: ["nuevo", "regular", "vip", "multiples_mascotas", "emergencia", "reserva_online"],
      columnaExtra: null,
    },
  },
  psicologia: {
    nombre: "Psicologia",
    icono: Brain,
    color: "#f59e0b",
    modulos: [
      { id: "notas_sesion", nombre: "Notas de Sesion", ruta: "/dashboard/notas-sesion", icono: NotebookPen },
      { id: "evolucion", nombre: "Evolucion", ruta: "/dashboard/evolucion", icono: TrendingUp },
      { id: "cuestionarios", nombre: "Cuestionarios", ruta: "/dashboard/cuestionarios", icono: ClipboardCheck },
      { id: "consentimientos", nombre: "Consentimientos", ruta: "/dashboard/consentimientos", icono: FileText },
      { id: "recetas", nombre: "Recetas", ruta: "/dashboard/recetas", icono: Pill },
    ],
    terminoPaciente: "Paciente",
    crm: {
      terminoPlural: "Pacientes",
      campos: {
        obra_social: true,
        numero_afiliado: true,
        genero: true,
        fecha_nacimiento: true,
      },
      etiquetas: ["nuevo", "regular", "vip", "obra_social", "particular", "derivado", "reserva_online"],
      columnaExtra: "Obra social",
    },
  },
  contadores: {
    nombre: "Contaduria",
    icono: Calculator,
    color: "#3b82f6",
    modulos: [
      { id: "vencimientos_fiscales", nombre: "Vencimientos Fiscales", ruta: "/dashboard/vencimientos-fiscales", icono: CalendarClock },
      { id: "checklists", nombre: "Checklists", ruta: "/dashboard/checklists", icono: ListChecks },
      { id: "documentos_cliente", nombre: "Repositorio Docs.", ruta: "/dashboard/documentos-cliente", icono: FolderOpen },
      { id: "recetas", nombre: "Docs. Profesionales", ruta: "/dashboard/recetas", icono: FileText },
    ],
    terminoPaciente: "Cliente",
    crm: {
      terminoPlural: "Clientes",
      campos: {
        obra_social: false,
        numero_afiliado: false,
        genero: false,
        fecha_nacimiento: false,
      },
      etiquetas: ["nuevo", "regular", "vip", "monotributista", "empresa", "autonomo", "reserva_online"],
      columnaExtra: null,
    },
  },
};

export function getRubroConfig(rubroId) {
  return RUBROS[rubroId] || null;
}

export function getRubroModulos(rubroId) {
  return RUBROS[rubroId]?.modulos || [];
}
