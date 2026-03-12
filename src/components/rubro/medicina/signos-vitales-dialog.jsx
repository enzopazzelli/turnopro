"use client";

import { useActionState, useEffect, useRef } from "react";
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
import { registrarSignosVitales } from "@/app/(dashboard)/actions/medicina";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function SignosVitalesDialog({ abierto, onCerrar, pacienteId }) {
  const [state, formAction, pending] = useActionState(registrarSignosVitales, estadoInicial);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Signos vitales registrados");
      onCerrar();
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Signos Vitales</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={pacienteId} />

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              name="fecha"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso_kg">Peso (kg)</Label>
              <Input id="peso_kg" name="peso_kg" type="number" step="0.1" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altura_cm">Altura (cm)</Label>
              <Input id="altura_cm" name="altura_cm" type="number" step="0.1" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="presion_sistolica">Presion sistolica</Label>
              <Input id="presion_sistolica" name="presion_sistolica" type="number" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presion_diastolica">Presion diastolica</Label>
              <Input id="presion_diastolica" name="presion_diastolica" type="number" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperatura">Temp (°C)</Label>
              <Input id="temperatura" name="temperatura" type="number" step="0.1" min="30" max="45" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frecuencia_cardiaca">FC (lpm)</Label>
              <Input id="frecuencia_cardiaca" name="frecuencia_cardiaca" type="number" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saturacion_o2">SpO2 (%)</Label>
              <Input id="saturacion_o2" name="saturacion_o2" type="number" min="0" max="100" />
            </div>
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
              {pending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
