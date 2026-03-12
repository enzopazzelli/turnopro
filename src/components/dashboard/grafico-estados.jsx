"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GraficoEstados({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estados del mes</CardTitle>
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
        <CardTitle className="text-base">Estados del mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={datos}
              dataKey="total"
              nameKey="estado"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ estado, total }) => `${estado}: ${total}`}
              labelLine={false}
            >
              {datos.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} citas`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
