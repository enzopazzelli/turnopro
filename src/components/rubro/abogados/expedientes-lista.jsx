"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { ESTADOS_EXPEDIENTE } from "@/lib/constants";
import { ExpedienteDialog } from "./expediente-dialog";
import { obtenerExpedientes } from "@/app/(dashboard)/actions/abogados";

export function ExpedientesLista({ expedientesIniciales = [] }) {
  const router = useRouter();
  const [expedientes, setExpedientes] = useState(expedientesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const cargar = useCallback(async () => {
    const { data } = await obtenerExpedientes(busqueda, filtroEstado);
    setExpedientes(data);
  }, [busqueda, filtroEstado]);

  useEffect(() => {
    const timeout = setTimeout(cargar, 300);
    return () => clearTimeout(timeout);
  }, [cargar]);

  const getColorEstado = (estado) => {
    return ESTADOS_EXPEDIENTE.find((e) => e.valor === estado)?.color || "#6b7280";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Expedientes</h3>
        <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo expediente
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por caratula o numero..."
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          <Badge
            variant={filtroEstado === "" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroEstado("")}
          >
            Todos
          </Badge>
          {ESTADOS_EXPEDIENTE.map((est) => (
            <Badge
              key={est.valor}
              variant={filtroEstado === est.valor ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFiltroEstado(est.valor === filtroEstado ? "" : est.valor)}
              style={filtroEstado === est.valor ? { backgroundColor: est.color } : {}}
            >
              {est.nombre}
            </Badge>
          ))}
        </div>
      </div>

      {expedientes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay expedientes registrados
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caratula</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha inicio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expedientes.map((exp) => (
                <TableRow
                  key={exp.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => router.push(`/dashboard/expedientes/${exp.id}`)}
                >
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {exp.caratula}
                  </TableCell>
                  <TableCell>{exp.numero_expediente || "-"}</TableCell>
                  <TableCell>{exp.pacientes?.nombre_completo || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{ borderColor: getColorEstado(exp.estado), color: getColorEstado(exp.estado) }}
                    >
                      {ESTADOS_EXPEDIENTE.find((e) => e.valor === exp.estado)?.nombre || exp.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {exp.fecha_inicio
                      ? format(new Date(exp.fecha_inicio), "dd/MM/yyyy", { locale: es })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExpedienteDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => {
          setDialogAbierto(false);
          cargar();
        }}
      />
    </div>
  );
}
