import { verificarRubro } from "@/components/rubro/guard-rubro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Stethoscope, Shield, Pill, BookOpen, Phone } from "lucide-react";

export const metadata = {
  title: "Recursos Medicos | TurnoPro",
};

const SECCIONES = [
  {
    titulo: "Obras Sociales y Prepagas",
    icono: Shield,
    color: "text-blue-600",
    links: [
      { nombre: "PAMI", descripcion: "Portal oficial — afiliados, tramites, medicamentos", url: "https://www.pami.org.ar" },
      { nombre: "OSDE", descripcion: "Gestion de autorizaciones y cartilla medica", url: "https://www.osde.com.ar" },
      { nombre: "Swiss Medical", descripcion: "Cartilla, autorizaciones y facturacion", url: "https://www.swissmedical.com.ar" },
      { nombre: "Galeno", descripcion: "Portal para prestadores medicos", url: "https://www.galeno.com.ar" },
      { nombre: "IOMA", descripcion: "Instituto de Obra Medico Asistencial (Pcia. Bs. As.)", url: "https://www.ioma.gba.gov.ar" },
      { nombre: "OSECAC", descripcion: "Obra Social Empleados de Comercio", url: "https://www.osecac.org.ar" },
      { nombre: "Medife", descripcion: "Portal de prestadores y autorizaciones", url: "https://www.medife.com.ar" },
      { nombre: "Sancor Salud", descripcion: "Autorizaciones y cartilla", url: "https://www.sancorsalud.com.ar" },
    ],
  },
  {
    titulo: "Medicamentos y Vademecum",
    icono: Pill,
    color: "text-green-600",
    links: [
      { nombre: "ANMAT — Medicamentos", descripcion: "Consulta de medicamentos habilitados en Argentina", url: "https://www.argentina.gob.ar/anmat/medicamentos" },
      { nombre: "Vademecum.es (AR)", descripcion: "Vademecum online con indicaciones y posologia", url: "https://www.vademecum.es" },
      { nombre: "Kairos", descripcion: "Guia de medicamentos y especialidades medicinales", url: "https://www.kairosweb.com" },
      { nombre: "ANMAT Farmacos", descripcion: "Base de datos de especialidades medicinales", url: "https://servicios.anmat.gov.ar/publico/farmacosForm.html" },
      { nombre: "COFA", descripcion: "Confederacion Farmaceutica Argentina", url: "https://www.cofa.org.ar" },
    ],
  },
  {
    titulo: "Organismos y Normativa",
    icono: BookOpen,
    color: "text-purple-600",
    links: [
      { nombre: "Ministerio de Salud", descripcion: "Resoluciones, normativas y programas nacionales", url: "https://www.argentina.gob.ar/salud" },
      { nombre: "ANMAT", descripcion: "Administracion Nacional de Medicamentos, Alimentos y Tecnologia Medica", url: "https://www.anmat.gov.ar" },
      { nombre: "SISA — REFES", descripcion: "Sistema Integrado de Informacion Sanitaria Argentino", url: "https://sisa.msal.gov.ar" },
      { nombre: "Nomivac", descripcion: "Calendario Nacional de Vacunacion", url: "https://nomivac.msal.gov.ar" },
      { nombre: "INC — Oncologia", descripcion: "Instituto Nacional del Cancer", url: "https://www.argentina.gob.ar/salud/inc" },
    ],
  },
  {
    titulo: "Colegios y Asociaciones",
    icono: Stethoscope,
    color: "text-red-600",
    links: [
      { nombre: "AMA — Asociacion Medica Argentina", descripcion: "Gremio medico nacional", url: "https://www.ama-med.org.ar" },
      { nombre: "Federacion Medica Argentina", descripcion: "FEMEBA — Federacion Medica Bonaerense", url: "https://www.femeba.org.ar" },
      { nombre: "Colegio Medico de la Pcia. de Bs. As.", descripcion: "Registro matriculas y normativa provincial", url: "https://www.cmba.org.ar" },
      { nombre: "COMRA — Cordoba", descripcion: "Colegio de Medicos de la Pcia. de Cordoba", url: "https://www.comra.org.ar" },
      { nombre: "SAC — Cardiologia", descripcion: "Sociedad Argentina de Cardiologia", url: "https://www.sac.org.ar" },
      { nombre: "AAD — Dermatologia", descripcion: "Asociacion Argentina de Dermatologia", url: "https://www.aad.org.ar" },
    ],
  },
  {
    titulo: "Emergencias y Lineas Utiles",
    icono: Phone,
    color: "text-orange-600",
    links: [
      { nombre: "SAME — Buenos Aires", descripcion: "Sistema de Atencion Medica de Emergencia (107)", url: "https://www.buenosaires.gob.ar/salud/same" },
      { nombre: "Venenos — CITOXAL", descripcion: "Centro Nacional de Intoxicaciones (0800-333-0160)", url: "https://www.anmat.gov.ar/ciudadanos/toxicologia.asp" },
      { nombre: "CIV — ANMAT", descripcion: "Centro de Informacion de Vigilancia Epidemiologica", url: "https://www.anmat.gov.ar" },
    ],
  },
];

export default async function RecursosMedicosPage() {
  await verificarRubro("medicina");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recursos Medicos</h1>
        <p className="text-muted-foreground">
          Links utiles: obras sociales, vademecum, organismos y colegios profesionales.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {SECCIONES.map((seccion) => {
          const Icono = seccion.icono;
          return (
            <Card key={seccion.titulo}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icono className={`h-5 w-5 ${seccion.color}`} />
                  {seccion.titulo}
                  <Badge variant="outline" className="ml-auto text-xs font-normal">
                    {seccion.links.length} links
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {seccion.links.map((link) => (
                  <a
                    key={link.nombre}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-accent transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {link.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">{link.descripcion}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
