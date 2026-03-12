"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HistoriaDentalDialog } from "./historia-dental-dialog";

export function HistoriaDentalCliente({ entradas = [], pacienteId }) {
  const [dialogAbierto, setDialogAbierto] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historia Clinica Dental</h3>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva entrada
        </Button>
      </div>

      {entradas.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay entradas registradas
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Diagnostico</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Dientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradas.map((entrada) => (
                <TableRow key={entrada.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(entrada.fecha), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entrada.diagnostico || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entrada.procedimiento || "-"}
                  </TableCell>
                  <TableCell>
                    {entrada.dientes_afectados?.join(", ") || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <HistoriaDentalDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        pacienteId={pacienteId}
      />
    </div>
  );
}
