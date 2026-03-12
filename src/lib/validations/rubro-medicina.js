import { z } from "zod";

export const historiaClinicaSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  cita_id: z.string().uuid().optional().nullable(),
  fecha: z.string().min(1, "Fecha requerida"),
  motivo_consulta: z.string().optional(),
  diagnostico: z.string().optional(),
  indicaciones: z.string().optional(),
  antecedentes: z.string().optional(),
  alergias: z.array(z.string()).default([]),
  medicacion_cronica: z.array(z.string()).default([]),
  observaciones: z.string().optional(),
});

export const signosVitalesSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  peso_kg: z.coerce.number().min(0).max(500).optional().nullable(),
  altura_cm: z.coerce.number().min(0).max(300).optional().nullable(),
  presion_sistolica: z.coerce.number().int().min(0).max(300).optional().nullable(),
  presion_diastolica: z.coerce.number().int().min(0).max(200).optional().nullable(),
  temperatura: z.coerce.number().min(30).max(45).optional().nullable(),
  frecuencia_cardiaca: z.coerce.number().int().min(0).max(300).optional().nullable(),
  saturacion_o2: z.coerce.number().int().min(0).max(100).optional().nullable(),
  notas: z.string().optional(),
});

export const medicamentoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  dosis: z.string().optional(),
  frecuencia: z.string().optional(),
  duracion: z.string().optional(),
  indicaciones: z.string().optional(),
});

export const recetaSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  diagnostico: z.string().optional(),
  medicamentos: z.array(medicamentoSchema).min(1, "Al menos un medicamento"),
  indicaciones_generales: z.string().optional(),
});
