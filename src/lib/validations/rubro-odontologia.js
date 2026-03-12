import { z } from "zod";

export const odontogramaSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  tipo: z.enum(["adulto", "infantil"]).default("adulto"),
  datos: z.record(z.any()).default({}),
  notas: z.string().optional(),
});

export const planTratamientoSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  titulo: z.string().min(1, "Titulo requerido").max(200),
  descripcion: z.string().optional(),
  estado: z.enum(["pendiente", "en_curso", "completado", "cancelado"]).default("pendiente"),
  costo_total: z.coerce.number().min(0).default(0),
  notas: z.string().optional(),
});

export const etapaTratamientoSchema = z.object({
  plan_id: z.string().uuid("Plan requerido"),
  orden: z.coerce.number().int().min(0).default(0),
  descripcion: z.string().min(1, "Descripcion requerida"),
  dientes: z.array(z.string()).default([]),
  costo: z.coerce.number().min(0).default(0),
  estado: z.enum(["pendiente", "en_curso", "completado"]).default("pendiente"),
  notas: z.string().optional(),
});

export const historiaDentalSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  cita_id: z.string().uuid().optional().nullable(),
  fecha: z.string().min(1, "Fecha requerida"),
  diagnostico: z.string().optional(),
  procedimiento: z.string().optional(),
  dientes_afectados: z.array(z.string()).default([]),
  observaciones: z.string().optional(),
});
