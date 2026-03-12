"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tenantTiene } from "@/lib/features";

// ============================================
// EQUIPO (PROFESIONALES + SECRETARIAS)
// ============================================

export async function obtenerEquipo() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data: usuarios, error } = await supabase
    .from("users")
    .select("*, professionals(especialidad, numero_matricula)")
    .eq("tenant_id", tenantId)
    .in("rol", ["profesional", "secretaria"])
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: "Error al obtener equipo" };
  return { data: usuarios || [], error: null };
}

export async function obtenerInvitaciones() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("invitaciones")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: "Error al obtener invitaciones" };
  return { data: data || [], error: null };
}

export async function crearInvitacion(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  // Check plan allows multi-professional
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan, features_override")
    .eq("id", tenantId)
    .single();

  if (!tenantTiene(tenant, "multi_profesional")) {
    return { error: "Tu plan no incluye múltiples profesionales. Contactá al administrador para actualizar tu suscripción.", success: false };
  }

  const email = formData.get("email")?.trim();
  const nombre = formData.get("nombre")?.trim();
  const rol = formData.get("rol") || "profesional";

  if (!email) return { error: "Email requerido", success: false };

  // Check if already invited
  const { data: existente } = await supabase
    .from("invitaciones")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .eq("estado", "pendiente")
    .single();

  if (existente) return { error: "Ya existe una invitacion pendiente para este email", success: false };

  // Check if already in team
  const { data: yaEnEquipo } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .single();

  if (yaEnEquipo) return { error: "Este email ya pertenece a tu equipo", success: false };

  const { error } = await supabase
    .from("invitaciones")
    .insert({
      tenant_id: tenantId,
      email,
      nombre: nombre || null,
      rol,
    });

  if (error) return { error: "Error al crear invitacion", success: false };

  revalidatePath("/dashboard/configuracion");
  return { error: null, success: true };
}

export async function cancelarInvitacion(invitacionId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("invitaciones")
    .delete()
    .eq("id", invitacionId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al cancelar invitacion" };

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

// ============================================
// SUCURSALES
// ============================================

export async function obtenerSucursales() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("sucursales")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("es_principal", { ascending: false })
    .order("nombre", { ascending: true });

  if (error) return { data: [], error: "Error al obtener sucursales" };
  return { data: data || [], error: null };
}

export async function crearSucursal(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  // Check plan
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan, features_override")
    .eq("id", tenantId)
    .single();

  if (!tenantTiene(tenant, "sucursales")) {
    return { error: "Tu plan no incluye múltiples sucursales. Contactá al administrador para actualizar tu suscripción.", success: false };
  }

  const nombre = formData.get("nombre")?.trim();
  const direccion = formData.get("direccion")?.trim();
  const telefono = formData.get("telefono")?.trim();
  const email = formData.get("email")?.trim();

  if (!nombre) return { error: "Nombre de sucursal requerido", success: false };

  // Check if first sucursal (mark as principal)
  const { data: existentes } = await supabase
    .from("sucursales")
    .select("id")
    .eq("tenant_id", tenantId);

  const esPrimera = !existentes || existentes.length === 0;

  const { error } = await supabase
    .from("sucursales")
    .insert({
      tenant_id: tenantId,
      nombre,
      direccion: direccion || null,
      telefono: telefono || null,
      email: email || null,
      es_principal: esPrimera,
    });

  if (error) return { error: "Error al crear sucursal", success: false };

  revalidatePath("/dashboard/configuracion");
  return { error: null, success: true };
}

export async function actualizarSucursal(id, datos) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("sucursales")
    .update({
      nombre: datos.nombre,
      direccion: datos.direccion || null,
      telefono: datos.telefono || null,
      email: datos.email || null,
      activa: datos.activa,
    })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar sucursal" };

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

export async function eliminarSucursal(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  // Don't allow deleting principal sucursal
  const { data: suc } = await supabase
    .from("sucursales")
    .select("es_principal")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (suc?.es_principal) return { error: "No se puede eliminar la sucursal principal" };

  const { error } = await supabase
    .from("sucursales")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar sucursal" };

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}
