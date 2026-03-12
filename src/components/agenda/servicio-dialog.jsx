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
import {
  crearServicio,
  actualizarServicio,
} from "@/app/(dashboard)/actions/servicios";
import { toast } from "sonner";

const estadoInicial = { error: null, fieldErrors: {}, success: null };

export function ServicioDialog({ abierto, onCerrar, servicio = null }) {
  const esEdicion = !!servicio;

  const actionFn = esEdicion
    ? actualizarServicio.bind(null, servicio.id)
    : crearServicio;

  const [state, formAction, pending] = useActionState(actionFn, estadoInicial);
  const formRef = useRef(null);
  const ultimoExitoRef = useRef(null);

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success(
        esEdicion ? "Servicio actualizado" : "Servicio creado"
      );
      onCerrar();
    }
  }, [state.success, esEdicion, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar servicio" : "Nuevo servicio"}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={servicio?.nombre || ""}
              placeholder="Ej: Consulta general"
              required
            />
            {state.fieldErrors?.nombre && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.nombre[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracion_minutos">Duracion (min)</Label>
              <Input
                id="duracion_minutos"
                name="duracion_minutos"
                type="number"
                min="5"
                max="480"
                defaultValue={servicio?.duracion_minutos || 30}
              />
              {state.fieldErrors?.duracion_minutos && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.duracion_minutos[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio</Label>
              <Input
                id="precio"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                defaultValue={servicio?.precio || 0}
              />
              {state.fieldErrors?.precio && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.precio[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                name="color"
                type="color"
                defaultValue={servicio?.color || "#6366f1"}
                className="h-9 w-16 cursor-pointer p-1"
              />
              <span className="text-sm text-muted-foreground">
                Color para el calendario
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={servicio?.descripcion || ""}
              placeholder="Descripcion opcional del servicio"
              rows={3}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando..."
                : esEdicion
                ? "Actualizar"
                : "Crear servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
