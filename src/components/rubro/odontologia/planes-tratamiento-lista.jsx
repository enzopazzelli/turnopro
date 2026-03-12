"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronRight, Check, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanTratamientoDialog } from "./plan-tratamiento-dialog";
import { CitaRapidaDialog } from "@/components/agenda/cita-rapida-dialog";
import { actualizarEstadoEtapa } from "@/app/(dashboard)/actions/odontologia";
import { toast } from "sonner";

const COLORES_ESTADO = {
  pendiente: "bg-yellow-100 text-yellow-800",
  en_curso: "bg-blue-100 text-blue-800",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

export function PlanesTratamientoLista({ planes = [], pacienteId, pacienteNombre = "" }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [expandido, setExpandido] = useState(null);
  const [citaDialogAbierto, setCitaDialogAbierto] = useState(false);
  const [notaParaCita, setNotaParaCita] = useState("");

  const toggleEstadoEtapa = async (etapaId, estadoActual) => {
    const nuevoEstado = estadoActual === "completado" ? "pendiente" : "completado";
    const resultado = await actualizarEstadoEtapa(etapaId, nuevoEstado);
    if (resultado.error) toast.error(resultado.error);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Planes de Tratamiento</h3>
        <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo plan
        </Button>
      </div>

      {planes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay planes de tratamiento registrados
        </p>
      ) : (
        <div className="space-y-3">
          {planes.map((plan) => {
            const etapas = plan.etapas_tratamiento || [];
            const completadas = etapas.filter((e) => e.estado === "completado").length;
            const abierto = expandido === plan.id;

            return (
              <div key={plan.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandido(abierto ? null : plan.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <p className="font-medium">{plan.titulo}</p>
                      {plan.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{plan.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={COLORES_ESTADO[plan.estado]}>
                      {plan.estado}
                    </Badge>
                    {etapas.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {completadas}/{etapas.length} etapas
                      </span>
                    )}
                    {plan.costo_total > 0 && (
                      <span className="text-sm font-medium">${Number(plan.costo_total).toFixed(2)}</span>
                    )}
                  </div>
                </button>

                {abierto && etapas.length > 0 && (
                  <div className="border-t px-4 py-3 space-y-2 bg-muted/30">
                    {etapas
                      .sort((a, b) => a.orden - b.orden)
                      .map((etapa) => (
                        <div key={etapa.id} className="flex items-center gap-3">
                          <button
                            onClick={() => toggleEstadoEtapa(etapa.id, etapa.estado)}
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                              etapa.estado === "completado"
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-muted-foreground"
                            }`}
                          >
                            {etapa.estado === "completado" && <Check className="h-3 w-3" />}
                          </button>
                          <span className={`text-sm flex-1 ${etapa.estado === "completado" ? "line-through text-muted-foreground" : ""}`}>
                            {etapa.descripcion}
                          </span>
                          {etapa.dientes?.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Dientes: {etapa.dientes.join(", ")}
                            </span>
                          )}
                          {etapa.costo > 0 && (
                            <span className="text-xs font-medium">${Number(etapa.costo).toFixed(2)}</span>
                          )}
                          {etapa.estado !== "completado" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              title="Agendar cita para esta etapa"
                              onClick={() => {
                                setNotaParaCita(
                                  `Tratamiento: ${plan.titulo} — Etapa ${etapa.orden}: ${etapa.descripcion}`
                                );
                                setCitaDialogAbierto(true);
                              }}
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PlanTratamientoDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => { setDialogAbierto(false); router.refresh(); }}
        pacienteId={pacienteId}
      />

      <CitaRapidaDialog
        abierto={citaDialogAbierto}
        onCerrar={() => {
          setCitaDialogAbierto(false);
          setNotaParaCita("");
        }}
        pacientePreseleccionado={
          pacienteId
            ? { id: pacienteId, nombre_completo: pacienteNombre }
            : null
        }
        notaPreseleccionada={notaParaCita}
      />
    </div>
  );
}
