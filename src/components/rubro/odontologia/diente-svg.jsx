"use client";

import { COLORES_CARA_DIENTE, COLORES_ESTADO_DIENTE } from "@/lib/constants";

const CARAS = {
  oclusal: { points: "15,15 25,15 25,25 15,25", label: "O" },
  mesial: { points: "0,10 15,15 15,25 0,30", label: "M" },
  distal: { points: "25,15 40,10 40,30 25,25", label: "D" },
  vestibular: { points: "0,10 15,15 25,15 40,10 40,0 0,0", label: "V" },
  lingual: { points: "0,30 15,25 25,25 40,30 40,40 0,40", label: "L" },
};

export function DienteSVG({ numero, datos = {}, estadoDiente = "presente", onClick }) {
  const caras = datos.caras || {};

  if (estadoDiente === "ausente") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono text-muted-foreground">{numero}</span>
        <svg width="40" height="40" viewBox="0 0 40 40" className="opacity-30">
          <line x1="0" y1="0" x2="40" y2="40" stroke="#999" strokeWidth="1.5" />
          <line x1="40" y1="0" x2="0" y2="40" stroke="#999" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-mono text-muted-foreground">{numero}</span>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className="cursor-pointer hover:opacity-80 transition-opacity"
        style={{
          filter: estadoDiente !== "presente"
            ? `drop-shadow(0 0 2px ${COLORES_ESTADO_DIENTE[estadoDiente] || "#6b7280"})`
            : undefined,
        }}
      >
        {Object.entries(CARAS).map(([nombre, { points }]) => (
          <polygon
            key={nombre}
            points={points}
            fill={COLORES_CARA_DIENTE[caras[nombre] || "sano"]}
            stroke="#6b7280"
            strokeWidth="0.8"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(numero, nombre);
            }}
            className="cursor-pointer hover:brightness-90 transition-all"
          />
        ))}
      </svg>
      {estadoDiente !== "presente" && (
        <span className="text-[8px] capitalize" style={{ color: COLORES_ESTADO_DIENTE[estadoDiente] }}>
          {estadoDiente}
        </span>
      )}
    </div>
  );
}
