"use client";

import { useState } from "react";
import { format, subDays, subMonths, startOfMonth, startOfYear } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PRESETS = [
  {
    label: "Ultima semana",
    rango: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "Ultimo mes",
    rango: () => ({ from: subMonths(new Date(), 1), to: new Date() }),
  },
  {
    label: "Ultimo trimestre",
    rango: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "Este año",
    rango: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
];

export function SelectorRangoFechas({ rango, onCambio }) {
  const [open, setOpen] = useState(false);

  const aplicarPreset = (preset) => {
    const r = preset.rango();
    onCambio(r);
    setOpen(false);
  };

  const textoRango =
    rango?.from && rango?.to
      ? `${format(rango.from, "dd/MM/yyyy")} - ${format(rango.to, "dd/MM/yyyy")}`
      : "Seleccionar fechas";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarDays className="mr-2 h-4 w-4" />
          {textoRango}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-3">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => aplicarPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              selected={rango}
              onSelect={(r) => {
                if (r?.from && r?.to) {
                  onCambio(r);
                  setOpen(false);
                } else if (r) {
                  onCambio(r);
                }
              }}
              numberOfMonths={2}
              locale={es}
              disabled={{ after: new Date() }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
