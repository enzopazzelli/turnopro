"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { guardarConfiguracionNotificaciones } from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";
import { LABELS_TIPO_NOTIFICACION } from "@/lib/constants";
import { Save } from "lucide-react";

const tiposEditables = [
  "cita_creada",
  "cita_confirmada",
  "cita_cancelada",
  "cita_modificada",
  "reserva_nueva",
];

export function TabNotificaciones({ configuracionInicial }) {
  const configInicial = configuracionInicial?.notificaciones || {};

  const [config, setConfig] = useState({
    email_habilitado: configInicial.email_habilitado ?? true,
    whatsapp_habilitado: configInicial.whatsapp_habilitado ?? false,
    tipos: configInicial.tipos || {},
    recordatorio_24h: configInicial.recordatorio_24h ?? true,
    recordatorio_2h: configInicial.recordatorio_2h ?? false,
  });

  const [guardando, startTransition] = useTransition();

  function handleCanalChange(campo, valor) {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleTipoChange(tipo, canal, valor) {
    setConfig((prev) => ({
      ...prev,
      tipos: {
        ...prev.tipos,
        [tipo]: {
          ...prev.tipos[tipo],
          [canal]: valor,
        },
      },
    }));
  }

  function handleGuardar() {
    startTransition(async () => {
      const { error } = await guardarConfiguracionNotificaciones(config);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Configuracion de notificaciones guardada");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Canales globales */}
      <Card>
        <CardHeader>
          <CardTitle>Canales de notificacion</CardTitle>
          <CardDescription>
            Habilita o deshabilita los canales de envio de notificaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_habilitado" className="font-medium">Email</Label>
              <p className="text-sm text-muted-foreground">
                Enviar notificaciones por correo electronico via Resend.
              </p>
            </div>
            <Switch
              id="email_habilitado"
              checked={config.email_habilitado}
              onCheckedChange={(v) => handleCanalChange("email_habilitado", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="whatsapp_habilitado" className="font-medium">WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Enviar notificaciones por WhatsApp (requiere servicio externo configurado).
              </p>
            </div>
            <Switch
              id="whatsapp_habilitado"
              checked={config.whatsapp_habilitado}
              onCheckedChange={(v) => handleCanalChange("whatsapp_habilitado", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de notificacion por canal */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de notificacion</CardTitle>
          <CardDescription>
            Configura que notificaciones se envian por cada canal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tiposEditables.map((tipo) => (
              <div key={tipo} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">
                  {LABELS_TIPO_NOTIFICACION[tipo]}
                </span>
                <div className="flex items-center gap-4">
                  {config.email_habilitado && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Switch
                        checked={config.tipos[tipo]?.email ?? true}
                        onCheckedChange={(v) => handleTipoChange(tipo, "email", v)}
                      />
                    </div>
                  )}
                  {config.whatsapp_habilitado && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                      <Switch
                        checked={config.tipos[tipo]?.whatsapp ?? false}
                        onCheckedChange={(v) => handleTipoChange(tipo, "whatsapp", v)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recordatorios */}
      <Card>
        <CardHeader>
          <CardTitle>Recordatorios automaticos</CardTitle>
          <CardDescription>
            Enviar recordatorios a pacientes antes de sus citas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="recordatorio_24h" className="font-medium">Recordatorio 24 horas antes</Label>
              <p className="text-sm text-muted-foreground">
                Enviar recordatorio un dia antes de la cita.
              </p>
            </div>
            <Switch
              id="recordatorio_24h"
              checked={config.recordatorio_24h}
              onCheckedChange={(v) => handleCanalChange("recordatorio_24h", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="recordatorio_2h" className="font-medium">Recordatorio 2 horas antes</Label>
              <p className="text-sm text-muted-foreground">
                Enviar recordatorio 2 horas antes de la cita.
              </p>
            </div>
            <Switch
              id="recordatorio_2h"
              checked={config.recordatorio_2h}
              onCheckedChange={(v) => handleCanalChange("recordatorio_2h", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Boton guardar */}
      <div className="flex justify-end">
        <Button onClick={handleGuardar} disabled={guardando}>
          <Save className="h-4 w-4 mr-2" />
          {guardando ? "Guardando..." : "Guardar configuracion"}
        </Button>
      </div>
    </div>
  );
}
