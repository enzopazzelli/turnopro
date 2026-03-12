"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { Clock, Play, Check, UserCheck, DollarSign, XCircle, Zap, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EstadoBadge } from "./estado-badge";
import { EstadoPagoBadge } from "@/components/facturacion/estado-pago-badge";
import { PagoDialog } from "@/components/facturacion/pago-dialog";
import { ConsultaActiva } from "./consulta-activa";
import { cambiarEstadoCita, iniciarConsulta } from "@/app/(dashboard)/actions/citas";
import { useRubro } from "@/hooks/use-rubro";
import { toast } from "sonner";

const RUBROS_SALUD = ["medicina", "odontologia", "psicologia", "veterinaria"];

export function SalaDeEspera({ citasHoy }) {
  const router = useRouter();
  const { terminoPaciente, rubroId } = useRubro();
  const esSalud = RUBROS_SALUD.includes(rubroId);
  const IconoConsulta = esSalud ? Stethoscope : Play;
  const textoIniciar = esSalud ? "Iniciar consulta" : "Iniciar atención";
  const textoContinuar = esSalud ? "Continuar consulta" : "Continuar atención";
  const [isPending, startTransition] = useTransition();
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false);
  const [dialogPagoKey, setDialogPagoKey] = useState(0);
  const [citaParaPago, setCitaParaPago] = useState(null);

  // Dialog de cancelacion con motivo
  const [dialogCancelarAbierto, setDialogCancelarAbierto] = useState(false);
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  // Consulta activa
  const [consultaAbierta, setConsultaAbierta] = useState(false);
  const [consultaKey, setConsultaKey] = useState(0);
  const [citaConsulta, setCitaConsulta] = useState(null);

  function handleCambiarEstado(id, nuevoEstado, label) {
    startTransition(async () => {
      const result = await cambiarEstadoCita(id, nuevoEstado);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Cita ${label}`);
      }
    });
  }

  function handleIniciarConsulta(cita) {
    startTransition(async () => {
      const result = await iniciarConsulta(cita.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setCitaConsulta(result.data);
        setConsultaKey((k) => k + 1);
        setConsultaAbierta(true);
      }
    });
  }

  function handleContinuarConsulta(cita) {
    setCitaConsulta(cita);
    setConsultaKey((k) => k + 1);
    setConsultaAbierta(true);
  }

  function handleIniciarCancelacion(cita) {
    setCitaParaCancelar(cita);
    setMotivoCancelacion("");
    setDialogCancelarAbierto(true);
  }

  function handleConfirmarCancelacion() {
    if (!motivoCancelacion.trim()) {
      toast.error("Debes indicar un motivo para cancelar");
      return;
    }

    startTransition(async () => {
      const result = await cambiarEstadoCita(
        citaParaCancelar.id,
        "cancelada",
        motivoCancelacion.trim()
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cita cancelada");
        setDialogCancelarAbierto(false);
        setCitaParaCancelar(null);
      }
    });
  }

  function handleCobrar(cita) {
    setCitaParaPago(cita);
    setDialogPagoKey((k) => k + 1);
    setDialogPagoAbierto(true);
  }

  const citasOrdenadas = [...citasHoy].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio)
  );

  function formatearHora(hora) {
    try {
      return format(parse(hora, "HH:mm:ss", new Date()), "HH:mm");
    } catch {
      return hora;
    }
  }

  function getEstadoPago(cita) {
    const precio = Number(cita.servicios?.precio || 0);
    if (precio === 0) return null;
    const pagado = Number(cita.total_pagado || 0);
    if (pagado >= precio) return "pagado";
    if (pagado > 0) return "parcial";
    return "pendiente";
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Hoy
          <span className="text-sm font-normal text-muted-foreground">
            ({citasOrdenadas.length} citas)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          {citasOrdenadas.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm px-4">
              No hay citas para hoy
            </p>
          ) : (
            <div className="space-y-1 px-4 pb-4">
              {citasOrdenadas.map((cita) => {
                const estadoPago = getEstadoPago(cita);
                return (
                  <div
                    key={cita.id}
                    className={`flex flex-col gap-2 rounded-lg border p-3 ${
                      cita.estado === "en_curso"
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : cita.sobreturno
                        ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate flex items-center gap-1">
                          {cita.paciente_nombre}
                          {cita.sobreturno && (
                            <Zap className="h-3 w-3 text-orange-500 inline" title="Sobreturno" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatearHora(cita.hora_inicio)} -{" "}
                          {formatearHora(cita.hora_fin)}
                        </p>
                        {cita.servicios?.nombre && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: cita.servicios?.color || "#6366f1",
                              }}
                            />
                            {cita.servicios.nombre}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <EstadoBadge estado={cita.estado} />
                        {estadoPago && <EstadoPagoBadge estado={estadoPago} />}
                      </div>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {(cita.estado === "pendiente" || cita.estado === "pendiente_confirmacion") && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={() =>
                              handleCambiarEstado(cita.id, "confirmada", "confirmada")
                            }
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            disabled={isPending}
                            onClick={() => handleIniciarCancelacion(cita)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      {cita.estado === "confirmada" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={() => handleIniciarConsulta(cita)}
                          >
                            <IconoConsulta className="mr-1 h-3 w-3" />
                            {textoIniciar}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            disabled={isPending}
                            onClick={() => handleIniciarCancelacion(cita)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      {cita.estado === "en_curso" && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleContinuarConsulta(cita)}
                        >
                          <IconoConsulta className="mr-1 h-3 w-3" />
                          {textoContinuar}
                        </Button>
                      )}
                      {cita.estado === "completada" && estadoPago !== "pagado" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleCobrar(cita)}
                        >
                          <DollarSign className="mr-1 h-3 w-3" />
                          Cobrar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <PagoDialog
        key={`pago-${dialogPagoKey}`}
        abierto={dialogPagoAbierto}
        onCerrar={() => {
          setDialogPagoAbierto(false);
          setCitaParaPago(null);
          router.refresh();
        }}
        cita={citaParaPago}
        paciente={citaParaPago?.paciente_id ? { id: citaParaPago.paciente_id } : null}
      />

      <ConsultaActiva
        key={`consulta-${consultaKey}`}
        abierto={consultaAbierta}
        onCerrar={() => {
          setConsultaAbierta(false);
          setCitaConsulta(null);
          router.refresh();
        }}
        cita={citaConsulta}
      />

      {/* Dialog de cancelacion con motivo */}
      <Dialog open={dialogCancelarAbierto} onOpenChange={setDialogCancelarAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Estas por cancelar la cita de{" "}
              <span className="font-medium text-foreground">
                {citaParaCancelar?.paciente_nombre}
              </span>
              . Se notificara al {terminoPaciente.toLowerCase()}.
            </p>
            <div className="space-y-2">
              <Label htmlFor="motivo-cancelacion">
                Motivo de cancelacion <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo-cancelacion"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ej: Reprogramacion por agenda del profesional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogCancelarAbierto(false)}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !motivoCancelacion.trim()}
              onClick={handleConfirmarCancelacion}
            >
              {isPending ? "Cancelando..." : "Confirmar cancelacion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
