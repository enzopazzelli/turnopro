"use client";

import { useState, useEffect, useCallback } from "react";
import { obtenerDatosAnalytics } from "../actions/analytics";
import { DashboardCliente } from "@/components/dashboard/dashboard-cliente";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async (p) => {
    setCargando(true);
    setError(null);
    const resultado = await obtenerDatosAnalytics(p);
    if (resultado.error || !resultado.data) {
      setError(resultado.error || "No se pudieron cargar los datos del dashboard.");
      setDatos(null);
    } else {
      setDatos(resultado.data);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarDatos(periodo);
  }, [periodo, cargarDatos]);

  if (cargando) {
    return <DashboardSkeleton />;
  }

  if (error || !datos) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {error || "No se pudieron cargar los datos del dashboard."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardCliente
      datos={datos}
      periodo={periodo}
      onCambioPeriodo={setPeriodo}
    />
  );
}
