"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
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
import { registrarPago } from "@/app/(dashboard)/actions/facturacion";
import { LABELS_METODO_PAGO } from "@/lib/constants";
import { toast } from "sonner";

const estadoInicial = { error: null, fieldErrors: {}, success: null };

export function PagoDialog({ abierto, onCerrar, cita = null, paciente = null }) {
  const [state, formAction, pending] = useActionState(registrarPago, estadoInicial);
  const ultimoExitoRef = useRef(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoIngresado, setMontoIngresado] = useState("");

  // Calcular montos
  const precioServicio = Number(cita?.servicios?.precio || 0);
  const totalPagado = Number(cita?.total_pagado || 0);
  const restante = precioServicio > 0 ? precioServicio - totalPagado : 0;
  const montoSugerido = restante > 0 ? restante : precioServicio > 0 ? precioServicio : "";

  // Calcular vuelto o saldo a favor
  const montoNum = Number(montoIngresado || montoSugerido || 0);
  const diferencia = restante > 0 ? montoNum - restante : 0;

  useEffect(() => {
    if (abierto) {
      setMetodoPago("efectivo");
      setMontoIngresado("");
    }
  }, [abierto]);

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success("Pago registrado");
      onCerrar();
    }
  }, [state.success, onCerrar]);

  const hoy = format(new Date(), "yyyy-MM-dd");

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4" key={abierto ? "open" : "closed"}>
          {/* Hidden fields */}
          {cita?.id && <input type="hidden" name="cita_id" value={cita.id} />}
          {(paciente?.id || cita?.paciente_id) && (
            <input type="hidden" name="paciente_id" value={paciente?.id || cita?.paciente_id} />
          )}

          {/* Info de contexto */}
          {(paciente || cita) && (
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
              {(paciente?.nombre_completo || cita?.paciente_nombre) && (
                <p>
                  <span className="text-muted-foreground">Paciente:</span>{" "}
                  {paciente?.nombre_completo || cita?.paciente_nombre}
                </p>
              )}
              {cita?.servicios?.nombre && (
                <p>
                  <span className="text-muted-foreground">Servicio:</span>{" "}
                  {cita.servicios.nombre}
                </p>
              )}
              {precioServicio > 0 && (
                <div className="border-t pt-1.5 mt-1.5 space-y-0.5">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-medium">${precioServicio.toFixed(2)}</span>
                  </p>
                  {totalPagado > 0 && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Ya pagado:</span>
                      <span className="text-green-600">-${totalPagado.toFixed(2)}</span>
                    </p>
                  )}
                  <p className="flex justify-between font-medium">
                    <span>Restante:</span>
                    <span className={restante <= 0 ? "text-green-600" : "text-amber-600"}>
                      ${Math.max(restante, 0).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto a cobrar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                min="0"
                defaultValue={montoSugerido}
                onChange={(e) => setMontoIngresado(e.target.value)}
                placeholder="0.00"
                className="pl-7"
                required
              />
            </div>
            {state.fieldErrors?.monto && (
              <p className="text-sm text-destructive">{state.fieldErrors.monto[0]}</p>
            )}
            {/* Indicador de vuelto o saldo a favor */}
            {restante > 0 && montoNum > 0 && diferencia > 0 && metodoPago === "efectivo" && (
              <p className="text-sm text-blue-600 font-medium">
                Vuelto: ${diferencia.toFixed(2)}
              </p>
            )}
            {restante > 0 && montoNum > 0 && diferencia > 0 && metodoPago !== "efectivo" && (
              <p className="text-sm text-blue-600 font-medium">
                Saldo a favor del paciente: ${diferencia.toFixed(2)}
              </p>
            )}
          </div>

          {/* Metodo de pago */}
          <div className="space-y-2">
            <Label>Metodo de pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LABELS_METODO_PAGO).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="metodo_pago" value={metodoPago} />
            {state.fieldErrors?.metodo_pago && (
              <p className="text-sm text-destructive">{state.fieldErrors.metodo_pago[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha_pago">Fecha</Label>
              <Input
                id="fecha_pago"
                name="fecha_pago"
                type="date"
                defaultValue={hoy}
                required
              />
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                name="referencia"
                placeholder="N° comprobante"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Notas adicionales"
              rows={2}
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
              {pending ? "Registrando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
