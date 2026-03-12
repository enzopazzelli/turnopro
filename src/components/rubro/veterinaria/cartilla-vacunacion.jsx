"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { format, isPast, addDays, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VacunacionDialog } from "./vacunacion-dialog";

export function CartillaVacunacion({ vacunas = [], mascotaId }) {
  const [dialogAbierto, setDialogAbierto] = useState(false);

  const getEstadoProxima = (fechaProxima) => {
    if (!fechaProxima) return null;
    const fecha = new Date(fechaProxima);
    if (isPast(fecha)) return { label: "Vencida", color: "destructive" };
    if (isAfter(addDays(new Date(), 30), fecha)) return { label: "Proxima", color: "warning" };
    return { label: "Al dia", color: "default" };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cartilla de Vacunacion</h3>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" /> Registrar vacuna
        </Button>
      </div>

      {vacunas.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No hay vacunas registradas
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vacuna</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proxima</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Veterinario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacunas.map((v) => {
                const estadoProx = getEstadoProxima(v.fecha_proxima);
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.vacuna}</TableCell>
                    <TableCell>
                      {format(new Date(v.fecha_aplicacion), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {v.fecha_proxima ? (
                        <span className="flex items-center gap-2">
                          {format(new Date(v.fecha_proxima), "dd/MM/yyyy", { locale: es })}
                          {estadoProx && (
                            <Badge variant={estadoProx.color === "warning" ? "outline" : estadoProx.color} className={estadoProx.color === "warning" ? "border-yellow-500 text-yellow-600" : ""}>
                              {estadoProx.label}
                            </Badge>
                          )}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{v.lote || "-"}</TableCell>
                    <TableCell>{v.veterinario || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <VacunacionDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        mascotaId={mascotaId}
      />
    </div>
  );
}
