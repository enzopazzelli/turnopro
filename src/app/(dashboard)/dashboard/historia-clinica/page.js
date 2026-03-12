import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { HistoriaClinicaPage } from "./historia-clinica-page";

export const metadata = { title: "Historia Clinica | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("medicina");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historia Clinica</h1>
      <HistoriaClinicaPage />
    </div>
  );
}
