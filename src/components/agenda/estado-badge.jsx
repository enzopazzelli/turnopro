"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  pendiente_confirmacion: {
    label: "Por confirmar",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  confirmada: {
    label: "Confirmada",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  en_curso: {
    label: "En curso",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  completada: {
    label: "Completada",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  no_asistio: {
    label: "No asistio",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

export function EstadoBadge({ estado }) {
  const config = estadoConfig[estado] || estadoConfig.pendiente;

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", config.className)}
    >
      {config.label}
    </Badge>
  );
}
