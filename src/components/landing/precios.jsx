import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const planes = [
  {
    nombre: "Trial",
    precio: "Gratis",
    periodo: "14 días",
    descripcion: "Para que lo pruebes sin compromisos.",
    destacado: false,
    cta: "Comenzar gratis",
    features: [
      { texto: "Agenda completa", incluido: true },
      { texto: "Hasta 50 citas/mes", incluido: true },
      { texto: "Hasta 30 pacientes", incluido: true },
      { texto: "Página pública de reservas", incluido: true },
      { texto: "Historia clínica", incluido: false },
      { texto: "Notificaciones email", incluido: false },
      { texto: "Módulos por rubro", incluido: false },
      { texto: "Múltiples profesionales", incluido: false },
    ],
  },
  {
    nombre: "Básico",
    precio: "$5.000",
    periodo: "/mes",
    descripcion: "Para profesionales independientes.",
    destacado: false,
    cta: "Elegir Básico",
    features: [
      { texto: "Agenda completa", incluido: true },
      { texto: "Citas ilimitadas", incluido: true },
      { texto: "Pacientes ilimitados", incluido: true },
      { texto: "Página pública de reservas", incluido: true },
      { texto: "Historia clínica", incluido: true },
      { texto: "Notificaciones email", incluido: true },
      { texto: "Módulos por rubro", incluido: false },
      { texto: "Múltiples profesionales", incluido: false },
    ],
  },
  {
    nombre: "Profesional",
    precio: "$12.000",
    periodo: "/mes",
    descripcion: "Para consultorios que quieren todo.",
    destacado: true,
    cta: "Elegir Profesional",
    features: [
      { texto: "Todo lo de Básico", incluido: true },
      { texto: "Módulos por rubro", incluido: true },
      { texto: "Recetas y firma digital", incluido: true },
      { texto: "Reportes avanzados", incluido: true },
      { texto: "Facturación y pagos", incluido: true },
      { texto: "Archivos adjuntos", incluido: true },
      { texto: "Hasta 5 profesionales", incluido: true },
      { texto: "Múltiples sucursales", incluido: false },
    ],
  },
  {
    nombre: "Premium",
    precio: "$25.000",
    periodo: "/mes",
    descripcion: "Sin límites, para equipos grandes.",
    destacado: false,
    cta: "Elegir Premium",
    features: [
      { texto: "Todo lo de Profesional", incluido: true },
      { texto: "Profesionales ilimitados", incluido: true },
      { texto: "Múltiples sucursales", incluido: true },
      { texto: "WhatsApp notifications", incluido: true },
      { texto: "Soporte prioritario", incluido: true },
      { texto: "Exportar / importar CSV", incluido: true },
      { texto: "Overrides por tenant", incluido: true },
      { texto: "SLA garantizado", incluido: true },
    ],
  },
];

function formatPrecio(val) {
  if (!val || val === 0) return "Gratis";
  return "$" + Number(val).toLocaleString("es-AR");
}

export function Precios({ preciosDB = {} }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
      {planes.map((plan) => {
        const key = plan.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const db = preciosDB[key];
        const precioMostrar = db ? formatPrecio(db.precio) : plan.precio;
        const descMostrar = db?.descripcion || plan.descripcion;
        return (
        <div
          key={plan.nombre}
          className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${
            plan.destacado
              ? "border-primary ring-2 ring-primary shadow-lg"
              : ""
          }`}
        >
          {plan.destacado && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground whitespace-nowrap">
                Más popular
              </span>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{plan.nombre}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{precioMostrar}</span>
              <span className="text-sm text-muted-foreground">{plan.periodo}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{descMostrar}</p>
          </div>

          <ul className="space-y-2 flex-1">
            {plan.features.map((feat) => (
              <li key={feat.texto} className="flex items-center gap-2 text-sm">
                {feat.incluido
                  ? <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  : <Minus className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                }
                <span className={feat.incluido ? "text-foreground" : "text-muted-foreground/60"}>
                  {feat.texto}
                </span>
              </li>
            ))}
          </ul>

          <Button
            asChild
            className="w-full"
            variant={plan.destacado ? "default" : "outline"}
            size="sm"
          >
            <Link href={plan.nombre === "Trial" ? "/registro" : `/registro?plan=${plan.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
              {plan.cta}
            </Link>
          </Button>
        </div>
        );
      })}
    </div>
  );
}
