"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { crearCuestionario } from "@/app/(dashboard)/actions/psicologia";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function CuestionarioCrearDialog({ abierto, onCerrar }) {
  const [state, formAction, pending] = useActionState(crearCuestionario, estadoInicial);
  const formRef = useRef(null);
  const [preguntas, setPreguntas] = useState([{ texto: "", tipo: "escala", min: 0, max: 3 }]);

  useEffect(() => {
    if (state.success) {
      toast.success("Cuestionario creado");
      onCerrar();
      setPreguntas([{ texto: "", tipo: "escala", min: 0, max: 3 }]);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  const agregarPregunta = () => {
    setPreguntas([...preguntas, { texto: "", tipo: "escala", min: 0, max: 3 }]);
  };

  const eliminarPregunta = (i) => {
    setPreguntas(preguntas.filter((_, idx) => idx !== i));
  };

  const actualizarPregunta = (i, campo, valor) => {
    const nuevas = [...preguntas];
    nuevas[i] = { ...nuevas[i], [campo]: valor };
    setPreguntas(nuevas);
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Cuestionario Personalizado</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="preguntas" value={JSON.stringify(preguntas)} />

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea id="descripcion" name="descripcion" rows={2} />
          </div>

          {/* Preguntas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Preguntas</Label>
              <Button type="button" variant="outline" size="sm" onClick={agregarPregunta}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>

            {preguntas.map((p, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pregunta {i + 1}</span>
                  {preguntas.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => eliminarPregunta(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Texto de la pregunta"
                  value={p.texto}
                  onChange={(e) => actualizarPregunta(i, "texto", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min (0)"
                    value={p.min}
                    onChange={(e) => actualizarPregunta(i, "min", Number(e.target.value))}
                    min={0}
                  />
                  <Input
                    type="number"
                    placeholder="Max (3)"
                    value={p.max}
                    onChange={(e) => actualizarPregunta(i, "max", Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
            ))}
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
