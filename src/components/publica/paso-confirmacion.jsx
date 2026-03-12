"use client";

import { useActionState } from "react";
import { useReservaStore } from "@/stores/reserva-store";
import { crearReserva } from "@/app/(public)/actions/reserva";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  ChevronLeft,
  RotateCcw,
  Loader2,
} from "lucide-react";

export function PasoConfirmacion({ slug, politicaCancelacion }) {
  const {
    servicioSeleccionado,
    fechaSeleccionada,
    horarioSeleccionado,
    datosCliente,
    setPaso,
    reiniciar,
  } = useReservaStore();

  const [estado, formAction, isPending] = useActionState(crearReserva, {
    error: null,
    fieldErrors: {},
    success: null,
  });

  // Formatear fecha para mostrar
  const [anio, mes, dia] = (fechaSeleccionada || "").split("-");
  const fechaMostrar = fechaSeleccionada
    ? new Date(Number(anio), Number(mes) - 1, Number(dia)).toLocaleDateString(
        "es-AR",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      )
    : "";

  // Si se confirmo exitosamente
  if (estado.success) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Turno reservado</h2>
          <p className="text-muted-foreground">
            Tu turno ha sido registrado exitosamente. El profesional confirmara
            tu reserva a la brevedad.
          </p>
        </div>

        <Card className="max-w-sm mx-auto">
          <CardContent className="p-4 text-left space-y-2 text-sm">
            <p>
              <strong>Servicio:</strong> {servicioSeleccionado?.nombre}
            </p>
            <p className="capitalize">
              <strong>Fecha:</strong> {fechaMostrar}
            </p>
            <p>
              <strong>Horario:</strong> {horarioSeleccionado?.hora_inicio} -{" "}
              {horarioSeleccionado?.hora_fin}
            </p>
          </CardContent>
        </Card>

        <Button onClick={reiniciar} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reservar otro turno
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Confirmar reserva</h2>
        <p className="text-sm text-muted-foreground">
          Revisa los datos antes de confirmar
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen del turno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: servicioSeleccionado?.color }}
            />
            <div>
              <p className="font-medium">{servicioSeleccionado?.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {servicioSeleccionado?.duracion_minutos} minutos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="capitalize">{fechaMostrar}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {horarioSeleccionado?.hora_inicio} - {horarioSeleccionado?.hora_fin}
            </span>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{datosCliente?.paciente_nombre}</span>
            </div>

            {datosCliente?.paciente_telefono && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{datosCliente.paciente_telefono}</span>
              </div>
            )}

            {datosCliente?.paciente_email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{datosCliente.paciente_email}</span>
              </div>
            )}

            {datosCliente?.notas && (
              <div className="flex items-start gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {datosCliente.notas}
                </span>
              </div>
            )}
          </div>

          {servicioSeleccionado?.precio > 0 && (
            <div className="border-t pt-3 flex justify-between text-sm font-medium">
              <span>Precio</span>
              <span>
                ${Number(servicioSeleccionado.precio).toLocaleString("es-AR")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Politica de cancelacion */}
      {politicaCancelacion?.habilitada && (
        <div className="max-w-md mx-auto rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-400">
            <strong>Politica de cancelacion:</strong>{" "}
            {politicaCancelacion.mensaje ||
              `Las cancelaciones deben realizarse con al menos ${politicaCancelacion.horas_minimas || 24} horas de anticipacion.`}
          </p>
        </div>
      )}

      {estado.error && (
        <p className="text-sm text-destructive text-center">{estado.error}</p>
      )}

      <form action={formAction} className="max-w-md mx-auto">
        <input type="hidden" name="slug" value={slug} />
        <input
          type="hidden"
          name="servicio_id"
          value={servicioSeleccionado?.id || ""}
        />
        <input type="hidden" name="fecha" value={fechaSeleccionada || ""} />
        <input
          type="hidden"
          name="hora_inicio"
          value={horarioSeleccionado?.hora_inicio || ""}
        />
        <input
          type="hidden"
          name="hora_fin"
          value={horarioSeleccionado?.hora_fin || ""}
        />
        <input
          type="hidden"
          name="paciente_nombre"
          value={datosCliente?.paciente_nombre || ""}
        />
        <input
          type="hidden"
          name="paciente_telefono"
          value={datosCliente?.paciente_telefono || ""}
        />
        <input
          type="hidden"
          name="paciente_email"
          value={datosCliente?.paciente_email || ""}
        />
        <input type="hidden" name="notas" value={datosCliente?.notas || ""} />

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setPaso(4)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Editar datos
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar reserva
          </Button>
        </div>
      </form>
    </div>
  );
}
