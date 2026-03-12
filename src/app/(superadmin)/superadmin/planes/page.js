"use client";

import { useState, useEffect, useTransition } from "react";
import { Check, X, Edit2, Save, RotateCcw, CreditCard, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { obtenerPlanes, actualizarPlan } from "@/app/(superadmin)/actions/planes";
import {
  FEATURES_LISTA, FEATURES_LABELS, LIMITES_LABELS, PLAN_FEATURES_DEFAULT,
} from "@/lib/features";
import { toast } from "sonner";

const PLAN_STYLES = {
  trial:       { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", border: "border-yellow-200 dark:border-yellow-800" },
  basico:      { badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",         border: "border-blue-200 dark:border-blue-800" },
  profesional: { badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", border: "border-indigo-200 dark:border-indigo-800" },
  premium:     { badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", border: "border-purple-200 dark:border-purple-800" },
};

function LimiteInput({ label, value, onChange }) {
  const [esIlimitado, setEsIlimitado] = useState(value === null);
  const [num, setNum] = useState(value ?? "");

  function handleToggle(checked) {
    setEsIlimitado(checked);
    onChange(checked ? null : (num !== "" ? Number(num) : null));
  }

  function handleNum(e) {
    const v = e.target.value;
    setNum(v);
    onChange(v === "" ? null : Number(v));
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {!esIlimitado && (
          <Input
            type="number"
            min={1}
            value={num}
            onChange={handleNum}
            className="w-20 h-7 text-sm text-right"
          />
        )}
        <div className="flex items-center gap-1.5">
          <Switch checked={esIlimitado} onCheckedChange={handleToggle} />
          <span className="text-xs text-muted-foreground w-16">{esIlimitado ? "Ilimitado" : "Limitado"}</span>
        </div>
      </div>
    </div>
  );
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // plan completo en edición
  const [draftFeatures, setDraftFeatures] = useState({});
  const [draftLimites, setDraftLimites] = useState({});
  const [draftPrecio, setDraftPrecio] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [pendingSave, startSave] = useTransition();

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data } = await obtenerPlanes();
    setPlanes(data || []);
    setCargando(false);
  }

  function abrirEditar(plan) {
    setEditando(plan);
    setDraftFeatures({ ...plan.features });
    setDraftLimites({ ...plan.limites });
    setDraftPrecio(plan.precio ?? 0);
    setDraftDesc(plan.descripcion ?? "");
  }

  function cerrarEditar() {
    setEditando(null);
  }

  function toggleFeature(key) {
    setDraftFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function resetearDefaults() {
    const defaults = PLAN_FEATURES_DEFAULT[editando.nombre];
    if (!defaults) return;
    setDraftFeatures({ ...defaults.features });
    setDraftLimites({ ...defaults.limites });
    setDraftPrecio(defaults.precio ?? 0);
    setDraftDesc(defaults.descripcion ?? "");
  }

  function guardar() {
    startSave(async () => {
      const { error } = await actualizarPlan(editando.id, {
        features: draftFeatures,
        limites: draftLimites,
        precio: Number(draftPrecio),
        descripcion: draftDesc,
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Plan actualizado");
        cerrarEditar();
        cargar();
      }
    });
  }

  const featuresHabilitadas = (plan) =>
    FEATURES_LISTA.filter((f) => plan.features?.[f]).length;

  if (cargando) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Planes</h1>
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="h-48 animate-pulse bg-muted rounded mt-0" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planes</h1>
        <p className="text-muted-foreground text-sm">
          Configurá qué funcionalidades incluye cada plan. Los cambios aplican a todos los tenants en ese plan (salvo overrides individuales).
        </p>
      </div>

      {/* Cards de planes */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {planes.map((plan) => {
          const style = PLAN_STYLES[plan.nombre] || {};
          const habilitadas = featuresHabilitadas(plan);
          return (
            <Card key={plan.id} className={`border ${style.border || ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge className={`mb-1 ${style.badge || ""} border-0`}>{plan.label}</Badge>
                    <CardTitle className="text-lg">${Number(plan.precio).toLocaleString("es-AR")}<span className="text-sm font-normal text-muted-foreground">/mes</span></CardTitle>
                    <CardDescription className="text-xs mt-0.5">{plan.descripcion}</CardDescription>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => abrirEditar(plan)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Límites */}
                <div className="text-xs space-y-0.5 text-muted-foreground border-b pb-2">
                  {Object.entries(LIMITES_LABELS).map(([key, lbl]) => (
                    <div key={key} className="flex justify-between">
                      <span>{lbl}</span>
                      <span className="font-medium text-foreground">
                        {plan.limites?.[key] == null ? "Ilimitado" : plan.limites[key]}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Features resumen */}
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{habilitadas}</span> de {FEATURES_LISTA.length} funcionalidades habilitadas
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  {FEATURES_LISTA.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs">
                      {plan.features?.[f]
                        ? <Check className="h-3 w-3 text-green-500 shrink-0" />
                        : <X className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      }
                      <span className={plan.features?.[f] ? "text-foreground" : "text-muted-foreground/50"}>
                        {FEATURES_LABELS[f]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog editar plan */}
      <Dialog open={!!editando} onOpenChange={(open) => !open && cerrarEditar()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Editar plan — {editando?.label}
            </DialogTitle>
          </DialogHeader>

          {editando && (
            <div className="space-y-5 py-2">
              {/* Precio + descripción */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="precio">Precio mensual (ARS)</Label>
                  <Input
                    id="precio"
                    type="number"
                    min={0}
                    value={draftPrecio}
                    onChange={(e) => setDraftPrecio(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc">Descripción</Label>
                  <Input
                    id="desc"
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* Límites */}
              <div className="space-y-1">
                <p className="text-sm font-medium">Límites</p>
                <div className="border rounded-md px-3 divide-y">
                  {Object.entries(LIMITES_LABELS).map(([key, lbl]) => (
                    <LimiteInput
                      key={key}
                      label={lbl}
                      value={draftLimites[key] ?? null}
                      onChange={(v) => setDraftLimites((prev) => ({ ...prev, [key]: v }))}
                    />
                  ))}
                </div>
              </div>

              {/* Features toggles */}
              <div className="space-y-1">
                <p className="text-sm font-medium">Funcionalidades</p>
                <div className="border rounded-md divide-y">
                  {FEATURES_LISTA.map((f) => (
                    <div key={f} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{FEATURES_LABELS[f]}</span>
                      <Switch
                        checked={!!draftFeatures[f]}
                        onCheckedChange={() => toggleFeature(f)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div className="flex gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Los cambios aplican globalmente al plan. Los tenants con overrides individuales mantienen sus excepciones.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={resetearDefaults} className="mr-auto">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restaurar defaults
            </Button>
            <Button variant="outline" onClick={cerrarEditar}>Cancelar</Button>
            <Button onClick={guardar} disabled={pendingSave}>
              <Save className="h-4 w-4 mr-1.5" />
              {pendingSave ? "Guardando..." : "Guardar plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
