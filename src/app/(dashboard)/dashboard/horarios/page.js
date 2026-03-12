import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HorariosCliente } from "@/components/agenda/horarios-cliente";

export const metadata = {
  title: "Horarios | TurnoPro",
};

export default async function HorariosPage() {
  const supabase = await createClient();

  // Solo profesionales pueden gestionar horarios
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: u } = await supabase.from("users").select("rol").eq("id", user.id).single();
    if (u?.rol === "secretaria") redirect("/dashboard/agenda");
  }

  const { data: professionalId, error: rpcError1 } = await supabase.rpc("get_professional_id_for_user");
  const { data: tenantId, error: rpcError2 } = await supabase.rpc("get_tenant_id_for_user");

  if (rpcError1 || rpcError2 || !professionalId || !tenantId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Horarios</h2>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive text-sm">
            No se pudo cargar la informacion del profesional. Asegurate de haber ejecutado
            la migracion SQL (002_agenda.sql) en Supabase y que tu cuenta este configurada correctamente.
          </p>
          {(rpcError1 || rpcError2) && (
            <p className="text-destructive/70 text-xs mt-2">
              Error: {rpcError1?.message || rpcError2?.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  let { data: disponibilidad, error: queryError } = await supabase
    .from("disponibilidad")
    .select("*")
    .eq("professional_id", professionalId)
    .order("dia_semana");

  if (queryError) {
    console.error("Error al cargar disponibilidad:", queryError);
  }

  // Auto-inicializar si no hay registros
  if ((!disponibilidad || disponibilidad.length === 0)) {
    const { error: initError } = await supabase.rpc("inicializar_disponibilidad_profesional", {
      p_professional_id: professionalId,
      p_tenant_id: tenantId,
    });

    if (initError) {
      console.error("Error al inicializar disponibilidad:", initError);
    }

    const result = await supabase
      .from("disponibilidad")
      .select("*")
      .eq("professional_id", professionalId)
      .order("dia_semana");

    disponibilidad = result.data || [];
  }

  return <HorariosCliente disponibilidadInicial={disponibilidad || []} />;
}
