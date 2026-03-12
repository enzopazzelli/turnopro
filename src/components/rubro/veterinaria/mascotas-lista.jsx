"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ESPECIES_MASCOTA } from "@/lib/constants";
import { MascotaDialog } from "./mascota-dialog";
import { obtenerMascotas } from "@/app/(dashboard)/actions/veterinaria";

const ICONOS_ESPECIE = {
  perro: "🐕",
  gato: "🐈",
  ave: "🐦",
  reptil: "🦎",
  roedor: "🐹",
  otro: "🐾",
};

export function MascotasLista({ mascotasIniciales = [] }) {
  const router = useRouter();
  const [mascotas, setMascotas] = useState(mascotasIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("");
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const cargar = useCallback(async () => {
    const { data } = await obtenerMascotas();
    let filtradas = data || [];
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase();
      filtradas = filtradas.filter(
        (m) =>
          m.nombre.toLowerCase().includes(term) ||
          m.raza?.toLowerCase().includes(term) ||
          m.pacientes?.nombre_completo?.toLowerCase().includes(term)
      );
    }
    if (filtroEspecie) {
      filtradas = filtradas.filter((m) => m.especie === filtroEspecie);
    }
    setMascotas(filtradas);
  }, [busqueda, filtroEspecie]);

  useEffect(() => {
    const timeout = setTimeout(cargar, 300);
    return () => clearTimeout(timeout);
  }, [cargar]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mascotas</h3>
        <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva mascota
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, raza o tutor..."
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          <Badge
            variant={filtroEspecie === "" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroEspecie("")}
          >
            Todas
          </Badge>
          {ESPECIES_MASCOTA.map((esp) => (
            <Badge
              key={esp.valor}
              variant={filtroEspecie === esp.valor ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFiltroEspecie(esp.valor === filtroEspecie ? "" : esp.valor)}
            >
              {esp.nombre}
            </Badge>
          ))}
        </div>
      </div>

      {mascotas.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay mascotas registradas
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mascotas.map((mascota) => (
            <div
              key={mascota.id}
              className="border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => router.push(`/dashboard/mascotas/${mascota.id}`)}
            >
              <div className="flex items-center gap-3">
                {mascota.foto_url ? (
                  <img
                    src={mascota.foto_url}
                    alt={mascota.nombre}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl">
                    {ICONOS_ESPECIE[mascota.especie] || "🐾"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{mascota.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {ESPECIES_MASCOTA.find((e) => e.valor === mascota.especie)?.nombre}
                    {mascota.raza && ` - ${mascota.raza}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tutor: {mascota.pacientes?.nombre_completo || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MascotaDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => {
          setDialogAbierto(false);
          cargar();
        }}
      />
    </div>
  );
}
