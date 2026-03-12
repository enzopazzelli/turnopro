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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Stethoscope, Trophy, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function TabReporteServicios({ datos, cargando }) {
  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ListChecks className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.totalCitas}</p>
              <p className="text-xs text-muted-foreground">Total citas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Stethoscope className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{resumen.totalServicios}</p>
              <p className="text-xs text-muted-foreground">Servicios activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-lg font-bold leading-tight truncate max-w-[180px]">{resumen.servicioTop}</p>
              <p className="text-xs text-muted-foreground">Servicio mas demandado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafico */}
      {filas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demanda por servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, filas.length * 48)}>
              <BarChart
                data={filas}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={160}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "total") return [value, "Total"];
                    if (name === "completadas") return [value, "Completadas"];
                    if (name === "canceladas") return [value, "Canceladas"];
                    return [value, name];
                  }}
                />
                <Bar dataKey="total" fill="#3b82f6" name="total" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completadas" fill="#22c55e" name="completadas" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por servicio</CardTitle>
        </CardHeader>
        <CardContent>
          {filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay citas en el periodo seleccionado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Completadas</TableHead>
                  <TableHead className="text-right">Canceladas</TableHead>
                  <TableHead className="text-right">Ingresos est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila, i) => (
                  <TableRow key={fila.nombre}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{fila.nombre}</TableCell>
                    <TableCell className="text-right">{fila.total}</TableCell>
                    <TableCell className="text-right text-green-600">{fila.completadas}</TableCell>
                    <TableCell className="text-right text-red-500">{fila.canceladas}</TableCell>
                    <TableCell className="text-right">${fila.ingresos.toLocaleString("es-AR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
