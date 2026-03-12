"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { anularPago } from "@/app/(dashboard)/actions/facturacion";
import { toast } from "sonner";

const estadoInicial = { error: null, fieldErrors: {}, success: null };

export function AnularPagoDialog({ abierto, onCerrar, pago }) {
  const actionFn = anularPago.bind(null, pago?.id);
  const [state, formAction, pending] = useActionState(actionFn, estadoInicial);
  const ultimoExitoRef = useRef(null);

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success("Pago anulado");
      onCerrar();
    }
  }, [state.success, onCerrar]);

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(valor);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anular pago</DialogTitle>
          <DialogDescription>
            Esta accion no se puede deshacer. El pago de{" "}
            {pago ? formatearPrecio(pago.monto) : ""} sera marcado como anulado.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4" key={abierto ? "open" : "closed"}>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la anulacion</Label>
            <Textarea
              id="motivo"
              name="motivo"
              placeholder="Ingresa el motivo de la anulacion"
              rows={3}
              required
            />
            {state.fieldErrors?.motivo && (
              <p className="text-sm text-destructive">{state.fieldErrors.motivo[0]}</p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Anulando..." : "Anular pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
