"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CalendarDays, TrendingUp, DollarSign, Activity } from "lucide-react";
import { obtenerMetricasGlobales } from "@/app/(superadmin)/actions/superadmin";

const COLORES_RUBRO = {
  odontologia: "#06b6d4",
  medicina: "#10b981",
  abogados: "#6366f1",
  veterinaria: "#f59e0b",
  psicologia: "#8b5cf6",
  contadores: "#ec4899",
};

const LABELS_RUBRO = {
  odontologia: "Odontología",
  medicina: "Medicina",
  abogados: "Abogados",
  veterinaria: "Veterinaria",
  psicologia: "Psicología",
  contadores: "Contadores",
};

const LABELS_PLAN = { trial: "Trial", basico: "Básico", profesional: "Profesional", premium: "Premium" };

function StatCard({ titulo, valor, sub, icono: Icono, color = "text-foreground" }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{titulo}</p>
            <p className={`text-2xl font-bold ${color}`}>{valor}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          {Icono && <Icono className="h-5 w-5 text-muted-foreground/50" />}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperadminPage() {
  const [metricas, setMetricas] = useState(null);

  useEffect(() => {
    obtenerMetricasGlobales().then(({ data }) => setMetricas(data));
  }, []);

  if (!metricas) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Métricas globales</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-5 pb-4 h-20 animate-pulse bg-muted rounded" /></Card>
          ))}
        </div>
      </div>
    );
  }

  const planData = [
    { plan: "Trial", count: metricas.tenants.trial },
    { plan: "Básico", count: metricas.tenants.basico },
    { plan: "Profesional", count: metricas.tenants.profesional },
    { plan: "Premium", count: metricas.tenants.premium },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Métricas globales</h1>
        <p className="text-muted-foreground text-sm">Vista general de la plataforma TurnoPro.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard titulo="Tenants" valor={metricas.tenants.total} icono={Building2} />
        <StatCard titulo="Usuarios" valor={metricas.usuarios} icono={Users} />
        <StatCard titulo="Citas totales" valor={metricas.citas.total.toLocaleString()} icono={CalendarDays} />
        <StatCard titulo="Citas este mes" valor={metricas.citas.este_mes} icono={Activity} />
        <StatCard titulo="Ingresos mes" valor={`$${metricas.ingresos_mes.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`} icono={DollarSign} color="text-green-600" />
        <StatCard titulo="En trial" valor={metricas.tenants.trial} sub={`de ${metricas.tenants.total} tenants`} icono={TrendingUp} color="text-yellow-600" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Por rubro */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribución por rubro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metricas.por_rubro} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="rubro"
                  type="category"
                  width={85}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => LABELS_RUBRO[v] || v}
                />
                <Tooltip
                  formatter={(v) => [v, "Tenants"]}
                  labelFormatter={(v) => LABELS_RUBRO[v] || v}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {metricas.por_rubro.map((r) => (
                    <Cell key={r.rubro} fill={COLORES_RUBRO[r.rubro] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por plan */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribución por plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={planData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, "Tenants"]} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crecimiento */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nuevos tenants (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metricas.crecimiento}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, "Nuevos"]} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
