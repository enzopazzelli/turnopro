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
import { crearMascota } from "@/app/(dashboard)/actions/veterinaria";
import { buscarPacientesParaCita } from "@/app/(dashboard)/actions/pacientes";
import { ESPECIES_MASCOTA } from "@/lib/constants";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function MascotaDialog({ abierto, onCerrar }) {
  const [state, formAction, pending] = useActionState(crearMascota, estadoInicial);
  const formRef = useRef(null);
  const [especie, setEspecie] = useState("perro");
  const [sexo, setSexo] = useState("");

  // Búsqueda de tutor
  const [busquedaTutor, setBusquedaTutor] = useState("");
  const [tutorSeleccionado, setTutorSeleccionado] = useState(null);
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    if (state.success) {
      toast.success("Mascota registrada");
      onCerrar();
      setTutorSeleccionado(null);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  useEffect(() => {
    if (busquedaTutor.length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await buscarPacientesParaCita(busquedaTutor);
      setResultados(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaTutor]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Mascota</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="tutor_id" value={tutorSeleccionado?.id || ""} />
          <input type="hidden" name="especie" value={especie} />
          <input type="hidden" name="sexo" value={sexo} />

          {/* Tutor */}
          <div className="space-y-2">
            <Label>Tutor *</Label>
            {tutorSeleccionado ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <span className="flex-1 text-sm">{tutorSeleccionado.nombre_completo}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setTutorSeleccionado(null)}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tutor..."
                  className="pl-9"
                  value={busquedaTutor}
                  onChange={(e) => setBusquedaTutor(e.target.value)}
                />
                {resultados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
                    {resultados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => {
                          setTutorSeleccionado(p);
                          setBusquedaTutor("");
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
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Especie *</Label>
              <Select value={especie} onValueChange={setEspecie}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESPECIES_MASCOTA.map((e) => (
                    <SelectItem key={e.valor} value={e.valor}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raza">Raza</Label>
              <Input id="raza" name="raza" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso_kg">Peso (kg)</Label>
              <Input id="peso_kg" name="peso_kg" type="number" step="0.1" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Nacimiento</Label>
              <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={sexo} onValueChange={setSexo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="microchip">Microchip</Label>
              <Input id="microchip" name="microchip" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="foto">Foto</Label>
            <Input id="foto" name="foto" type="file" accept="image/*" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
