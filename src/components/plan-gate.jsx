"use client";

import { useState } from "react";
import { Lock, ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { tenantTiene, PLAN_FEATURES_DEFAULT, FEATURES_LABELS } from "@/lib/features";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLAN_ORDER = ["trial", "basico", "profesional", "premium"];

const PLAN_LABELS = {
  trial:       "Trial",
  basico:      "Básico",
  profesional: "Profesional",
  premium:     "Premium",
};

// Qué plan mínimo requiere cada feature
const FEATURE_MIN_PLAN = {
  recurrencia:             "basico",
  lista_espera:            "basico",
  consulta_activa:         "basico",
  notificaciones_email:    "basico",
  facturacion:             "basico",
  historial_clinico:       "basico",
  sobreturno:              "profesional",
  recetas:                 "profesional",
  firma_digital:           "profesional",
  notificaciones_whatsapp: "profesional",
  reportes_avanzados:      "profesional",
  modulos_rubro:           "profesional",
  archivos_pacientes:      "profesional",
  exportar_csv:            "profesional",
  multi_profesional:       "profesional",
  sucursales:              "premium",
};

// Features a mostrar en el dialog de upgrade (las más relevantes)
const FEATURES_COMPARACION = [
  "recurrencia",
  "lista_espera",
  "facturacion",
  "historial_clinico",
  "notificaciones_email",
  "sobreturno",
  "recetas",
  "reportes_avanzados",
  "modulos_rubro",
  "archivos_pacientes",
  "exportar_csv",
  "multi_profesional",
  "sucursales",
];

function UpgradeDialog({ open, onClose, feature, planActual }) {
  const planMinimo = FEATURE_MIN_PLAN[feature] || "profesional";
  const planMinimoIdx = PLAN_ORDER.indexOf(planMinimo);
  // Mostrar desde el plan actual hacia arriba (mínimo 2 planes)
  const planActualIdx = PLAN_ORDER.indexOf(planActual || "trial");
  const startIdx = Math.max(0, Math.min(planActualIdx, planMinimoIdx - 1));
  const planesAMostrar = PLAN_ORDER.slice(startIdx);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Función no disponible en tu plan
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{FEATURES_LABELS[feature] || feature}</span>
            {" "}está disponible a partir del plan{" "}
            <span className="font-semibold text-foreground">{PLAN_LABELS[planMinimo]}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Comparación de planes */}
        <div className="mt-2">
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `1fr repeat(${planesAMostrar.length}, 1fr)` }}>
            {/* Header — nombres de planes */}
            <div />
            {planesAMostrar.map((plan) => {
              const data = PLAN_FEATURES_DEFAULT[plan];
              const esPlanMinimo = plan === planMinimo;
              const esActual = plan === planActual;
              return (
                <div key={plan} className={`text-center rounded-lg p-3 ${esPlanMinimo ? "bg-primary/10 border border-primary" : "bg-muted/40"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{data.label}</p>
                  <p className="text-base font-bold mt-0.5">
                    {data.precio === 0 ? "Gratis" : `$${data.precio.toLocaleString("es-AR")}`}
                    {data.precio > 0 && <span className="text-xs font-normal text-muted-foreground">/mes</span>}
                  </p>
                  {esActual && (
                    <Badge variant="secondary" className="text-[10px] mt-1">Tu plan</Badge>
                  )}
                  {esPlanMinimo && !esActual && (
                    <Badge className="text-[10px] mt-1">Recomendado</Badge>
                  )}
                </div>
              );
            })}

            {/* Filas de features */}
            {FEATURES_COMPARACION.map((feat) => (
              <>
                <div key={`label-${feat}`} className="flex items-center py-1.5 text-xs text-muted-foreground border-t">
                  {FEATURES_LABELS[feat]}
                </div>
                {planesAMostrar.map((plan) => {
                  const tieneFeature = PLAN_FEATURES_DEFAULT[plan]?.features[feat];
                  return (
                    <div key={`${plan}-${feat}`} className="flex items-center justify-center py-1.5 border-t">
                      {tieneFeature
                        ? <Check className="h-3.5 w-3.5 text-primary" />
                        : <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />
                      }
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t mt-2">
          <p className="text-xs text-muted-foreground">
            Contactá al administrador de la plataforma para actualizar tu plan.
          </p>
          <Button asChild size="sm">
            <Link href="/planes" onClick={onClose}>
              Ver planes
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * PlanGate — bloquea el contenido si el tenant no tiene la feature.
 *
 * Props:
 *   feature   (string)    — nombre de la feature a verificar
 *   fallback  (ReactNode) — opcional: contenido a mostrar si bloqueado (default: banner)
 *   inline    (boolean)   — muestra un badge compacto en lugar del card
 *   children
 */
export function PlanGate({ feature, fallback, inline = false, children }) {
  const { tenant } = useAuthStore();
  const [dialogAbierto, setDialogAbierto] = useState(false);

  // Si todavía está cargando el store o no hay tenant, no bloquear
  if (!tenant) return children;

  const tieneAcceso = tenantTiene(tenant, feature);
  if (tieneAcceso) return children;

  if (fallback !== undefined) return fallback;

  const planMinimo = PLAN_LABELS[FEATURE_MIN_PLAN[feature]] || "Profesional";

  if (inline) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogAbierto(true)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border hover:bg-muted/80 transition-colors"
        >
          <Lock className="h-2.5 w-2.5" />
          Plan {planMinimo}
        </button>
        <UpgradeDialog
          open={dialogAbierto}
          onClose={() => setDialogAbierto(false)}
          feature={feature}
          planActual={tenant?.plan}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center space-y-3">
        <div className="flex justify-center">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">Funcionalidad no incluida en tu plan actual</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Disponible en plan <span className="font-semibold text-foreground">{planMinimo}</span> o superior.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogAbierto(true)}
        >
          Ver planes
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
      <UpgradeDialog
        open={dialogAbierto}
        onClose={() => setDialogAbierto(false)}
        feature={feature}
        planActual={tenant?.plan}
      />
    </>
  );
}
