"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PacienteDialog } from "./paciente-dialog";
import { ImportarCSVDialog } from "./importar-csv-dialog";
import {
  eliminarPaciente,
  obtenerPacientes,
} from "@/app/(dashboard)/actions/pacientes";
import { useRubro } from "@/hooks/use-rubro";
import { exportarCSV } from "@/lib/exportar-csv";
import { toast } from "sonner";
import { PlanGate } from "@/components/plan-gate";

export function PacientesCliente({ pacientesIniciales }) {
  const router = useRouter();
  const { terminoPaciente, crm } = useRubro();
  const mostrarObraSocial = crm.campos.obra_social;
  const etiquetasDisponibles = crm.etiquetas;
  const totalColumnas = mostrarObraSocial ? 6 : 5;

  const [pacientes, setPacientes] = useState(pacientesIniciales);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [pacienteEditar, setPacienteEditar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [etiquetaFiltro, setEtiquetaFiltro] = useState("");
  const [importarAbierto, setImportarAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sincronizar con datos del servidor
  useEffect(() => {
    setPacientes(pacientesIniciales);
  }, [pacientesIniciales]);

  // Buscar/filtrar con debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const { data } = await obtenerPacientes(busqueda, etiquetaFiltro);
        setPacientes(data);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [busqueda, etiquetaFiltro]);

  function abrirNuevo() {
    setPacienteEditar(null);
    setDialogKey((k) => k + 1);
    setDialogAbierto(true);
  }

  function abrirEditar(e, paciente) {
    e.stopPropagation();
    setPacienteEditar(paciente);
    setDialogKey((k) => k + 1);
    setDialogAbierto(true);
  }

  function cerrarDialog() {
    setDialogAbierto(false);
    setPacienteEditar(null);
    router.refresh();
  }

  function handleEliminar(e, id) {
    e.stopPropagation();
    if (!confirm(`¿Desactivar este ${terminoPaciente.toLowerCase()}?`)) return;

    startTransition(async () => {
      const result = await eliminarPaciente(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setPacientes((prev) => prev.filter((p) => p.id !== id));
        toast.success(`${terminoPaciente} desactivado`);
      }
    });
  }

  function toggleEtiquetaFiltro(etiqueta) {
    setEtiquetaFiltro((prev) => (prev === etiqueta ? "" : etiqueta));
  }

  function irADetalle(id) {
    router.push(`/dashboard/pacientes/${id}`);
  }

  function handleExportarCSV() {
    if (pacientes.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const columnas = ["nombre_completo", "telefono", "email", "dni", "obra_social", "direccion", "etiquetas"];
    const encabezados = ["Nombre", "Telefono", "Email", "DNI", "Obra Social", "Direccion", "Etiquetas"];

    const datos = pacientes.map((p) => ({
      ...p,
      etiquetas: (p.etiquetas || []).join(", "),
    }));

    exportarCSV(datos, columnas, encabezados, crm.terminoPlural.toLowerCase());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {crm.terminoPlural}
          </h2>
          <p className="text-muted-foreground">
            Gestion de {crm.terminoPlural.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlanGate feature="exportar_csv" fallback={null}>
            <Button variant="outline" onClick={() => setImportarAbierto(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" onClick={handleExportarCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </PlanGate>
          <Button onClick={abrirNuevo}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo {terminoPaciente.toLowerCase()}
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, telefono o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filtro por etiquetas */}
      <div className="flex flex-wrap gap-2">
        {etiquetasDisponibles.map((etiqueta) => (
          <Badge
            key={etiqueta}
            variant={etiquetaFiltro === etiqueta ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => toggleEtiquetaFiltro(etiqueta)}
          >
            {etiqueta}
          </Badge>
        ))}
        {etiquetaFiltro && (
          <Badge
            variant="secondary"
            className="cursor-pointer select-none"
            onClick={() => setEtiquetaFiltro("")}
          >
            Limpiar filtro
          </Badge>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Email</TableHead>
              {mostrarObraSocial && <TableHead>{crm.columnaExtra}</TableHead>}
              <TableHead>Etiquetas</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColumnas}
                  className="text-center py-8 text-muted-foreground"
                >
                  {busqueda || etiquetaFiltro
                    ? `No se encontraron ${crm.terminoPlural.toLowerCase()} con esos filtros.`
                    : `No hay ${crm.terminoPlural.toLowerCase()} registrados. Crea tu primer ${terminoPaciente.toLowerCase()} para comenzar.`}
                </TableCell>
              </TableRow>
            ) : (
              pacientes.map((paciente) => (
                <TableRow
                  key={paciente.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => irADetalle(paciente.id)}
                >
                  <TableCell className="font-medium">
                    {paciente.nombre_completo}
                    {paciente.dni && (
                      <p className="text-sm text-muted-foreground">
                        DNI: {paciente.dni}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{paciente.telefono || "-"}</TableCell>
                  <TableCell>{paciente.email || "-"}</TableCell>
                  {mostrarObraSocial && (
                    <TableCell>{paciente.obra_social || "-"}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(paciente.etiquetas || []).map((etiqueta) => (
                        <Badge key={etiqueta} variant="secondary" className="text-xs">
                          {etiqueta}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => abrirEditar(e, paciente)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEliminar(e, paciente.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PacienteDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={cerrarDialog}
        paciente={pacienteEditar}
      />

      <ImportarCSVDialog
        abierto={importarAbierto}
        onCerrar={() => {
          setImportarAbierto(false);
          router.refresh();
        }}
      />
    </div>
  );
}
