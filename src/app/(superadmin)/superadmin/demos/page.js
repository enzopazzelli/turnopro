"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Phone, MessageSquare, Filter, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { obtenerSolicitudesDemo, actualizarEstadoDemo } from "@/app/(superadmin)/actions/superadmin";
import { toast } from "sonner";

const RUBROS_LABEL = {
  odontologia: "Odontología", medicina: "Medicina", abogados: "Abogados",
  veterinaria: "Veterinaria", psicologia: "Psicología", contadores: "Contadores",
};

const ESTADOS = [
  { value: "pendiente",   label: "Pendiente",   color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "contactado",  label: "Contactado",  color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "descartado",  label: "Descartado",  color: "bg-muted text-muted-foreground" },
];

function EstadoBadge({ estado }) {
  const e = ESTADOS.find((s) => s.value === estado) || ESTADOS[0];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e.color}`}>{e.label}</span>;
}

export default function DemosPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [isPending, startTransition] = useTransition();

  async function cargar() {
    setCargando(true);
    const { data } = await obtenerSolicitudesDemo({ estado: filtroEstado });
    setSolicitudes(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [filtroEstado]);

  function cambiarEstado(id, nuevoEstado) {
    startTransition(async () => {
      const { error } = await actualizarEstadoDemo(id, nuevoEstado);
      if (error) {
        toast.error(error);
      } else {
        setSolicitudes((prev) =>
          prev.map((s) => s.id === id ? { ...s, estado: nuevoEstado } : s)
        );
        toast.success("Estado actualizado");
      }
    });
  }

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Solicitudes de demo
            {pendientes > 0 && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 text-sm font-semibold">
                {pendientes} nueva{pendientes !== 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">{solicitudes.length} solicitudes</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroEstado || "all"} onValueChange={(v) => setFiltroEstado(v === "all" ? "" : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No hay solicitudes.</div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((s) => (
            <Card key={s.id} className={s.estado === "pendiente" ? "border-yellow-300/60 dark:border-yellow-700/40" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{s.nombre}</p>
                      <EstadoBadge estado={s.estado} />
                      {s.rubro && (
                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                          {RUBROS_LABEL[s.rubro] || s.rubro}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {s.email}
                      </a>
                      {s.telefono && (
                        <a href={`tel:${s.telefono}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {s.telefono}
                        </a>
                      )}
                    </div>
                    {s.mensaje && (
                      <p className="text-sm text-muted-foreground flex gap-1.5 bg-muted/50 rounded-md px-3 py-2">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {s.mensaje}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {ESTADOS.filter((e) => e.value !== s.estado).map((e) => (
                      <Button
                        key={e.value}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={isPending}
                        onClick={() => cambiarEstado(s.id, e.value)}
                      >
                        <Circle className="h-2 w-2 mr-1" />
                        {e.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
