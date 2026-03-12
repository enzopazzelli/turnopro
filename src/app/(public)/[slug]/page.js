import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { obtenerDatosProfesional } from "../actions/reserva";
import { obtenerReviewsPublicas } from "../actions/reviews";
import { PerfilProfesional } from "@/components/publica/perfil-profesional";
import { ServicioCard } from "@/components/publica/servicio-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, QrCode, Phone, Mail, MapPin, Star } from "lucide-react";
import { DIAS_SEMANA, APP_NAME } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const datos = await obtenerDatosProfesional(slug);

  if (!datos) {
    return { title: "Profesional no encontrado" };
  }

  const title = `${datos.profesional.nombre_completo} - ${datos.tenant.nombre} | ${APP_NAME}`;
  const description = datos.profesional.especialidad
    ? `Reserva tu turno con ${datos.profesional.nombre_completo}, ${datos.profesional.especialidad} en ${datos.tenant.nombre}`
    : `Reserva tu turno en ${datos.tenant.nombre}`;
  const logo = datos.tenant.logo_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(logo && { images: [{ url: logo, width: 400, height: 400, alt: datos.tenant.nombre }] }),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(logo && { images: [logo] }),
    },
  };
}

export default async function PaginaPublicaProfesional({ params }) {
  const { slug } = await params;
  const datos = await obtenerDatosProfesional(slug);

  if (!datos) {
    notFound();
  }

  const { tenant, profesional, servicios, disponibilidad } = datos;
  const configPP = tenant.configuracion?.pagina_publica || {};
  const branding = tenant.configuracion?.branding || {};
  const direccion = tenant.configuracion?.consultorio?.direccion || "";

  // Build QR URL
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const urlReserva = `${protocol}://${host}/${slug}/reservar`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(urlReserva)}`;

  // Reviews
  const { data: reviews } = await obtenerReviewsPublicas(tenant.id);
  const promedio =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.estrellas, 0) / reviews.length).toFixed(1)
      : null;

  // Branding inline styles
  const headerStyle = branding.color_encabezado
    ? { "--brand-header": branding.color_encabezado, "--brand-primary": branding.color_primario || "#2563eb" }
    : {};

  return (
    <div className="min-h-screen bg-background flex flex-col" style={headerStyle}>
      {/* Hero */}
      <PerfilProfesional
        profesional={profesional}
        tenant={tenant}
        configPP={configPP}
        slug={slug}
        brandingColor={branding.color_encabezado}
      />

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 space-y-10 w-full">
        {/* Servicios */}
        {servicios.length > 0 && (
          <section className="space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-semibold">Nuestros servicios</h2>
              <p className="text-sm text-muted-foreground">
                Conoce lo que ofrecemos y reserva tu turno online
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {servicios.map((servicio) => (
                <ServicioCard
                  key={servicio.id}
                  servicio={servicio}
                  mostrarPrecio={configPP.mostrar_precios !== false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Horarios + QR side by side */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Horarios */}
          {disponibilidad.length > 0 && configPP.mostrar_horarios !== false && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horarios de atencion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {disponibilidad.map((d) => {
                    const dia = DIAS_SEMANA.find(
                      (ds) => ds.valor === d.dia_semana
                    );
                    const bloques = d.bloques || [
                      { hora_inicio: d.hora_inicio, hora_fin: d.hora_fin },
                    ];
                    return (
                      <div
                        key={d.dia_semana}
                        className="flex justify-between gap-2 py-1.5 border-b border-border/50 last:border-0"
                      >
                        <span className="font-medium">{dia?.nombre}</span>
                        <span className="text-muted-foreground">
                          {bloques.map((b, i) => (
                            <span key={i}>
                              {i > 0 && " / "}
                              {b.hora_inicio.slice(0, 5)} -{" "}
                              {b.hora_fin.slice(0, 5)}
                            </span>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code */}
          {servicios.length > 0 && (
            <Card className="flex flex-col items-center justify-center text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Reserva rapida
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`Codigo QR para reservar turno con ${profesional.nombre_completo}`}
                    width={160}
                    height={160}
                    className="h-40 w-40"
                  />
                </div>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Escanea el codigo QR para reservar un turno directamente desde
                  tu celular
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Contacto + Ubicación */}
        {(profesional.telefono || profesional.email || direccion) && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Contacto</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {profesional.telefono && (
                <a
                  href={`tel:${profesional.telefono}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {profesional.telefono}
                </a>
              )}
              {profesional.email && (
                <a
                  href={`mailto:${profesional.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {profesional.email}
                </a>
              )}
              {direccion && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  {direccion}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold">Lo que dicen nuestros pacientes</h2>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= Math.round(parseFloat(promedio))
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
                <span className="text-sm font-semibold">{promedio}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} reseñas)</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reviews.slice(0, 6).map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{r.nombre}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i <= r.estrellas ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.texto}</p>
                    <p className="text-xs text-muted-foreground/60">
                      {format(new Date(r.created_at), "MMMM yyyy", { locale: es })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Link
                href={`/${slug}/review`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Dejá tu reseña
              </Link>
            </div>
          </section>
        )}

        {/* CTA */}
        {servicios.length > 0 && (
          <section className="text-center space-y-3 py-4">
            <Separator />
            {reviews.length === 0 && (
              <p className="text-xs text-muted-foreground pt-2">
                <Link href={`/${slug}/review`} className="underline underline-offset-4 hover:text-foreground transition-colors">
                  Dejá una reseña
                </Link>
              </p>
            )}
            <p className="text-muted-foreground text-sm pt-2">
              ¿Listo para agendar tu proximo turno?
            </p>
            <Button asChild size="lg" className="text-base px-10 h-12 shadow-md"
              style={branding.color_primario ? { backgroundColor: branding.color_primario, borderColor: branding.color_primario } : {}}>
              <Link href={`/${slug}/reservar`}>
                <CalendarDays className="h-5 w-5 mr-2" />
                Reservar turno ahora
              </Link>
            </Button>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            &copy; {new Date().getFullYear()} {tenant.nombre}
          </span>
          <span>
            Gestionado con{" "}
            <Link href="/" className="font-medium hover:text-foreground transition-colors">
              {APP_NAME}
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
