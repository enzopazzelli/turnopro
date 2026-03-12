import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { NotasSesionPage } from "./notas-sesion-page";

export const metadata = { title: "Notas de Sesion | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("psicologia");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notas de Sesion</h1>
      <NotasSesionPage />
    </div>
  );
}
