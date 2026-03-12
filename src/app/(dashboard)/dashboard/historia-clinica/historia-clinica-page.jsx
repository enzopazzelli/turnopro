"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { HistoriaClinicaLista } from "@/components/rubro/medicina/historia-clinica-lista";
import { obtenerHistoriaClinica } from "@/app/(dashboard)/actions/medicina";

export function HistoriaClinicaPage() {
  const [paciente, setPaciente] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [medicacion, setMedicacion] = useState([]);

  useEffect(() => {
    if (!paciente) { setEntradas([]); setAlergias([]); setMedicacion([]); return; }
    obtenerHistoriaClinica(paciente.id).then(({ data }) => {
      setEntradas(data);
      setAlergias([...new Set(data.flatMap((e) => e.alergias || []))]);
      setMedicacion([...new Set(data.flatMap((e) => e.medicacion_cronica || []))]);
    });
  }, [paciente]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Paciente" onSeleccionar={setPaciente} seleccionado={paciente} />
      {paciente && (
        <HistoriaClinicaLista
          entradas={entradas}
          pacienteId={paciente.id}
          alergias={alergias}
          medicacion={medicacion}
        />
      )}
    </div>
  );
}
