"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { OdontogramaCompleto } from "@/components/rubro/odontologia/odontograma-completo";
import { obtenerOdontograma } from "@/app/(dashboard)/actions/odontologia";

export function OdontogramaPage() {
  const [paciente, setPaciente] = useState(null);
  const [odontograma, setOdontograma] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!paciente) {
      setOdontograma(null);
      return;
    }
    setCargando(true);
    obtenerOdontograma(paciente.id).then((res) => {
      if (res.error) {
        console.error("Error odontograma:", res.error);
      }
      setOdontograma(res.data);
      setCargando(false);
    }).catch((err) => {
      console.error("Error cargando odontograma:", err);
      setCargando(false);
    });
  }, [paciente]);

  return (
    <div className="space-y-6">
      <SelectorPaciente
        label="Paciente"
        onSeleccionar={setPaciente}
        seleccionado={paciente}
      />

      {cargando && <p className="text-muted-foreground">Cargando odontograma...</p>}

      {odontograma && (
        <OdontogramaCompleto
          odontograma={odontograma}
          pacienteNombre={paciente?.nombre_completo}
        />
      )}
    </div>
  );
}
