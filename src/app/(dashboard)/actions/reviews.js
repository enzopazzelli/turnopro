"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function obtenerReviews() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: "Error al obtener reseñas" };
  return { data: data || [] };
}

export async function moderarReview(id, visible) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("reviews")
    .update({ visible })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar la reseña" };
  revalidatePath("/dashboard/reviews");
  return { error: null };
}

export async function eliminarReview(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar la reseña" };
  revalidatePath("/dashboard/reviews");
  return { error: null };
}
