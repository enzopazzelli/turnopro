"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { SignosVitalesChart } from "@/components/rubro/medicina/signos-vitales-chart";
import { SignosVitalesTabla } from "@/components/rubro/medicina/signos-vitales-tabla";
import { SignosVitalesDialog } from "@/components/rubro/medicina/signos-vitales-dialog";
import { obtenerSignosVitales } from "@/app/(dashboard)/actions/medicina";

export function SignosVitalesPage() {
  const [paciente, setPaciente] = useState(null);
  const [datos, setDatos] = useState([]);
  const [dialogAbierto, setDialogAbierto] = useState(false);

  useEffect(() => {
    if (!paciente) { setDatos([]); return; }
    obtenerSignosVitales(paciente.id).then(({ data }) => setDatos(data));
  }, [paciente]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SelectorPaciente label="Paciente" onSeleccionar={setPaciente} seleccionado={paciente} />
        {paciente && (
          <Button onClick={() => setDialogAbierto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Registrar
          </Button>
        )}
      </div>

      {paciente && (
        <>
          <SignosVitalesChart datos={datos} />
          <SignosVitalesTabla datos={datos} />
        </>
      )}

      {paciente && (
        <SignosVitalesDialog
          abierto={dialogAbierto}
          onCerrar={() => setDialogAbierto(false)}
          pacienteId={paciente.id}
        />
      )}
    </div>
  );
}
