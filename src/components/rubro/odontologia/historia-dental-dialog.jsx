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
import { crearEntradaHistoriaDental } from "@/app/(dashboard)/actions/odontologia";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function HistoriaDentalDialog({ abierto, onCerrar, pacienteId }) {
  const [state, formAction, pending] = useActionState(crearEntradaHistoriaDental, estadoInicial);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Entrada creada");
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
          <DialogTitle>Nueva Entrada - Historia Dental</DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnostico</Label>
            <Textarea id="diagnostico" name="diagnostico" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedimiento">Procedimiento</Label>
            <Textarea id="procedimiento" name="procedimiento" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dientes_afectados">Dientes afectados (separados por coma)</Label>
            <Input id="dientes_afectados" name="dientes_afectados" placeholder="11, 12, 21" />
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
