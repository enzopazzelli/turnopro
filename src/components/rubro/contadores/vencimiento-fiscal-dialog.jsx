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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearVencimientoFiscal } from "@/app/(dashboard)/actions/contadores";
import { OBLIGACIONES_FISCALES, PRIORIDADES, RECURRENCIAS } from "@/lib/constants";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function VencimientoFiscalDialog({ abierto, onCerrar }) {
  const [state, formAction, pending] = useActionState(crearVencimientoFiscal, estadoInicial);
  const formRef = useRef(null);
  const [prioridad, setPrioridad] = useState("media");
  const [obligacion, setObligacion] = useState("");
  const [recurrente, setRecurrente] = useState(false);
  const [recurrencia, setRecurrencia] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success("Vencimiento creado");
      onCerrar();
      formRef.current?.reset();
      setPrioridad("media");
      setRecurrente(false);
      setRecurrencia("");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Vencimiento Fiscal</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="prioridad" value={prioridad} />
          <input type="hidden" name="obligacion" value={obligacion} />
          <input type="hidden" name="recurrente" value={String(recurrente)} />
          <input type="hidden" name="recurrencia" value={recurrencia} />

          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo *</Label>
            <Input id="titulo" name="titulo" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Obligacion</Label>
              <Select value={obligacion} onValueChange={setObligacion}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {OBLIGACIONES_FISCALES.map((o) => (
                    <SelectItem key={o.valor} value={o.valor}>{o.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha *</Label>
              <Input id="fecha_vencimiento" name="fecha_vencimiento" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea id="descripcion" name="descripcion" rows={2} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={recurrente} onCheckedChange={setRecurrente} />
              <Label>Recurrente</Label>
            </div>
            {recurrente && (
              <Select value={recurrencia} onValueChange={setRecurrencia}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Frecuencia" /></SelectTrigger>
                <SelectContent>
                  {RECURRENCIAS.map((r) => (
                    <SelectItem key={r.valor} value={r.valor}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
