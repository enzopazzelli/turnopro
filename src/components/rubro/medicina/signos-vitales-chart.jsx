"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";

const METRICAS = [
  { key: "peso_kg", nombre: "Peso (kg)", color: "#3b82f6" },
  { key: "presion_sistolica", nombre: "Sistolica", color: "#ef4444" },
  { key: "presion_diastolica", nombre: "Diastolica", color: "#f97316" },
  { key: "temperatura", nombre: "Temp (°C)", color: "#8b5cf6" },
  { key: "frecuencia_cardiaca", nombre: "FC (lpm)", color: "#22c55e" },
  { key: "saturacion_o2", nombre: "SpO2 (%)", color: "#06b6d4" },
];

export function SignosVitalesChart({ datos = [] }) {
  const [activas, setActivas] = useState(["peso_kg", "presion_sistolica", "presion_diastolica"]);

  const toggleMetrica = (key) => {
    setActivas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const chartData = datos.map((d) => ({
    ...d,
    fechaLabel: format(new Date(d.fecha), "dd/MM"),
  }));

  if (datos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay registros de signos vitales
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {METRICAS.map((m) => (
          <Button
            key={m.key}
            variant={activas.includes(m.key) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMetrica(m.key)}
            style={activas.includes(m.key) ? { backgroundColor: m.color } : {}}
          >
            {m.nombre}
          </Button>
        ))}
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fechaLabel" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            {METRICAS.filter((m) => activas.includes(m.key)).map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.nombre}
                stroke={m.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
