"use client";

import { useState, useEffect, useTransition } from "react";
import { format, subMonths } from "date-fns";
import {
  DollarSign,
  Hash,
  CreditCard,
  Download,
  FileText,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectorRangoFechas } from "@/components/reportes/selector-rango-fechas";
import { PagoDialog } from "./pago-dialog";
import { AnularPagoDialog } from "./anular-pago-dialog";
import { obtenerPagos, generarRecibo } from "@/app/(dashboard)/actions/facturacion";
import { LABELS_METODO_PAGO } from "@/lib/constants";
import { exportarXLSX } from "@/lib/exportar-xlsx";
import { toast } from "sonner";

export function PagosTabla() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [rango, setRango] = useState({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false);
  const [dialogAnularAbierto, setDialogAnularAbierto] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  const cargarPagos = async () => {
    setCargando(true);
    const filtros = {};
    if (rango?.from) filtros.fecha_inicio = format(rango.from, "yyyy-MM-dd");
    if (rango?.to) filtros.fecha_fin = format(rango.to, "yyyy-MM-dd");
    if (filtroMetodo !== "todos") filtros.metodo_pago = filtroMetodo;

    const { data } = await obtenerPagos(filtros);
    setPagos(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarPagos();
  }, [rango, filtroMetodo]);

  const pagosActivos = pagos.filter((p) => !p.anulado);
  const totalCobrado = pagosActivos.reduce((acc, p) => acc + Number(p.monto), 0);
  const cantidadPagos = pagosActivos.length;

  // Metodo mas usado
  const conteoMetodos = {};
  pagosActivos.forEach((p) => {
    conteoMetodos[p.metodo_pago] = (conteoMetodos[p.metodo_pago] || 0) + 1;
  });
  const metodoMasUsado = Object.entries(conteoMetodos).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(valor);

  const handleGenerarRecibo = (pago) => {
    startTransition(async () => {
      const { data, error, yaExiste } = await generarRecibo(pago.id);
      if (error) {
        toast.error(error);
      } else if (yaExiste) {
        toast.info(`Ya existe recibo #${data.numero_recibo} para este pago`);
      } else {
        toast.success(`Recibo #${data.numero_recibo} generado`);
      }
    });
  };

  const handleAnular = (pago) => {
    setPagoSeleccionado(pago);
    setDialogAnularAbierto(true);
  };

  const handleExportar = () => {
    const filas = pagosActivos.map((p) => ({
      fecha: p.fecha_pago,
      paciente: p.pacientes?.nombre_completo || p.citas?.paciente_nombre || "—",
      servicio: p.citas?.servicios?.nombre || "—",
      monto: Number(p.monto),
      metodo: LABELS_METODO_PAGO[p.metodo_pago] || p.metodo_pago,
      referencia: p.referencia || "",
    }));
    exportarXLSX(
      filas,
      ["fecha", "paciente", "servicio", "monto", "metodo", "referencia"],
      ["Fecha", "Paciente", "Servicio", "Monto", "Metodo", "Referencia"],
      "pagos"
    );
  };

  const obtenerNombrePaciente = (pago) =>
    pago.pacientes?.nombre_completo || pago.citas?.paciente_nombre || "—";

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="mt-1 h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{formatearPrecio(totalCobrado)}</p>
              <p className="text-xs text-muted-foreground">Total cobrado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Hash className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{cantidadPagos}</p>
              <p className="text-xs text-muted-foreground">Pagos registrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CreditCard className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold truncate max-w-[150px]">
                {metodoMasUsado ? LABELS_METODO_PAGO[metodoMasUsado] : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Metodo mas usado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <SelectorRangoFechas rango={rango} onCambio={setRango} />
        <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Metodo de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los metodos</SelectItem>
            {Object.entries(LABELS_METODO_PAGO).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button size="sm" onClick={() => setDialogPagoAbierto(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Registrar pago
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No hay pagos en el periodo seleccionado.
            </p>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow
                      key={pago.id}
                      className={pago.anulado ? "opacity-50 line-through" : ""}
                    >
                      <TableCell>{pago.fecha_pago}</TableCell>
                      <TableCell>{obtenerNombrePaciente(pago)}</TableCell>
                      <TableCell>
                        {pago.citas?.servicios?.nombre || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatearPrecio(pago.monto)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {LABELS_METODO_PAGO[pago.metodo_pago] || pago.metodo_pago}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {pago.referencia || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!pago.anulado && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Generar recibo"
                              disabled={isPending}
                              onClick={() => handleGenerarRecibo(pago)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="Anular pago"
                              onClick={() => handleAnular(pago)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {pago.anulado && (
                          <Badge variant="destructive" className="text-xs">
                            Anulado
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PagoDialog
        abierto={dialogPagoAbierto}
        onCerrar={() => {
          setDialogPagoAbierto(false);
          cargarPagos();
        }}
      />

      <AnularPagoDialog
        abierto={dialogAnularAbierto}
        onCerrar={() => {
          setDialogAnularAbierto(false);
          setPagoSeleccionado(null);
          cargarPagos();
        }}
        pago={pagoSeleccionado}
      />
    </div>
  );
}
