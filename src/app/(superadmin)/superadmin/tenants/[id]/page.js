"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft, Building2, Users, CalendarDays, DollarSign, Circle,
  ToggleLeft, RefreshCw, Shield, Check, X, Save, RotateCcw, Info, Package,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  obtenerTenantDetalle,
  activarDesactivarTenant,
  cambiarPlanTenant,
  extenderTrial,
} from "@/app/(superadmin)/actions/superadmin";
import { obtenerTenantConFeatures, actualizarTenantOverride } from "@/app/(superadmin)/actions/planes";
import {
  FEATURES_LISTA, FEATURES_LABELS, LIMITES_LABELS,
  PLAN_FEATURES_DEFAULT, getTenantFeatures,
} from "@/lib/features";

const PLAN_COLORS = {
  trial:       "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  basico:      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  profesional: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  premium:     "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const RUBRO_LABELS = {
  odontologia: "Odontología", medicina: "Medicina", abogados: "Abogados",
  veterinaria: "Veterinaria", psicologia: "Psicología", contadores: "Contadores",
};

export default function TenantDetallePage() {
  const params = useParams();
  const tenantId = params?.id;

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [plan, setPlan] = useState("");
  const [pendingAction, startAction] = useTransition();

  // Feature overrides
  const [overrides, setOverrides] = useState({});
  const [pendingOverride, startOverride] = useTransition();

  async function cargar() {
    setCargando(true);
    const [{ data: detalle }, { data: conFeatures }] = await Promise.all([
      obtenerTenantDetalle(tenantId),
      obtenerTenantConFeatures(tenantId),
    ]);
    if (detalle) {
      setDatos(detalle);
      setPlan(detalle.tenant?.plan || "");
    }
    if (conFeatures) {
      setOverrides(conFeatures.tenant.features_override || {});
    }
    setCargando(false);
  }

  useEffect(() => { if (tenantId) cargar(); }, [tenantId]);

  function handleToggleActivo() {
    startAction(async () => {
      const { error } = await activarDesactivarTenant(tenantId, !datos.tenant.activo);
      if (error) toast.error(error);
      else { toast.success(datos.tenant.activo ? "Tenant desactivado" : "Tenant activado"); cargar(); }
    });
  }

  function handleCambiarPlan() {
    startAction(async () => {
      const { error } = await cambiarPlanTenant(tenantId, plan);
      if (error) toast.error(error);
      else { toast.success("Plan actualizado"); cargar(); }
    });
  }

  function handleExtenderTrial(dias) {
    startAction(async () => {
      const { error } = await extenderTrial(tenantId, dias);
      if (error) toast.error(error);
      else { toast.success(`Trial extendido ${dias} días`); cargar(); }
    });
  }

  function guardarOverrides() {
    startOverride(async () => {
      const { error } = await actualizarTenantOverride(tenantId, overrides);
      if (error) { toast.error(error); return; }
      toast.success("Overrides guardados");
      cargar();
    });
  }

  function setFeatureOverride(feature, value) {
    // value: true | false | "auto" (remove override)
    setOverrides((prev) => {
      const prevFeatures = prev.features || {};
      if (value === "auto") {
        const { [feature]: _, ...rest } = prevFeatures;
        return { ...prev, features: rest };
      }
      return { ...prev, features: { ...prevFeatures, [feature]: value } };
    });
  }

  if (cargando) return <div className="p-8 text-muted-foreground text-sm">Cargando...</div>;
  if (!datos) return <div className="p-8 text-muted-foreground text-sm">Tenant no encontrado.</div>;

  const { tenant, usuarios, stats } = datos;
  const planData = PLAN_FEATURES_DEFAULT[tenant.plan];
  const featuresEfectivas = getTenantFeatures(
    { ...tenant, features_override: overrides },
    planData,
  );
  const featureOverrides = overrides.features || {};
  const hayOverrides = Object.keys(featureOverrides).length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/tenants"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{tenant.nombre}</h1>
          <p className="text-muted-foreground text-sm font-mono">{tenant.slug}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_COLORS[tenant.plan] || ""}`}>
            {tenant.plan}
          </span>
          <div className={`flex items-center gap-1.5 text-xs ${tenant.activo ? "text-green-600" : "text-muted-foreground"}`}>
            <Circle className={`h-2 w-2 ${tenant.activo ? "fill-green-500" : "fill-muted-foreground"}`} />
            {tenant.activo ? "Activo" : "Inactivo"}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Rubro",           valor: RUBRO_LABELS[tenant.rubro] || tenant.rubro, icono: Building2 },
          { label: "Total citas",     valor: stats.citas_total,                          icono: CalendarDays },
          { label: "Pacientes",       valor: stats.pacientes_total,                      icono: Users },
          { label: "Ingresos mes",    valor: `$${stats.ingresos_mes.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`, icono: DollarSign },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold mt-0.5">{s.valor}</p>
                </div>
                <s.icono className="h-5 w-5 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: info + acciones */}
        <div className="space-y-4">
          {/* Información */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Información</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              {[
                ["Registro",    format(new Date(tenant.created_at), "dd/MM/yyyy HH:mm", { locale: es })],
                ["Trial hasta", tenant.trial_ends_at ? format(new Date(tenant.trial_ends_at), "dd/MM/yyyy", { locale: es }) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Acciones de plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" /> Plan y acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Cambiar plan</p>
                <div className="flex gap-2">
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="profesional">Profesional</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleCambiarPlan} disabled={pendingAction || plan === tenant.plan}>
                    OK
                  </Button>
                </div>
                {/* Límites del plan seleccionado */}
                {PLAN_FEATURES_DEFAULT[plan] && (
                  <div className="text-xs space-y-0.5 text-muted-foreground pt-1">
                    {Object.entries(LIMITES_LABELS).map(([key, lbl]) => (
                      <div key={key} className="flex justify-between">
                        <span>{lbl}</span>
                        <span className="font-medium text-foreground">
                          {PLAN_FEATURES_DEFAULT[plan].limites?.[key] == null
                            ? "Ilimitado"
                            : PLAN_FEATURES_DEFAULT[plan].limites[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Extender trial</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExtenderTrial(14)} disabled={pendingAction}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> +14 días
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExtenderTrial(30)} disabled={pendingAction}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> +30 días
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant={tenant.activo ? "destructive" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={handleToggleActivo}
                  disabled={pendingAction}
                >
                  <ToggleLeft className="h-4 w-4 mr-2" />
                  {tenant.activo ? "Desactivar tenant" : "Activar tenant"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usuarios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Usuarios ({usuarios.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Rol</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        <p className="font-medium">{u.nombre_completo}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">{u.rol}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs ${u.activo ? "text-green-600" : "text-muted-foreground"}`}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Feature overrides */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Overrides de features
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Forzá o deshabilitá funcionalidades individualmente, sin importar el plan.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {hayOverrides && (
                    <Button
                      variant="ghost" size="sm" className="h-7 text-xs"
                      onClick={() => setOverrides({})}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Limpiar
                    </Button>
                  )}
                  <Button size="sm" className="h-7 text-xs" onClick={guardarOverrides} disabled={pendingOverride}>
                    <Save className="h-3 w-3 mr-1" />
                    {pendingOverride ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Leyenda */}
              <div className="px-4 py-2 bg-muted/30 border-b flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-[52px] h-5 rounded border border-muted-foreground/20 bg-primary/10 text-primary text-[10px] font-semibold">AUTO</span>
                  Usa el plan
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-green-400 bg-green-100 dark:bg-green-900">
                    <Check className="h-2.5 w-2.5 text-green-600" />
                  </span>
                  Forzado ON
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-red-400 bg-red-100 dark:bg-red-900">
                    <X className="h-2.5 w-2.5 text-red-600" />
                  </span>
                  Forzado OFF
                </div>
              </div>

              {/* Tabla de features */}
              <div className="divide-y">
                {FEATURES_LISTA.map((f) => {
                  const planValue     = planData?.features?.[f] ?? false;
                  const effectiveValue = featuresEfectivas.features[f] ?? false;
                  const hasOverride   = f in featureOverrides;
                  const overrideValue = featureOverrides[f];

                  return (
                    <div
                      key={f}
                      className={`flex items-center justify-between px-4 py-2.5 gap-3 transition-colors
                        ${hasOverride ? "bg-amber-50/60 dark:bg-amber-950/10" : ""}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`shrink-0 ${effectiveValue ? "text-green-500" : "text-muted-foreground/30"}`}>
                          {effectiveValue ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm truncate">{FEATURES_LABELS[f]}</p>
                          <p className="text-xs text-muted-foreground">
                            Plan: <span className={planValue ? "text-green-600" : "text-muted-foreground"}>
                              {planValue ? "habilitado" : "deshabilitado"}
                            </span>
                            {hasOverride && (
                              <span className="ml-2 text-amber-600 font-medium">
                                → override: {overrideValue ? "ON" : "OFF"}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Controles OFF / AUTO / ON */}
                      <div className="flex items-center border rounded-md overflow-hidden shrink-0 divide-x">
                        <button
                          title="Forzar OFF"
                          onClick={() => setFeatureOverride(f, false)}
                          className={`px-2 h-7 flex items-center justify-center transition-colors text-xs
                            ${hasOverride && overrideValue === false
                              ? "bg-red-100 dark:bg-red-900 text-red-600"
                              : "hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600"
                            }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          title="Sin override (usa plan)"
                          onClick={() => setFeatureOverride(f, "auto")}
                          className={`px-2 h-7 flex items-center justify-center transition-colors text-[10px] font-semibold
                            ${!hasOverride
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted text-muted-foreground"
                            }`}
                        >
                          AUTO
                        </button>
                        <button
                          title="Forzar ON"
                          onClick={() => setFeatureOverride(f, true)}
                          className={`px-2 h-7 flex items-center justify-center transition-colors text-xs
                            ${hasOverride && overrideValue === true
                              ? "bg-green-100 dark:bg-green-900 text-green-600"
                              : "hover:bg-green-50 dark:hover:bg-green-950 text-muted-foreground hover:text-green-600"
                            }`}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hayOverrides && (
                <div className="px-4 py-3 border-t bg-amber-50/50 dark:bg-amber-950/10">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    {Object.keys(featureOverrides).length} override{Object.keys(featureOverrides).length !== 1 ? "s" : ""} activo{Object.keys(featureOverrides).length !== 1 ? "s" : ""}. Presioná Guardar para aplicar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
