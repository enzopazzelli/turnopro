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
import { registrarEvolucion } from "@/app/(dashboard)/actions/psicologia";
import { AREAS_EVOLUCION } from "@/lib/constants";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function EvolucionDialog({ abierto, onCerrar, pacienteId }) {
  const [state, formAction, pending] = useActionState(registrarEvolucion, estadoInicial);
  const formRef = useRef(null);
  const [area, setArea] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success("Evolucion registrada");
      onCerrar();
      formRef.current?.reset();
      setArea("");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Evolucion</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={pacienteId} />
          <input type="hidden" name="area" value={area} />

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
            <div className="space-y-2">
              <Label htmlFor="puntuacion">Puntuacion (1-10) *</Label>
              <Input
                id="puntuacion"
                name="puntuacion"
                type="number"
                min="1"
                max="10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo *</Label>
            <Input id="titulo" name="titulo" required />
          </div>

          <div className="space-y-2">
            <Label>Area</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger><SelectValue placeholder="Seleccionar area" /></SelectTrigger>
              <SelectContent>
                {AREAS_EVOLUCION.map((a) => (
                  <SelectItem key={a.valor} value={a.valor}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea id="descripcion" name="descripcion" rows={3} />
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
