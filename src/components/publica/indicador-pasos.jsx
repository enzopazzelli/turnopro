"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PASOS = [
  { numero: 1, titulo: "Servicio" },
  { numero: 2, titulo: "Fecha" },
  { numero: 3, titulo: "Horario" },
  { numero: 4, titulo: "Datos" },
  { numero: 5, titulo: "Confirmar" },
];

export function IndicadorPasos({ pasoActual }) {
  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto">
      {PASOS.map((paso, index) => (
        <div key={paso.numero} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                pasoActual > paso.numero
                  ? "bg-primary text-primary-foreground"
                  : pasoActual === paso.numero
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {pasoActual > paso.numero ? (
                <Check className="h-4 w-4" />
              ) : (
                paso.numero
              )}
            </div>
            <span
              className={cn(
                "text-xs hidden sm:block",
                pasoActual >= paso.numero
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {paso.titulo}
            </span>
          </div>

          {index < PASOS.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 mx-2 transition-colors",
                pasoActual > paso.numero ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
