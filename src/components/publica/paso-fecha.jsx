"use client";

import { useMemo } from "react";
import { useReservaStore } from "@/stores/reserva-store";
import { Calendar } from "@/components/ui/calendar";
import { es } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function PasoFecha({ disponibilidad, fechasBloqueadas }) {
  const { setFecha, setPaso } = useReservaStore();

  // Dias de la semana con disponibilidad activa (0=domingo...6=sabado)
  const diasActivos = useMemo(
    () => new Set(disponibilidad.map((d) => d.dia_semana)),
    [disponibilidad]
  );

  // Fechas bloqueadas (todo el dia)
  const fechasBloqueadasSet = useMemo(() => {
    if (!fechasBloqueadas) return new Set();
    return new Set(
      fechasBloqueadas
        .filter((fb) => fb.todo_el_dia)
        .map((fb) => fb.fecha)
    );
  }, [fechasBloqueadas]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const handleSelect = (fecha) => {
    if (!fecha) return;
    // Formatear a YYYY-MM-DD sin problemas de timezone
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    setFecha(`${anio}-${mes}-${dia}`);
  };

  const isDisabled = (fecha) => {
    // Deshabilitar fechas pasadas
    if (fecha < hoy) return true;

    // Deshabilitar dias sin disponibilidad
    if (!diasActivos.has(fecha.getDay())) return true;

    // Deshabilitar fechas bloqueadas
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    if (fechasBloqueadasSet.has(`${anio}-${mes}-${dia}`)) return true;

    return false;
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Selecciona una fecha</h2>
        <p className="text-sm text-muted-foreground">
          Elige el dia para tu turno
        </p>
      </div>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          onSelect={handleSelect}
          disabled={isDisabled}
          locale={es}
          fromDate={hoy}
        />
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => setPaso(1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Cambiar servicio
        </Button>
      </div>
    </div>
  );
}
