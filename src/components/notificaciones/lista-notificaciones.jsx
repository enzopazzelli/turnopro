"use client";

import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemNotificacion } from "./item-notificacion";

export function ListaNotificaciones({ notificaciones, cargando, onMarcarLeida }) {
  if (cargando) {
    return (
      <div className="p-3 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notificaciones || notificaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Bell className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No tienes notificaciones</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div>
        {notificaciones.map((notificacion) => (
          <ItemNotificacion
            key={notificacion.id}
            notificacion={notificacion}
            onMarcarLeida={onMarcarLeida}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
