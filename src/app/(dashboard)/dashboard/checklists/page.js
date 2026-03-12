import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { ChecklistsPage } from "./checklists-page";

export const metadata = { title: "Checklists | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("contadores");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Checklists de Documentacion</h1>
      <ChecklistsPage />
    </div>
  );
}
