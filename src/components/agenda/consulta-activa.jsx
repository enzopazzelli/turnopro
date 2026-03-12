"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  Save,
  CheckCircle2,
  Stethoscope,
  Timer,
  Minimize2,
  Maximize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  guardarNotasConsulta,
  completarConsulta,
} from "@/app/(dashboard)/actions/citas";
import { toast } from "sonner";

function formatearDuracion(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function ConsultaActiva({ abierto, onCerrar, cita }) {
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [completando, setCompletando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);
  const [minimizada, setMinimizada] = useState(false);
  const notasRef = useRef("");
  const intervaloRef = useRef(null);
  const autoSaveRef = useRef(null);

  // Inicializar notas y timer al activar
  useEffect(() => {
    if (abierto && cita) {
      const notasIniciales = cita.notas_consulta || "";
      setNotas(notasIniciales);
      notasRef.current = notasIniciales;
      setUltimoGuardado(null);
      setCompletando(false);
      setMinimizada(false);

      if (cita.hora_inicio_consulta) {
        const inicio = new Date(cita.hora_inicio_consulta).getTime();
        const ahora = Date.now();
        setSegundos(Math.max(0, Math.floor((ahora - inicio) / 1000)));
      } else {
        setSegundos(0);
      }
    }
  }, [abierto, cita]);

  // Timer — corre siempre que la consulta este activa (minimizada o no)
  useEffect(() => {
    if (abierto) {
      intervaloRef.current = setInterval(() => {
        setSegundos((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [abierto]);

  // Auto-save cada 30 segundos — corre siempre que la consulta este activa
  useEffect(() => {
    if (abierto && cita) {
      autoSaveRef.current = setInterval(() => {
        if (notasRef.current && cita.id) {
          guardarNotasConsulta(cita.id, notasRef.current).then((res) => {
            if (!res.error) {
              setUltimoGuardado(new Date());
            }
          });
        }
      }, 30000);
    }
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [abierto, cita]);

  const handleNotasChange = useCallback((e) => {
    const valor = e.target.value;
    setNotas(valor);
    notasRef.current = valor;
  }, []);

  async function handleGuardar() {
    if (!cita?.id) return;
    setGuardando(true);
    const res = await guardarNotasConsulta(cita.id, notas);
    setGuardando(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      setUltimoGuardado(new Date());
      toast.success("Notas guardadas");
    }
  }

  async function handleCompletar() {
    if (!cita?.id) return;
    setCompletando(true);
    const res = await completarConsulta(cita.id, notas);
    setCompletando(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Consulta completada");
      setMinimizada(false);
      onCerrar();
    }
  }

  function formatearHora(hora) {
    if (!hora) return "";
    return hora.slice(0, 5);
  }

  if (!cita || !abierto) return null;

  // --- Barra minimizada ---
  if (minimizada) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border bg-background px-4 py-2.5 shadow-lg animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-medium truncate max-w-[140px]">
            {cita.paciente_nombre}
          </span>
        </div>
        <div className="font-mono text-lg font-bold tabular-nums tracking-wider text-primary">
          {formatearDuracion(segundos)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setMinimizada(false)}
          title="Expandir consulta"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // --- Dialog completo ---
  return (
    <Dialog open onOpenChange={() => setMinimizada(true)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Consulta activa
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMinimizada(true)}
              title="Minimizar"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Info del paciente y timer */}
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4 bg-muted/30">
            <div className="min-w-0">
              <p className="font-semibold text-lg truncate">
                {cita.paciente_nombre}
              </p>
              {cita.servicios?.nombre && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: cita.servicios?.color || "#6366f1",
                    }}
                  />
                  {cita.servicios.nombre}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                <Clock className="inline h-3 w-3 mr-1" />
                Turno: {formatearHora(cita.hora_inicio)}
              </p>
            </div>

            <div className="text-center shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Timer className="h-3 w-3" />
                Duracion
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums tracking-wider">
                {formatearDuracion(segundos)}
              </div>
              {cita.servicios?.duracion_minutos && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estimado: {cita.servicios.duracion_minutos} min
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Notas de la cita (previas, solo lectura) */}
          {cita.notas && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Notas previas de la cita
              </Label>
              <p className="text-sm rounded-md border p-3 bg-muted/20">
                {cita.notas}
              </p>
            </div>
          )}

          {/* Notas de la consulta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notas-consulta" className="text-sm font-medium">
                Notas de la consulta
              </Label>
              <div className="flex items-center gap-2">
                {ultimoGuardado && (
                  <span className="text-xs text-muted-foreground">
                    Guardado {ultimoGuardado.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  Auto-guardado
                </Badge>
              </div>
            </div>
            <Textarea
              id="notas-consulta"
              value={notas}
              onChange={handleNotasChange}
              placeholder="Escribe las notas de la consulta aqui...&#10;&#10;Motivo de consulta, diagnostico, indicaciones, observaciones..."
              className="min-h-[200px] resize-y text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleGuardar}
            disabled={guardando}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {guardando ? "Guardando..." : "Guardar notas"}
          </Button>
          <Button
            type="button"
            onClick={handleCompletar}
            disabled={completando}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {completando ? "Completando..." : "Completar consulta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
