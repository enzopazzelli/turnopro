import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { EvolucionPage } from "./evolucion-page";

export const metadata = { title: "Evolucion | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("psicologia");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Linea de Evolucion</h1>
      <EvolucionPage />
    </div>
  );
}
