"use client";

import { useState, useEffect } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buscarPacientesParaCita,
  obtenerPacientesRecientes,
} from "@/app/(dashboard)/actions/pacientes";

export function SelectorPaciente({ label = "Paciente", onSeleccionar, seleccionado = null }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [cargandoRecientes, setCargandoRecientes] = useState(true);

  useEffect(() => {
    obtenerPacientesRecientes().then(({ data }) => {
      setRecientes(data || []);
      setCargandoRecientes(false);
    });
  }, []);

  useEffect(() => {
    if (busqueda.length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await buscarPacientesParaCita(busqueda);
      setResultados(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  if (seleccionado) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 max-w-sm">
        <span className="flex-1 text-sm font-medium">{seleccionado.nombre_completo}</span>
        <button
          type="button"
          onClick={() => onSeleccionar(null)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cambiar
        </button>
      </div>
    );
  }

  const mostrarRecientes = busqueda.length < 2 && recientes.length > 0;

  return (
    <div className="space-y-4">
      <div className="max-w-sm space-y-2">
        <Label>{label}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${label.toLowerCase()}...`}
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {resultados.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => {
                    onSeleccionar(p);
                    setBusqueda("");
                    setResultados([]);
                  }}
                >
                  {p.nombre_completo}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {mostrarRecientes && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Recientes</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recientes.map((p) => {
              const iniciales = p.nombre_completo
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSeleccionar(p)}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{iniciales}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.nombre_completo}</p>
                    {p.telefono && (
                      <p className="text-xs text-muted-foreground truncate">{p.telefono}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {cargandoRecientes && busqueda.length < 2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
