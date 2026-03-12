"use client";

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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORES_INTERPRETACION = {
  Minimo: "bg-green-100 text-green-800",
  Leve: "bg-yellow-100 text-yellow-800",
  Moderada: "bg-orange-100 text-orange-800",
  "Moderadamente severa": "bg-red-100 text-red-800",
  Severa: "bg-red-200 text-red-900",
  Baja: "bg-green-100 text-green-800",
  Alta: "bg-red-100 text-red-800",
  Normal: "bg-green-100 text-green-800",
  "Deterioro leve": "bg-yellow-100 text-yellow-800",
  "Deterioro moderado": "bg-orange-100 text-orange-800",
  "Deterioro severo": "bg-red-200 text-red-900",
};

export function CuestionarioResultados({ respuestas = [] }) {
  if (respuestas.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay aplicaciones registradas
      </p>
    );
  }

  const chartData = respuestas.map((r) => ({
    fechaLabel: format(new Date(r.fecha), "dd/MM", { locale: es }),
    puntuacion: r.puntuacion_total,
  }));

  return (
    <div className="space-y-6">
      {/* Chart */}
      {respuestas.length > 1 && (
        <div className="border rounded-lg p-4 bg-card">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fechaLabel" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="puntuacion"
                name="Puntuacion"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cuestionario</TableHead>
              <TableHead>Puntuacion</TableHead>
              <TableHead>Interpretacion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...respuestas].reverse().map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {format(new Date(r.fecha), "dd/MM/yyyy", { locale: es })}
                </TableCell>
                <TableCell>{r.cuestionarios?.nombre || "-"}</TableCell>
                <TableCell className="font-bold">{r.puntuacion_total}</TableCell>
                <TableCell>
                  {r.interpretacion ? (
                    <Badge variant="outline" className={COLORES_INTERPRETACION[r.interpretacion] || ""}>
                      {r.interpretacion}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
