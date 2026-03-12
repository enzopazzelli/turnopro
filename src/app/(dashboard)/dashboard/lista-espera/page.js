import { createClient } from "@/lib/supabase/server";
import { ListaEspera } from "@/components/agenda/lista-espera";

export const metadata = {
  title: "Lista de espera | TurnoPro",
};

export default async function ListaEsperaPage() {
  const supabase = await createClient();
  const professionalId = (await supabase.rpc("get_professional_id_for_user")).data;

  if (!professionalId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Lista de espera</h2>
        <p className="text-muted-foreground">No se pudo identificar al profesional.</p>
      </div>
    );
  }

  const [listaResult, serviciosResult] = await Promise.all([
    supabase
      .from("lista_espera")
      .select("*, servicios(nombre, color)")
      .eq("professional_id", professionalId)
      .in("estado", ["esperando", "notificado"])
      .order("created_at", { ascending: true }),
    supabase
      .from("servicios")
      .select("id, nombre, color")
      .eq("activo", true)
      .order("nombre"),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Lista de espera</h2>
      <ListaEspera
        items={listaResult.data || []}
        servicios={serviciosResult.data || []}
      />
    </div>
  );
}
