"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function crearReview(prevState, formData) {
  const supabase = await createClient();

  const slug = formData.get("slug") || "";
  const nombre = (formData.get("nombre") || "").trim();
  const email = (formData.get("email") || "").trim();
  const texto = (formData.get("texto") || "").trim();
  const estrellas = parseInt(formData.get("estrellas") || "0", 10);

  if (!nombre) return { error: "El nombre es requerido", success: false };
  if (!texto) return { error: "El comentario es requerido", success: false };
  if (!estrellas || estrellas < 1 || estrellas > 5)
    return { error: "Seleccioná una calificación", success: false };

  // Buscar tenant por slug
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) return { error: "Profesional no encontrado", success: false };

  // Usar admin client para el INSERT: la RLS anon_insert no aplica a usuarios autenticados
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").insert({
    tenant_id: tenant.id,
    nombre,
    email: email || null,
    texto,
    estrellas,
    visible: false,
  });

  if (error) {
    console.error("Error al guardar review:", error);
    return { error: "Error al guardar la reseña", success: false };
  }

  return { error: null, success: true };
}

export async function obtenerReviewsPublicas(tenantId) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reviews")
    .select("id, nombre, estrellas, texto, created_at")
    .eq("tenant_id", tenantId)
    .eq("visible", true)
    .order("created_at", { ascending: false })
    .limit(20);

  return { data: data || [] };
}
