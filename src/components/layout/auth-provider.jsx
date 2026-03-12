"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ datosIniciales, children }) {
  const router = useRouter();
  const setDatosAuth = useAuthStore((s) => s.setDatosAuth);
  const limpiar = useAuthStore((s) => s.limpiar);
  const inicializado = useRef(false);

  useEffect(() => {
    if (!inicializado.current) {
      setDatosAuth(datosIniciales);
      inicializado.current = true;
    }
  }, [datosIniciales, setDatosAuth]);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        limpiar();
        router.push("/login");
      }
      if (event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [limpiar, router]);

  return children;
}
