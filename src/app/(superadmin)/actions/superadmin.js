"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarAuditLog } from "@/lib/audit";

// ============================================================
// Guard: verifica que el caller sea superadmin
// ============================================================
async function verificarSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: rows } = await supabase.rpc("obtener_perfil_usuario", {
    p_auth_id: user.id,
  });
  const usuario = rows?.[0] ?? null;

  if (!usuario || usuario.rol !== "superadmin") {
    throw new Error("Acceso denegado");
  }
  return usuario;
}

// ============================================================
// 11.5 — Métricas globales
// ============================================================
export async function obtenerMetricasGlobales() {
  await verificarSuperadmin();
  const admin = createAdminClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const inicioMesISO = inicioMes.toISOString();

  const [
    { count: totalTenants },
    { data: tenantsPorPlan },
    { data: tenantsPorRubro },
    { count: totalUsuarios },
    { count: citasTotal },
    { count: citasMes },
    { data: pagosMes },
    { data: crecimiento },
  ] = await Promise.all([
    admin.from("tenants").select("*", { count: "exact", head: true }),
    admin.from("tenants").select("plan"),
    admin.from("tenants").select("rubro"),
    admin.from("users").select("*", { count: "exact", head: true }).neq("rol", "superadmin"),
    admin.from("citas").select("*", { count: "exact", head: true }),
    admin
      .from("citas")
      .select("*", { count: "exact", head: true })
      .gte("created_at", inicioMesISO),
    admin.from("pagos").select("monto").gte("created_at", inicioMesISO).eq("anulado", false),
    // Crecimiento: últimos 6 meses
    admin
      .from("tenants")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: true }),
  ]);

  // Agrupar por plan
  const planCounts = { trial: 0, basico: 0, profesional: 0, premium: 0 };
  (tenantsPorPlan || []).forEach((t) => { planCounts[t.plan] = (planCounts[t.plan] || 0) + 1; });

  // Agrupar por rubro
  const rubroCounts = {};
  (tenantsPorRubro || []).forEach((t) => { rubroCounts[t.rubro] = (rubroCounts[t.rubro] || 0) + 1; });
  const por_rubro = Object.entries(rubroCounts).map(([rubro, count]) => ({ rubro, count }))
    .sort((a, b) => b.count - a.count);

  // Ingresos del mes
  const ingresosMes = (pagosMes || []).reduce((acc, p) => acc + parseFloat(p.monto), 0);

  // Crecimiento mensual
  const mesesMap = {};
  (crecimiento || []).forEach((t) => {
    const mes = t.created_at.slice(0, 7); // YYYY-MM
    mesesMap[mes] = (mesesMap[mes] || 0) + 1;
  });
  const crecimientoArr = Object.entries(mesesMap)
    .map(([mes, count]) => ({ mes, count }))
    .slice(-6);

  return {
    data: {
      tenants: {
        total: totalTenants || 0,
        ...planCounts,
      },
      usuarios: totalUsuarios || 0,
      citas: { total: citasTotal || 0, este_mes: citasMes || 0 },
      ingresos_mes: ingresosMes,
      por_rubro,
      crecimiento: crecimientoArr,
    },
  };
}

// ============================================================
// 11.1 — Gestión de tenants
// ============================================================
export async function obtenerTenants({ busqueda = "", rubro = "", plan = "", activo = "" } = {}) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  let query = admin
    .from("tenants")
    .select("id, nombre, slug, rubro, plan, activo, created_at, trial_ends_at, configuracion")
    .order("created_at", { ascending: false });

  if (busqueda) query = query.or(`nombre.ilike.%${busqueda}%,slug.ilike.%${busqueda}%`);
  if (rubro) query = query.eq("rubro", rubro);
  if (plan) query = query.eq("plan", plan);
  if (activo !== "") query = query.eq("activo", activo === "true");

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener tenants" };

  // Enriquecer con conteos
  const tenantIds = (data || []).map((t) => t.id);
  if (tenantIds.length === 0) return { data: [], error: null };

  const [{ data: userCounts }, { data: citaCounts }] = await Promise.all([
    admin
      .from("users")
      .select("tenant_id")
      .in("tenant_id", tenantIds)
      .neq("rol", "superadmin"),
    admin.from("citas").select("tenant_id").in("tenant_id", tenantIds),
  ]);

  const usersMap = {};
  (userCounts || []).forEach((u) => { usersMap[u.tenant_id] = (usersMap[u.tenant_id] || 0) + 1; });
  const citasMap = {};
  (citaCounts || []).forEach((c) => { citasMap[c.tenant_id] = (citasMap[c.tenant_id] || 0) + 1; });

  const enriched = (data || []).map((t) => ({
    ...t,
    usuarios_count: usersMap[t.id] || 0,
    citas_count: citasMap[t.id] || 0,
  }));

  return { data: enriched, error: null };
}

export async function obtenerTenantDetalle(tenantId) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    { data: tenant },
    { data: usuarios },
    { count: citasTotal },
    { count: pacientesTotal },
    { data: pagosMes },
    { data: ultimasCitas },
  ] = await Promise.all([
    admin.from("tenants").select("*").eq("id", tenantId).single(),
    admin.from("users").select("id, nombre_completo, email, rol, activo, created_at").eq("tenant_id", tenantId),
    admin.from("citas").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    admin.from("pacientes").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    admin.from("pagos").select("monto").eq("tenant_id", tenantId).eq("anulado", false).gte("created_at", inicioMes.toISOString()),
    admin.from("citas").select("id, fecha, hora_inicio, estado, servicio_id").eq("tenant_id", tenantId).order("fecha", { ascending: false }).limit(5),
  ]);

  if (!tenant) return { data: null, error: "Tenant no encontrado" };

  const ingresosMes = (pagosMes || []).reduce((acc, p) => acc + parseFloat(p.monto), 0);

  return {
    data: {
      tenant,
      usuarios: usuarios || [],
      stats: {
        citas_total: citasTotal || 0,
        pacientes_total: pacientesTotal || 0,
        ingresos_mes: ingresosMes,
      },
      ultimas_citas: ultimasCitas || [],
    },
  };
}

export async function activarDesactivarTenant(tenantId, activo) {
  const admin_user = await verificarSuperadmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("tenants")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return { error: "Error al actualizar el tenant" };

  await registrarAuditLog({
    user_id: admin_user.id,
    accion: activo ? "tenant_activado" : "tenant_desactivado",
    entidad: "tenants",
    entidad_id: tenantId,
    datos: { activo },
  });

  revalidatePath("/superadmin/tenants");
  return { error: null };
}

export async function cambiarPlanTenant(tenantId, plan) {
  const admin_user = await verificarSuperadmin();
  const admin = createAdminClient();

  const updates = { plan, updated_at: new Date().toISOString() };
  if (plan === "trial") {
    updates.trial_ends_at = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  } else {
    updates.trial_ends_at = null;
  }

  const { error } = await admin.from("tenants").update(updates).eq("id", tenantId);
  if (error) return { error: "Error al cambiar el plan" };

  await registrarAuditLog({
    user_id: admin_user.id,
    accion: "plan_cambiado",
    entidad: "tenants",
    entidad_id: tenantId,
    datos: { plan },
  });

  revalidatePath("/superadmin/tenants");
  revalidatePath(`/superadmin/tenants/${tenantId}`);
  return { error: null };
}

export async function extenderTrial(tenantId, dias) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  const nuevaFecha = new Date(Date.now() + dias * 24 * 3600 * 1000).toISOString();
  const { error } = await admin
    .from("tenants")
    .update({ trial_ends_at: nuevaFecha, plan: "trial", updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return { error: "Error al extender el trial" };
  revalidatePath(`/superadmin/tenants/${tenantId}`);
  return { error: null };
}

export async function eliminarTenant(tenantId) {
  const adminUser = await verificarSuperadmin();
  const admin = createAdminClient();

  // No permitir eliminar el tenant _plataforma
  const { data: tenant } = await admin.from("tenants").select("slug, nombre").eq("id", tenantId).single();
  if (!tenant) return { error: "Tenant no encontrado" };
  if (tenant.slug === "_plataforma") return { error: "No se puede eliminar el tenant de la plataforma" };

  // Obtener auth_ids de todos los usuarios del tenant
  const { data: usuarios } = await admin.from("users").select("auth_id").eq("tenant_id", tenantId);

  // Eliminar el tenant (cascade elimina users, citas, pacientes, etc.)
  const { error } = await admin.from("tenants").delete().eq("id", tenantId);
  if (error) return { error: "Error al eliminar el tenant" };

  // Eliminar usuarios de auth.users (no hay cascade hacia auth)
  for (const u of (usuarios || [])) {
    if (u.auth_id) {
      await admin.auth.admin.deleteUser(u.auth_id);
    }
  }

  await registrarAuditLog({
    user_id: adminUser.id,
    accion: "tenant_eliminado",
    entidad: "tenants",
    entidad_id: tenantId,
    datos: { nombre: tenant.nombre, slug: tenant.slug },
  });

  revalidatePath("/superadmin/tenants");
  return { error: null };
}

export async function eliminarTenants(tenantIds) {
  const adminUser = await verificarSuperadmin();
  const errors = [];
  for (const id of tenantIds) {
    const result = await eliminarTenant(id);
    if (result.error) errors.push(`${id}: ${result.error}`);
  }
  return errors.length > 0 ? { error: errors.join(", ") } : { error: null };
}

export async function impersonarTenant(tenantId) {
  await verificarSuperadmin();
  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Buscar el usuario profesional principal del tenant
  const { data: usuario } = await admin
    .from("users")
    .select("email, nombre_completo")
    .eq("tenant_id", tenantId)
    .eq("rol", "profesional")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!usuario) return { data: null, error: "No se encontró un usuario profesional en este tenant" };

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: usuario.email,
    options: { redirectTo: `${siteUrl}/dashboard` },
  });

  if (error) return { data: null, error: "Error al generar el link" };

  // Construimos la URL de callback directamente con el hashed_token, evitando
  // depender del redirect de Supabase (que usa implicit flow y pierde query params)
  const hashedToken = data.properties?.hashed_token;
  if (!hashedToken) return { data: null, error: "No se pudo obtener el token" };
  const link = `${siteUrl}/api/auth/callback?token_hash=${hashedToken}&type=magiclink&admin_access=true`;

  return { data: { link, email: usuario.email, nombre: usuario.nombre_completo }, error: null };
}

// ============================================================
// 11.2 — Gestión de usuarios
// ============================================================
export async function obtenerUsuarios({ busqueda = "", rol = "" } = {}) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  let query = admin
    .from("users")
    .select("id, auth_id, nombre_completo, email, rol, activo, created_at, tenant_id, tenants(nombre, slug, rubro)")
    .neq("rol", "superadmin")
    .order("created_at", { ascending: false })
    .limit(200);

  if (busqueda)
    query = query.or(`nombre_completo.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
  if (rol) query = query.eq("rol", rol);

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener usuarios" };
  return { data: data || [] };
}

export async function cambiarContrasenaUsuario(authId, nuevaContrasena) {
  const admin_user = await verificarSuperadmin();
  const admin = createAdminClient();

  if (!nuevaContrasena || nuevaContrasena.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }

  const { error } = await admin.auth.admin.updateUserById(authId, {
    password: nuevaContrasena,
  });

  if (error) return { error: "Error al cambiar la contraseña" };

  await registrarAuditLog({
    user_id: admin_user.id,
    accion: "contrasena_cambiada_por_admin",
    datos: { auth_id: authId },
  });

  return { error: null };
}

export async function generarLinkAcceso(email) {
  const adminUser = await verificarSuperadmin();
  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/dashboard` },
  });

  if (error) return { data: null, error: "Error al generar el link" };

  const hashedToken = data.properties?.hashed_token;
  if (!hashedToken) return { data: null, error: "No se pudo obtener el token" };
  const link = `${siteUrl}/api/auth/callback?token_hash=${hashedToken}&type=magiclink&admin_access=true`;

  await registrarAuditLog({
    user_id: adminUser.id,
    accion: "impersonacion_link_generado",
    datos: { email },
  });

  return { data: { link }, error: null };
}

export async function activarDesactivarUsuario(userId, activo) {
  const admin_user = await verificarSuperadmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("users")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: "Error al actualizar el usuario" };

  await registrarAuditLog({
    user_id: admin_user.id,
    accion: activo ? "usuario_activado" : "usuario_desactivado",
    entidad: "users",
    entidad_id: userId,
  });

  revalidatePath("/superadmin/usuarios");
  return { error: null };
}

export async function eliminarUsuario(userId, authId) {
  const adminUser = await verificarSuperadmin();
  const admin = createAdminClient();

  // Obtener datos antes de borrar
  const { data: usuario } = await admin.from("users").select("email, rol, nombre_completo").eq("id", userId).single();
  if (!usuario) return { error: "Usuario no encontrado" };
  if (usuario.rol === "superadmin") return { error: "No se puede eliminar al superadmin" };

  // Eliminar de nuestra tabla (cascade a datos propios del user si los hubiera)
  const { error } = await admin.from("users").delete().eq("id", userId);
  if (error) return { error: "Error al eliminar el usuario" };

  // Eliminar de auth.users
  if (authId) await admin.auth.admin.deleteUser(authId);

  await registrarAuditLog({
    user_id: adminUser.id,
    accion: "usuario_eliminado",
    entidad: "users",
    entidad_id: userId,
    datos: { email: usuario.email, nombre: usuario.nombre_completo },
  });

  revalidatePath("/superadmin/usuarios");
  return { error: null };
}

// ============================================================
// 11.5 — Solicitudes de demo
// ============================================================
export async function obtenerSolicitudesDemo({ estado = "" } = {}) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  let query = admin
    .from("solicitudes_demo")
    .select("*")
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener solicitudes" };
  return { data: data || [] };
}

export async function actualizarEstadoDemo(id, nuevoEstado) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("solicitudes_demo")
    .update({ estado: nuevoEstado })
    .eq("id", id);

  if (error) return { error: "Error al actualizar estado" };

  revalidatePath("/superadmin/demos");
  return { error: null };
}

// ============================================================
// 11.4 — Audit logs
// ============================================================
export async function obtenerAuditLogs({ tenant_id = "", accion = "", limite = 100 } = {}) {
  await verificarSuperadmin();
  const admin = createAdminClient();

  let query = admin
    .from("audit_logs")
    .select("*, users(nombre_completo, email), tenants(nombre, slug)")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (tenant_id) query = query.eq("tenant_id", tenant_id);
  if (accion) query = query.ilike("accion", `%${accion}%`);

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener logs" };
  return { data: data || [] };
}
