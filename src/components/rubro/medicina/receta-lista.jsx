"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, Trash2, Mail } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecetaDialog } from "./receta-dialog";
import { RecetaPDFButton } from "./receta-pdf";
import { eliminarReceta, enviarRecetaEmail } from "@/app/(dashboard)/actions/recetas";
import { RUBROS } from "@/config/rubros";
import { toast } from "sonner";

const TIPO_LABELS = {
  receta_medicamento: { label: "Receta", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  indicacion_medica: { label: "Indicacion", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  orden_estudio: { label: "Orden", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  derivacion: { label: "Derivacion", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  certificado: { label: "Certificado", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  carta_documento: { label: "Carta Doc.", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  dictamen: { label: "Dictamen", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  certificacion_firma: { label: "Cert. Firma", className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  informe_legal: { label: "Informe", className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
  poder: { label: "Poder", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400" },
  certificacion_ingresos: { label: "Cert. Ingresos", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  informe_contable: { label: "Informe", className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
  balance: { label: "Balance", className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  dictamen_contador: { label: "Dictamen", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  nota_requerimiento: { label: "Requerimiento", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
};

export function RecetaLista({ recetas = [], pacienteId, rubro }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [verReceta, setVerReceta] = useState(null);
  const [isPending, startTransition] = useTransition();

  const esSalud = !["abogados", "contadores"].includes(rubro);
  const terminoPaciente = RUBROS[rubro]?.terminoPaciente || "Paciente";
  const tituloSeccion = esSalud ? "Recetas y documentos" : "Documentos profesionales";
  const botonNuevo = esSalud ? "Nueva receta" : "Nuevo documento";
  const labelAsunto = esSalud ? "Diagnostico" : "Asunto";
  const msgVacio = esSalud ? "No hay recetas registradas" : "No hay documentos registrados";

  function handleEliminar(id) {
    if (!confirm("Eliminar este documento?")) return;
    startTransition(async () => {
      const res = await eliminarReceta(id);
      if (res.error) toast.error(res.error);
      else { toast.success("Documento eliminado"); router.refresh(); }
    });
  }

  function handleEnviarEmail(id) {
    startTransition(async () => {
      const res = await enviarRecetaEmail(id);
      if (res.error) toast.error(res.error);
      else toast.success("Documento enviado por email");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{tituloSeccion}</h3>
        {pacienteId && (
          <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
            <Plus className="h-4 w-4 mr-2" /> {botonNuevo}
          </Button>
        )}
      </div>

      {recetas.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {msgVacio}
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>{terminoPaciente}</TableHead>
                <TableHead>{labelAsunto}</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recetas.map((receta) => {
                const tipoConfig = TIPO_LABELS[receta.tipo] || { label: receta.tipo, className: "bg-gray-100 text-gray-800" };
                return (
                  <TableRow key={receta.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(receta.fecha + "T12:00:00"), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-transparent text-xs ${tipoConfig.className}`}>
                        {tipoConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {receta.pacientes?.nombre_completo || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {receta.diagnostico || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {receta.tipo === "receta_medicamento"
                        ? `${receta.medicamentos?.length || 0} medicamento(s)`
                        : receta.contenido?.slice(0, 40) || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setVerReceta(receta)} title="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <RecetaPDFButton recetaId={receta.id} />
                        <Button variant="ghost" size="icon" onClick={() => handleEnviarEmail(receta.id)} disabled={isPending} title="Enviar por email">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEliminar(receta.id)} disabled={isPending} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog ver detalle */}
      <Dialog open={!!verReceta} onOpenChange={() => setVerReceta(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle</DialogTitle>
          </DialogHeader>
          {verReceta && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-4">
                <div>
                  <span className="font-medium">Fecha: </span>
                  {format(new Date(verReceta.fecha + "T12:00:00"), "dd/MM/yyyy", { locale: es })}
                </div>
                <Badge variant="outline" className={`border-transparent text-xs ${(TIPO_LABELS[verReceta.tipo] || { className: "" }).className}`}>
                  {(TIPO_LABELS[verReceta.tipo] || { label: verReceta.tipo }).label}
                </Badge>
              </div>
              {verReceta.diagnostico && (
                <div>
                  <span className="font-medium">{labelAsunto}: </span>
                  {verReceta.diagnostico}
                </div>
              )}
              {verReceta.tipo === "receta_medicamento" && verReceta.medicamentos?.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium">Medicamentos:</span>
                  {verReceta.medicamentos.map((med, i) => (
                    <div key={i} className="border rounded p-2 bg-muted/30">
                      <p className="font-medium">{med.nombre}</p>
                      {med.dosis && <p>Dosis: {med.dosis}</p>}
                      {med.frecuencia && <p>Frecuencia: {med.frecuencia}</p>}
                      {med.duracion && <p>Duracion: {med.duracion}</p>}
                      {med.indicaciones && <p>Indicaciones: {med.indicaciones}</p>}
                    </div>
                  ))}
                </div>
              )}
              {verReceta.contenido && (
                <div>
                  <span className="font-medium">Contenido: </span>
                  <p className="whitespace-pre-wrap mt-1">{verReceta.contenido}</p>
                </div>
              )}
              {verReceta.indicaciones_generales && (
                <div>
                  <span className="font-medium">{esSalud ? "Indicaciones generales" : "Observaciones"}: </span>
                  {verReceta.indicaciones_generales}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {pacienteId && (
        <RecetaDialog
          key={dialogKey}
          abierto={dialogAbierto}
          onCerrar={() => { setDialogAbierto(false); router.refresh(); }}
          pacienteId={pacienteId}
          rubro={rubro}
        />
      )}
    </div>
  );
}
