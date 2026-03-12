"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cerrarSesion } from "@/app/(auth)/actions";

const STORAGE_KEY = "turnopro_admin_access";

export function AdminAccessBanner() {
  const [visible, setVisible] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const fromUrl = searchParams.get("admin_access") === "true";
    const fromStorage = sessionStorage.getItem(STORAGE_KEY) === "true";

    if (fromUrl) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setVisible(true);
      // Limpiar el query param de la URL sin recargar
      router.replace("/dashboard");
    } else if (fromStorage) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleSalir() {
    sessionStorage.removeItem(STORAGE_KEY);
    startTransition(async () => {
      await cerrarSesion();
    });
  }

  return (
    <div className="bg-amber-400 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 shrink-0" />
        <span>Sesión generada por administrador — acceso temporal a esta cuenta.</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-amber-700 bg-amber-300 hover:bg-amber-500 text-amber-950"
        onClick={handleSalir}
        disabled={pending}
      >
        <LogOut className="h-3.5 w-3.5 mr-1" />
        {pending ? "Saliendo..." : "Cerrar sesión"}
      </Button>
    </div>
  );
}
