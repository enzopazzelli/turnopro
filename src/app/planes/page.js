import Link from "next/link";
import { ArrowLeft, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Planes y precios — ${APP_NAME}`,
  description: "Elegí el plan que mejor se adapta a tu consultorio.",
};

const planes = [
  {
    nombre: "trial",
    label: "Trial",
    precio: "Gratis",
    periodo: "14 días",
    descripcion: "Para que lo pruebes sin compromisos.",
    destacado: false,
    cta: "Comenzar gratis",
    limites: "Hasta 50 citas/mes · Hasta 30 pacientes",
  },
  {
    nombre: "basico",
    label: "Básico",
    precio: "$5.000",
    periodo: "/mes",
    descripcion: "Para profesionales independientes.",
    destacado: false,
    cta: "Elegir Básico",
    limites: "Citas y pacientes ilimitados",
  },
  {
    nombre: "profesional",
    label: "Profesional",
    precio: "$12.000",
    periodo: "/mes",
    descripcion: "Para consultorios que quieren todo.",
    destacado: true,
    cta: "Elegir Profesional",
    limites: "Hasta 5 profesionales",
  },
  {
    nombre: "premium",
    label: "Premium",
    precio: "$25.000",
    periodo: "/mes",
    descripcion: "Sin límites, para equipos grandes.",
    destacado: false,
    cta: "Elegir Premium",
    limites: "Profesionales y sucursales ilimitados",
  },
];

const grupos = [
  {
    titulo: "Agenda",
    features: [
      { key: "agenda_completa", label: "Agenda completa", planes: ["trial", "basico", "profesional", "premium"] },
      { key: "recurrencia",     label: "Citas recurrentes",   planes: ["basico", "profesional", "premium"] },
      { key: "sobreturno",      label: "Sobreturnos",         planes: ["profesional", "premium"] },
      { key: "lista_espera",    label: "Lista de espera",     planes: ["basico", "profesional", "premium"] },
      { key: "consulta_activa", label: "Consulta activa",     planes: ["basico", "profesional", "premium"] },
    ],
  },
  {
    titulo: "Pacientes",
    features: [
      { key: "historial_clinico",  label: "Historia clínica",              planes: ["basico", "profesional", "premium"] },
      { key: "archivos_pacientes", label: "Archivos adjuntos de pacientes", planes: ["profesional", "premium"] },
      { key: "exportar_csv",       label: "Exportar / importar CSV",        planes: ["profesional", "premium"] },
    ],
  },
  {
    titulo: "Documentos",
    features: [
      { key: "recetas",      label: "Recetas y documentos profesionales", planes: ["profesional", "premium"] },
      { key: "firma_digital", label: "Firma digital",                     planes: ["profesional", "premium"] },
    ],
  },
  {
    titulo: "Notificaciones",
    features: [
      { key: "notificaciones_email",    label: "Notificaciones por email",    planes: ["basico", "profesional", "premium"] },
      { key: "notificaciones_whatsapp", label: "Notificaciones por WhatsApp", planes: ["premium"] },
    ],
  },
  {
    titulo: "Análisis",
    features: [
      { key: "reportes_avanzados", label: "Reportes y analytics avanzados", planes: ["profesional", "premium"] },
      { key: "facturacion",        label: "Facturación e historial de pagos", planes: ["basico", "profesional", "premium"] },
    ],
  },
  {
    titulo: "Especialización",
    features: [
      { key: "modulos_rubro",    label: "Módulos especializados por rubro", planes: ["profesional", "premium"] },
      { key: "pagina_publica",   label: "Página pública y reservas online", planes: ["trial", "basico", "profesional", "premium"] },
    ],
  },
  {
    titulo: "Equipo y sucursales",
    features: [
      { key: "multi_profesional", label: "Múltiples profesionales",  planes: ["profesional", "premium"] },
      { key: "sucursales",        label: "Múltiples sucursales",      planes: ["premium"] },
    ],
  },
];

export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Inicio
            </Link>
          </Button>
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Planes y precios</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Elegí el plan que mejor se adapta a tu consultorio. Sin compromisos, cancelás cuando quieras.
          </p>
        </div>

        {/* Cards de planes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
          {planes.map((plan) => (
            <div
              key={plan.nombre}
              className={`relative rounded-2xl border p-6 flex flex-col gap-4 ${
                plan.destacado ? "border-primary ring-2 ring-primary shadow-lg" : ""
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{plan.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.precio}</span>
                  <span className="text-sm text-muted-foreground">{plan.periodo}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.descripcion}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{plan.limites}</p>
              </div>
              <Button
                asChild
                className="w-full"
                variant={plan.destacado ? "default" : "outline"}
                size="sm"
              >
                <Link href="/registro">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Tabla de comparación */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted-foreground py-3 pr-4 w-1/2">Funcionalidad</th>
                {planes.map((plan) => (
                  <th key={plan.nombre} className={`text-center py-3 px-3 ${plan.destacado ? "text-primary" : "text-muted-foreground"}`}>
                    {plan.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <>
                  <tr key={grupo.titulo}>
                    <td colSpan={5} className="pt-6 pb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{grupo.titulo}</span>
                    </td>
                  </tr>
                  {grupo.features.map((feat) => (
                    <tr key={feat.key} className="border-t">
                      <td className="py-2.5 pr-4 text-foreground">{feat.label}</td>
                      {planes.map((plan) => {
                        const incluido = feat.planes.includes(plan.nombre);
                        return (
                          <td key={plan.nombre} className="text-center py-2.5 px-3">
                            {incluido
                              ? <Check className="h-4 w-4 text-primary mx-auto" />
                              : <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer CTA */}
        <div className="text-center space-y-3 py-4">
          <p className="text-muted-foreground text-sm">¿Tenés dudas? Contactanos y te ayudamos a elegir el plan ideal.</p>
          <Button asChild>
            <Link href="/registro">Empezar con el Trial gratuito</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
