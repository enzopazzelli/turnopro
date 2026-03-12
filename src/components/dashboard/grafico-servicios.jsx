"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GraficoServicios({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Servicios mas demandados</CardTitle>
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
        <CardTitle className="text-base">Servicios mas demandados</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={datos} layout="vertical">
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="nombre"
              tick={{ fontSize: 11 }}
              width={120}
            />
            <Tooltip formatter={(v) => [`${v} citas`, "Total"]} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {datos.map((entry, index) => (
                <Cell key={index} fill={entry.color || "#6366f1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
