"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { PlanesTratamientoLista } from "@/components/rubro/odontologia/planes-tratamiento-lista";
import { obtenerPlanesTratamiento } from "@/app/(dashboard)/actions/odontologia";

export function TratamientosPage() {
  const [paciente, setPaciente] = useState(null);
  const [planes, setPlanes] = useState([]);

  useEffect(() => {
    if (!paciente) { setPlanes([]); return; }
    obtenerPlanesTratamiento(paciente.id).then(({ data }) => setPlanes(data));
  }, [paciente]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Paciente" onSeleccionar={setPaciente} seleccionado={paciente} />
      {paciente && (
        <PlanesTratamientoLista
          planes={planes}
          pacienteId={paciente.id}
          pacienteNombre={paciente.nombre_completo}
        />
      )}
    </div>
  );
}
