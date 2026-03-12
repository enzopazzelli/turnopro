"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRubro } from "@/hooks/use-rubro";

export function GraficoPacientes({ datos }) {
  const rubro = useRubro();
  const label = rubro?.crm?.terminoPlural || "Pacientes";

  if (!datos || datos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{label} nuevos vs recurrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {label} - Ultimos 6 meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(v) => `Mes: ${v}`}
              formatter={(v, name) => [
                `${v}`,
                name === "nuevos" ? "Nuevos" : "Recurrentes",
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "nuevos" ? "Nuevos" : "Recurrentes"
              }
            />
            <Bar dataKey="nuevos" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recurrentes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
