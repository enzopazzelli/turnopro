"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EvolucionDialog } from "./evolucion-dialog";

export function LineaEvolucion({ evoluciones = [], pacienteId }) {
  const [dialogAbierto, setDialogAbierto] = useState(false);

  const chartData = evoluciones.map((e) => ({
    ...e,
    fechaLabel: format(new Date(e.fecha), "dd/MM", { locale: es }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Linea de Evolucion</h3>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" /> Registrar evolucion
        </Button>
      </div>

      {/* Chart */}
      {evoluciones.length > 1 && (
        <div className="border rounded-lg p-4 bg-card">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fechaLabel" fontSize={12} />
              <YAxis domain={[1, 10]} fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="puntuacion"
                name="Puntuacion"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline */}
      {evoluciones.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay registros de evolucion
        </p>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {[...evoluciones].reverse().map((e) => (
              <div key={e.id} className="relative flex gap-4 pl-10">
                <div className="absolute left-[8px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                <div className="flex-1 border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {format(new Date(e.fecha), "dd/MM/yyyy", { locale: es })}
                    </span>
                    <div className="flex items-center gap-2">
                      {e.area && <Badge variant="secondary">{e.area}</Badge>}
                      <span className="text-lg font-bold text-primary">{e.puntuacion}/10</span>
                    </div>
                  </div>
                  <p className="font-medium">{e.titulo}</p>
                  {e.descripcion && (
                    <p className="text-sm text-muted-foreground mt-1">{e.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <EvolucionDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        pacienteId={pacienteId}
      />
    </div>
  );
}
