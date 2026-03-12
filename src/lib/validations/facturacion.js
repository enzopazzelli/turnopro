import { z } from "zod";

export const pagoSchema = z.object({
  monto: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0"),
  metodo_pago: z.enum(
    ["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito", "mercado_pago", "obra_social"],
    { required_error: "Selecciona un metodo de pago" }
  ),
  referencia: z.string().max(200).optional().or(z.literal("")),
  notas: z.string().max(500).optional().or(z.literal("")),
  fecha_pago: z.string().min(1, "La fecha es requerida"),
  cita_id: z.string().uuid().optional().or(z.literal("")),
  paciente_id: z.string().uuid().optional().or(z.literal("")),
});

export const anulacionPagoSchema = z.object({
  motivo: z.string().min(1, "El motivo es requerido").max(500),
});
