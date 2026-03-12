"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  crearPaciente,
  actualizarPaciente,
} from "@/app/(dashboard)/actions/pacientes";
import { GENEROS } from "@/lib/constants";
import { useRubro } from "@/hooks/use-rubro";
import { toast } from "sonner";

const estadoInicial = { error: null, fieldErrors: {}, success: null };

export function PacienteDialog({ abierto, onCerrar, paciente = null }) {
  const esEdicion = !!paciente;
  const { terminoPaciente, crm } = useRubro();
  const campos = crm.campos;
  const etiquetasDisponibles = crm.etiquetas;

  const actionFn = esEdicion
    ? actualizarPaciente.bind(null, paciente.id)
    : crearPaciente;

  const [state, formAction, pending] = useActionState(actionFn, estadoInicial);
  const formRef = useRef(null);
  const ultimoExitoRef = useRef(null);

  const [genero, setGenero] = useState(paciente?.genero || "no_especifica");
  const [etiquetas, setEtiquetas] = useState(paciente?.etiquetas || []);

  // Resetear al abrir/cerrar
  useEffect(() => {
    if (abierto) {
      setGenero(paciente?.genero || "no_especifica");
      setEtiquetas(paciente?.etiquetas || []);
    }
  }, [abierto, paciente]);

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success(
        esEdicion
          ? `${terminoPaciente} actualizado`
          : `${terminoPaciente} creado`
      );
      onCerrar();
    }
  }, [state.success, esEdicion, onCerrar, terminoPaciente]);

  function toggleEtiqueta(etiqueta) {
    setEtiquetas((prev) =>
      prev.includes(etiqueta)
        ? prev.filter((e) => e !== etiqueta)
        : [...prev, etiqueta]
    );
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {esEdicion
              ? `Editar ${terminoPaciente.toLowerCase()}`
              : `Nuevo ${terminoPaciente.toLowerCase()}`}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre completo *</Label>
            <Input
              id="nombre_completo"
              name="nombre_completo"
              defaultValue={paciente?.nombre_completo || ""}
              placeholder="Nombre y apellido"
              required
            />
            {state.fieldErrors?.nombre_completo && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.nombre_completo[0]}
              </p>
            )}
          </div>

          {/* Telefono y Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input
                id="telefono"
                name="telefono"
                defaultValue={paciente?.telefono || ""}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={paciente?.email || ""}
                placeholder="Opcional"
              />
              {state.fieldErrors?.email && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>
          </div>

          {/* DNI y Fecha de nacimiento */}
          <div className={`grid gap-4 ${campos.fecha_nacimiento ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="space-y-2">
              <Label htmlFor="dni">DNI / Documento</Label>
              <Input
                id="dni"
                name="dni"
                defaultValue={paciente?.dni || ""}
                placeholder="Opcional"
              />
            </div>
            {campos.fecha_nacimiento && (
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  defaultValue={paciente?.fecha_nacimiento || ""}
                />
              </div>
            )}
          </div>

          {/* Genero */}
          {!campos.genero && (
            <input type="hidden" name="genero" value="no_especifica" />
          )}
          {campos.genero && (
            <div className="space-y-2">
              <Label>Genero</Label>
              <Select value={genero} onValueChange={setGenero}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENEROS.map((g) => (
                    <SelectItem key={g.valor} value={g.valor}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="genero" value={genero} />
            </div>
          )}

          {/* Direccion */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Direccion</Label>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={paciente?.direccion || ""}
              placeholder="Opcional"
            />
          </div>

          {/* Obra social */}
          {campos.obra_social && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="obra_social">Obra social</Label>
                <Input
                  id="obra_social"
                  name="obra_social"
                  defaultValue={paciente?.obra_social || ""}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_afiliado">N° afiliado</Label>
                <Input
                  id="numero_afiliado"
                  name="numero_afiliado"
                  defaultValue={paciente?.numero_afiliado || ""}
                  placeholder="Opcional"
                />
              </div>
            </div>
          )}

          {/* Etiquetas */}
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2">
              {etiquetasDisponibles.map((etiqueta) => (
                <Badge
                  key={etiqueta}
                  variant={etiquetas.includes(etiqueta) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleEtiqueta(etiqueta)}
                >
                  {etiqueta}
                  {etiquetas.includes(etiqueta) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
            <input
              type="hidden"
              name="etiquetas"
              value={JSON.stringify(etiquetas)}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              name="notas"
              defaultValue={paciente?.notas || ""}
              placeholder="Observaciones generales"
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
                : `Crear ${terminoPaciente.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
