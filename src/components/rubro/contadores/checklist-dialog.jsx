"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Trash2, LayoutTemplate } from "lucide-react";

const TEMPLATES_CHECKLIST = {
  iva_mensual: {
    titulo: "IVA Mensual",
    items: [
      "Libro de IVA Compras",
      "Libro de IVA Ventas",
      "Comprobantes de compras del mes",
      "Comprobantes de ventas del mes",
      "Declaracion jurada F.2002 / F.2003",
      "Comprobante de pago",
    ],
  },
  ganancias_anual: {
    titulo: "Ganancias Anual",
    items: [
      "DDJJ Ganancias (F.713)",
      "Libro de Ingresos y Gastos",
      "Comprobantes de gastos deducibles",
      "Resumen bancario anual",
      "Certificado de haberes / honorarios",
      "Comprobante de pago",
    ],
  },
  monotributo_mensual: {
    titulo: "Monotributo Mensual",
    items: [
      "Comprobante de pago mensual",
      "Facturacion del mes",
      "Control de ingresos acumulados",
      "Verificar categoria vigente",
    ],
  },
  bienes_personales: {
    titulo: "Bienes Personales",
    items: [
      "Detalle de bienes al 31/12",
      "Valuacion de inmuebles",
      "Saldos bancarios al 31/12",
      "Participaciones societarias",
      "Deudas al 31/12",
      "DDJJ F.762/A",
      "Comprobante de pago",
    ],
  },
  cargas_sociales: {
    titulo: "Cargas Sociales (F.931)",
    items: [
      "Nomina de empleados del mes",
      "Novedades (altas, bajas, licencias)",
      "Recibos de sueldo firmados",
      "Declaracion jurada F.931",
      "Comprobante de pago AFIP",
      "Comprobante de pago obra social",
    ],
  },
  iibb_mensual: {
    titulo: "Ingresos Brutos Mensual",
    items: [
      "Detalle de ingresos del mes por jurisdiccion",
      "Declaracion jurada IIBB",
      "Comprobante de pago",
    ],
  },
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearChecklist } from "@/app/(dashboard)/actions/contadores";
import { toast } from "sonner";

const estadoInicial = { error: null, success: false };

export function ChecklistDialog({ abierto, onCerrar, pacienteId }) {
  const [state, formAction, pending] = useActionState(crearChecklist, estadoInicial);
  const formRef = useRef(null);
  const [items, setItems] = useState([{ descripcion: "" }]);
  const [titulo, setTitulo] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success("Checklist creado");
      onCerrar();
      setItems([{ descripcion: "" }]);
      setTitulo("");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onCerrar]);

  function handleTemplate(key) {
    if (!key) return;
    const tpl = TEMPLATES_CHECKLIST[key];
    if (!tpl) return;
    setTitulo(tpl.titulo);
    setItems(tpl.items.map((d) => ({ descripcion: d })));
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Checklist</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {pacienteId && <input type="hidden" name="paciente_id" value={pacienteId} />}
          <input type="hidden" name="items" value={JSON.stringify(items.filter((i) => i.descripcion.trim()))} />

          {/* Selector de template */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <LayoutTemplate className="h-4 w-4" /> Usar template
            </Label>
            <Select onValueChange={handleTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar template predefinido..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATES_CHECKLIST).map(([key, tpl]) => (
                  <SelectItem key={key} value={key}>{tpl.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo *</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodo">Periodo</Label>
            <Input id="periodo" name="periodo" placeholder="Ej: Enero 2026" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} />
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems([...items, { descripcion: "" }])}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Item ${i + 1}`}
                  value={item.descripcion}
                  onChange={(e) => {
                    const nuevos = [...items];
                    nuevos[i] = { descripcion: e.target.value };
                    setItems(nuevos);
                  }}
                />
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
