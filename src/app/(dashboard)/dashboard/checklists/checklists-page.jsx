"use client";

import { useState, useEffect } from "react";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { ChecklistsCliente } from "@/components/rubro/contadores/checklists-cliente";
import { obtenerChecklists } from "@/app/(dashboard)/actions/contadores";

export function ChecklistsPage() {
  const [cliente, setCliente] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [todosChecklists, setTodosChecklists] = useState([]);

  // Cargar todos al inicio
  useEffect(() => {
    obtenerChecklists().then(({ data }) => setTodosChecklists(data));
  }, []);

  // Filtrar por cliente
  useEffect(() => {
    if (!cliente) {
      setChecklists(todosChecklists);
    } else {
      setChecklists(todosChecklists.filter((c) => c.paciente_id === cliente.id));
    }
  }, [cliente, todosChecklists]);

  return (
    <div className="space-y-6">
      <SelectorPaciente label="Cliente (filtrar)" onSeleccionar={setCliente} seleccionado={cliente} />
      <ChecklistsCliente checklists={checklists} pacienteId={cliente?.id} />
    </div>
  );
}
