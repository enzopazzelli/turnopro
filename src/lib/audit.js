"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Registra un evento en la tabla audit_logs.
 * Usa admin client para garantizar la inserción (bypass RLS).
 */
export async function registrarAuditLog({
  tenant_id = null,
  user_id = null,
  accion,
  entidad = null,
  entidad_id = null,
  datos = {},
}) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("audit_logs").insert({
      tenant_id,
      user_id,
      accion,
      entidad,
      entidad_id,
      datos,
    });
  } catch (e) {
    // No bloquear el flujo principal si el log falla
    console.error("Error registrando audit log:", e);
  }
}
