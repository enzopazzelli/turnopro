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
import { Download, DollarSign, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { exportarXLSX } from "@/lib/exportar-xlsx";
import { Skeleton } from "@/components/ui/skeleton";
import { LABELS_METODO_PAGO } from "@/lib/constants";

export function TabReporteIngresos({ datos, cargando }) {
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

  const { filas, resumen, fuentePagos } = datos;

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(valor);

  const handleExportar = () => {
    const columnas = fuentePagos
      ? ["fecha", "paciente", "servicio", "precio", "metodo_pago"]
      : ["fecha", "horaInicio", "paciente", "servicio", "precio"];
    const headers = fuentePagos
      ? ["Fecha", "Paciente", "Servicio", "Monto", "Metodo"]
      : ["Fecha", "Hora", "Paciente", "Servicio", "Precio"];
    const filasExport = fuentePagos
      ? filas.map((f) => ({ ...f, metodo_pago: LABELS_METODO_PAGO[f.metodo_pago] || f.metodo_pago }))
      : filas;
    exportarXLSX(filasExport, columnas, headers, "reporte-ingresos");
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {formatearPrecio(resumen.totalIngresos)}
              </p>
              <p className="text-xs text-muted-foreground">Ingresos totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {formatearPrecio(resumen.promedioIngreso)}
              </p>
              <p className="text-xs text-muted-foreground">Promedio por cita</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              #
            </div>
            <div>
              <p className="text-2xl font-bold">{resumen.totalCitas}</p>
              <p className="text-xs text-muted-foreground">Citas completadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Award className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold truncate max-w-[150px]">
                {resumen.servicioMasRentable}
              </p>
              <p className="text-xs text-muted-foreground">Mas rentable</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle de Ingresos</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </CardHeader>
        <CardContent>
          {filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay ingresos en el periodo seleccionado.
            </p>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    {!fuentePagos && <TableHead>Hora</TableHead>}
                    <TableHead>Paciente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">
                      {fuentePagos ? "Monto" : "Precio"}
                    </TableHead>
                    {fuentePagos && <TableHead>Metodo</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((fila) => (
                    <TableRow key={fila.id}>
                      <TableCell>{fila.fecha}</TableCell>
                      {!fuentePagos && <TableCell>{fila.horaInicio}</TableCell>}
                      <TableCell>{fila.paciente}</TableCell>
                      <TableCell>{fila.servicio}</TableCell>
                      <TableCell className="text-right">
                        {formatearPrecio(fila.precio)}
                      </TableCell>
                      {fuentePagos && (
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {LABELS_METODO_PAGO[fila.metodo_pago] || fila.metodo_pago}
                          </Badge>
                        </TableCell>
                      )}
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
