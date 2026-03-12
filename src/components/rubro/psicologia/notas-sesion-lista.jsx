"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotaSesionDialog } from "./nota-sesion-dialog";

const COLORES_EMOCIONAL = {
  ansioso: "bg-yellow-100 text-yellow-800",
  triste: "bg-blue-100 text-blue-800",
  neutro: "bg-gray-100 text-gray-800",
  esperanzado: "bg-green-100 text-green-800",
  enojado: "bg-red-100 text-red-800",
  tranquilo: "bg-teal-100 text-teal-800",
  confundido: "bg-purple-100 text-purple-800",
};

export function NotasSesionLista({ notas = [], pacienteId }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [notaEditar, setNotaEditar] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notas de Sesion</h3>
        <Button onClick={() => { setNotaEditar(null); setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva nota
        </Button>
      </div>

      {notas.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay notas de sesion registradas
        </p>
      ) : (
        <div className="space-y-3">
          {notas.map((nota) => (
            <div
              key={nota.id}
              className="border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => { setNotaEditar(nota); setDialogKey((k) => k + 1); setDialogAbierto(true); }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {format(new Date(nota.fecha), "dd/MM/yyyy", { locale: es })}
                  </span>
                  {nota.estado_emocional && (
                    <Badge variant="outline" className={COLORES_EMOCIONAL[nota.estado_emocional] || ""}>
                      {nota.estado_emocional}
                    </Badge>
                  )}
                  {nota.privado && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
              <p className="text-sm line-clamp-3">{nota.contenido}</p>
              {nota.temas?.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {nota.temas.map((tema) => (
                    <Badge key={tema} variant="secondary" className="text-xs">
                      {tema}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <NotaSesionDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => { setDialogAbierto(false); setNotaEditar(null); router.refresh(); }}
        pacienteId={pacienteId}
        nota={notaEditar}
      />
    </div>
  );
}
