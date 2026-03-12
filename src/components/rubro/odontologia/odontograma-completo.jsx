"use client";

import { useState, useCallback } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DienteSVG } from "./diente-svg";
import { guardarOdontograma } from "@/app/(dashboard)/actions/odontologia";
import { toast } from "sonner";
import {
  ESTADOS_CARA_DIENTE,
  ESTADOS_DIENTE,
  COLORES_CARA_DIENTE,
  COLORES_ESTADO_DIENTE,
} from "@/lib/constants";

// Cuadrantes FDI
const CUADRANTES = {
  adulto: {
    superior_derecho: [18, 17, 16, 15, 14, 13, 12, 11],
    superior_izquierdo: [21, 22, 23, 24, 25, 26, 27, 28],
    inferior_izquierdo: [31, 32, 33, 34, 35, 36, 37, 38],
    inferior_derecho: [48, 47, 46, 45, 44, 43, 42, 41],
  },
  infantil: {
    superior_derecho: [55, 54, 53, 52, 51],
    superior_izquierdo: [61, 62, 63, 64, 65],
    inferior_izquierdo: [71, 72, 73, 74, 75],
    inferior_derecho: [85, 84, 83, 82, 81],
  },
};

export function OdontogramaCompleto({ odontograma, pacienteNombre }) {
  const [datos, setDatos] = useState(odontograma?.datos || {});
  const [notas, setNotas] = useState(odontograma?.notas || "");
  const [guardando, setGuardando] = useState(false);
  const [popoverAbierto, setPopoverAbierto] = useState(null);

  const tipo = odontograma?.tipo || "adulto";
  const cuadrantes = CUADRANTES[tipo];

  const handleClickCara = useCallback((diente, cara) => {
    setPopoverAbierto({ diente: String(diente), cara });
  }, []);

  const setEstadoCara = (diente, cara, estado) => {
    setDatos((prev) => ({
      ...prev,
      [diente]: {
        ...prev[diente],
        caras: { ...(prev[diente]?.caras || {}), [cara]: estado },
        estado: prev[diente]?.estado || "presente",
      },
    }));
    setPopoverAbierto(null);
  };

  const setEstadoDiente = (diente, estado) => {
    setDatos((prev) => ({
      ...prev,
      [diente]: { ...prev[diente], estado, caras: prev[diente]?.caras || {} },
    }));
    setPopoverAbierto(null);
  };

  const handleGuardar = async () => {
    if (!odontograma?.id) return;
    setGuardando(true);
    const resultado = await guardarOdontograma(odontograma.id, datos, notas);
    setGuardando(false);
    if (resultado.error) {
      toast.error(resultado.error);
    } else {
      toast.success("Odontograma guardado");
    }
  };

  const renderCuadrante = (numeros) => (
    <div className="flex gap-1 items-end">
      {numeros.map((num) => {
        const d = String(num);
        const dienteData = datos[d] || {};
        return (
          <Popover
            key={d}
            open={popoverAbierto?.diente === d}
            onOpenChange={(open) => !open && setPopoverAbierto(null)}
          >
            <PopoverTrigger asChild>
              <div>
                <DienteSVG
                  numero={d}
                  datos={dienteData}
                  estadoDiente={dienteData.estado || "presente"}
                  onClick={handleClickCara}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" side="bottom">
              <p className="font-medium text-sm mb-2">Diente {d}{popoverAbierto?.cara ? ` - ${popoverAbierto.cara}` : ""}</p>
              {popoverAbierto?.cara && (
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground">Estado de la cara:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(ESTADOS_CARA_DIENTE).map(([, val]) => (
                      <button
                        key={val}
                        onClick={() => setEstadoCara(d, popoverAbierto.cara, val)}
                        className="text-xs px-2 py-1 rounded border capitalize hover:opacity-80"
                        style={{
                          backgroundColor: COLORES_CARA_DIENTE[val],
                          color: val === "sano" ? "#374151" : "#fff",
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Estado del diente:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(ESTADOS_DIENTE).map(([, val]) => (
                    <button
                      key={val}
                      onClick={() => setEstadoDiente(d, val)}
                      className="text-xs px-2 py-1 rounded border capitalize hover:opacity-80"
                      style={{
                        borderColor: COLORES_ESTADO_DIENTE[val],
                        color: COLORES_ESTADO_DIENTE[val],
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Odontograma {tipo === "adulto" ? "Adulto" : "Infantil"}
          </h3>
          {pacienteNombre && (
            <p className="text-sm text-muted-foreground">{pacienteNombre}</p>
          )}
        </div>
        <Button onClick={handleGuardar} disabled={guardando}>
          <Save className="h-4 w-4 mr-2" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Arcada Superior */}
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground mb-3 text-center">ARCADA SUPERIOR</p>
        <div className="flex justify-center gap-4">
          {renderCuadrante(cuadrantes.superior_derecho)}
          <div className="w-px bg-border" />
          {renderCuadrante(cuadrantes.superior_izquierdo)}
        </div>
      </div>

      {/* Arcada Inferior */}
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground mb-3 text-center">ARCADA INFERIOR</p>
        <div className="flex justify-center gap-4">
          {renderCuadrante(cuadrantes.inferior_izquierdo)}
          <div className="w-px bg-border" />
          {renderCuadrante(cuadrantes.inferior_derecho)}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="font-medium">Caras:</span>
        {Object.entries(COLORES_CARA_DIENTE).map(([estado, color]) => (
          <span key={estado} className="flex items-center gap-1 capitalize">
            <span className="w-3 h-3 rounded-sm border" style={{ backgroundColor: color }} />
            {estado}
          </span>
        ))}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones generales..."
          rows={3}
        />
      </div>
    </div>
  );
}
