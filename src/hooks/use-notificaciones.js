"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificacionesStore } from "@/stores/notificaciones-store";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function useNotificaciones() {
  const { usuario, tenant } = useAuthStore();
  const { setNotificaciones, agregarNotificacion } = useNotificacionesStore();
  const suscripcionRef = useRef(null);

  useEffect(() => {
    if (!usuario?.id || !tenant?.id) return;

    const supabase = createClient();

    // Carga inicial de notificaciones in_app
    async function cargarNotificaciones() {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("canal", "in_app")
        .eq("usuario_id", usuario.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotificaciones(data);
      }
    }

    cargarNotificaciones();

    // Suscripcion Realtime
    const canal = supabase
      .channel(`notificaciones:${tenant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          const nueva = payload.new;
          // Solo agregar si es in_app y para este usuario
          if (nueva.canal === "in_app" && nueva.usuario_id === usuario.id) {
            agregarNotificacion(nueva);
            toast(nueva.titulo, {
              description: nueva.mensaje?.slice(0, 100),
            });
          }
        }
      )
      .subscribe();

    suscripcionRef.current = canal;

    return () => {
      if (suscripcionRef.current) {
        supabase.removeChannel(suscripcionRef.current);
      }
    };
  }, [usuario?.id, tenant?.id]);
}
