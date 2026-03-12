"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificacionesStore } from "@/stores/notificaciones-store";
import { ListaNotificaciones } from "./lista-notificaciones";
import { marcarNotificacionLeida, marcarTodasLeidas } from "@/app/(dashboard)/actions/notificaciones";
import Link from "next/link";

export function PanelNotificaciones() {
  const {
    notificaciones,
    noLeidas,
    cargando,
    panelAbierto,
    togglePanel,
    cerrarPanel,
    marcarLeida: marcarLeidaStore,
    marcarTodasLeidas: marcarTodasLeidasStore,
  } = useNotificacionesStore();

  async function handleMarcarLeida(id) {
    marcarLeidaStore(id);
    await marcarNotificacionLeida(id);
  }

  async function handleMarcarTodasLeidas() {
    marcarTodasLeidasStore();
    await marcarTodasLeidas();
  }

  return (
    <Popover open={panelAbierto} onOpenChange={(open) => (open ? togglePanel() : cerrarPanel())}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {noLeidas > 9 ? "9+" : noLeidas}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          {noLeidas > 0 && (
            <button
              onClick={handleMarcarTodasLeidas}
              className="text-xs text-primary hover:underline"
            >
              Marcar todas leidas
            </button>
          )}
        </div>

        <ListaNotificaciones
          notificaciones={notificaciones}
          cargando={cargando}
          onMarcarLeida={handleMarcarLeida}
        />

        <div className="p-2 border-t">
          <Link
            href="/dashboard/notificaciones"
            onClick={cerrarPanel}
            className="block text-center text-xs text-primary hover:underline py-1"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
