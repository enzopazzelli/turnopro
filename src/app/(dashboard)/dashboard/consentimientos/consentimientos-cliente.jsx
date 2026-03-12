"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, CheckCircle2, Clock, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SelectorPaciente } from "@/components/rubro/selector-paciente";
import { ConsentimientoDialog } from "@/components/rubro/psicologia/consentimiento-dialog";
import {
  obtenerConsentimientos,
  marcarConsentimientoFirmado,
  eliminarConsentimiento,
} from "@/app/(dashboard)/actions/psicologia";

export function ConsentimientosCliente() {
  const router = useRouter();
  const [paciente, setPaciente] = useState(null);
  const [consentimientos, setConsentimientos] = useState([]);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    obtenerConsentimientos(paciente?.id || null).then(({ data }) =>
      setConsentimientos(data)
    );
  }, [paciente, router]);

  async function handleFirmar(id) {
    await marcarConsentimientoFirmado(id);
    const { data } = await obtenerConsentimientos(paciente?.id || null);
    setConsentimientos(data);
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este consentimiento?")) return;
    await eliminarConsentimiento(id);
    const { data } = await obtenerConsentimientos(paciente?.id || null);
    setConsentimientos(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <SelectorPaciente label="Filtrar por paciente" onSeleccionar={setPaciente} seleccionado={paciente} />
        </div>
        <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo consentimiento
        </Button>
      </div>

      {consentimientos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay consentimientos{paciente ? " para este paciente" : ""}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consentimientos.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.paciente_nombre && (
                        <span className="font-medium text-sm">{c.paciente_nombre}</span>
                      )}
                      {c.firmado ? (
                        <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Firmado {c.fecha_firma && format(new Date(c.fecha_firma + "T12:00:00"), "dd/MM/yyyy", { locale: es })}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-400">
                          <Clock className="h-3 w-3" />
                          Pendiente de firma
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "dd/MM/yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!c.firmado && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleFirmar(c.id)}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Marcar firmado
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleEliminar(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setExpandido(expandido === c.id ? null : c.id)}
                >
                  {expandido === c.id ? "Ocultar texto ▲" : "Ver texto completo ▼"}
                </button>
                {expandido === c.id && (
                  <pre className="text-xs whitespace-pre-wrap font-sans p-3 bg-muted rounded border">
                    {c.contenido}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConsentimientoDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => { setDialogAbierto(false); obtenerConsentimientos(paciente?.id || null).then(({ data }) => setConsentimientos(data)); }}
        pacienteId={paciente?.id}
        pacienteNombre={paciente?.nombre_completo}
      />
    </div>
  );
}
