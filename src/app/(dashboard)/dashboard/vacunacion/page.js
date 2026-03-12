import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { createClient } from "@/lib/supabase/server";
import { format, isPast, addDays, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Vacunacion | TurnoPro" };

export default async function Page() {
  const { autorizado, tenantId } = await verificarRubro("veterinaria");
  if (!autorizado) return <RubroNoDisponible />;

  const supabase = await createClient();
  const { data: vacunas } = await supabase
    .from("vacunaciones")
    .select("*, mascotas(nombre, especie)")
    .eq("tenant_id", tenantId)
    .not("fecha_proxima", "is", null)
    .order("fecha_proxima", { ascending: true });

  const vencidas = (vacunas || []).filter((v) => v.fecha_proxima && isPast(new Date(v.fecha_proxima)));
  const proximas = (vacunas || []).filter(
    (v) => v.fecha_proxima && !isPast(new Date(v.fecha_proxima)) && isAfter(addDays(new Date(), 30), new Date(v.fecha_proxima))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vacunacion - Proximas y Vencidas</h1>

      {vencidas.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-destructive">Vencidas</h2>
          {vencidas.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3 border border-destructive rounded-lg bg-destructive/5">
              <div className="flex-1">
                <p className="font-medium text-sm">{v.vacuna} - {v.mascotas?.nombre}</p>
                <p className="text-xs text-muted-foreground">{v.mascotas?.especie}</p>
              </div>
              <Badge variant="destructive">
                Vencida {format(new Date(v.fecha_proxima), "dd/MM/yyyy", { locale: es })}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {proximas.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-yellow-600">Proximas (30 dias)</h2>
          {proximas.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="flex-1">
                <p className="font-medium text-sm">{v.vacuna} - {v.mascotas?.nombre}</p>
                <p className="text-xs text-muted-foreground">{v.mascotas?.especie}</p>
              </div>
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                {format(new Date(v.fecha_proxima), "dd/MM/yyyy", { locale: es })}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {vencidas.length === 0 && proximas.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No hay vacunas vencidas ni proximas a vencer
        </p>
      )}
    </div>
  );
}
