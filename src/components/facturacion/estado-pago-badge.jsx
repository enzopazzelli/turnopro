"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  parcial: {
    label: "Parcial",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  pagado: {
    label: "Pagado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  reembolsado: {
    label: "Reembolsado",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

export function EstadoPagoBadge({ estado }) {
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
