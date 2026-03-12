"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  crearEnlaceProfesional,
  eliminarEnlaceProfesional,
} from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";

const CATEGORIAS = {
  general: { label: "General", className: "bg-gray-100 text-gray-800" },
  colegio: { label: "Colegio profesional", className: "bg-blue-100 text-blue-800" },
  asociacion: { label: "Asociacion", className: "bg-purple-100 text-purple-800" },
  recurso: { label: "Recurso / referencia", className: "bg-green-100 text-green-800" },
};

const estadoInicial = { error: null, success: false };

function NuevoEnlaceDialog({ abierto, onCerrar }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearEnlaceProfesional, estadoInicial);
  const [categoria, setCategoria] = useState("colegio");
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Enlace guardado");
      formRef.current?.reset();
      setCategoria("colegio");
      onCerrar();
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar, router]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar enlace</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="categoria" value={categoria} />

          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo *</Label>
            <Input id="titulo" name="titulo" placeholder="Ej: Colegio de Psicologos de Bs. As." required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input id="url" name="url" placeholder="https://..." required />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIAS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion (opcional)</Label>
            <Input id="descripcion" name="descripcion" placeholder="Breve descripcion del enlace" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabRecursos({ enlaces = [] }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleEliminar(id) {
    if (!confirm("Eliminar este enlace?")) return;
    startTransition(async () => {
      const res = await eliminarEnlaceProfesional(id);
      if (res.error) toast.error(res.error);
      else { toast.success("Enlace eliminado"); router.refresh(); }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Mis colegios y asociaciones
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Links a tus colegios profesionales, asociaciones y recursos de referencia.
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogAbierto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {enlaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay enlaces guardados.</p>
              <p className="text-xs mt-1">Agrega links a tus colegios, asociaciones o recursos que uses habitualmente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enlaces.map((enlace) => {
                const cat = CATEGORIAS[enlace.categoria] || CATEGORIAS.general;
                return (
                  <div key={enlace.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={enlace.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline text-primary flex items-center gap-1 text-sm"
                        >
                          {enlace.titulo}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <Badge variant="outline" className={`text-xs border-transparent ${cat.className}`}>
                          {cat.label}
                        </Badge>
                      </div>
                      {enlace.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5">{enlace.descripcion}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{enlace.url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleEliminar(enlace.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NuevoEnlaceDialog abierto={dialogAbierto} onCerrar={() => setDialogAbierto(false)} />
    </div>
  );
}
