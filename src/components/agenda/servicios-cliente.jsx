"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ServicioDialog } from "./servicio-dialog";
import {
  eliminarServicio,
  toggleServicioActivo,
} from "@/app/(dashboard)/actions/servicios";
import { toast } from "sonner";

export function ServiciosCliente({ serviciosIniciales }) {
  const [servicios, setServicios] = useState(serviciosIniciales);
  const [dialogAbierto, setDialogAbierto] = useState(false);

  // Sincronizar con datos del servidor despues de revalidatePath
  useEffect(() => {
    setServicios(serviciosIniciales);
  }, [serviciosIniciales]);
  const [servicioEditar, setServicioEditar] = useState(null);
  const [isPending, startTransition] = useTransition();

  function abrirNuevo() {
    setServicioEditar(null);
    setDialogAbierto(true);
  }

  function abrirEditar(servicio) {
    setServicioEditar(servicio);
    setDialogAbierto(true);
  }

  function cerrarDialog() {
    setDialogAbierto(false);
    setServicioEditar(null);
  }

  function handleToggle(id, activo) {
    startTransition(async () => {
      // Optimistic update
      setServicios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, activo } : s))
      );

      const result = await toggleServicioActivo(id, activo);
      if (result.error) {
        toast.error(result.error);
        setServicios((prev) =>
          prev.map((s) => (s.id === id ? { ...s, activo: !activo } : s))
        );
      }
    });
  }

  function handleEliminar(id) {
    if (!confirm("¿Eliminar este servicio?")) return;

    startTransition(async () => {
      const result = await eliminarServicio(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setServicios((prev) => prev.filter((s) => s.id !== id));
        toast.success("Servicio eliminado");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Servicios</h2>
          <p className="text-muted-foreground">
            Administra los servicios que ofreces
          </p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo servicio
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Color</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Duracion</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay servicios creados. Crea tu primer servicio para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              servicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell>
                    <span
                      className="inline-block h-5 w-5 rounded-full"
                      style={{ backgroundColor: servicio.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {servicio.nombre}
                    {servicio.descripcion && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {servicio.descripcion}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{servicio.duracion_minutos} min</TableCell>
                  <TableCell>
                    {Number(servicio.precio) > 0
                      ? `$${Number(servicio.precio).toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={servicio.activo}
                      onCheckedChange={(checked) =>
                        handleToggle(servicio.id, checked)
                      }
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEditar(servicio)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEliminar(servicio.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ServicioDialog
        abierto={dialogAbierto}
        onCerrar={cerrarDialog}
        servicio={servicioEditar}
      />
    </div>
  );
}
