"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { RecetaLista } from "@/components/rubro/medicina/receta-lista";
import { obtenerRecetas } from "@/app/(dashboard)/actions/recetas";
import { RUBROS } from "@/config/rubros";

export function RecetasPage({ rubro }) {
  const [paciente, setPaciente] = useState(null);
  const [recetas, setRecetas] = useState([]);

  const terminoPaciente = RUBROS[rubro]?.terminoPaciente || "Paciente";

  useEffect(() => {
    if (!paciente) { setRecetas([]); return; }
    obtenerRecetas(paciente.id).then(({ data }) => setRecetas(data));
  }, [paciente]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label={terminoPaciente} onSeleccionar={setPaciente} seleccionado={paciente} />
      {paciente && <RecetaLista recetas={recetas} pacienteId={paciente.id} rubro={rubro} />}
    </div>
  );
}
