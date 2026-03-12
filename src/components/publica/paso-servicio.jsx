"use client";

import { useReservaStore } from "@/stores/reserva-store";
import { ServicioCard } from "./servicio-card";

export function PasoServicio({ servicios }) {
  const { setServicio } = useReservaStore();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Selecciona un servicio</h2>
        <p className="text-sm text-muted-foreground">
          Elige el servicio que deseas reservar
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {servicios.map((servicio) => (
          <ServicioCard
            key={servicio.id}
            servicio={servicio}
            onClick={setServicio}
          />
        ))}
      </div>

      {servicios.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No hay servicios disponibles en este momento.
        </p>
      )}
    </div>
  );
}
