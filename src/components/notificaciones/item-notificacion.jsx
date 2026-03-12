"use client";

import {
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Bell,
  Clock,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const iconosPorTipo = {
  cita_creada: CalendarPlus,
  cita_confirmada: CalendarCheck,
  cita_cancelada: CalendarX,
  cita_modificada: CalendarClock,
  recordatorio_24h: Clock,
  recordatorio_2h: Clock,
  reserva_nueva: UserPlus,
  general: Bell,
};

const coloresPorTipo = {
  cita_creada: "text-blue-500",
  cita_confirmada: "text-green-500",
  cita_cancelada: "text-red-500",
  cita_modificada: "text-amber-500",
  recordatorio_24h: "text-purple-500",
  recordatorio_2h: "text-purple-500",
  reserva_nueva: "text-emerald-500",
  general: "text-muted-foreground",
};

export function ItemNotificacion({ notificacion, onMarcarLeida }) {
  const Icono = iconosPorTipo[notificacion.tipo] || Bell;
  const colorIcono = coloresPorTipo[notificacion.tipo] || "text-muted-foreground";

  const tiempoRelativo = formatDistanceToNow(new Date(notificacion.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <button
      onClick={() => !notificacion.leida && onMarcarLeida?.(notificacion.id)}
      className={cn(
        "w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0",
        !notificacion.leida && "bg-muted/30"
      )}
    >
      <div className={cn("mt-0.5 shrink-0", colorIcono)}>
        <Icono className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium truncate", !notificacion.leida && "font-semibold")}>
            {notificacion.titulo}
          </p>
          {!notificacion.leida && (
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notificacion.mensaje}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">{tiempoRelativo}</p>
      </div>
    </button>
  );
}
