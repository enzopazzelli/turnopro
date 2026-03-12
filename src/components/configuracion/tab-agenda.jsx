"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Shield, CheckCircle } from "lucide-react";
import { guardarConfiguracionAgenda } from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";

export function TabAgenda({ configuracionInicial }) {
  const configAgenda = configuracionInicial?.agenda || {};
  const [isPending, startTransition] = useTransition();

  // Politica de cancelacion
  const [cancelacionHabilitada, setCancelacionHabilitada] = useState(
    configAgenda.politica_cancelacion?.habilitada ?? false
  );
  const [horasMinimas, setHorasMinimas] = useState(
    configAgenda.politica_cancelacion?.horas_minimas ?? 24
  );
  const [mensajePolitica, setMensajePolitica] = useState(
    configAgenda.politica_cancelacion?.mensaje ?? ""
  );

  // Doble opt-in de confirmacion
  const [confirmacionHabilitada, setConfirmacionHabilitada] = useState(
    configAgenda.confirmacion_cita?.habilitada ?? false
  );
  const [horasParaConfirmar, setHorasParaConfirmar] = useState(
    configAgenda.confirmacion_cita?.horas_para_confirmar ?? 24
  );

  // Sobreturno
  const [sobreturnos, setSobreturnos] = useState(
    configAgenda.sobreturnos_habilitados ?? true
  );

  function handleGuardar() {
    startTransition(async () => {
      const result = await guardarConfiguracionAgenda({
        politica_cancelacion: {
          habilitada: cancelacionHabilitada,
          horas_minimas: Number(horasMinimas),
          mensaje: mensajePolitica,
        },
        confirmacion_cita: {
          habilitada: confirmacionHabilitada,
          horas_para_confirmar: Number(horasParaConfirmar),
        },
        sobreturnos_habilitados: sobreturnos,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Configuracion de agenda guardada");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Politica de cancelacion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Politica de cancelacion
          </CardTitle>
          <CardDescription>
            Define las reglas para que los pacientes puedan cancelar sus citas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cancelacion-hab">Activar politica de cancelacion</Label>
            <Switch
              id="cancelacion-hab"
              checked={cancelacionHabilitada}
              onCheckedChange={setCancelacionHabilitada}
            />
          </div>

          {cancelacionHabilitada && (
            <>
              <div className="space-y-2">
                <Label htmlFor="horas-minimas">
                  Horas minimas antes de la cita para cancelar sin cargo
                </Label>
                <Select
                  value={String(horasMinimas)}
                  onValueChange={(v) => setHorasMinimas(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="4">4 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas</SelectItem>
                    <SelectItem value="72">72 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensaje-politica">
                  Mensaje a mostrar en la pagina publica (opcional)
                </Label>
                <Textarea
                  id="mensaje-politica"
                  value={mensajePolitica}
                  onChange={(e) => setMensajePolitica(e.target.value)}
                  placeholder="Ej: Las cancelaciones deben realizarse con al menos 24 horas de anticipacion."
                  rows={2}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Doble opt-in */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5" />
            Confirmacion de citas
          </CardTitle>
          <CardDescription>
            Enviar un email/WhatsApp al paciente pidiendo confirmar su asistencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmacion-hab">Solicitar confirmacion al crear cita</Label>
            <Switch
              id="confirmacion-hab"
              checked={confirmacionHabilitada}
              onCheckedChange={setConfirmacionHabilitada}
            />
          </div>

          {confirmacionHabilitada && (
            <div className="space-y-2">
              <Label>
                Horas para confirmar (si no confirma, se notifica al profesional)
              </Label>
              <Select
                value={String(horasParaConfirmar)}
                onValueChange={(v) => setHorasParaConfirmar(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                La cita se crea como &quot;Por confirmar&quot; y el paciente recibe un link para confirmar o cancelar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sobreturnos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5" />
            Sobreturnos
          </CardTitle>
          <CardDescription>
            Permitir crear citas fuera del horario de disponibilidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="sobreturnos-hab">Habilitar sobreturnos</Label>
            <Switch
              id="sobreturnos-hab"
              checked={sobreturnos}
              onCheckedChange={setSobreturnos}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleGuardar} disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar configuracion"}
        </Button>
      </div>
    </div>
  );
}
