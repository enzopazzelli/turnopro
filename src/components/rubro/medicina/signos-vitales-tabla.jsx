"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SignosVitalesTabla({ datos = [] }) {
  if (datos.length === 0) return null;

  const datosOrdenados = [...datos].reverse();

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Peso</TableHead>
            <TableHead>Altura</TableHead>
            <TableHead>PA</TableHead>
            <TableHead>Temp</TableHead>
            <TableHead>FC</TableHead>
            <TableHead>SpO2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datosOrdenados.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(d.fecha), "dd/MM/yyyy", { locale: es })}
              </TableCell>
              <TableCell>{d.peso_kg ? `${d.peso_kg} kg` : "-"}</TableCell>
              <TableCell>{d.altura_cm ? `${d.altura_cm} cm` : "-"}</TableCell>
              <TableCell>
                {d.presion_sistolica && d.presion_diastolica
                  ? `${d.presion_sistolica}/${d.presion_diastolica}`
                  : "-"}
              </TableCell>
              <TableCell>{d.temperatura ? `${d.temperatura}°C` : "-"}</TableCell>
              <TableCell>{d.frecuencia_cardiaca ? `${d.frecuencia_cardiaca}` : "-"}</TableCell>
              <TableCell>{d.saturacion_o2 ? `${d.saturacion_o2}%` : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
