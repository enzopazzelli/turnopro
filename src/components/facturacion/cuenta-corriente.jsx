"use client";

import { useState, useEffect, useTransition } from "react";
import {
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PagoDialog } from "./pago-dialog";
import {
  obtenerResumenCuentaCorriente,
  obtenerCuentaCorriente,
} from "@/app/(dashboard)/actions/facturacion";
import { LABELS_METODO_PAGO } from "@/lib/constants";

export function CuentaCorriente() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false);
  const [pacienteParaPago, setPacienteParaPago] = useState(null);

  const cargarResumen = async () => {
    setCargando(true);
    const { data } = await obtenerResumenCuentaCorriente();
    setPacientes(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const handleExpandir = async (pacienteId) => {
    if (expandido === pacienteId) {
      setExpandido(null);
      setMovimientos([]);
      return;
    }

    setExpandido(pacienteId);
    setCargandoMovimientos(true);
    const { data } = await obtenerCuentaCorriente(pacienteId);
    setMovimientos(data?.movimientos || []);
    setCargandoMovimientos(false);
  };

  const handleRegistrarPago = (paciente) => {
    setPacienteParaPago({
      id: paciente.paciente_id,
      nombre_completo: paciente.nombre_completo,
    });
    setDialogPagoAbierto(true);
  };

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(valor);

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      {pacientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>
              {pacientes.length === 0
                ? "No hay pacientes con saldo pendiente."
                : "No se encontraron resultados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pacientesFiltrados.map((paciente) => (
            <Card key={paciente.paciente_id}>
              <CardContent className="p-0">
                {/* Fila principal */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleExpandir(paciente.paciente_id)}
                >
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      {expandido === paciente.paciente_id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <p className="font-medium">{paciente.nombre_completo}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Cargos: {formatearPrecio(paciente.total_cargos)}</span>
                        <span>Pagos: {formatearPrecio(paciente.total_pagos)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">
                        {formatearPrecio(paciente.saldo)}
                      </p>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegistrarPago(paciente);
                      }}
                    >
                      <DollarSign className="mr-1 h-4 w-4" />
                      Cobrar
                    </Button>
                  </div>
                </div>

                {/* Movimientos expandidos */}
                {expandido === paciente.paciente_id && (
                  <div className="border-t px-4 py-3">
                    {cargandoMovimientos ? (
                      <div className="space-y-2 py-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movimientos.map((m, i) => (
                            <TableRow key={`${m.tipo}-${m.id}-${i}`}>
                              <TableCell className="text-sm">{m.fecha}</TableCell>
                              <TableCell>
                                {m.tipo === "cargo" ? (
                                  <span className="flex items-center gap-1 text-destructive text-sm">
                                    <ArrowUpCircle className="h-3 w-3" />
                                    Cargo
                                  </span>
                                ) : m.tipo === "anulacion" ? (
                                  <span className="text-sm text-muted-foreground line-through">
                                    Anulado
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-green-600 text-sm">
                                    <ArrowDownCircle className="h-3 w-3" />
                                    Abono
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {m.concepto}
                                {m.metodo_pago && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {LABELS_METODO_PAGO[m.metodo_pago] || m.metodo_pago}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className={`text-right text-sm ${
                                m.tipo === "cargo" ? "text-destructive" : "text-green-600"
                              }`}>
                                {m.tipo === "cargo" ? "+" : "-"}
                                {formatearPrecio(m.monto)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {formatearPrecio(m.saldo)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PagoDialog
        abierto={dialogPagoAbierto}
        onCerrar={() => {
          setDialogPagoAbierto(false);
          setPacienteParaPago(null);
          cargarResumen();
        }}
        paciente={pacienteParaPago}
      />
    </div>
  );
}
