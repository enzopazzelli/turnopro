"use client";

import { useState } from "react";
import { Plus, Trash2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  toggleChecklistItem,
  agregarChecklistItem,
  eliminarChecklistItem,
} from "@/app/(dashboard)/actions/contadores";
import { toast } from "sonner";

export function ChecklistDetalle({ checklist }) {
  const items = (checklist.checklist_items || []).sort((a, b) => a.orden - b.orden);
  const [nuevoItem, setNuevoItem] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const handleToggle = async (itemId, completado) => {
    const resultado = await toggleChecklistItem(itemId, !completado);
    if (resultado.error) toast.error(resultado.error);
  };

  const handleAgregar = async () => {
    if (!nuevoItem.trim()) return;
    setAgregando(true);
    const formData = new FormData();
    formData.set("descripcion", nuevoItem.trim());
    formData.set("orden", String(items.length));
    const resultado = await agregarChecklistItem(checklist.id, {}, formData);
    setAgregando(false);
    if (resultado.error) toast.error(resultado.error);
    else setNuevoItem("");
  };

  const handleEliminar = async (itemId) => {
    setEliminandoId(itemId);
    const resultado = await eliminarChecklistItem(itemId);
    setEliminandoId(null);
    if (resultado.error) toast.error(resultado.error);
  };

  const completados = items.filter((i) => i.completado).length;
  const porcentaje = items.length > 0 ? Math.round((completados / items.length) * 100) : 0;

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">{porcentaje}% completado</p>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <button
              onClick={() => handleToggle(item.id, item.completado)}
              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                item.completado ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground"
              }`}
            >
              {item.completado && <Check className="h-3 w-3" />}
            </button>
            <span className={`flex-1 text-sm ${item.completado ? "line-through text-muted-foreground" : ""}`}>
              {item.descripcion}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 h-6 w-6"
              onClick={() => handleEliminar(item.id)}
              disabled={eliminandoId === item.id}
            >
              {eliminandoId === item.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 text-destructive" />
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Agregar item */}
      <div className="flex gap-2">
        <Input
          placeholder="Nuevo item..."
          value={nuevoItem}
          onChange={(e) => setNuevoItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAgregar())}
          className="text-sm"
        />
        <Button size="sm" onClick={handleAgregar} disabled={agregando || !nuevoItem.trim()}>
          {agregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
