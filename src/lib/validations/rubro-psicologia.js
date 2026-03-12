import { z } from "zod";

export const notaSesionSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  cita_id: z.string().uuid().optional().nullable(),
  fecha: z.string().min(1, "Fecha requerida"),
  contenido: z.string().min(1, "Contenido requerido"),
  estado_emocional: z.string().optional(),
  temas: z.array(z.string()).default([]),
  objetivos: z.string().optional(),
  tareas: z.string().optional(),
  privado: z.coerce.boolean().default(true),
});

export const evolucionSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  titulo: z.string().min(1, "Titulo requerido"),
  descripcion: z.string().optional(),
  puntuacion: z.coerce.number().int().min(1).max(10),
  area: z.string().optional(),
});

export const cuestionarioSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  tipo: z.enum(["phq9", "gad7", "bdi2", "stai_estado", "stai_rasgo", "moca", "personalizado"]).default("personalizado"),
  preguntas: z.array(
    z.object({
      texto: z.string().min(1),
      tipo: z.enum(["escala", "texto", "opcion"]).default("escala"),
      min: z.coerce.number().default(0),
      max: z.coerce.number().default(3),
      opciones: z.array(z.string()).optional(),
    })
  ).min(1, "Al menos una pregunta"),
});

export const respuestaCuestionarioSchema = z.object({
  cuestionario_id: z.string().uuid("Cuestionario requerido"),
  paciente_id: z.string().uuid("Paciente requerido"),
  respuestas: z.array(z.coerce.number()).min(1, "Respuestas requeridas"),
  puntuacion_total: z.coerce.number().int().optional(),
  interpretacion: z.string().optional(),
});
