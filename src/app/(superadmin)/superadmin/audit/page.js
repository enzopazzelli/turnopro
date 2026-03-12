"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { obtenerAuditLogs } from "@/app/(superadmin)/actions/superadmin";

const ACCION_COLORS = {
  tenant_activado:              "bg-green-100 text-green-800",
  tenant_desactivado:           "bg-red-100 text-red-800",
  plan_cambiado:                "bg-blue-100 text-blue-800",
  contrasena_cambiada_por_admin:"bg-orange-100 text-orange-800",
  usuario_activado:             "bg-green-100 text-green-800",
  usuario_desactivado:          "bg-red-100 text-red-800",
  login:                        "bg-gray-100 text-gray-800",
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);

  async function cargar() {
    setCargando(true);
    const { data } = await obtenerAuditLogs({ accion: busqueda, limite: 200 });
    setLogs(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const logsFiltrados = busqueda
    ? logs.filter((l) => l.accion.toLowerCase().includes(busqueda.toLowerCase()))
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground text-sm">{logsFiltrados.length} eventos</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
          <RefreshCw className={`h-4 w-4 mr-2 ${cargando ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {/* Filtro */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por acción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
          ) : logsFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No hay eventos registrados.
              <br />
              <span className="text-xs">Los eventos de login, cambios de plan y acciones del superadmin aparecerán aquí.</span>
            </div>
          ) : (
            <div className="divide-y">
              {logsFiltrados.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5 ${ACCION_COLORS[log.accion] || "bg-muted text-muted-foreground"}`}
                      >
                        {log.accion}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        {log.tenants && (
                          <p className="text-sm font-medium truncate">{log.tenants.nombre}</p>
                        )}
                        {log.users && (
                          <p className="text-xs text-muted-foreground">{log.users.nombre_completo} · {log.users.email}</p>
                        )}
                        {log.entidad && (
                          <p className="text-xs text-muted-foreground font-mono">{log.entidad}{log.entidad_id ? ` / ${log.entidad_id.slice(0, 8)}...` : ""}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: es })}
                      </span>
                      {log.datos && Object.keys(log.datos).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expandido === log.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {expandido === log.id && (
                    <pre className="mt-2 ml-8 text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
                      {JSON.stringify(log.datos, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
