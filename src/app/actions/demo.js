"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const demoSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email invalido"),
  telefono: z.string().optional(),
  rubro: z.string().min(1, "Selecciona una profesion"),
  mensaje: z.string().optional(),
});

export async function solicitarDemo(prevState, formData) {
  const rawData = {
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    rubro: formData.get("rubro"),
    mensaje: formData.get("mensaje"),
  };

  const resultado = demoSchema.safeParse(rawData);
  if (!resultado.success) {
    return {
      error: null,
      fieldErrors: resultado.error.flatten().fieldErrors,
      success: null,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("solicitudes_demo").insert({
    nombre: resultado.data.nombre,
    email: resultado.data.email,
    telefono: resultado.data.telefono || null,
    rubro: resultado.data.rubro,
    mensaje: resultado.data.mensaje || null,
  });

  if (error) {
    console.error("Error al guardar solicitud de demo:", error);
    return {
      error: "Error al enviar la solicitud. Intenta nuevamente.",
      fieldErrors: {},
      success: null,
    };
  }

  return {
    error: null,
    fieldErrors: {},
    success: Date.now(),
  };
}
