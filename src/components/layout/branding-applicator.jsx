"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function BrandingApplicator() {
  const tenant = useAuthStore((s) => s.tenant);

  useEffect(() => {
    const branding = tenant?.configuracion?.branding;
    if (!branding) return;

    const root = document.documentElement;
    if (branding.color_primario) {
      root.style.setProperty("--brand-primary", branding.color_primario);
    }
    if (branding.color_encabezado) {
      root.style.setProperty("--brand-header", branding.color_encabezado);
    }
  }, [tenant]);

  return null;
}
