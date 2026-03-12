import { z } from "zod";

export const reservaSchema = z.object({
  servicio_id: z.string().uuid("Servicio requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  hora_inicio: z.string().min(1, "Horario requerido"),
  paciente_nombre: z
    .string()
    .min(2, "Nombre requerido (minimo 2 caracteres)")
    .max(150, "Nombre demasiado largo"),
  paciente_telefono: z
    .string()
    .max(20, "Telefono demasiado largo")
    .optional()
    .or(z.literal("")),
  paciente_email: z
    .string()
    .email("Email invalido")
    .optional()
    .or(z.literal("")),
  notas: z.string().max(1000, "Notas demasiado largas").optional().or(z.literal("")),
});
