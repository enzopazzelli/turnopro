"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearReceta } from "@/app/(dashboard)/actions/recetas";
import { buscarMedicamentos } from "@/config/vademecum";
import { buscarCIE10 } from "@/config/cie10";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };
const medicamentoVacio = { nombre: "", dosis: "", frecuencia: "", duracion: "", indicaciones: "" };

const TIPOS_SALUD = [
  { value: "receta_medicamento", label: "Receta de medicamentos" },
  { value: "indicacion_medica", label: "Indicacion medica" },
  { value: "orden_estudio", label: "Orden de estudio" },
  { value: "derivacion", label: "Derivacion" },
  { value: "certificado", label: "Certificado" },
];

const TIPOS_ABOGADOS = [
  { value: "carta_documento", label: "Carta documento" },
  { value: "dictamen", label: "Dictamen" },
  { value: "certificacion_firma", label: "Certificacion de firma" },
  { value: "informe_legal", label: "Informe legal" },
  { value: "poder", label: "Poder" },
  { value: "certificado", label: "Certificado" },
];

const TIPOS_CONTADORES = [
  { value: "certificacion_ingresos", label: "Certificacion de ingresos" },
  { value: "informe_contable", label: "Informe contable" },
  { value: "balance", label: "Balance" },
  { value: "dictamen_contador", label: "Dictamen" },
  { value: "nota_requerimiento", label: "Nota de requerimiento" },
  { value: "certificado", label: "Certificado" },
];

function getTiposPorRubro(rubro) {
  if (rubro === "abogados") return TIPOS_ABOGADOS;
  if (rubro === "contadores") return TIPOS_CONTADORES;
  return TIPOS_SALUD;
}

function getDefaultTipo(rubro) {
  if (rubro === "abogados") return "carta_documento";
  if (rubro === "contadores") return "certificacion_ingresos";
  return "receta_medicamento";
}

function getLabelAsunto(rubro) {
  if (rubro === "abogados" || rubro === "contadores") return "Asunto";
  return "Diagnostico";
}

function getPlaceholderAsunto(rubro) {
  if (rubro === "abogados") return "Asunto o referencia";
  if (rubro === "contadores") return "Asunto o concepto";
  return "Diagnostico o motivo";
}

const CONTENIDO_LABELS = {
  orden_estudio: "Estudios solicitados",
  indicacion_medica: "Indicaciones",
  derivacion: "Motivo de derivacion y especialidad",
  certificado: "Contenido del certificado",
  carta_documento: "Contenido de la carta documento",
  dictamen: "Contenido del dictamen",
  certificacion_firma: "Detalle de la certificacion",
  informe_legal: "Contenido del informe",
  poder: "Contenido del poder",
  certificacion_ingresos: "Detalle de la certificacion",
  informe_contable: "Contenido del informe",
  balance: "Detalle del balance",
  dictamen_contador: "Contenido del dictamen",
  nota_requerimiento: "Detalle del requerimiento",
};

const CONTENIDO_PLACEHOLDERS = {
  orden_estudio: "Ej: Hemograma completo, glucemia, perfil lipidico...",
  derivacion: "Ej: Se deriva al paciente a Cardiologia por...",
  certificado: "Ej: Se certifica que el/la...",
  carta_documento: "Ej: Por la presente se intima a...",
  dictamen: "Ej: En relacion a la consulta formulada...",
  certificacion_firma: "Ej: Se certifica que la firma inserta...",
  informe_legal: "Ej: Se informa que segun la normativa vigente...",
  poder: "Ej: Otorga poder especial a favor de...",
  certificacion_ingresos: "Ej: Se certifica que el/la contribuyente...",
  informe_contable: "Ej: De acuerdo con la documentacion analizada...",
  balance: "Ej: Estado de situacion patrimonial al...",
  dictamen_contador: "Ej: He examinado los estados contables de...",
  nota_requerimiento: "Ej: Se solicita la presentacion de la siguiente documentacion...",
};

function DiagnosticoAutocomplete({ placeholder }) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const ref = useRef(null);

  function handleChange(e) {
    const val = e.target.value;
    setValor(val);
    const resultados = buscarCIE10(val);
    setSugerencias(resultados);
    setAbierto(resultados.length > 0);
  }

  function handleSelect(item) {
    setValor(`${item.codigo} - ${item.descripcion}`);
    setAbierto(false);
    setSugerencias([]);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name="diagnostico" value={valor} />
      <Input
        placeholder={placeholder}
        value={valor}
        onChange={handleChange}
        onFocus={() => { if (sugerencias.length > 0) setAbierto(true); }}
        autoComplete="off"
      />
      {abierto && sugerencias.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
          {sugerencias.map((item) => (
            <button
              key={item.codigo}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => handleSelect(item)}
            >
              <span className="font-mono font-medium text-primary mr-2">{item.codigo}</span>
              <span>{item.descripcion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MedicamentoAutocomplete({ value, onSelect, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const ref = useRef(null);

  function handleChange(e) {
    const val = e.target.value;
    onChange(val);
    const resultados = buscarMedicamentos(val);
    setSugerencias(resultados);
    setAbierto(resultados.length > 0);
  }

  function handleSelect(item) {
    onSelect(item);
    setAbierto(false);
    setSugerencias([]);
  }

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Input
        placeholder="Nombre del medicamento *"
        value={value}
        onChange={handleChange}
        onFocus={() => { if (sugerencias.length > 0) setAbierto(true); }}
        autoComplete="off"
      />
      {abierto && sugerencias.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
          {sugerencias.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => handleSelect(item)}
            >
              <span className="font-medium">{item.texto}</span>
              {item.comerciales?.length > 0 && (
                <span className="text-muted-foreground ml-2 text-xs">
                  ({item.comerciales.join(", ")})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecetaDialog({ abierto, onCerrar, pacienteId, rubro }) {
  const [state, formAction, pending] = useActionState(crearReceta, estadoInicial);
  const formRef = useRef(null);
  const ultimoExitoRef = useRef(null);

  const tipos = getTiposPorRubro(rubro);
  const defaultTipo = getDefaultTipo(rubro);
  const [tipo, setTipo] = useState(defaultTipo);
  const [medicamentos, setMedicamentos] = useState([{ ...medicamentoVacio }]);

  const esSalud = !["abogados", "contadores"].includes(rubro);
  const tituloDialog = esSalud ? "Nueva Receta" : "Nuevo Documento";
  const botonTexto = esSalud ? "Crear receta" : "Crear documento";
  const labelObservaciones = esSalud ? "Indicaciones generales" : "Observaciones";

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success(esSalud ? "Receta creada" : "Documento creado");
      onCerrar();
      setMedicamentos([{ ...medicamentoVacio }]);
      setTipo(defaultTipo);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar, esSalud, defaultTipo]);

  const esMedicamentos = tipo === "receta_medicamento";

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tituloDialog}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={pacienteId} />
          <input type="hidden" name="tipo" value={tipo} />
          <input type="hidden" name="medicamentos" value={JSON.stringify(esMedicamentos ? medicamentos : [])} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnostico">{getLabelAsunto(rubro)}</Label>
            {esSalud ? (
              <DiagnosticoAutocomplete placeholder={getPlaceholderAsunto(rubro)} />
            ) : (
              <Textarea id="diagnostico" name="diagnostico" rows={2} placeholder={getPlaceholderAsunto(rubro)} />
            )}
          </div>

          {/* Medicamentos — solo para receta_medicamento */}
          {esMedicamentos && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Medicamentos *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMedicamentos([...medicamentos, { ...medicamentoVacio }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {medicamentos.map((med, i) => (
                <div key={i} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medicamento {i + 1}</span>
                    {medicamentos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setMedicamentos(medicamentos.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <MedicamentoAutocomplete
                    value={med.nombre}
                    onSelect={(resultado) => {
                      const nuevos = [...medicamentos];
                      nuevos[i] = {
                        ...nuevos[i],
                        nombre: resultado.texto,
                        dosis: resultado.presentacion || nuevos[i].dosis,
                      };
                      setMedicamentos(nuevos);
                    }}
                    onChange={(valor) => {
                      const nuevos = [...medicamentos];
                      nuevos[i] = { ...nuevos[i], nombre: valor };
                      setMedicamentos(nuevos);
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Dosis (ej: 500mg)"
                      value={med.dosis}
                      onChange={(e) => {
                        const nuevos = [...medicamentos];
                        nuevos[i] = { ...nuevos[i], dosis: e.target.value };
                        setMedicamentos(nuevos);
                      }}
                    />
                    <Input
                      placeholder="Frecuencia (ej: cada 8hs)"
                      value={med.frecuencia}
                      onChange={(e) => {
                        const nuevos = [...medicamentos];
                        nuevos[i] = { ...nuevos[i], frecuencia: e.target.value };
                        setMedicamentos(nuevos);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Duracion (ej: 7 dias)"
                      value={med.duracion}
                      onChange={(e) => {
                        const nuevos = [...medicamentos];
                        nuevos[i] = { ...nuevos[i], duracion: e.target.value };
                        setMedicamentos(nuevos);
                      }}
                    />
                    <Input
                      placeholder="Indicaciones"
                      value={med.indicaciones}
                      onChange={(e) => {
                        const nuevos = [...medicamentos];
                        nuevos[i] = { ...nuevos[i], indicaciones: e.target.value };
                        setMedicamentos(nuevos);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contenido libre — para tipos que no son receta de medicamentos */}
          {!esMedicamentos && (
            <div className="space-y-2">
              <Label htmlFor="contenido">
                {CONTENIDO_LABELS[tipo] || "Contenido"}
              </Label>
              <Textarea
                id="contenido"
                name="contenido"
                rows={5}
                placeholder={CONTENIDO_PLACEHOLDERS[tipo] || "Detalle del documento..."}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="indicaciones_generales">{labelObservaciones}</Label>
            <Textarea id="indicaciones_generales" name="indicaciones_generales" rows={2} placeholder="Observaciones adicionales" />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : botonTexto}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
