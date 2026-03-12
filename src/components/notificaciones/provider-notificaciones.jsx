"use client";

import { useNotificaciones } from "@/hooks/use-notificaciones";

export function NotificacionesProvider({ children }) {
  useNotificaciones();
  return children;
}
