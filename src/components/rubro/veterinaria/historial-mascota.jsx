"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ConsultaMascotaDialog } from "./consulta-mascota-dialog";

export function HistorialMascota({ consultas = [], mascotaId }) {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [expandido, setExpandido] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historial de Consultas</h3>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva consulta
        </Button>
      </div>

      {consultas.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No hay consultas registradas
        </p>
      ) : (
        <div className="space-y-2">
          {consultas.map((c) => {
            const abierto = expandido === c.id;
            return (
              <div key={c.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandido(abierto ? null : c.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <p className="font-medium">
                        {format(new Date(c.fecha), "dd/MM/yyyy", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {c.motivo || "Sin motivo especificado"}
                      </p>
                    </div>
                  </div>
                  {c.peso_kg && (
                    <span className="text-sm text-muted-foreground">{c.peso_kg} kg</span>
                  )}
                </button>

                {abierto && (
                  <div className="border-t px-4 py-3 space-y-2 bg-muted/30 text-sm">
                    {c.diagnostico && <div><span className="font-medium">Diagnostico: </span>{c.diagnostico}</div>}
                    {c.tratamiento && <div><span className="font-medium">Tratamiento: </span>{c.tratamiento}</div>}
                    {c.temperatura && <div><span className="font-medium">Temperatura: </span>{c.temperatura}°C</div>}
                    {c.observaciones && <div><span className="font-medium">Observaciones: </span>{c.observaciones}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConsultaMascotaDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        mascotaId={mascotaId}
      />
    </div>
  );
}
