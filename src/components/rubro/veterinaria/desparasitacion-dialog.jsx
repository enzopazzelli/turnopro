"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { registrarDesparasitacion } from "@/app/(dashboard)/actions/veterinaria";

const estadoInicial = { error: null, success: false };

export function DesparasitacionDialog({ abierto, onCerrar, mascotaId }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registrarDesparasitacion, estadoInicial);

  useEffect(() => {
    if (state.success) { router.refresh(); onCerrar(); }
  }, [state.success, router, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar desparasitación</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="mascota_id" value={mascotaId} />

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select name="tipo" required defaultValue="interna">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interna">Interna</SelectItem>
                <SelectItem value="externa">Externa (pulgas/garrapatas)</SelectItem>
                <SelectItem value="ambas">Ambas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="producto">Producto *</Label>
            <Input id="producto" name="producto" placeholder="Ej: Frontline, Milbemax" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosis">Dosis</Label>
              <Input id="dosis" name="dosis" placeholder="Ej: 1 comprimido" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="veterinario">Veterinario</Label>
              <Input id="veterinario" name="veterinario" placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_aplicacion">Fecha aplicación *</Label>
              <Input id="fecha_aplicacion" name="fecha_aplicacion" type="date"
                defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_proxima">Próxima dosis</Label>
              <Input id="fecha_proxima" name="fecha_proxima" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" placeholder="Observaciones..." rows={2} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

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
