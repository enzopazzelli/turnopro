"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const onboardingSchema = z.object({
  nombre_completo: z.string().min(2, "Nombre requerido"),
  especialidad: z.string().optional(),
  telefono: z.string().optional(),
  nombre_consultorio: z.string().min(2, "Nombre del consultorio requerido"),
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  rubro: z.string().min(1, "Selecciona un rubro"),
});

export async function completarOnboarding(prevState, formData) {
  const rawData = {
    nombre_completo: formData.get("nombre_completo"),
    especialidad: formData.get("especialidad"),
    telefono: formData.get("telefono"),
    nombre_consultorio: formData.get("nombre_consultorio"),
    slug: formData.get("slug"),
    rubro: formData.get("rubro"),
  };

  const resultado = onboardingSchema.safeParse(rawData);
  if (!resultado.success) {
    return {
      error: null,
      fieldErrors: resultado.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Obtener el auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "No se pudo identificar tu sesion. Intenta iniciar sesion de nuevo.",
      fieldErrors: {},
    };
  }

  // Verificar que no tenga ya un tenant
  const { data: existente } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existente) {
    redirect("/dashboard");
  }

  // Llamar al RPC existente para crear tenant + user + professional atomicamente
  const { error: rpcError } = await supabase.rpc("registrar_profesional", {
    p_auth_id: user.id,
    p_email: user.email,
    p_nombre_completo: resultado.data.nombre_completo,
    p_nombre_consultorio: resultado.data.nombre_consultorio,
    p_slug: resultado.data.slug,
    p_rubro: resultado.data.rubro,
  });

  if (rpcError) {
    const mensajeSlug = rpcError.message.includes("slug")
      ? "Este slug ya esta en uso, elige otro"
      : "Error al configurar la cuenta. Intenta de nuevo.";
    return {
      error: mensajeSlug,
      fieldErrors: {},
    };
  }

  redirect("/dashboard");
}
