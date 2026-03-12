"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, ChevronDown, ChevronRight, Pill } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoriaClinicaDialog } from "./historia-clinica-dialog";

export function HistoriaClinicaLista({ entradas = [], pacienteId, alergias = [], medicacion = [] }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [expandido, setExpandido] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Historia Clinica</h3>
          {alergias.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alergias: {alergias.join(", ")}
            </Badge>
          )}
          {medicacion.length > 0 && (
            <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Pill className="h-3 w-3" />
              Med. crónica: {medicacion.join(", ")}
            </Badge>
          )}
        </div>
        <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva entrada
        </Button>
      </div>

      {entradas.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay entradas en la historia clinica
        </p>
      ) : (
        <div className="space-y-2">
          {entradas.map((entrada) => {
            const abierto = expandido === entrada.id;
            return (
              <div key={entrada.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandido(abierto ? null : entrada.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <p className="font-medium">
                        {format(new Date(entrada.fecha), "dd/MM/yyyy", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {entrada.motivo_consulta || entrada.diagnostico || "Sin detalle"}
                      </p>
                    </div>
                  </div>
                </button>

                {abierto && (
                  <div className="border-t px-4 py-3 space-y-3 bg-muted/30 text-sm">
                    {entrada.motivo_consulta && (
                      <div>
                        <span className="font-medium">Motivo: </span>
                        {entrada.motivo_consulta}
                      </div>
                    )}
                    {entrada.diagnostico && (
                      <div>
                        <span className="font-medium">Diagnostico: </span>
                        {entrada.diagnostico}
                      </div>
                    )}
                    {entrada.indicaciones && (
                      <div>
                        <span className="font-medium">Indicaciones: </span>
                        {entrada.indicaciones}
                      </div>
                    )}
                    {entrada.antecedentes && (
                      <div>
                        <span className="font-medium">Antecedentes: </span>
                        {entrada.antecedentes}
                      </div>
                    )}
                    {entrada.alergias?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Alergias: </span>
                        {entrada.alergias.map((a) => (
                          <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    )}
                    {entrada.medicacion_cronica?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Medicacion cronica: </span>
                        {entrada.medicacion_cronica.map((m) => (
                          <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    )}
                    {entrada.observaciones && (
                      <div>
                        <span className="font-medium">Observaciones: </span>
                        {entrada.observaciones}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <HistoriaClinicaDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => { setDialogAbierto(false); router.refresh(); }}
        pacienteId={pacienteId}
      />
    </div>
  );
}
