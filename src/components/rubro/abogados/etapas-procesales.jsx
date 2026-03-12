"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Circle, CheckCircle2, Clock, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { crearEtapaProcesalAction, eliminarEtapaProcesal } from "@/app/(dashboard)/actions/abogados";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", icono: Circle, color: "text-muted-foreground" },
  { value: "en_curso", label: "En curso", icono: Clock, color: "text-blue-500" },
  { value: "completado", label: "Completado", icono: CheckCircle2, color: "text-green-500" },
  { value: "suspendido", label: "Suspendido", icono: PauseCircle, color: "text-yellow-500" },
];

const estadoInicial = { error: null, success: false };

function NuevaEtapaDialog({ abierto, onCerrar, expedienteId }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearEtapaProcesalAction, estadoInicial);

  useEffect(() => {
    if (state.success) { router.refresh(); onCerrar(); }
  }, [state.success, router, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva etapa procesal</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="expediente_id" value={expedienteId} />

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" placeholder="Ej: Presentación de demanda" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input id="fecha" name="fecha" type="date"
                defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select name="estado" defaultValue="pendiente">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" name="descripcion" rows={2} placeholder="Detalles de la etapa..." />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EtapasProcesales({ etapas = [], expedienteId }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta etapa?")) return;
    await eliminarEtapaProcesal(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Etapas procesales</h3>
        <Button size="sm" onClick={() => setDialogAbierto(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar etapa
        </Button>
      </div>

      {etapas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hay etapas registradas para este expediente.
        </p>
      ) : (
        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

          <div className="space-y-2">
            {etapas.map((etapa) => {
              const estadoCfg = ESTADOS.find((e) => e.value === etapa.estado) || ESTADOS[0];
              const Icono = estadoCfg.icono;
              return (
                <div key={etapa.id} className="flex gap-4 relative">
                  <div className={`z-10 mt-1 shrink-0 ${estadoCfg.color}`}>
                    <Icono className="h-5 w-5 bg-background" />
                  </div>
                  <div className="flex-1 min-w-0 border rounded-lg p-3 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{etapa.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(etapa.fecha + "T12:00:00"), "dd 'de' MMMM yyyy", { locale: es })}
                          {" · "}
                          <span className={estadoCfg.color}>{estadoCfg.label}</span>
                        </p>
                        {etapa.descripcion && (
                          <p className="text-xs text-muted-foreground mt-1">{etapa.descripcion}</p>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleEliminar(etapa.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <NuevaEtapaDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        expedienteId={expedienteId}
      />
    </div>
  );
}
