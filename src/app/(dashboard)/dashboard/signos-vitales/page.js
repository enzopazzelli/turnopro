import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { SignosVitalesPage } from "./signos-vitales-page";

export const metadata = { title: "Signos Vitales | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("medicina");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Signos Vitales</h1>
      <SignosVitalesPage />
    </div>
  );
}
