"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DesparasitacionDialog } from "./desparasitacion-dialog";
import { eliminarDesparasitacion } from "@/app/(dashboard)/actions/veterinaria";

const TIPO_LABEL = { interna: "Interna", externa: "Externa", ambas: "Ambas" };
const TIPO_COLOR = {
  interna: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  externa: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ambas: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

function estadoProximaDosis(fechaProxima) {
  if (!fechaProxima) return null;
  const dias = differenceInDays(new Date(fechaProxima + "T12:00:00"), new Date());
  if (dias < 0) return { label: "Vencida", variant: "destructive", icono: AlertTriangle };
  if (dias <= 7) return { label: `En ${dias}d`, variant: "warning", icono: Clock };
  return null;
}

export function DesparasitacionesLista({ desparasitaciones = [], mascotaId }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este registro?")) return;
    await eliminarDesparasitacion(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Desparasitaciones</h3>
        <Button size="sm" onClick={() => setDialogAbierto(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </div>

      {desparasitaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hay desparasitaciones registradas.
        </p>
      ) : (
        <div className="space-y-2">
          {desparasitaciones.map((d) => {
            const alerta = estadoProximaDosis(d.fecha_proxima);
            const Icono = alerta?.icono;
            return (
              <div key={d.id} className="flex items-start gap-3 border rounded-lg p-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{d.producto}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[d.tipo]}`}>
                      {TIPO_LABEL[d.tipo]}
                    </span>
                    {alerta && (
                      <Badge variant={alerta.variant === "warning" ? "outline" : "destructive"}
                        className={alerta.variant === "warning" ? "border-yellow-500 text-yellow-600 gap-1" : "gap-1"}>
                        <Icono className="h-3 w-3" />
                        {alerta.label}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Aplicado: {format(new Date(d.fecha_aplicacion + "T12:00:00"), "dd/MM/yyyy", { locale: es })}
                      {d.dosis && ` — ${d.dosis}`}
                    </p>
                    {d.fecha_proxima && (
                      <p>Próxima: {format(new Date(d.fecha_proxima + "T12:00:00"), "dd/MM/yyyy", { locale: es })}</p>
                    )}
                    {d.veterinario && <p>Vet: {d.veterinario}</p>}
                    {d.notas && <p>{d.notas}</p>}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleEliminar(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <DesparasitacionDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        mascotaId={mascotaId}
      />
    </div>
  );
}
