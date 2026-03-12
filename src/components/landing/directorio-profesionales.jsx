import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { RUBROS } from "@/config/rubros";

const LABELS_RUBRO = Object.fromEntries(
  Object.entries(RUBROS).map(([key, val]) => [key, val.nombre])
);

const COLORES_RUBRO = Object.fromEntries(
  Object.entries(RUBROS).map(([key, val]) => [key, val.color])
);

async function obtenerProfesionalesPublicos() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nombre, slug, rubro")
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(12);

  if (!tenants?.length) return [];

  const tenantIds = tenants.map((t) => t.id);

  const { data: profesionales } = await supabase
    .from("professionals")
    .select("tenant_id, especialidad")
    .in("tenant_id", tenantIds);

  const { data: usuarios } = await supabase
    .from("users")
    .select("tenant_id, nombre_completo, avatar_url")
    .in("tenant_id", tenantIds)
    .eq("rol", "profesional");

  return tenants.map((tenant) => {
    const prof = profesionales?.find((p) => p.tenant_id === tenant.id);
    const user = usuarios?.find((u) => u.tenant_id === tenant.id);
    return {
      slug: tenant.slug,
      nombre: tenant.nombre,
      rubro: tenant.rubro,
      especialidad: prof?.especialidad,
      nombre_completo: user?.nombre_completo,
      avatar_url: user?.avatar_url,
    };
  }).filter((p) => p.nombre_completo);
}

export async function DirectorioProfesionales() {
  const profesionales = await obtenerProfesionalesPublicos();

  if (!profesionales.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {profesionales.map((prof) => {
        const iniciales = prof.nombre_completo
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <Link key={prof.slug} href={`/${prof.slug}`}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 group">
              <CardContent className="p-5 flex items-center gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={prof.avatar_url} alt={prof.nombre_completo} />
                  <AvatarFallback className="text-lg">{iniciales}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {prof.nombre_completo}
                  </h3>

                  {prof.especialidad && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      {prof.especialidad}
                    </p>
                  )}

                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${COLORES_RUBRO[prof.rubro]}15`,
                      color: COLORES_RUBRO[prof.rubro],
                    }}
                  >
                    {LABELS_RUBRO[prof.rubro] || prof.rubro}
                  </Badge>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
