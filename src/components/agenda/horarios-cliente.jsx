"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guardarDisponibilidad } from "@/app/(dashboard)/actions/disponibilidad";
import { toast } from "sonner";

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
  { value: 0, label: "Domingo" },
];

const MAX_BLOQUES = 3;

const estadoInicial = { error: null, success: null };

function agruparBloques(disponibilidadInicial) {
  // Agrupa registros de disponibilidad por dia_semana, soportando multiples bloques
  const porDia = {};
  for (const reg of disponibilidadInicial) {
    if (!porDia[reg.dia_semana]) {
      porDia[reg.dia_semana] = [];
    }
    porDia[reg.dia_semana].push(reg);
  }
  return porDia;
}

export function HorariosCliente({ disponibilidadInicial }) {
  const porDia = agruparBloques(disponibilidadInicial);

  const [dias, setDias] = useState(() => {
    return DIAS_SEMANA.map((dia) => {
      const registros = porDia[dia.value] || [];
      const activo = registros.some((r) => r.activo);
      const bloques = registros
        .filter((r) => r.activo)
        .sort((a, b) => (a.bloque || 1) - (b.bloque || 1))
        .map((r) => ({
          hora_inicio: r.hora_inicio?.slice(0, 5) ?? "09:00",
          hora_fin: r.hora_fin?.slice(0, 5) ?? "18:00",
        }));

      return {
        dia_semana: dia.value,
        label: dia.label,
        activo,
        bloques: bloques.length > 0 ? bloques : [{ hora_inicio: "09:00", hora_fin: "18:00" }],
      };
    });
  });

  const [state, formAction, pending] = useActionState(
    guardarDisponibilidad,
    estadoInicial
  );

  const ultimoExitoRef = useRef(null);

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success("Horarios guardados correctamente");
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function actualizarDia(index, campo, valor) {
    setDias((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [campo]: valor } : d))
    );
  }

  function actualizarBloque(diaIndex, bloqueIndex, campo, valor) {
    setDias((prev) =>
      prev.map((d, i) => {
        if (i !== diaIndex) return d;
        const nuevosBloques = d.bloques.map((b, j) =>
          j === bloqueIndex ? { ...b, [campo]: valor } : b
        );
        return { ...d, bloques: nuevosBloques };
      })
    );
  }

  function agregarBloque(diaIndex) {
    setDias((prev) =>
      prev.map((d, i) => {
        if (i !== diaIndex || d.bloques.length >= MAX_BLOQUES) return d;
        const ultimoBloque = d.bloques[d.bloques.length - 1];
        return {
          ...d,
          bloques: [
            ...d.bloques,
            { hora_inicio: ultimoBloque.hora_fin, hora_fin: "20:00" },
          ],
        };
      })
    );
  }

  function eliminarBloque(diaIndex, bloqueIndex) {
    setDias((prev) =>
      prev.map((d, i) => {
        if (i !== diaIndex || d.bloques.length <= 1) return d;
        return {
          ...d,
          bloques: d.bloques.filter((_, j) => j !== bloqueIndex),
        };
      })
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Horarios</h2>
        <p className="text-muted-foreground">
          Configura tu disponibilidad semanal. Podes agregar cortes (ej: mañana y tarde).
        </p>
      </div>

      <form action={formAction}>
        <input
          type="hidden"
          name="dias"
          value={JSON.stringify(
            dias.map(({ dia_semana, activo, bloques }) => ({
              dia_semana,
              activo,
              bloques,
            }))
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle>Disponibilidad semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dias.map((dia, index) => (
              <div
                key={dia.dia_semana}
                className="py-3 border-b last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-28 flex items-center gap-3">
                    <Switch
                      checked={dia.activo}
                      onCheckedChange={(checked) =>
                        actualizarDia(index, "activo", checked)
                      }
                    />
                    <Label className="font-medium">{dia.label}</Label>
                  </div>

                  {!dia.activo && (
                    <span className="text-muted-foreground text-sm">
                      No disponible
                    </span>
                  )}
                </div>

                {dia.activo && (
                  <div className="ml-28 mt-2 space-y-2">
                    {dia.bloques.map((bloque, bloqueIdx) => (
                      <div key={bloqueIdx} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={bloque.hora_inicio}
                          onChange={(e) =>
                            actualizarBloque(index, bloqueIdx, "hora_inicio", e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">a</span>
                        <Input
                          type="time"
                          value={bloque.hora_fin}
                          onChange={(e) =>
                            actualizarBloque(index, bloqueIdx, "hora_fin", e.target.value)
                          }
                          className="w-32"
                        />
                        {dia.bloques.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => eliminarBloque(index, bloqueIdx)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {dia.bloques.length < MAX_BLOQUES && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => agregarBloque(index)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar bloque
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4">
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando..." : "Guardar horarios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
