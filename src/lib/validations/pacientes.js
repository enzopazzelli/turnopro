import { z } from "zod";

export const pacienteSchema = z.object({
  nombre_completo: z
    .string()
    .min(1, "El nombre es requerido")
    .max(150, "Maximo 150 caracteres"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  telefono: z.string().max(20).optional().or(z.literal("")),
  dni: z.string().max(20).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  genero: z
    .enum(["masculino", "femenino", "otro", "no_especifica"])
    .default("no_especifica"),
  direccion: z.string().max(300).optional().or(z.literal("")),
  obra_social: z.string().max(100).optional().or(z.literal("")),
  numero_afiliado: z.string().max(50).optional().or(z.literal("")),
  etiquetas: z.array(z.string()).default([]),
  notas: z.string().max(2000).optional().or(z.literal("")),
});
