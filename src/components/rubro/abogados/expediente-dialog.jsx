"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
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
import { crearExpediente, actualizarExpediente } from "@/app/(dashboard)/actions/abogados";
import { buscarPacientesParaCita } from "@/app/(dashboard)/actions/pacientes";
import { ESTADOS_EXPEDIENTE } from "@/lib/constants";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function ExpedienteDialog({ abierto, onCerrar, expediente = null }) {
  const esEdicion = !!expediente;
  const actionFn = esEdicion ? actualizarExpediente.bind(null, expediente.id) : crearExpediente;
  const [state, formAction, pending] = useActionState(actionFn, estadoInicial);
  const formRef = useRef(null);
  const [estado, setEstado] = useState(expediente?.estado || "activo");

  // Búsqueda de cliente
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(
    expediente?.paciente_id ? { id: expediente.paciente_id, nombre_completo: expediente.pacientes?.nombre_completo || "Cliente" } : null
  );
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    if (state.success) {
      toast.success(esEdicion ? "Expediente actualizado" : "Expediente creado");
      onCerrar();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar, esEdicion]);

  useEffect(() => {
    if (busquedaCliente.length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await buscarPacientesParaCita(busquedaCliente);
      setResultados(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaCliente]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expediente ? "Editar" : "Nuevo"} Expediente</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={clienteSeleccionado?.id || ""} />
          <input type="hidden" name="estado" value={estado} />

          {/* Búsqueda de cliente */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {clienteSeleccionado ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <span className="flex-1 text-sm">{clienteSeleccionado.nombre_completo}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setClienteSeleccionado(null)}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-9"
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                />
                {resultados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
                    {resultados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => {
                          setClienteSeleccionado(p);
                          setBusquedaCliente("");
                          setResultados([]);
                        }}
                      >
                        {p.nombre_completo}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caratula">Caratula *</Label>
            <Input id="caratula" name="caratula" defaultValue={expediente?.caratula} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_expediente">Numero de expediente</Label>
              <Input id="numero_expediente" name="numero_expediente" defaultValue={expediente?.numero_expediente} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="juzgado">Juzgado</Label>
              <Input id="juzgado" name="juzgado" defaultValue={expediente?.juzgado} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuero">Fuero</Label>
              <Input id="fuero" name="fuero" defaultValue={expediente?.fuero} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_EXPEDIENTE.map((e) => (
                    <SelectItem key={e.valor} value={e.valor}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input id="tipo" name="tipo" defaultValue={expediente?.tipo} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
              <Input id="fecha_inicio" name="fecha_inicio" type="date" defaultValue={expediente?.fecha_inicio || new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea id="descripcion" name="descripcion" rows={2} defaultValue={expediente?.descripcion} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas_privadas">Notas privadas</Label>
            <Textarea id="notas_privadas" name="notas_privadas" rows={2} defaultValue={expediente?.notas_privadas} />
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
