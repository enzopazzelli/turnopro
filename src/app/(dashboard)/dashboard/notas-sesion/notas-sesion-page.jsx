"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { NotasSesionLista } from "@/components/rubro/psicologia/notas-sesion-lista";
import { obtenerNotasSesion } from "@/app/(dashboard)/actions/psicologia";

export function NotasSesionPage() {
  const [paciente, setPaciente] = useState(null);
  const [notas, setNotas] = useState([]);

  useEffect(() => {
    if (!paciente) { setNotas([]); return; }
    obtenerNotasSesion(paciente.id).then(({ data }) => setNotas(data));
  }, [paciente]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Paciente" onSeleccionar={setPaciente} seleccionado={paciente} />
      {paciente && <NotasSesionLista notas={notas} pacienteId={paciente.id} />}
    </div>
  );
}
