"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServicioCard({ servicio, seleccionado, onClick, mostrarPrecio = true }) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        seleccionado && "ring-2 ring-primary"
      )}
      onClick={() => onClick?.(servicio)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="h-3 w-3 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: servicio.color }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">{servicio.nombre}</h3>

            {servicio.descripcion && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {servicio.descripcion}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {servicio.duracion_minutos} min
              </span>
              {mostrarPrecio && servicio.precio > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {Number(servicio.precio).toLocaleString("es-AR")}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
