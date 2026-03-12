"use client";

import { useState, useEffect, useTransition } from "react";
import { DollarSign, FileText, Download, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PagosTabla } from "./pagos-tabla";
import { CuentaCorriente } from "./cuenta-corriente";
import { descargarReciboPDF } from "./recibo-pdf";
import { obtenerRecibos } from "@/app/(dashboard)/actions/facturacion";
import { LABELS_METODO_PAGO } from "@/lib/constants";
import { toast } from "sonner";

function RecibosTab() {
  const [recibos, setRecibos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const { data } = await obtenerRecibos();
      setRecibos(data);
      setCargando(false);
    };
    cargar();
  }, []);

  const handleDescargar = (recibo) => {
    startTransition(async () => {
      try {
        await descargarReciboPDF(recibo);
        toast.success("Recibo descargado");
      } catch (err) {
        console.error("Error al descargar recibo:", err);
        toast.error("Error al generar el PDF");
      }
    });
  };

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(valor);

  if (cargando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {recibos.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No hay recibos generados.</p>
            <p className="text-xs mt-1">
              Registra un pago y genera un recibo desde la tabla de pagos.
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Recibo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recibos.map((recibo) => {
                  const nombrePaciente =
                    recibo.pagos?.pacientes?.nombre_completo ||
                    recibo.pagos?.citas?.paciente_nombre ||
                    recibo.datos_recibo?.paciente?.nombre ||
                    "—";
                  return (
                    <TableRow key={recibo.id}>
                      <TableCell className="font-mono font-medium">
                        #{String(recibo.numero_recibo).padStart(4, "0")}
                      </TableCell>
                      <TableCell>{nombrePaciente}</TableCell>
                      <TableCell>{recibo.pagos?.fecha_pago || "—"}</TableCell>
                      <TableCell className="text-right">
                        {formatearPrecio(recibo.pagos?.monto || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {LABELS_METODO_PAGO[recibo.pagos?.metodo_pago] || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={recibo.estado === "emitido" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {recibo.estado === "emitido" ? "Emitido" : "Anulado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDescargar(recibo)}
                        >
                          <Download className="mr-1 h-4 w-4" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FacturacionCliente() {
  return (
    <Tabs defaultValue="pagos" className="space-y-6">
      <TabsList>
        <TabsTrigger value="pagos">
          <DollarSign className="mr-2 h-4 w-4" />
          Pagos
        </TabsTrigger>
        <TabsTrigger value="cuenta-corriente">
          <Users className="mr-2 h-4 w-4" />
          Cuenta Corriente
        </TabsTrigger>
        <TabsTrigger value="recibos">
          <FileText className="mr-2 h-4 w-4" />
          Recibos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pagos">
        <PagosTabla />
      </TabsContent>

      <TabsContent value="cuenta-corriente">
        <CuentaCorriente />
      </TabsContent>

      <TabsContent value="recibos">
        <RecibosTab />
      </TabsContent>
    </Tabs>
  );
}
