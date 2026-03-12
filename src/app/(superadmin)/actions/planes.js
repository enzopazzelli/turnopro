"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarAuditLog } from "@/lib/audit";
import { PLAN_FEATURES_DEFAULT } from "@/lib/features";

async function verificarSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: usuario } = await supabase
    .from("users").select("id, rol").eq("auth_id", user.id).single();
  if (!usuario || usuario.rol !== "superadmin") throw new Error("Acceso denegado");
  return usuario;
}

// ============================================================
// Planes
// ============================================================

export async function obtenerPlanes() {
  await verificarSuperadmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("planes")
    .select("*")
    .order("orden");

  if (error) {
    // Fallback estático si la tabla todavía no existe
    return {
      data: Object.entries(PLAN_FEATURES_DEFAULT).map(([nombre, p], i) => ({
        id: nombre,
        nombre,
        label: p.label,
        descripcion: p.descripcion,
        precio: p.precio,
        features: p.features,
        limites: p.limites,
        orden: i + 1,
        activo: true,
      })),
      error: null,
    };
  }

  return { data: data || [], error: null };
}

export async function actualizarPlan(planId, { features, limites, precio, descripcion }) {
  const adminUser = await verificarSuperadmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("planes")
    .update({ features, limites, precio, descripcion, updated_at: new Date().toISOString() })
    .eq("id", planId);

  if (error) return { error: "Error al actualizar el plan" };

  await registrarAuditLog({
    user_id: adminUser.id,
    accion: "plan_actualizado",
    entidad: "planes",
    datos: { plan_id: planId },
  });

  revalidatePath("/superadmin/planes");
  return { error: null };
}

// ============================================================
// Tenant detail + overrides
// ============================================================

export async function obtenerTenantConFeatures(tenantId) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  const [
    { data: tenant, error },
    { data: usuarios },
    { count: citasTotal },
    { count: pacientesTotal },
  ] = await Promise.all([
    admin.from("tenants")
      .select("id, nombre, slug, rubro, plan, activo, features_override, trial_ends_at, created_at, updated_at")
      .eq("id", tenantId)
      .single(),
    admin.from("users")
      .select("id, nombre_completo, email, rol, activo, created_at")
      .eq("tenant_id", tenantId)
      .neq("rol", "superadmin"),
    admin.from("citas")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    admin.from("pacientes")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);

  if (error || !tenant) return { data: null, error: "Tenant no encontrado" };

  return {
    data: {
      tenant,
      usuarios: usuarios || [],
      stats: { citas_total: citasTotal || 0, pacientes_total: pacientesTotal || 0 },
    },
  };
}

export async function actualizarTenantOverride(tenantId, featuresOverride) {
  const adminUser = await verificarSuperadmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("tenants")
    .update({ features_override: featuresOverride, updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return { error: "Error al guardar los overrides" };

  await registrarAuditLog({
    user_id: adminUser.id,
    accion: "tenant_features_override",
    entidad: "tenants",
    entidad_id: tenantId,
    datos: { features_override: featuresOverride },
  });

  revalidatePath(`/superadmin/tenants/${tenantId}`);
  return { error: null };
}
