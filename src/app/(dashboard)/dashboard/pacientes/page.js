import { createClient } from "@/lib/supabase/server";
import { PacientesCliente } from "@/components/pacientes/pacientes-cliente";

export const metadata = {
  title: "Pacientes | TurnoPro",
};

export default async function PacientesPage() {
  const supabase = await createClient();
  const { data: tenantId, error: rpcError } = await supabase.rpc("get_tenant_id_for_user");

  if (rpcError || !tenantId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Pacientes</h2>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive text-sm">
            No se pudo cargar la informacion de tu cuenta. Asegurate de haber ejecutado
            las migraciones SQL en Supabase y que tu cuenta este configurada correctamente.
          </p>
          {rpcError && (
            <p className="text-destructive/70 text-xs mt-2">
              Error: {rpcError.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre_completo", { ascending: true });

  return <PacientesCliente pacientesIniciales={pacientes || []} />;
}
