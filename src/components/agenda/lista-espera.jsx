"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Clock, Plus, Trash2, CalendarPlus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  agregarAListaEspera,
  eliminarDeListaEspera,
  cambiarEstadoListaEspera,
} from "@/app/(dashboard)/actions/lista-espera";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const estadoInicial = { error: null, fieldErrors: {}, success: null };

const estadoConfig = {
  esperando: { label: "Esperando", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  notificado: { label: "Notificado", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  agendado: { label: "Agendado", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function ListaEspera({ items = [], servicios = [] }) {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleAgregarClick() {
    setDialogKey((k) => k + 1);
    setDialogAbierto(true);
  }

  function handleEliminar(id) {
    startTransition(async () => {
      const result = await eliminarDeListaEspera(id);
      if (result.error) toast.error(result.error);
      else toast.success("Eliminado de la lista de espera");
    });
  }

  function handleMarcarAgendado(id) {
    startTransition(async () => {
      const result = await cambiarEstadoListaEspera(id, "agendado");
      if (result.error) toast.error(result.error);
      else toast.success("Marcado como agendado");
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Lista de espera
            {items.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" className="h-8" onClick={handleAgregarClick}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center py-6 text-sm text-muted-foreground">
            No hay pacientes en lista de espera
          </p>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {items.map((item) => {
                const config = estadoConfig[item.estado] || estadoConfig.esperando;
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {item.paciente_nombre}
                      </p>
                      {item.servicios?.nombre && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.servicios?.color || "#6366f1" }}
                          />
                          {item.servicios.nombre}
                        </p>
                      )}
                      {item.fecha_preferida && (
                        <p className="text-xs text-muted-foreground">
                          Preferencia: {item.fecha_preferida}
                          {item.horario_preferido && ` (${item.horario_preferido})`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Hace {formatDistanceToNow(new Date(item.created_at), { locale: es })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`border-transparent text-xs ${config.className}`}>
                        {config.label}
                      </Badge>
                      <div className="flex gap-1">
                        {item.estado === "notificado" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={isPending}
                            onClick={() => handleMarcarAgendado(item.id)}
                            title="Marcar como agendado"
                          >
                            <CalendarPlus className="h-3 w-3 text-green-600" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={isPending}
                          onClick={() => handleEliminar(item.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <DialogAgregarListaEspera
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        servicios={servicios}
      />
    </Card>
  );
}

function DialogAgregarListaEspera({ abierto, onCerrar, servicios }) {
  const [state, formAction, pending] = useActionState(agregarAListaEspera, estadoInicial);
  const [servicioId, setServicioId] = useState("");
  const [horarioPreferido, setHorarioPreferido] = useState("");
  const ultimoExitoRef = useRef(null);

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success("Agregado a la lista de espera");
      onCerrar();
    }
  }, [state.success, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar a lista de espera</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="le-nombre">Nombre del paciente *</Label>
            <Input
              id="le-nombre"
              name="paciente_nombre"
              placeholder="Nombre completo"
              required
            />
            {state.fieldErrors?.paciente_nombre && (
              <p className="text-sm text-destructive">{state.fieldErrors.paciente_nombre[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="le-tel">Telefono</Label>
              <Input id="le-tel" name="paciente_telefono" placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="le-email">Email</Label>
              <Input id="le-email" name="paciente_email" type="email" placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Servicio solicitado</Label>
            <Select value={servicioId} onValueChange={setServicioId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Cualquier servicio" />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="servicio_id" value={servicioId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="le-fecha">Fecha preferida</Label>
              <Input id="le-fecha" name="fecha_preferida" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Horario preferido</Label>
              <Select value={horarioPreferido} onValueChange={setHorarioPreferido}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cualquiera">Cualquiera</SelectItem>
                  <SelectItem value="manana">Manana</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="horario_preferido" value={horarioPreferido} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="le-notas">Notas</Label>
            <Textarea id="le-notas" name="notas" placeholder="Notas adicionales" rows={2} />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
