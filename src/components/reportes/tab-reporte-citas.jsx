"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, CalendarDays, CheckCircle, XCircle, UserX } from "lucide-react";
import { EstadoBadge } from "@/components/agenda/estado-badge";
import { exportarXLSX } from "@/lib/exportar-xlsx";
import { Skeleton } from "@/components/ui/skeleton";

export function TabReporteCitas({ datos, cargando }) {
  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="mt-1 h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!datos) return null;

  const { citas, resumen } = datos;

  const handleExportar = () => {
    exportarXLSX(
      citas,
      ["fecha", "horaInicio", "horaFin", "paciente", "servicio", "estado", "precio"],
      ["Fecha", "Hora Inicio", "Hora Fin", "Paciente", "Servicio", "Estado", "Precio"],
      "reporte-citas"
    );
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CalendarDays className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.total}</p>
              <p className="text-xs text-muted-foreground">Total citas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.completadas}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.canceladas}</p>
              <p className="text-xs text-muted-foreground">Canceladas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <UserX className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.noAsistio}</p>
              <p className="text-xs text-muted-foreground">No asistieron</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              %
            </div>
            <div>
              <p className="text-2xl font-bold">{resumen.tasaCompletacion}%</p>
              <p className="text-xs text-muted-foreground">Tasa completacion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle de Citas</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </CardHeader>
        <CardContent>
          {citas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay citas en el periodo seleccionado.
            </p>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citas.map((cita) => (
                    <TableRow key={cita.id}>
                      <TableCell>{cita.fecha}</TableCell>
                      <TableCell>
                        {cita.horaInicio} - {cita.horaFin}
                      </TableCell>
                      <TableCell>{cita.paciente}</TableCell>
                      <TableCell>{cita.servicio}</TableCell>
                      <TableCell>
                        <EstadoBadge estado={cita.estado} />
                      </TableCell>
                      <TableCell className="text-right">
                        ${cita.precio.toLocaleString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
