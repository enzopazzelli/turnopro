"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Download, Loader2, Image, FileSpreadsheet, File } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  subirArchivoPaciente,
  eliminarArchivoPaciente,
  obtenerArchivosPaciente,
} from "@/app/(dashboard)/actions/pacientes";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

const CATEGORIAS = [
  { value: "estudios", label: "Estudios" },
  { value: "documentacion", label: "Documentacion" },
  { value: "consentimientos", label: "Consentimientos" },
  { value: "imagenes", label: "Imagenes" },
  { value: "otros", label: "Otros" },
];

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getIconoArchivo(tipo) {
  if (!tipo) return File;
  if (tipo.startsWith("image/")) return Image;
  if (tipo === "application/pdf") return FileText;
  if (tipo.includes("spreadsheet") || tipo.includes("excel")) return FileSpreadsheet;
  return File;
}

function getCategoriaColor(cat) {
  const colores = {
    estudios: "default",
    documentacion: "secondary",
    consentimientos: "outline",
    imagenes: "default",
    otros: "secondary",
  };
  return colores[cat] || "secondary";
}

export function ArchivosPaciente({ pacienteId }) {
  const [state, formAction, pending] = useActionState(subirArchivoPaciente, estadoInicial);
  const formRef = useRef(null);
  const [archivos, setArchivos] = useState([]);
  const [eliminando, setEliminando] = useState(null);
  const [categoria, setCategoria] = useState("otros");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  const cargarArchivos = async () => {
    const { data } = await obtenerArchivosPaciente(pacienteId);
    setArchivos(data || []);
  };

  useEffect(() => {
    cargarArchivos();
  }, [pacienteId]);

  useEffect(() => {
    if (state.success) {
      toast.success("Archivo subido");
      formRef.current?.reset();
      setCategoria("otros");
      cargarArchivos();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleEliminar = async (id) => {
    setEliminando(id);
    const resultado = await eliminarArchivoPaciente(id);
    setEliminando(null);
    if (resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success("Archivo eliminado");
      cargarArchivos();
    }
  };

  const archivosFiltrados = filtroCategoria === "todas"
    ? archivos
    : archivos.filter((a) => a.categoria === filtroCategoria);

  return (
    <div className="space-y-4">
      {/* Formulario de upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subir archivo</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-3">
            <input type="hidden" name="paciente_id" value={pacienteId} />
            <input type="hidden" name="categoria" value={categoria} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="archivo">Archivo *</Label>
                <Input id="archivo" name="archivo" type="file" required />
                <p className="text-xs text-muted-foreground">Max. 10 MB</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="nombre-archivo">Nombre</Label>
                <Input id="nombre-archivo" name="nombre" placeholder="Nombre del archivo (opcional)" />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Input name="notas" placeholder="Notas u observaciones (opcional)" className="flex-1" />
              <Button type="submit" disabled={pending}>
                <Upload className="h-4 w-4 mr-2" />
                {pending ? "Subiendo..." : "Subir"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filtro por categoria */}
      {archivos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filtroCategoria === "todas" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroCategoria("todas")}
          >
            Todos ({archivos.length})
          </Badge>
          {CATEGORIAS.map((c) => {
            const count = archivos.filter((a) => a.categoria === c.value).length;
            if (count === 0) return null;
            return (
              <Badge
                key={c.value}
                variant={filtroCategoria === c.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFiltroCategoria(c.value)}
              >
                {c.label} ({count})
              </Badge>
            );
          })}
        </div>
      )}

      {/* Lista de archivos */}
      {archivosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">
              {archivos.length === 0
                ? "No hay archivos adjuntos. Subi estudios, documentos o imagenes."
                : "No hay archivos en esta categoria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {archivosFiltrados.map((archivo) => {
            const Icono = getIconoArchivo(archivo.tipo_archivo);
            return (
              <div key={archivo.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Icono className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{archivo.nombre}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatBytes(archivo.tamano_bytes)}</span>
                    <span>·</span>
                    <span>{format(new Date(archivo.created_at), "dd/MM/yyyy", { locale: es })}</span>
                    <Badge variant={getCategoriaColor(archivo.categoria)} className="text-[10px] px-1.5 py-0">
                      {CATEGORIAS.find((c) => c.value === archivo.categoria)?.label || archivo.categoria}
                    </Badge>
                  </div>
                  {archivo.notas && <p className="text-xs text-muted-foreground mt-1">{archivo.notas}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {archivo.archivo_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={archivo.archivo_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEliminar(archivo.id)}
                    disabled={eliminando === archivo.id}
                  >
                    {eliminando === archivo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
