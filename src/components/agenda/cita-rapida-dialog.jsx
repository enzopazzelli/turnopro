"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CitaDialog } from "./cita-dialog";
import { obtenerServiciosActivos } from "@/app/(dashboard)/actions/servicios";

export function CitaRapidaDialog({
  abierto,
  onCerrar,
  pacientePreseleccionado = null,
  notaPreseleccionada = "",
}) {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    obtenerServiciosActivos().then(({ data }) => {
      setServicios(data || []);
      setCargando(false);
    });
  }, [abierto]);

  if (cargando && abierto) {
    return (
      <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Cargando servicios...
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <CitaDialog
      abierto={abierto}
      onCerrar={onCerrar}
      servicios={servicios}
      pacientePreseleccionado={pacientePreseleccionado}
      notaPreseleccionada={notaPreseleccionada}
    />
  );
}
