"use client";

import { useActionState, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aplicarCuestionario } from "@/app/(dashboard)/actions/psicologia";
import { buscarPacientesParaCita } from "@/app/(dashboard)/actions/pacientes";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

const OPCIONES_POR_TIPO = {
  phq9: [
    { valor: "0", label: "Nunca" },
    { valor: "1", label: "Varios dias" },
    { valor: "2", label: "Mas de la mitad de los dias" },
    { valor: "3", label: "Casi todos los dias" },
  ],
  gad7: [
    { valor: "0", label: "Nunca" },
    { valor: "1", label: "Varios dias" },
    { valor: "2", label: "Mas de la mitad de los dias" },
    { valor: "3", label: "Casi todos los dias" },
  ],
  bdi2: [
    { valor: "0", label: "0" },
    { valor: "1", label: "1" },
    { valor: "2", label: "2" },
    { valor: "3", label: "3" },
  ],
  stai_estado: [
    { valor: "1", label: "Nada" },
    { valor: "2", label: "Algo" },
    { valor: "3", label: "Bastante" },
    { valor: "4", label: "Mucho" },
  ],
  stai_rasgo: [
    { valor: "1", label: "Casi nunca" },
    { valor: "2", label: "A veces" },
    { valor: "3", label: "A menudo" },
    { valor: "4", label: "Casi siempre" },
  ],
};

const OPCIONES_DEFAULT = [
  { valor: "0", label: "0" },
  { valor: "1", label: "1" },
  { valor: "2", label: "2" },
  { valor: "3", label: "3" },
];

export function CuestionarioAplicar({ cuestionario }) {
  const [state, formAction, pending] = useActionState(aplicarCuestionario, estadoInicial);
  const [respuestas, setRespuestas] = useState(
    new Array(cuestionario.preguntas?.length || 0).fill(null)
  );
  const [resultado, setResultado] = useState(null);

  // Búsqueda de paciente
  const [busqueda, setBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);

  useEffect(() => {
    if (state.success) {
      setResultado({ puntuacion: state.puntuacion, interpretacion: state.interpretacion });
      toast.success("Cuestionario aplicado");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    if (busqueda.length < 2) {
      setResultadosBusqueda([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await buscarPacientesParaCita(busqueda);
      setResultadosBusqueda(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  const setRespuesta = (index, valor) => {
    const nuevas = [...respuestas];
    nuevas[index] = Number(valor);
    setRespuestas(nuevas);
  };

  const todasRespondidas = respuestas.every((r) => r !== null);
  const puntuacionActual = respuestas.reduce((sum, r) => sum + (r || 0), 0);

  if (resultado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultado: {cuestionario.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-5xl font-bold text-primary">{resultado.puntuacion}</div>
          {resultado.interpretacion && (
            <div className="text-xl font-medium">{resultado.interpretacion}</div>
          )}
          <Button onClick={() => { setResultado(null); setRespuestas(new Array(cuestionario.preguntas?.length || 0).fill(null)); setPacienteSeleccionado(null); }}>
            Aplicar nuevamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{cuestionario.nombre}</h2>
        {cuestionario.descripcion && (
          <p className="text-muted-foreground">{cuestionario.descripcion}</p>
        )}
      </div>

      {/* Seleccionar paciente */}
      <div className="space-y-2">
        <Label>Paciente *</Label>
        {pacienteSeleccionado ? (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
            <span className="flex-1 text-sm">{pacienteSeleccionado.nombre_completo}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPacienteSeleccionado(null)}>
              Cambiar
            </Button>
          </div>
        ) : (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              className="pl-9"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {resultadosBusqueda.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
                {resultadosBusqueda.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => {
                      setPacienteSeleccionado(p);
                      setBusqueda("");
                      setResultadosBusqueda([]);
                    }}
                  >
                    {p.nombre_completo}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preguntas */}
      <form
        action={formAction}
        className="space-y-6"
      >
        <input type="hidden" name="cuestionario_id" value={cuestionario.id} />
        <input type="hidden" name="paciente_id" value={pacienteSeleccionado?.id || ""} />
        <input type="hidden" name="respuestas" value={JSON.stringify(respuestas)} />

        {cuestionario.preguntas?.map((pregunta, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <p className="font-medium mb-3">
                {i + 1}. {pregunta.texto}
              </p>
              <RadioGroup
                value={respuestas[i] !== null ? String(respuestas[i]) : undefined}
                onValueChange={(val) => setRespuesta(i, val)}
              >
                {(() => {
                  const tipoOpciones = OPCIONES_POR_TIPO[cuestionario.tipo];
                  if (tipoOpciones) {
                    return tipoOpciones.map((opcion) => (
                      <div key={opcion.valor} className="flex items-center gap-2">
                        <RadioGroupItem value={opcion.valor} id={`q${i}-${opcion.valor}`} />
                        <Label htmlFor={`q${i}-${opcion.valor}`} className="font-normal cursor-pointer">
                          {opcion.valor} - {opcion.label}
                        </Label>
                      </div>
                    ));
                  }
                  // Generar opciones desde min/max de la pregunta
                  const min = pregunta.min ?? 0;
                  const max = pregunta.max ?? 3;
                  const opciones = [];
                  for (let v = min; v <= max; v++) {
                    opciones.push(
                      <div key={v} className="flex items-center gap-2">
                        <RadioGroupItem value={String(v)} id={`q${i}-${v}`} />
                        <Label htmlFor={`q${i}-${v}`} className="font-normal cursor-pointer">
                          {v}
                        </Label>
                      </div>
                    );
                  }
                  return opciones;
                })()}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Puntuacion parcial: {puntuacionActual}
          </span>
          <Button
            type="submit"
            disabled={pending || !todasRespondidas || !pacienteSeleccionado}
          >
            {pending ? "Enviando..." : "Enviar respuestas"}
          </Button>
        </div>
      </form>
    </div>
  );
}
