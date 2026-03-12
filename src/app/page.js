import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays, Users, Bell, BarChart3, Shield, Smartphone,
  ArrowRight, FileText, CreditCard, Clock, Star, Zap,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SelectorProfesion } from "@/components/landing/selector-profesion";
import { ComoFunciona } from "@/components/landing/como-funciona";
import { Precios } from "@/components/landing/precios";
import { FormularioDemo } from "@/components/landing/formulario-demo";
import { DirectorioProfesionales } from "@/components/landing/directorio-profesionales";
import { HeroMockup } from "@/components/landing/hero-mockup";

const stats = [
  { valor: "6", label: "Rubros profesionales" },
  { valor: "14", label: "Días de prueba gratis" },
  { valor: "100%", label: "En la nube, sin instalar" },
  { valor: "24/7", label: "Reservas online" },
];

const testimonios = [
  { nombre: "Dra. Laura M.", rubro: "Odontología", texto: "El odontograma interactivo cambió cómo llevo la historia clínica. Mis pacientes también lo agradecen." },
  { nombre: "Dr. Carlos R.", rubro: "Medicina", texto: "Las recetas digitales y el historial completo en un solo lugar. No volvería a papel jamás." },
  { nombre: "Lic. Ana G.", rubro: "Psicología", texto: "Los turnos recurrentes y las notas de sesión son exactamente lo que necesitaba para mi práctica." },
];

const features = [
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    desc: "Vista diaria, semanal y mensual. Citas recurrentes, sobreturnos, lista de espera, bloqueo de fechas y consulta activa con cronómetro en tiempo real.",
    tags: ["Recurrente", "Lista espera", "Sobreturno", "Consulta activa"],
    color: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    wide: true,
  },
  {
    icon: Users,
    title: "CRM de pacientes",
    desc: "Fichas completas, historial clínico, archivos adjuntos, importación CSV y comunicación directa.",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  },
  {
    icon: Bell,
    title: "Recordatorios",
    desc: "Email y WhatsApp automáticos 24h y 2h antes. Confirmación con doble opt-in.",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  {
    icon: FileText,
    title: "Módulos especializados por rubro",
    desc: "Odontograma interactivo, historia clínica, expedientes legales, fichas veterinarias, notas de sesión, vencimientos fiscales y mucho más.",
    tags: ["Odontología", "Medicina", "Psicología", "Abogacía", "Veterinaria", "Contadores"],
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    wide: true,
  },
  {
    icon: CreditCard,
    title: "Facturación",
    desc: "Registrá cobros, generá recibos PDF y llevá el historial de pagos por paciente.",
    color: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
  },
  {
    icon: Smartphone,
    title: "Reserva online",
    desc: "Página pública personalizable con branding propio y código QR. Tus pacientes reservan 24/7.",
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Servicios más demandados, horarios pico, ingresos del período y evolución mensual.",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
  },
  {
    icon: Shield,
    title: "Recetas y firma digital",
    desc: "Generá recetas, indicaciones y documentos con firma digital y exportación PDF.",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  },
  {
    icon: Clock,
    title: "Multi-profesional",
    desc: "Sumá profesionales y secretarias. Permisos por rol, múltiples sucursales y agenda consolidada.",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
  },
];

export default async function LandingPage() {
  // Leer precios desde la tabla planes (fallback a hardcoded si falla)
  let preciosDB = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("planes")
      .select("nombre, precio, descripcion")
      .eq("activo", true);
    if (data) {
      data.forEach((p) => { preciosDB[p.nombre] = p; });
    }
  } catch (_) {}

  return (
    <div className="min-h-screen flex flex-col bg-background bg-dot-pattern">

      {/* ── Header ── */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">{APP_NAME}</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            {[
              ["#profesiones", "Profesiones"],
              ["#como-funciona", "Cómo funciona"],
              ["#precios", "Precios"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-foreground transition-colors">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/registro">
                Comenzar gratis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24">
        {/* Fondo con gradientes de color */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-[700px] h-[600px] bg-violet-400/15 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[500px] h-[400px] bg-blue-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-primary/8 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Texto */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-8 shadow-sm">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>Módulos especializados por rubro disponibles</span>
              <ArrowRight className="h-3 w-3" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
              Gestioná tu consultorio{" "}
              <span className="bg-gradient-to-r from-violet-600 via-primary to-blue-600 bg-clip-text text-transparent">
                sin complicaciones
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10">
              La plataforma all-in-one para profesionales de salud, derecho, veterinaria y más.
              Agenda, pacientes, facturación y reservas online desde un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" className="text-base px-8 bg-gradient-to-r from-violet-600 to-primary hover:from-violet-700 hover:to-primary/90 shadow-lg shadow-primary/25" asChild>
                <Link href="/registro">
                  Empezar gratis — 14 días
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 bg-background/80 backdrop-blur" asChild>
                <a href="#demo">Ver demo</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Sin tarjeta de crédito. Sin límite de tiempo para configurar.</p>
          </div>

          {/* Mockup */}
          <div className="w-full lg:w-[460px] shrink-0 hidden lg:block px-6 lg:px-0">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y bg-gradient-to-r from-violet-50/50 via-background to-blue-50/50 dark:from-violet-950/20 dark:to-blue-950/20">
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-primary bg-clip-text text-transparent">{s.valor}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-bold">Todo lo que tu consultorio necesita</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Una plataforma completa, sin integraciones externas complicadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icono = f.icon;
              return (
                <div
                  key={f.title}
                  className={`${f.wide ? "md:col-span-2" : ""} rounded-2xl border bg-muted/10 p-8 flex flex-col gap-4 hover:bg-muted/30 transition-colors group`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.color} transition-transform group-hover:scale-110`}>
                    <Icono className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                  {f.tags && (
                    <div className="mt-auto flex flex-wrap gap-2">
                      {f.tags.map((tag) => (
                        <span key={tag} className="text-xs rounded-full bg-background border px-2.5 py-0.5 text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Para cada profesión ── */}
      <section id="profesiones" className="py-24 bg-muted/20 border-y">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Verticales</p>
            <h2 className="text-3xl md:text-4xl font-bold">Para cada profesión</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Módulos especializados que se adaptan a tu rubro. Seleccioná tu profesión.
            </p>
          </div>
          <SelectorProfesion />
        </div>
      </section>

      {/* ── Testimonios ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Testimonios</p>
            <h2 className="text-3xl md:text-4xl font-bold">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonios.map((t) => (
              <div key={t.nombre} className="rounded-2xl border bg-gradient-to-br from-background to-muted/20 p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.texto}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.nombre}</p>
                  <p className="text-xs text-primary font-medium">{t.rubro}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Directorio ── */}
      <section id="profesionales" className="py-24 bg-muted/20 border-y">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Directorio</p>
            <h2 className="text-3xl md:text-4xl font-bold">Profesionales en {APP_NAME}</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Encontrá un profesional y reservá tu turno online en segundos.
            </p>
          </div>
          <Suspense fallback={null}>
            <DirectorioProfesionales />
          </Suspense>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Proceso</p>
            <h2 className="text-3xl md:text-4xl font-bold">En 3 pasos, estás operativo</h2>
          </div>
          <ComoFunciona />
        </div>
      </section>

      {/* ── Precios ── */}
      <section id="precios" className="py-24 bg-muted/20 border-y">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Planes</p>
            <h2 className="text-3xl md:text-4xl font-bold">Precios claros, sin sorpresas</h2>
            <p className="text-muted-foreground mt-3">Empezá gratis y escalá cuando lo necesités.</p>
          </div>
          <Precios preciosDB={preciosDB} />
        </div>
      </section>

      {/* ── CTA / Demo ── */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-primary/5 to-blue-600/10" />
          <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-violet-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[300px] bg-blue-400/15 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-3xl border bg-background/70 backdrop-blur p-12 text-center space-y-6 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              <Zap className="h-3 w-3" />
              Demo
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">¿Querés ver {APP_NAME} en acción?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Completá el formulario y te contactamos para una demo personalizada de la plataforma.
            </p>
            <FormularioDemo />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-muted/30 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#profesiones" className="hover:text-foreground transition-colors">Profesiones</a>
            <a href="#precios" className="hover:text-foreground transition-colors">Precios</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Ingresar</Link>
            <Link href="/registro" className="hover:text-foreground transition-colors">Registrarse</Link>
          </div>
          <p className="text-xs text-muted-foreground">&copy; 2026 {APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
