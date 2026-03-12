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
import { crearNotaSesion, actualizarNotaSesion } from "@/app/(dashboard)/actions/psicologia";
import { ESTADOS_EMOCIONAL } from "@/lib/constants";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function NotaSesionDialog({ abierto, onCerrar, pacienteId, nota = null }) {
  const esEdicion = !!nota;
  const actionFn = esEdicion
    ? actualizarNotaSesion.bind(null, nota.id)
    : crearNotaSesion;

  const [state, formAction, pending] = useActionState(actionFn, estadoInicial);
  const formRef = useRef(null);
  const [estadoEmocional, setEstadoEmocional] = useState(nota?.estado_emocional || "");
  const [privado, setPrivado] = useState(nota?.privado ?? true);

  useEffect(() => {
    if (state.success) {
      toast.success(esEdicion ? "Nota actualizada" : "Nota creada");
      onCerrar();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar, esEdicion]);

  useEffect(() => {
    if (nota) {
      setEstadoEmocional(nota.estado_emocional || "");
      setPrivado(nota.privado ?? true);
    } else {
      setEstadoEmocional("");
      setPrivado(true);
    }
  }, [nota]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar" : "Nueva"} Nota de Sesion</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={pacienteId} />
          <input type="hidden" name="estado_emocional" value={estadoEmocional} />
          <input type="hidden" name="privado" value={String(privado)} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={nota?.fecha || new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estado emocional</Label>
              <Select value={estadoEmocional} onValueChange={setEstadoEmocional}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_EMOCIONAL.map((e) => (
                    <SelectItem key={e.valor} value={e.valor}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contenido">Contenido de la sesion *</Label>
            <Textarea
              id="contenido"
              name="contenido"
              rows={10}
              defaultValue={nota?.contenido}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temas">Temas tratados (separados por coma)</Label>
            <Input
              id="temas"
              name="temas"
              defaultValue={nota?.temas?.join(", ")}
              placeholder="Ansiedad, Trabajo, Relaciones"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivos">Objetivos</Label>
            <Textarea id="objetivos" name="objetivos" rows={2} defaultValue={nota?.objetivos} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tareas">Tareas para la proxima sesion</Label>
            <Textarea id="tareas" name="tareas" rows={2} defaultValue={nota?.tareas} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={privado} onCheckedChange={setPrivado} />
            <Label>Nota privada</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
