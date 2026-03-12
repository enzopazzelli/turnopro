"use server";

import { createClient } from "@/lib/supabase/server";

export async function obtenerNotificaciones({ pagina = 1, porPagina = 20, tipo, canal } = {}) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: [], total: 0, error: "No se pudo identificar el tenant" };
  }

  let query = supabase
    .from("notificaciones")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  if (canal) {
    query = query.eq("canal", canal);
  }

  const desde = (pagina - 1) * porPagina;
  query = query.range(desde, desde + porPagina - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error al obtener notificaciones:", error);
    return { data: [], total: 0, error: error.message };
  }

  return { data: data || [], total: count || 0, error: null };
}

export async function marcarNotificacionLeida(id) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notificaciones")
    .update({ leida: true, leida_at: new Date().toISOString(), estado: "leida" })
    .eq("id", id);

  if (error) {
    console.error("Error al marcar notificacion leida:", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function marcarTodasLeidas() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) return { error: "No se pudo identificar el tenant" };

  // Get current user id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: usuario } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!usuario) return { error: "Usuario no encontrado" };

  const { error } = await supabase
    .from("notificaciones")
    .update({ leida: true, leida_at: new Date().toISOString(), estado: "leida" })
    .eq("tenant_id", tenantId)
    .eq("usuario_id", usuario.id)
    .eq("canal", "in_app")
    .eq("leida", false);

  if (error) {
    console.error("Error al marcar todas leidas:", error);
    return { error: error.message };
  }

  return { error: null };
}

export async function contarNoLeidas() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) return 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: usuario } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!usuario) return 0;

  const { count } = await supabase
    .from("notificaciones")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("usuario_id", usuario.id)
    .eq("canal", "in_app")
    .eq("leida", false);

  return count || 0;
}
