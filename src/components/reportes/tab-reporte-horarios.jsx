"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock, CalendarDays, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORES_HORA = (cantidad, max) => {
  if (max === 0) return "#e5e7eb";
  const intensidad = cantidad / max;
  if (intensidad > 0.75) return "#1d4ed8";
  if (intensidad > 0.5) return "#3b82f6";
  if (intensidad > 0.25) return "#93c5fd";
  return "#dbeafe";
};

const COLORES_DIA = ["#e5e7eb", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#e5e7eb"];

export function TabReporteHorarios({ datos, cargando }) {
  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="mt-1 h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!datos) return null;

  const { horasData, diasData, resumen } = datos;

  const maxHora = Math.max(...horasData.map((h) => h.cantidad), 1);

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.totalCitas}</p>
              <p className="text-xs text-muted-foreground">Citas en el periodo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.horaPico}</p>
              <p className="text-xs text-muted-foreground">Hora pico</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CalendarDays className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.diaPico}</p>
              <p className="text-xs text-muted-foreground">Dia mas ocupado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafico por hora */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribucion por hora del dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={horasData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, "Citas"]} />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                {horasData.map((entry, index) => (
                  <Cell key={index} fill={COLORES_HORA(entry.cantidad, maxHora)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grafico por dia de semana */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribucion por dia de la semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diasData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, "Citas"]} />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                {diasData.map((entry, index) => (
                  <Cell key={index} fill={COLORES_DIA[index] || "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
