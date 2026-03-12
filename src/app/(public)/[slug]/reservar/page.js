import { notFound } from "next/navigation";
import Link from "next/link";
import { obtenerDatosProfesional } from "../../actions/reserva";
import { AsistenteReserva } from "@/components/publica/asistente-reserva";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getRubroConfig } from "@/config/rubros";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const datos = await obtenerDatosProfesional(slug);

  if (!datos) {
    return { title: "Profesional no encontrado" };
  }

  return {
    title: `Reservar turno - ${datos.profesional.nombre_completo} | ${APP_NAME}`,
    description: `Reserva tu turno online con ${datos.profesional.nombre_completo} en ${datos.tenant.nombre}`,
  };
}

export default async function PaginaReserva({ params }) {
  const { slug } = await params;
  const datos = await obtenerDatosProfesional(slug);

  if (!datos) {
    notFound();
  }

  const { tenant, profesional, servicios, disponibilidad } = datos;
  const rubroConfig = getRubroConfig(tenant.rubro);
  const politicaCancelacion = tenant.configuracion?.agenda?.politica_cancelacion;

  // Obtener fechas bloqueadas (futuras)
  const supabase = await createClient();
  const hoy = new Date().toISOString().split("T")[0];
  const { data: fechasBloqueadas } = await supabase
    .from("fechas_bloqueadas")
    .select("fecha, todo_el_dia, hora_inicio, hora_fin")
    .eq("professional_id", profesional.id)
    .gte("fecha", hoy);

  const iniciales = profesional.nombre_completo
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header con link al perfil */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/${slug}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={profesional.avatar_url}
              alt={profesional.nombre_completo}
            />
            <AvatarFallback>{iniciales}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {profesional.nombre_completo}
            </p>
            <p className="text-xs text-muted-foreground">{tenant.nombre}</p>
          </div>
        </div>
      </div>

      {/* Wizard de reserva */}
      <AsistenteReserva
        slug={slug}
        servicios={servicios}
        disponibilidad={disponibilidad}
        fechasBloqueadas={fechasBloqueadas || []}
        terminoPaciente={rubroConfig?.terminoPaciente}
        politicaCancelacion={politicaCancelacion}
      />
    </div>
  );
}
