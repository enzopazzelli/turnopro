"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MENSAJES = {
  otp_expired: "El link de verificación expiró. Solicitá uno nuevo.",
  access_denied: "Acceso denegado. El link puede estar vencido o ser inválido.",
  invalid_request: "Link inválido. Solicitá uno nuevo.",
};

/**
 * Captura errores de Supabase que llegan como fragmentos hash (#error=...)
 * en lugar del callback. Redirige a /login con el mensaje correspondiente.
 */
export function HashErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.includes("error=")) return;

    const params = new URLSearchParams(hash.slice(1)); // quitar el #
    const errorCode = params.get("error_code") || params.get("error") || "auth_error";
    const mensaje = MENSAJES[errorCode] || "Error de autenticación. Intentá de nuevo.";

    // Limpiar el hash sin recargar
    window.history.replaceState(null, "", window.location.pathname);

    // Redirigir al login con el error como query param
    router.push(`/login?auth_error=${encodeURIComponent(mensaje)}`);
  }, [router]);

  return null;
}
