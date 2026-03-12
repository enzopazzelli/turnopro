"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearPlanTratamiento } from "@/app/(dashboard)/actions/odontologia";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function PlanTratamientoDialog({ abierto, onCerrar, pacienteId }) {
  const [state, formAction, pending] = useActionState(crearPlanTratamiento, estadoInicial);
  const formRef = useRef(null);
  const [etapas, setEtapas] = useState([{ descripcion: "", dientes: "", costo: 0 }]);

  useEffect(() => {
    if (state.success) {
      toast.success("Plan de tratamiento creado");
      onCerrar();
      setEtapas([{ descripcion: "", dientes: "", costo: 0 }]);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  const agregarEtapa = () => {
    setEtapas([...etapas, { descripcion: "", dientes: "", costo: 0 }]);
  };

  const eliminarEtapa = (i) => {
    setEtapas(etapas.filter((_, idx) => idx !== i));
  };

  const actualizarEtapa = (i, campo, valor) => {
    const nuevas = [...etapas];
    nuevas[i] = { ...nuevas[i], [campo]: valor };
    setEtapas(nuevas);
  };

  const costoTotal = etapas.reduce((sum, e) => sum + (Number(e.costo) || 0), 0);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Plan de Tratamiento</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={pacienteId} />
          <input type="hidden" name="costo_total" value={costoTotal} />
          <input
            type="hidden"
            name="etapas"
            value={JSON.stringify(
              etapas.map((e) => ({
                descripcion: e.descripcion,
                dientes: e.dientes ? e.dientes.split(",").map((d) => d.trim()).filter(Boolean) : [],
                costo: Number(e.costo) || 0,
              }))
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo *</Label>
            <Input id="titulo" name="titulo" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea id="descripcion" name="descripcion" rows={2} />
          </div>

          {/* Etapas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Etapas del tratamiento</Label>
              <Button type="button" variant="outline" size="sm" onClick={agregarEtapa}>
                <Plus className="h-4 w-4 mr-1" /> Agregar etapa
              </Button>
            </div>

            {etapas.map((etapa, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Etapa {i + 1}</span>
                  {etapas.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => eliminarEtapa(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Descripcion de la etapa"
                  value={etapa.descripcion}
                  onChange={(e) => actualizarEtapa(i, "descripcion", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Dientes (ej: 11, 12, 21)"
                    value={etapa.dientes}
                    onChange={(e) => actualizarEtapa(i, "dientes", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Costo"
                    value={etapa.costo}
                    onChange={(e) => actualizarEtapa(i, "costo", e.target.value)}
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
            ))}

            <p className="text-sm text-right font-medium">
              Costo total: ${costoTotal.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
