"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { HistorialMascota } from "@/components/rubro/veterinaria/historial-mascota";
import { obtenerMascotas, obtenerHistorialMascota } from "@/app/(dashboard)/actions/veterinaria";

export function HistorialMascotaPage() {
  const [tutor, setTutor] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [consultas, setConsultas] = useState([]);

  useEffect(() => {
    if (!tutor) { setMascotas([]); setMascotaSeleccionada(null); return; }
    obtenerMascotas(tutor.id).then(({ data }) => setMascotas(data));
  }, [tutor]);

  useEffect(() => {
    if (!mascotaSeleccionada) { setConsultas([]); return; }
    obtenerHistorialMascota(mascotaSeleccionada.id).then(({ data }) => setConsultas(data));
  }, [mascotaSeleccionada]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Tutor" onSeleccionar={setTutor} seleccionado={tutor} />

      {mascotas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Mascotas del tutor:</p>
          <div className="flex gap-2 flex-wrap">
            {mascotas.map((m) => (
              <button
                key={m.id}
                onClick={() => setMascotaSeleccionada(m)}
                className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                  mascotaSeleccionada?.id === m.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {m.nombre} ({m.especie})
              </button>
            ))}
          </div>
        </div>
      )}

      {mascotaSeleccionada && (
        <HistorialMascota consultas={consultas} mascotaId={mascotaSeleccionada.id} />
      )}
    </div>
  );
}
