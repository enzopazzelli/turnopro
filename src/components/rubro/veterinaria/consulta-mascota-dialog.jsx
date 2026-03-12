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
import { crearConsultaMascota } from "@/app/(dashboard)/actions/veterinaria";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function ConsultaMascotaDialog({ abierto, onCerrar, mascotaId }) {
  const [state, formAction, pending] = useActionState(crearConsultaMascota, estadoInicial);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Consulta registrada");
      onCerrar();
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Consulta</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="mascota_id" value={mascotaId} />

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
            <Label htmlFor="motivo">Motivo</Label>
            <Input id="motivo" name="motivo" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnostico</Label>
            <Textarea id="diagnostico" name="diagnostico" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tratamiento">Tratamiento</Label>
            <Textarea id="tratamiento" name="tratamiento" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso_kg">Peso (kg)</Label>
              <Input id="peso_kg" name="peso_kg" type="number" step="0.1" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperatura">Temperatura (°C)</Label>
              <Input id="temperatura" name="temperatura" type="number" step="0.1" min="30" max="45" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" name="observaciones" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
