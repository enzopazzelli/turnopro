import { z } from "zod";

export const configuracionNotificacionesSchema = z.object({
  email_habilitado: z.boolean().default(true),
  whatsapp_habilitado: z.boolean().default(false),
  tipos: z.object({
    cita_creada: z.object({
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(false),
    }).default({}),
    cita_confirmada: z.object({
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(false),
    }).default({}),
    cita_cancelada: z.object({
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(false),
    }).default({}),
    cita_modificada: z.object({
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(false),
    }).default({}),
    reserva_nueva: z.object({
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(false),
    }).default({}),
  }).default({}),
  recordatorio_24h: z.boolean().default(true),
  recordatorio_2h: z.boolean().default(false),
});
