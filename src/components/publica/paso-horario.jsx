"use client";

import { useEffect, useState } from "react";
import { useReservaStore } from "@/stores/reserva-store";
import { obtenerSlotsDisponibles } from "@/app/(public)/actions/reserva";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasoHorario({ slug }) {
  const { servicioSeleccionado, fechaSeleccionada, setHorario, setPaso } =
    useReservaStore();
  const [slots, setSlots] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarSlots() {
      setCargando(true);
      const resultado = await obtenerSlotsDisponibles(
        slug,
        fechaSeleccionada,
        servicioSeleccionado.id
      );
      setSlots(resultado);
      setCargando(false);
    }

    if (fechaSeleccionada && servicioSeleccionado?.id) {
      cargarSlots();
    }
  }, [slug, fechaSeleccionada, servicioSeleccionado?.id]);

  // Formatear fecha para mostrar
  const [anio, mes, dia] = (fechaSeleccionada || "").split("-");
  const fechaMostrar = fechaSeleccionada
    ? new Date(Number(anio), Number(mes) - 1, Number(dia)).toLocaleDateString(
        "es-AR",
        { weekday: "long", day: "numeric", month: "long" }
      )
    : "";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Selecciona un horario</h2>
        <p className="text-sm text-muted-foreground capitalize">
          {fechaMostrar}
        </p>
      </div>

      {cargando ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : slots.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => (
            <Button
              key={slot.hora_inicio}
              variant="outline"
              className={cn("flex items-center gap-1")}
              onClick={() => setHorario(slot)}
            >
              <Clock className="h-3.5 w-3.5" />
              {slot.hora_inicio}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No hay horarios disponibles para esta fecha. Intenta con otro dia.
        </p>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => setPaso(2)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Cambiar fecha
        </Button>
      </div>
    </div>
  );
}
