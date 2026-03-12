import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { RecursosLegalesPage } from "./recursos-legales-page";

export const metadata = { title: "Recursos Legales | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("abogados");
  if (!autorizado) return <RubroNoDisponible />;

  return <RecursosLegalesPage />;
}
