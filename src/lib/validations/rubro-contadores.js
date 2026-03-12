import { z } from "zod";

export const vencimientoFiscalSchema = z.object({
  paciente_id: z.string().uuid().optional().nullable(),
  titulo: z.string().min(1, "Titulo requerido"),
  descripcion: z.string().optional(),
  obligacion: z.string().optional(),
  fecha_vencimiento: z.string().min(1, "Fecha requerida"),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  recurrente: z.coerce.boolean().default(false),
  recurrencia: z.enum(["mensual", "bimestral", "trimestral", "semestral", "anual"]).optional().nullable(),
});

export const checklistSchema = z.object({
  paciente_id: z.string().uuid().optional().nullable(),
  titulo: z.string().min(1, "Titulo requerido"),
  periodo: z.string().optional(),
  notas: z.string().optional(),
  items: z.array(
    z.object({
      descripcion: z.string().min(1, "Descripcion requerida"),
    })
  ).optional().default([]),
});

export const checklistItemSchema = z.object({
  checklist_id: z.string().uuid("Checklist requerido"),
  descripcion: z.string().min(1, "Descripcion requerida"),
  orden: z.coerce.number().int().default(0),
});
