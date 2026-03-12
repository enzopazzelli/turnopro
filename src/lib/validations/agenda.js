import { z } from "zod";

export const servicioSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Maximo 100 caracteres"),
  duracion_minutos: z.coerce
    .number()
    .min(5, "Minimo 5 minutos")
    .max(480, "Maximo 8 horas"),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo").default(0),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color invalido")
    .default("#6366f1"),
  activo: z.boolean().default(true),
});

export const citaSchema = z.object({
  paciente_nombre: z
    .string()
    .min(1, "El nombre del paciente es requerido")
    .max(100),
  paciente_telefono: z.string().max(20).optional().or(z.literal("")),
  paciente_email: z.string().email("Email invalido").optional().or(z.literal("")),
  paciente_id: z.string().uuid().optional().or(z.literal("")),
  servicio_id: z.string().uuid().optional().or(z.literal("")),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora_inicio: z.string().min(1, "La hora de inicio es requerida"),
  hora_fin: z.string().min(1, "La hora de fin es requerida"),
  estado: z
    .enum([
      "pendiente",
      "pendiente_confirmacion",
      "confirmada",
      "en_curso",
      "completada",
      "cancelada",
      "no_asistio",
    ])
    .default("pendiente"),
  notas: z.string().max(1000).optional().or(z.literal("")),
  motivo: z.string().max(500).optional().or(z.literal("")),
  sobreturno: z.coerce.boolean().optional().default(false),
  recurrencia: z.enum(["semanal", "quincenal", "mensual"]).optional().or(z.literal("")),
  recurrencia_fin: z.string().optional().or(z.literal("")),
});

export const fechaBloqueadaSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  motivo: z.string().max(200).optional().or(z.literal("")),
});

export const listaEsperaSchema = z.object({
  paciente_nombre: z.string().min(1, "El nombre es requerido").max(100),
  paciente_telefono: z.string().max(20).optional().or(z.literal("")),
  paciente_email: z.string().email("Email invalido").optional().or(z.literal("")),
  paciente_id: z.string().uuid().optional().or(z.literal("")),
  servicio_id: z.string().uuid().optional().or(z.literal("")),
  fecha_preferida: z.string().optional().or(z.literal("")),
  horario_preferido: z.enum(["manana", "tarde", "cualquiera"]).optional().or(z.literal("")),
  notas: z.string().max(500).optional().or(z.literal("")),
});
