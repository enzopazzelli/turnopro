"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importarPacientesCSV } from "@/app/(dashboard)/actions/pacientes";
import { toast } from "sonner";

const COLUMNAS_ESPERADAS = [
  "nombre_completo",
  "telefono",
  "email",
  "dni",
  "obra_social",
  "direccion",
  "fecha_nacimiento",
  "notas",
];

function parsearCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return { encabezados: [], filas: [] };

  // Parsear respetando comillas
  const parsearLinea = (linea) => {
    const resultado = [];
    let actual = "";
    let enComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i];
      if (c === '"') {
        enComillas = !enComillas;
      } else if ((c === "," || c === ";") && !enComillas) {
        resultado.push(actual.trim());
        actual = "";
      } else {
        actual += c;
      }
    }
    resultado.push(actual.trim());
    return resultado;
  };

  const encabezados = parsearLinea(lineas[0]).map((h) =>
    h.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
  );

  const filas = lineas.slice(1).map((l) => {
    const valores = parsearLinea(l);
    const obj = {};
    encabezados.forEach((h, i) => {
      obj[h] = valores[i] || "";
    });
    return obj;
  });

  return { encabezados, filas };
}

function mapearColumna(encabezado) {
  const mapeo = {
    nombre: "nombre_completo",
    nombre_completo: "nombre_completo",
    nombre_y_apellido: "nombre_completo",
    paciente: "nombre_completo",
    telefono: "telefono",
    tel: "telefono",
    celular: "telefono",
    email: "email",
    correo: "email",
    mail: "email",
    dni: "dni",
    documento: "dni",
    obra_social: "obra_social",
    prepaga: "obra_social",
    cobertura: "obra_social",
    direccion: "direccion",
    domicilio: "direccion",
    fecha_nacimiento: "fecha_nacimiento",
    nacimiento: "fecha_nacimiento",
    notas: "notas",
    observaciones: "notas",
  };
  return mapeo[encabezado] || null;
}

export function ImportarCSVDialog({ abierto, onCerrar }) {
  const [paso, setPaso] = useState(1); // 1=subir, 2=preview, 3=resultado
  const [datos, setDatos] = useState({ encabezados: [], filas: [] });
  const [mapeoColumnas, setMapeoColumnas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [importando, setImportando] = useState(false);
  const inputRef = useRef(null);

  function resetear() {
    setPaso(1);
    setDatos({ encabezados: [], filas: [] });
    setMapeoColumnas({});
    setResultado(null);
    setImportando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleCerrar() {
    resetear();
    onCerrar();
  }

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const texto = await archivo.text();
    const { encabezados, filas } = parsearCSV(texto);

    if (filas.length === 0) {
      toast.error("El archivo esta vacio o no tiene formato CSV valido");
      return;
    }

    // Auto-mapear columnas
    const mapeo = {};
    encabezados.forEach((h) => {
      const col = mapearColumna(h);
      if (col) mapeo[h] = col;
    });

    setDatos({ encabezados, filas });
    setMapeoColumnas(mapeo);
    setPaso(2);
  }

  async function handleImportar() {
    // Validar que al menos nombre_completo este mapeado
    const tieneNombre = Object.values(mapeoColumnas).includes("nombre_completo");
    if (!tieneNombre) {
      toast.error("Debes mapear al menos la columna 'Nombre'");
      return;
    }

    // Transformar filas al formato esperado
    const pacientes = datos.filas.map((fila) => {
      const paciente = {};
      Object.entries(mapeoColumnas).forEach(([csvCol, dbCol]) => {
        if (fila[csvCol]) paciente[dbCol] = fila[csvCol];
      });
      return paciente;
    }).filter((p) => p.nombre_completo?.trim());

    if (pacientes.length === 0) {
      toast.error("No hay pacientes validos para importar");
      return;
    }

    setImportando(true);
    const res = await importarPacientesCSV(pacientes);
    setImportando(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      setResultado(res);
      setPaso(3);
    }
  }

  function descargarTemplate() {
    const headers = "nombre_completo,telefono,email,dni,obra_social,direccion,fecha_nacimiento,notas";
    const ejemplo = "Juan Perez,1155551234,juan@email.com,30123456,OSDE,Av. Corrientes 1234,1990-05-15,Paciente derivado";
    const bom = "\uFEFF";
    const blob = new Blob([bom + headers + "\n" + ejemplo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_pacientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && handleCerrar()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar pacientes desde CSV
          </DialogTitle>
        </DialogHeader>

        {/* Paso 1: Subir archivo */}
        {paso === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecciona un archivo CSV con los datos de tus pacientes
              </p>
              <Input
                ref={inputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleArchivo}
                className="max-w-xs mx-auto"
              />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="link" size="sm" onClick={descargarTemplate}>
                <Download className="h-4 w-4 mr-1" />
                Descargar template CSV
              </Button>
              <p className="text-xs text-muted-foreground">
                Separador: coma o punto y coma. Codificacion: UTF-8.
              </p>
            </div>
          </div>
        )}

        {/* Paso 2: Preview y mapeo */}
        {paso === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {datos.filas.length} registros encontrados
              </p>
              <Badge variant="secondary">
                {Object.keys(mapeoColumnas).length} columnas mapeadas
              </Badge>
            </div>

            {/* Mapeo de columnas */}
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Mapeo de columnas</p>
              <div className="grid grid-cols-2 gap-2">
                {datos.encabezados.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-24">{h}</span>
                    <span className="text-muted-foreground">→</span>
                    <select
                      value={mapeoColumnas[h] || ""}
                      onChange={(e) => {
                        const nuevo = { ...mapeoColumnas };
                        if (e.target.value) nuevo[h] = e.target.value;
                        else delete nuevo[h];
                        setMapeoColumnas(nuevo);
                      }}
                      className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                    >
                      <option value="">— Ignorar —</option>
                      {COLUMNAS_ESPERADAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview de las primeras 5 filas */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {datos.encabezados.filter((h) => mapeoColumnas[h]).map((h) => (
                      <TableHead key={h} className="text-xs whitespace-nowrap">
                        {mapeoColumnas[h]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.filas.slice(0, 5).map((fila, i) => (
                    <TableRow key={i}>
                      {datos.encabezados.filter((h) => mapeoColumnas[h]).map((h) => (
                        <TableCell key={h} className="text-xs">
                          {fila[h] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {datos.filas.length > 5 && (
                <p className="text-xs text-center text-muted-foreground py-2">
                  ...y {datos.filas.length - 5} registros mas
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetear}>Volver</Button>
              <Button onClick={handleImportar} disabled={importando}>
                {importando ? "Importando..." : `Importar ${datos.filas.length} registros`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Paso 3: Resultado */}
        {paso === 3 && resultado && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-medium">Importacion completada</p>
              <p className="text-sm text-muted-foreground mt-1">
                {resultado.importados} pacientes importados correctamente
              </p>
              {resultado.omitidos > 0 && (
                <p className="text-sm text-amber-600 mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {resultado.omitidos} registros omitidos (sin nombre o duplicados)
                </p>
              )}
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={handleCerrar}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
