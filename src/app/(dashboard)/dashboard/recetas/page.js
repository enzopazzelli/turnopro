import { verificarRubro, RubroNoDisponible, verificarFeature, FeatureNoDisponible } from "@/components/rubro/guard-rubro";
import { RecetasPage } from "./recetas-page";

export const metadata = { title: "Documentos | TurnoPro" };

const RUBROS_CON_RECETAS = ["medicina", "odontologia", "veterinaria", "psicologia", "abogados", "contadores"];

const RUBROS_SALUD = ["medicina", "odontologia", "veterinaria", "psicologia"];

export default async function Page() {
  const tieneAcceso = await verificarFeature("recetas");
  if (!tieneAcceso) return <FeatureNoDisponible feature="recetas" />;

  const { autorizado, rubro } = await verificarRubro(RUBROS_CON_RECETAS);
  if (!autorizado) return <RubroNoDisponible />;

  const esSalud = RUBROS_SALUD.includes(rubro);
  const titulo = esSalud ? "Recetas y documentos" : "Documentos profesionales";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <RecetasPage rubro={rubro} />
    </div>
  );
}
