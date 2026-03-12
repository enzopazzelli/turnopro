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
import { registrarVacunacion } from "@/app/(dashboard)/actions/veterinaria";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function VacunacionDialog({ abierto, onCerrar, mascotaId }) {
  const [state, formAction, pending] = useActionState(registrarVacunacion, estadoInicial);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Vacunacion registrada");
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
          <DialogTitle>Registrar Vacunacion</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="mascota_id" value={mascotaId} />

          <div className="space-y-2">
            <Label htmlFor="vacuna">Vacuna *</Label>
            <Input id="vacuna" name="vacuna" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_aplicacion">Fecha aplicacion *</Label>
              <Input
                id="fecha_aplicacion"
                name="fecha_aplicacion"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_proxima">Proxima dosis</Label>
              <Input id="fecha_proxima" name="fecha_proxima" type="date" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lote">Lote</Label>
              <Input id="lote" name="lote" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="veterinario">Veterinario</Label>
              <Input id="veterinario" name="veterinario" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} />
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
