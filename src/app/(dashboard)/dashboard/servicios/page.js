import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiciosCliente } from "@/components/agenda/servicios-cliente";

export const metadata = {
  title: "Servicios | TurnoPro",
};

export default async function ServiciosPage() {
  const supabase = await createClient();

  // Solo profesionales pueden gestionar servicios
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: u } = await supabase.from("users").select("rol").eq("id", user.id).single();
    if (u?.rol === "secretaria") redirect("/dashboard/agenda");
  }
  const { data: tenantId, error: rpcError } = await supabase.rpc("get_tenant_id_for_user");

  if (rpcError || !tenantId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Servicios</h2>
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

  const { data: servicios } = await supabase
    .from("servicios")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return <ServiciosCliente serviciosIniciales={servicios || []} />;
}
