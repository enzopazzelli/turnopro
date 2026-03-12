"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { HistoriaDentalCliente } from "@/components/rubro/odontologia/historia-dental-cliente";
import { obtenerHistoriaDental } from "@/app/(dashboard)/actions/odontologia";

export function HistoriaDentalPage() {
  const [paciente, setPaciente] = useState(null);
  const [entradas, setEntradas] = useState([]);

  useEffect(() => {
    if (!paciente) { setEntradas([]); return; }
    obtenerHistoriaDental(paciente.id).then(({ data }) => setEntradas(data));
  }, [paciente]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Paciente" onSeleccionar={setPaciente} seleccionado={paciente} />
      {paciente && <HistoriaDentalCliente entradas={entradas} pacienteId={paciente.id} />}
    </div>
  );
}
