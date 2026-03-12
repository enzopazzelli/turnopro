"use client";

import { Button } from "@/components/ui/button";

const PERIODOS = [
  { valor: "hoy", label: "Hoy" },
  { valor: "semana", label: "Semana" },
  { valor: "mes", label: "Mes" },
  { valor: "trimestre", label: "Trimestre" },
];

export function SelectorPeriodo({ periodo, onCambio }) {
  return (
    <div className="flex gap-1 rounded-lg border p-1">
      {PERIODOS.map((p) => (
        <Button
          key={p.valor}
          variant={periodo === p.valor ? "default" : "ghost"}
          size="sm"
          onClick={() => onCambio(p.valor)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
