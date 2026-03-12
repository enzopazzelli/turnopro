"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Save, Loader2 } from "lucide-react";
import { subirFirma } from "@/app/(dashboard)/actions/recetas";
import { toast } from "sonner";

export function FirmaCanvas({ onGuardada }) {
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = 140;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function iniciarTrazo(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDibujando(true);
  }

  function dibujar(e) {
    e.preventDefault();
    if (!dibujando) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setTieneTrazo(true);
  }

  function terminarTrazo(e) {
    e.preventDefault();
    setDibujando(false);
  }

  function limpiar() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneTrazo(false);
  }

  async function guardar() {
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("firma", new File([blob], "firma.png", { type: "image/png" }));
      setGuardando(true);
      const { error, url } = await subirFirma(formData);
      setGuardando(false);
      if (error) { toast.error(error); return; }
      toast.success("Firma guardada");
      if (onGuardada) onGuardada(url);
    }, "image/png");
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-md bg-white overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: 140, display: "block", touchAction: "none" }}
          onMouseDown={iniciarTrazo}
          onMouseMove={dibujar}
          onMouseUp={terminarTrazo}
          onMouseLeave={terminarTrazo}
          onTouchStart={iniciarTrazo}
          onTouchMove={dibujar}
          onTouchEnd={terminarTrazo}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Dibuja tu firma con el mouse o con el dedo en movil
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={limpiar}
          disabled={!tieneTrazo}
        >
          <Eraser className="h-4 w-4 mr-1" /> Limpiar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={guardar}
          disabled={!tieneTrazo || guardando}
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Guardar firma
        </Button>
      </div>
    </div>
  );
}
