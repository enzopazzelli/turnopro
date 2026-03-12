"use client";

import { useState, useEffect, useTransition } from "react";
import { obtenerNotificaciones, marcarNotificacionLeida } from "@/app/(dashboard)/actions/notificaciones";
import { ItemNotificacion } from "@/components/notificaciones/item-notificacion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { LABELS_TIPO_NOTIFICACION } from "@/lib/constants";
import { useNotificacionesStore } from "@/stores/notificaciones-store";

const POR_PAGINA = 20;

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [, startTransition] = useTransition();
  const { marcarLeida: marcarLeidaStore } = useNotificacionesStore();

  useEffect(() => {
    cargarNotificaciones();
  }, [pagina, filtroTipo, filtroCanal]);

  async function cargarNotificaciones() {
    setCargando(true);
    const { data, total: t } = await obtenerNotificaciones({
      pagina,
      porPagina: POR_PAGINA,
      tipo: filtroTipo === "todos" ? undefined : filtroTipo,
      canal: filtroCanal === "todos" ? undefined : filtroCanal,
    });
    setNotificaciones(data);
    setTotal(t);
    setCargando(false);
  }

  function handleMarcarLeida(id) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
    marcarLeidaStore(id);
    startTransition(() => marcarNotificacionLeida(id));
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
        <p className="text-muted-foreground">
          Historial completo de notificaciones.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filtroTipo} onValueChange={(v) => { setFiltroTipo(v); setPagina(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(LABELS_TIPO_NOTIFICACION).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroCanal} onValueChange={(v) => { setFiltroCanal(v); setPagina(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los canales</SelectItem>
            <SelectItem value="in_app">In-app</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>

        {total > 0 && (
          <Badge variant="secondary" className="self-center">
            {total} notificacion{total !== 1 ? "es" : ""}
          </Badge>
        )}
      </div>

      {/* Lista */}
      <div className="border rounded-lg bg-card">
        {cargando ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 mt-0.5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <div>
            {notificaciones.map((notif) => (
              <ItemNotificacion
                key={notif.id}
                notificacion={notif}
                onMarcarLeida={handleMarcarLeida}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paginacion */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {pagina} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
