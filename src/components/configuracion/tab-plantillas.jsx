"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { guardarConfiguracionPlantillas } from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";

const VARIABLES_DISPONIBLES = [
  { clave: "{paciente}", descripcion: "Nombre del paciente/cliente" },
  { clave: "{profesional}", descripcion: "Nombre del profesional" },
  { clave: "{consultorio}", descripcion: "Nombre del consultorio" },
  { clave: "{fecha}", descripcion: "Fecha de la cita" },
  { clave: "{hora}", descripcion: "Hora de la cita" },
  { clave: "{servicio}", descripcion: "Nombre del servicio" },
  { clave: "{motivo}", descripcion: "Motivo (cancelacion/reprogramacion)" },
];

const TIPOS_PLANTILLA = [
  {
    id: "cita_creada",
    nombre: "Cita agendada",
    descripcion: "Se envia cuando se crea una nueva cita.",
    defecto: "Hola {paciente}, tu cita de {servicio} fue agendada para el {fecha} a las {hora} con {profesional}.",
  },
  {
    id: "cita_confirmada",
    nombre: "Cita confirmada",
    descripcion: "Se envia cuando se confirma una cita.",
    defecto: "Hola {paciente}, tu cita de {servicio} del {fecha} a las {hora} ha sido confirmada.",
  },
  {
    id: "cita_cancelada",
    nombre: "Cita cancelada",
    descripcion: "Se envia cuando se cancela una cita.",
    defecto: "Hola {paciente}, tu cita de {servicio} del {fecha} a las {hora} ha sido cancelada. {motivo}",
  },
  {
    id: "cita_reprogramada",
    nombre: "Cita reprogramada",
    descripcion: "Se envia cuando se cambia la fecha/hora de una cita.",
    defecto: "Hola {paciente}, tu cita de {servicio} fue reprogramada para el {fecha} a las {hora}. {motivo}",
  },
  {
    id: "recordatorio_24h",
    nombre: "Recordatorio (24h antes)",
    descripcion: "Se envia un dia antes de la cita.",
    defecto: "Hola {paciente}, te recordamos que tienes una cita de {servicio} manana {fecha} a las {hora} con {profesional}.",
  },
  {
    id: "recordatorio_2h",
    nombre: "Recordatorio (2h antes)",
    descripcion: "Se envia 2 horas antes de la cita.",
    defecto: "Hola {paciente}, te recordamos que tienes una cita de {servicio} hoy a las {hora} con {profesional}.",
  },
  {
    id: "reserva_nueva",
    nombre: "Nueva reserva (al profesional)",
    descripcion: "Se envia al profesional cuando un paciente reserva online.",
    defecto: "{paciente} reservo una cita de {servicio} para el {fecha} a las {hora}.",
  },
];

function reemplazarVariables(texto) {
  return texto
    .replace(/{paciente}/g, "Juan Perez")
    .replace(/{profesional}/g, "Dra. Garcia")
    .replace(/{consultorio}/g, "Consultorio Ejemplo")
    .replace(/{fecha}/g, "lunes 10 de marzo")
    .replace(/{hora}/g, "10:30")
    .replace(/{servicio}/g, "Consulta general")
    .replace(/{motivo}/g, "Motivo: reprogramacion por agenda.");
}

export function TabPlantillas({ configuracionInicial }) {
  const plantillasGuardadas = configuracionInicial?.plantillas || {};

  const [plantillas, setPlantillas] = useState(() => {
    const estado = {};
    for (const tipo of TIPOS_PLANTILLA) {
      estado[tipo.id] = plantillasGuardadas[tipo.id] || "";
    }
    return estado;
  });

  const [previewAbierto, setPreviewAbierto] = useState(null);
  const [guardando, startTransition] = useTransition();

  function handleChange(id, valor) {
    setPlantillas((prev) => ({ ...prev, [id]: valor }));
  }

  function handleReset(id) {
    setPlantillas((prev) => ({ ...prev, [id]: "" }));
  }

  function getTextoActual(id) {
    const custom = plantillas[id];
    if (custom) return custom;
    return TIPOS_PLANTILLA.find((t) => t.id === id)?.defecto || "";
  }

  function handleGuardar() {
    startTransition(async () => {
      // Only save non-empty (custom) templates
      const paraGuardar = {};
      for (const [id, valor] of Object.entries(plantillas)) {
        if (valor.trim()) paraGuardar[id] = valor.trim();
      }
      const { error } = await guardarConfiguracionPlantillas(paraGuardar);
      if (error) toast.error(error);
      else toast.success("Plantillas de mensajes guardadas");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plantillas de mensajes</CardTitle>
          <CardDescription>
            Personaliza los mensajes que reciben tus pacientes por email y WhatsApp. Deja en blanco para usar el mensaje por defecto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {VARIABLES_DISPONIBLES.map((v) => (
              <Badge key={v.clave} variant="secondary" className="text-xs cursor-help" title={v.descripcion}>
                {v.clave}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {TIPOS_PLANTILLA.map((tipo) => {
        const esCustom = !!plantillas[tipo.id]?.trim();
        return (
          <Card key={tipo.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{tipo.nombre}</CardTitle>
                  <CardDescription className="text-xs">{tipo.descripcion}</CardDescription>
                </div>
                <div className="flex gap-1">
                  {esCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset(tipo.id)}
                      title="Restaurar mensaje por defecto"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewAbierto(tipo.id)}
                    title="Vista previa"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={plantillas[tipo.id]}
                onChange={(e) => handleChange(tipo.id, e.target.value)}
                rows={3}
                placeholder={tipo.defecto}
                className="text-sm"
              />
              {!esCustom && (
                <p className="text-xs text-muted-foreground mt-1">
                  Usando mensaje por defecto
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={handleGuardar} disabled={guardando}>
          <Save className="h-4 w-4 mr-2" />
          {guardando ? "Guardando..." : "Guardar plantillas"}
        </Button>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewAbierto} onOpenChange={(open) => !open && setPreviewAbierto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-muted/30 text-sm leading-relaxed">
            {previewAbierto && reemplazarVariables(getTextoActual(previewAbierto))}
          </div>
          <p className="text-xs text-muted-foreground">
            Los valores entre llaves se reemplazan automaticamente con los datos reales al enviar.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
