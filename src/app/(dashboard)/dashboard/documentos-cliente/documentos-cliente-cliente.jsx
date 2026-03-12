"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { ArchivosPaciente } from "@/components/pacientes/archivos-paciente";

export function DocumentosClienteCliente() {
  const [cliente, setCliente] = useState(null);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Seleccionar cliente" onSeleccionar={setCliente} seleccionado={cliente} />

      {!cliente ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Seleccioná un cliente para ver y gestionar sus documentos.</p>
          </CardContent>
        </Card>
      ) : (
        <ArchivosPaciente pacienteId={cliente.id} />
      )}
    </div>
  );
}
