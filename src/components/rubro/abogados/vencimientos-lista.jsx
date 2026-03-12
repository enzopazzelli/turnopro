"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRIORIDADES } from "@/lib/constants";
import { completarVencimiento } from "@/app/(dashboard)/actions/abogados";
import { VencimientoDialog } from "./vencimiento-dialog";
import { toast } from "sonner";

export function VencimientosLista({ vencimientos = [], expedienteId }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const handleToggle = async (id) => {
    const resultado = await completarVencimiento(id);
    if (resultado.error) toast.error(resultado.error);
  };

  const getColorPrioridad = (prioridad) => {
    return PRIORIDADES.find((p) => p.valor === prioridad)?.color || "#6b7280";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vencimientos</h3>
        <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo vencimiento
        </Button>
      </div>

      {vencimientos.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No hay vencimientos registrados
        </p>
      ) : (
        <div className="space-y-2">
          {vencimientos.map((v) => {
            const vencido = !v.completado && isPast(new Date(v.fecha_vencimiento)) && !isToday(new Date(v.fecha_vencimiento));
            return (
              <div
                key={v.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  vencido ? "border-destructive bg-destructive/5" : ""
                } ${v.completado ? "opacity-60" : ""}`}
              >
                <button
                  onClick={() => handleToggle(v.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    v.completado ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground"
                  }`}
                >
                  {v.completado && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${v.completado ? "line-through" : ""}`}>
                    {v.titulo}
                  </p>
                  {v.descripcion && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{v.descripcion}</p>
                  )}
                  {v.expedientes?.caratula && (
                    <p className="text-xs text-muted-foreground">Exp: {v.expedientes.caratula}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  style={{ borderColor: getColorPrioridad(v.prioridad), color: getColorPrioridad(v.prioridad) }}
                >
                  {v.prioridad}
                </Badge>
                <span className={`text-sm whitespace-nowrap ${vencido ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {format(new Date(v.fecha_vencimiento), "dd/MM/yyyy", { locale: es })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <VencimientoDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => { setDialogAbierto(false); router.refresh(); }}
        expedienteId={expedienteId}
      />
    </div>
  );
}
