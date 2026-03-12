"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardCheck, Loader2 } from "lucide-react";
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
import { CuestionarioCrearDialog } from "./cuestionario-crear-dialog";
import { inicializarCuestionariosPredefinidos } from "@/app/(dashboard)/actions/psicologia";
import { toast } from "sonner";

const COLORES_TIPO = {
  phq9: "bg-blue-100 text-blue-800",
  gad7: "bg-purple-100 text-purple-800",
  bdi2: "bg-indigo-100 text-indigo-800",
  stai_estado: "bg-amber-100 text-amber-800",
  stai_rasgo: "bg-orange-100 text-orange-800",
  moca: "bg-teal-100 text-teal-800",
  personalizado: "bg-gray-100 text-gray-800",
};

const TIPO_LABELS = {
  phq9: "PHQ-9",
  gad7: "GAD-7",
  bdi2: "BDI-II",
  stai_estado: "STAI-E",
  stai_rasgo: "STAI-R",
  moca: "MoCA",
  personalizado: "CUSTOM",
};

export function CuestionariosLista({ cuestionarios = [] }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [inicializando, setInicializando] = useState(false);

  const handleInicializar = async () => {
    setInicializando(true);
    const resultado = await inicializarCuestionariosPredefinidos();
    setInicializando(false);
    if (resultado.error) toast.error(resultado.error);
    else toast.success("Cuestionarios predefinidos inicializados");
  };

  const tienePredef = cuestionarios.some((c) => ["phq9", "gad7", "bdi2", "stai_estado", "moca"].includes(c.tipo));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cuestionarios</h3>
        <div className="flex gap-2">
          {!tienePredef && (
            <Button variant="outline" onClick={handleInicializar} disabled={inicializando}>
              {inicializando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
              Inicializar tests predefinidos
            </Button>
          )}
          <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Crear cuestionario
          </Button>
        </div>
      </div>

      {cuestionarios.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No hay cuestionarios. Puedes inicializar los predefinidos (PHQ-9, GAD-7) o crear uno personalizado.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preguntas</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuestionarios.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.nombre}</p>
                      {c.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{c.descripcion}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={COLORES_TIPO[c.tipo] || ""}>
                      {TIPO_LABELS[c.tipo] || c.tipo.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.preguntas?.length || 0}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/cuestionarios/${c.id}`)}
                    >
                      Aplicar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CuestionarioCrearDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => { setDialogAbierto(false); router.refresh(); }}
      />
    </div>
  );
}
