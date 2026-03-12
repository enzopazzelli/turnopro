import { z } from "zod";

export const medicamentoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  dosis: z.string().optional().or(z.literal("")),
  frecuencia: z.string().optional().or(z.literal("")),
  duracion: z.string().optional().or(z.literal("")),
  indicaciones: z.string().optional().or(z.literal("")),
});

export const recetaSchema = z.object({
  paciente_id: z.string().uuid("Paciente requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  tipo: z
    .enum([
      "receta_medicamento",
      "indicacion_medica",
      "orden_estudio",
      "derivacion",
      "certificado",
      "carta_documento",
      "dictamen",
      "certificacion_firma",
      "informe_legal",
      "poder",
      "certificacion_ingresos",
      "informe_contable",
      "balance",
      "dictamen_contador",
      "nota_requerimiento",
    ])
    .default("receta_medicamento"),
  diagnostico: z.string().optional().or(z.literal("")),
  medicamentos: z.array(medicamentoSchema).default([]),
  contenido: z.string().optional().or(z.literal("")),
  indicaciones_generales: z.string().optional().or(z.literal("")),
});
