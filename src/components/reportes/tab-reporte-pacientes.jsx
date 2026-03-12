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
import { Badge } from "@/components/ui/badge";
import { Download, Users, UserPlus, UserCheck, BarChart3 } from "lucide-react";
import { useRubro } from "@/hooks/use-rubro";
import { exportarXLSX } from "@/lib/exportar-xlsx";
import { Skeleton } from "@/components/ui/skeleton";

export function TabReportePacientes({ datos, cargando }) {
  const rubro = useRubro();
  const label = rubro?.crm?.terminoPlural || "Pacientes";

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

  const { filas, resumen } = datos;

  const handleExportar = () => {
    exportarXLSX(
      filas,
      ["nombre", "totalVisitas", "completadas", "noAsistio", "primeraVisita", "ultimaVisita", "esNuevo"],
      ["Nombre", "Total Visitas", "Completadas", "No Asistio", "Primera Visita", "Ultima Visita", "Es Nuevo"],
      `reporte-${label.toLowerCase()}`
    );
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.totalPacientes}</p>
              <p className="text-xs text-muted-foreground">Total {label.toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <UserPlus className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.nuevos}</p>
              <p className="text-xs text-muted-foreground">Nuevos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <UserCheck className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.recurrentes}</p>
              <p className="text-xs text-muted-foreground">Recurrentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BarChart3 className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.promedioVisitas}</p>
              <p className="text-xs text-muted-foreground">Promedio visitas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle por {label}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </CardHeader>
        <CardContent>
          {filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay {label.toLowerCase()} en el periodo seleccionado.
            </p>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Visitas</TableHead>
                    <TableHead className="text-center">Completadas</TableHead>
                    <TableHead className="text-center">No asistio</TableHead>
                    <TableHead>Primera visita</TableHead>
                    <TableHead>Ultima visita</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((fila, i) => (
                    <TableRow key={fila.pacienteId || i}>
                      <TableCell className="font-medium">{fila.nombre}</TableCell>
                      <TableCell className="text-center">{fila.totalVisitas}</TableCell>
                      <TableCell className="text-center">{fila.completadas}</TableCell>
                      <TableCell className="text-center">{fila.noAsistio}</TableCell>
                      <TableCell>{fila.primeraVisita}</TableCell>
                      <TableCell>{fila.ultimaVisita}</TableCell>
                      <TableCell>
                        <Badge variant={fila.esNuevo ? "default" : "secondary"}>
                          {fila.esNuevo ? "Nuevo" : "Recurrente"}
                        </Badge>
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
