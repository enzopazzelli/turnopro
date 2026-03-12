"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearVencimientoLegal } from "@/app/(dashboard)/actions/abogados";
import { PRIORIDADES } from "@/lib/constants";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function VencimientoDialog({ abierto, onCerrar, expedienteId }) {
  const [state, formAction, pending] = useActionState(crearVencimientoLegal, estadoInicial);
  const formRef = useRef(null);
  const [prioridad, setPrioridad] = useState("media");

  useEffect(() => {
    if (state.success) {
      toast.success("Vencimiento creado");
      onCerrar();
      formRef.current?.reset();
      setPrioridad("media");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Vencimiento</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {expedienteId && <input type="hidden" name="expediente_id" value={expedienteId} />}
          <input type="hidden" name="prioridad" value={prioridad} />

          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo *</Label>
            <Input id="titulo" name="titulo" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea id="descripcion" name="descripcion" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha de vencimiento *</Label>
              <Input id="fecha_vencimiento" name="fecha_vencimiento" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={prioridad} onValueChange={setPrioridad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p.valor} value={p.valor}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
