import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { createClient } from "@/lib/supabase/server";
import { ExpedientesLista } from "@/components/rubro/abogados/expedientes-lista";

export const metadata = { title: "Expedientes | TurnoPro" };

export default async function Page() {
  const { autorizado, tenantId } = await verificarRubro("abogados");
  if (!autorizado) return <RubroNoDisponible />;

  const supabase = await createClient();
  const { data: expedientes } = await supabase
    .from("expedientes")
    .select("*, pacientes(nombre_completo)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Expedientes</h1>
      <ExpedientesLista expedientesIniciales={expedientes || []} />
    </div>
  );
}
