import { z } from "zod";

export const mascotaSchema = z.object({
  tutor_id: z.string().uuid("Tutor requerido"),
  nombre: z.string().min(1, "Nombre requerido").max(100),
  especie: z.enum(["perro", "gato", "ave", "reptil", "roedor", "otro"]),
  raza: z.string().optional(),
  peso_kg: z.coerce.number().min(0).max(999).optional().nullable(),
  fecha_nacimiento: z.string().optional().nullable(),
  sexo: z.enum(["macho", "hembra"]).optional().nullable(),
  color: z.string().optional(),
  microchip: z.string().optional(),
  notas: z.string().optional(),
});

export const vacunacionSchema = z.object({
  mascota_id: z.string().uuid("Mascota requerida"),
  vacuna: z.string().min(1, "Vacuna requerida"),
  fecha_aplicacion: z.string().min(1, "Fecha requerida"),
  fecha_proxima: z.string().optional().nullable(),
  lote: z.string().optional(),
  veterinario: z.string().optional(),
  notas: z.string().optional(),
});

export const consultaMascotaSchema = z.object({
  mascota_id: z.string().uuid("Mascota requerida"),
  cita_id: z.string().uuid().optional().nullable(),
  fecha: z.string().min(1, "Fecha requerida"),
  motivo: z.string().optional(),
  diagnostico: z.string().optional(),
  tratamiento: z.string().optional(),
  peso_kg: z.coerce.number().min(0).max(999).optional().nullable(),
  temperatura: z.coerce.number().min(30).max(45).optional().nullable(),
  observaciones: z.string().optional(),
});
