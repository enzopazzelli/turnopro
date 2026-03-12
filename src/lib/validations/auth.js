import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresa un email valido"),
  password: z
    .string()
    .min(6, "La contrasena debe tener al menos 6 caracteres"),
});

export const registroSchema = z.object({
  nombre_completo: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresa un email valido"),
  password: z
    .string()
    .min(6, "La contrasena debe tener al menos 6 caracteres"),
  nombre_consultorio: z
    .string()
    .min(2, "El nombre del consultorio debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(50, "El slug no puede superar 50 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo letras minusculas, numeros y guiones (sin espacios)"
    ),
  rubro: z.enum(
    ["odontologia", "medicina", "abogados", "veterinaria", "psicologia", "contadores"],
    { errorMap: () => ({ message: "Selecciona un rubro" }) }
  ),
});

export function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .trim()
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-"); // collapse multiple hyphens
}
