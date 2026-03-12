import { tienePermiso } from "./permisos";

// Verifica el rol del usuario actual en el servidor
// Retorna { rol, tenantId, error }
export async function verificarPermisoServer(supabase, permiso) {
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", rol: null, tenantId: null };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado", rol: null, tenantId: null };

  const { data: usuario } = await supabase
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();

  const rol = usuario?.rol || "profesional";

  if (!tienePermiso(rol, permiso)) {
    return { error: "No tienes permisos para esta accion", rol, tenantId };
  }

  return { error: null, rol, tenantId };
}
