"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subirDocumento, eliminarDocumento } from "@/app/(dashboard)/actions/abogados";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function DocumentoUpload({ expedienteId, pacienteId, documentos = [] }) {
  const [state, formAction, pending] = useActionState(subirDocumento, estadoInicial);
  const formRef = useRef(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Documento subido");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleEliminar = async (id) => {
    setEliminando(id);
    const resultado = await eliminarDocumento(id, expedienteId);
    setEliminando(null);
    if (resultado.error) toast.error(resultado.error);
    else toast.success("Documento eliminado");
  };

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <form ref={formRef} action={formAction} className="border rounded-lg p-4 space-y-3">
        <input type="hidden" name="expediente_id" value={expedienteId} />
        <input type="hidden" name="paciente_id" value={pacienteId || ""} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="archivo">Archivo *</Label>
            <Input id="archivo" name="archivo" type="file" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del documento</Label>
            <Input id="nombre" name="nombre" placeholder="Se usara el nombre del archivo si se deja vacio" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notas">Notas</Label>
          <Input id="notas" name="notas" placeholder="Observaciones opcionales" />
        </div>

        <Button type="submit" disabled={pending}>
          <Upload className="h-4 w-4 mr-2" />
          {pending ? "Subiendo..." : "Subir documento"}
        </Button>
      </form>

      {/* Lista de documentos */}
      {documentos.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No hay documentos subidos
        </p>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(doc.tamano_bytes)} | {doc.tipo_archivo} |{" "}
                  {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: es })}
                </p>
                {doc.notas && <p className="text-xs text-muted-foreground mt-1">{doc.notas}</p>}
              </div>
              <div className="flex items-center gap-1">
                {doc.archivo_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEliminar(doc.id)}
                  disabled={eliminando === doc.id}
                >
                  {eliminando === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
