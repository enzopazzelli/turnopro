"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, CalendarPlus, Loader2, ExternalLink } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PRIORIDADES, OBLIGACIONES_FISCALES } from "@/lib/constants";
import { obtenerVencimientosFiscales, completarVencimientoFiscal, cargarVencimientosAFIP } from "@/app/(dashboard)/actions/contadores";
import { LINKS_CONTADORES, CATEGORIAS_MONOTRIBUTO } from "@/config/calendario-fiscal";
import { VencimientoFiscalDialog } from "./vencimiento-fiscal-dialog";
import { toast } from "sonner";

export function VencimientosFiscalesLista({ vencimientosIniciales = [] }) {
  const [vencimientos, setVencimientos] = useState(vencimientosIniciales);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [filtroObligacion, setFiltroObligacion] = useState("");
  const [afipDialogAbierto, setAfipDialogAbierto] = useState(false);
  const [afipCargando, setAfipCargando] = useState(false);

  const cargar = useCallback(async () => {
    const filtro = {};
    if (filtroObligacion) filtro.obligacion = filtroObligacion;
    const { data } = await obtenerVencimientosFiscales(filtro);
    setVencimientos(data);
  }, [filtroObligacion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleToggle = async (id) => {
    const resultado = await completarVencimientoFiscal(id);
    if (resultado.error) toast.error(resultado.error);
    else cargar();
  };

  const getColorPrioridad = (prioridad) => {
    return PRIORIDADES.find((p) => p.valor === prioridad)?.color || "#6b7280";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vencimientos Fiscales</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAfipDialogAbierto(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" /> Cargar AFIP
          </Button>
          <Button onClick={() => { setDialogKey((k) => k + 1); setDialogAbierto(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo vencimiento
          </Button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        <Badge
          variant={filtroObligacion === "" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroObligacion("")}
        >
          Todas
        </Badge>
        {OBLIGACIONES_FISCALES.map((ob) => (
          <Badge
            key={ob.valor}
            variant={filtroObligacion === ob.valor ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroObligacion(ob.valor === filtroObligacion ? "" : ob.valor)}
          >
            {ob.nombre}
          </Badge>
        ))}
      </div>

      {vencimientos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No hay vencimientos registrados
        </p>
      ) : (
        <div className="space-y-2">
          {vencimientos.map((v) => {
            const vencido = !v.completado && isPast(new Date(v.fecha_vencimiento)) && !isToday(new Date(v.fecha_vencimiento));
            return (
              <div
                key={v.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  vencido ? "border-destructive bg-destructive/5" : ""
                } ${v.completado ? "opacity-60" : ""}`}
              >
                <button
                  onClick={() => handleToggle(v.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    v.completado ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground"
                  }`}
                >
                  {v.completado && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${v.completado ? "line-through" : ""}`}>
                    {v.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.obligacion && <>{OBLIGACIONES_FISCALES.find((o) => o.valor === v.obligacion)?.nombre || v.obligacion} | </>}
                    {v.pacientes?.nombre_completo && <>{v.pacientes.nombre_completo} | </>}
                    {v.recurrente && <Badge variant="secondary" className="text-[10px] mr-1">{v.recurrencia}</Badge>}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  style={{ borderColor: getColorPrioridad(v.prioridad), color: getColorPrioridad(v.prioridad) }}
                >
                  {v.prioridad}
                </Badge>
                <span className={`text-sm whitespace-nowrap ${vencido ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {format(new Date(v.fecha_vencimiento), "dd/MM/yyyy", { locale: es })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <VencimientoFiscalDialog
        key={dialogKey}
        abierto={dialogAbierto}
        onCerrar={() => {
          setDialogAbierto(false);
          cargar();
        }}
      />

      {/* Links utiles */}
      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold">Links utiles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {LINKS_CONTADORES.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors text-sm"
            >
              <div>
                <span className="font-medium">{link.titulo}</span>
                <p className="text-xs text-muted-foreground">{link.descripcion}</p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-2" />
            </a>
          ))}
        </div>
      </div>

      {/* Dialog cargar vencimientos AFIP */}
      <Dialog open={afipDialogAbierto} onOpenChange={setAfipDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar vencimientos AFIP</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              setAfipCargando(true);
              const res = await cargarVencimientosAFIP(
                Number(fd.get("mes")),
                Number(fd.get("anio")),
                fd.get("cuit_terminacion")
              );
              setAfipCargando(false);
              if (res.error) { toast.error(res.error); return; }
              toast.success(`${res.cantidad} vencimientos cargados`);
              setAfipDialogAbierto(false);
              cargar();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="afip-mes">Mes *</Label>
                <Input id="afip-mes" name="mes" type="number" min={1} max={12} defaultValue={new Date().getMonth() + 1} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="afip-anio">Ano *</Label>
                <Input id="afip-anio" name="anio" type="number" min={2024} max={2030} defaultValue={new Date().getFullYear()} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="afip-cuit">Terminacion de CUIT (ultimo digito) *</Label>
              <Input id="afip-cuit" name="cuit_terminacion" type="number" min={0} max={9} required placeholder="Ej: 7" />
            </div>
            <p className="text-xs text-muted-foreground">
              Se cargaran automaticamente los vencimientos de IVA, Ganancias, Monotributo, IIBB y Cargas Sociales para el periodo seleccionado.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAfipDialogAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={afipCargando}>
                {afipCargando ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando...</> : "Cargar vencimientos"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
