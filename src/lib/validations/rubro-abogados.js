import { z } from "zod";

export const expedienteSchema = z.object({
  paciente_id: z.string().uuid("Cliente requerido"),
  caratula: z.string().min(1, "Caratula requerida").max(300),
  numero_expediente: z.string().optional(),
  juzgado: z.string().optional(),
  fuero: z.string().optional(),
  estado: z.enum(["activo", "en_tramite", "con_sentencia", "archivado", "apelado"]).default("activo"),
  tipo: z.string().optional(),
  descripcion: z.string().optional(),
  notas_privadas: z.string().optional(),
  fecha_inicio: z.string().optional(),
});

export const documentoLegalSchema = z.object({
  expediente_id: z.string().uuid("Expediente requerido"),
  paciente_id: z.string().uuid().optional().nullable(),
  nombre: z.string().min(1, "Nombre requerido"),
  notas: z.string().optional(),
});

export const vencimientoLegalSchema = z.object({
  expediente_id: z.string().uuid().optional().nullable(),
  paciente_id: z.string().uuid().optional().nullable(),
  titulo: z.string().min(1, "Titulo requerido"),
  descripcion: z.string().optional(),
  fecha_vencimiento: z.string().min(1, "Fecha requerida"),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
});
