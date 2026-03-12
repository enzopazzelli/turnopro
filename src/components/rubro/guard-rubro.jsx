import { createClient } from "@/lib/supabase/server";
import { tenantTiene } from "@/lib/features";

export async function verificarRubro(rubroEsperado) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { autorizado: false, tenantId: null, rubro: null };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("rubro")
    .eq("id", tenantId)
    .single();

  const autorizado = Array.isArray(rubroEsperado)
    ? rubroEsperado.includes(tenant?.rubro)
    : tenant?.rubro === rubroEsperado;

  return { autorizado, tenantId, rubro: tenant?.rubro };
}

export async function verificarFeature(feature) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return false;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan, features_override")
    .eq("id", tenantId)
    .single();

  return tenantTiene(tenant, feature);
}

export function RubroNoDisponible() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      Este modulo no esta disponible para tu rubro.
    </div>
  );
}

export function FeatureNoDisponible({ feature }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-foreground">Funcion no disponible en tu plan</p>
        <p className="text-sm text-muted-foreground mt-1">
          Actualiza tu plan para acceder a esta seccion.
        </p>
      </div>
    </div>
  );
}
