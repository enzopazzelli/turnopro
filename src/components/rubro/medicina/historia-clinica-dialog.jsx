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
import { crearEntradaHistoria } from "@/app/(dashboard)/actions/medicina";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function HistoriaClinicaDialog({ abierto, onCerrar, pacienteId }) {
  const [state, formAction, pending] = useActionState(crearEntradaHistoria, estadoInicial);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Entrada registrada");
      onCerrar();
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Entrada - Historia Clinica</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={pacienteId} />

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo_consulta">Motivo de consulta</Label>
            <Textarea id="motivo_consulta" name="motivo_consulta" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnostico</Label>
            <Textarea id="diagnostico" name="diagnostico" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicaciones">Indicaciones</Label>
            <Textarea id="indicaciones" name="indicaciones" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="antecedentes">Antecedentes</Label>
            <Textarea id="antecedentes" name="antecedentes" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alergias">Alergias (separadas por coma)</Label>
              <Input id="alergias" name="alergias" placeholder="Penicilina, Ibuprofeno" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicacion_cronica">Medicacion cronica (separada por coma)</Label>
              <Input id="medicacion_cronica" name="medicacion_cronica" placeholder="Losartan, Metformina" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" name="observaciones" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
