"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { LineaEvolucion } from "@/components/rubro/psicologia/linea-evolucion";
import { obtenerEvoluciones } from "@/app/(dashboard)/actions/psicologia";

export function EvolucionPage() {
  const [paciente, setPaciente] = useState(null);
  const [evoluciones, setEvoluciones] = useState([]);

  useEffect(() => {
    if (!paciente) { setEvoluciones([]); return; }
    obtenerEvoluciones(paciente.id).then(({ data }) => setEvoluciones(data));
  }, [paciente]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Paciente" onSeleccionar={setPaciente} seleccionado={paciente} />
      {paciente && <LineaEvolucion evoluciones={evoluciones} pacienteId={paciente.id} />}
    </div>
  );
}
