"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChecklistDialog } from "./checklist-dialog";
import { ChecklistDetalle } from "./checklist-detalle";

export function ChecklistsCliente({ checklists = [], pacienteId }) {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [expandido, setExpandido] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Checklists de Documentacion</h3>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay checklists registrados
        </p>
      ) : (
        <div className="space-y-3">
          {checklists.map((cl) => {
            const items = cl.checklist_items || [];
            const completados = items.filter((i) => i.completado).length;
            const total = items.length;
            const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
            const abierto = expandido === cl.id;

            return (
              <div key={cl.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandido(abierto ? null : cl.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <p className="font-medium">{cl.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {cl.pacientes?.nombre_completo && `${cl.pacientes.nombre_completo} | `}
                        {cl.periodo && `Periodo: ${cl.periodo}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <Progress value={porcentaje} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {completados}/{total}
                    </span>
                  </div>
                </button>

                {abierto && (
                  <div className="border-t">
                    <ChecklistDetalle checklist={cl} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ChecklistDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        pacienteId={pacienteId}
      />
    </div>
  );
}
